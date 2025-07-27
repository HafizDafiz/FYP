const AuditLog = require('../models/auditLogModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// Helper function to create audit log entries
const createAuditLog = async (data) => {
    try {
        const auditLog = new AuditLog(data);
        await auditLog.save();
        return auditLog;
    } catch (error) {
        console.error('Error creating audit log:', error);
        // Don't throw error to prevent disrupting main operations
        return null;
    }
};

// GET all audit logs (admin only)
const getAuditLogs = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            userId, 
            action, 
            entityType, 
            startDate, 
            endDate,
            search 
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            filter.userId = userId;
        }
        
        if (action) {
            filter.action = action;
        }
        
        if (entityType) {
            filter.entityType = entityType;
        }
        
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.timestamp.$lte = end;
            }
        }
        
        if (search) {
            filter.$or = [
                { userEmail: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } },
                { entityName: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [auditLogs, totalCount] = await Promise.all([
            AuditLog.find(filter)
                .populate('userId', 'name email role')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            AuditLog.countDocuments(filter)
        ]);

        res.status(200).json({
            auditLogs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                hasNextPage: skip + auditLogs.length < totalCount,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET audit log statistics
const getAuditStats = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        const [
            totalLogs,
            recentLogs,
            actionStats,
            userStats,
            entityStats,
            dailyActivity
        ] = await Promise.all([
            // Total logs count
            AuditLog.countDocuments(),
            
            // Recent logs count
            AuditLog.countDocuments({ timestamp: { $gte: daysAgo } }),
            
            // Action statistics
            AuditLog.aggregate([
                { $match: { timestamp: { $gte: daysAgo } } },
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            
            // User activity statistics
            AuditLog.aggregate([
                { $match: { timestamp: { $gte: daysAgo } } },
                { $group: { 
                    _id: { userId: '$userId', userName: '$userName', userEmail: '$userEmail' }, 
                    count: { $sum: 1 } 
                } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            
            // Entity type statistics
            AuditLog.aggregate([
                { $match: { timestamp: { $gte: daysAgo }, entityType: { $exists: true } } },
                { $group: { _id: '$entityType', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            
            // Daily activity for the last 7 days
            AuditLog.aggregate([
                { $match: { timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 }
                } },
                { $sort: { _id: 1 } }
            ])
        ]);

        res.status(200).json({
            totalLogs,
            recentLogs,
            actionStats,
            userStats,
            entityStats,
            dailyActivity
        });
    } catch (error) {
        console.error('Error fetching audit statistics:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET user activity summary
const getUserActivity = async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 30 } = req.query;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        const [userInfo, activitySummary, recentActions] = await Promise.all([
            User.findById(userId).select('name email role'),
            
            AuditLog.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), timestamp: { $gte: daysAgo } } },
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            
            AuditLog.find({ userId, timestamp: { $gte: daysAgo } })
                .sort({ timestamp: -1 })
                .limit(20)
                .select('action entityType entityName details timestamp success')
        ]);

        if (!userInfo) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            user: userInfo,
            activitySummary,
            recentActions
        });
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: error.message });
    }
};

// Export audit log function for use in other controllers
const logAction = async (userId, action, details = {}) => {
    try {
        if (!userId) return;
        
        const user = await User.findById(userId).select('name email role');
        if (!user) return;

        const logData = {
            userId,
            userEmail: user.email,
            userName: user.name,
            userRole: user.role,
            action,
            entityType: details.entityType,
            entityId: details.entityId,
            entityName: details.entityName,
            details: details.description,
            changes: details.changes,
            metadata: {
                ipAddress: details.ipAddress,
                userAgent: details.userAgent,
                source: details.source || 'Web Application'
            },
            success: details.success !== false
        };

        if (details.errorMessage) {
            logData.errorMessage = details.errorMessage;
        }

        return await createAuditLog(logData);
    } catch (error) {
        console.error('Error logging action:', error);
        return null;
    }
};

module.exports = {
    getAuditLogs,
    getAuditStats,
    getUserActivity,
    logAction,
    createAuditLog
};
