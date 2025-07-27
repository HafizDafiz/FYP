const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getUserStats
} = require('../controllers/userManagementController');
const {
    getAuditLogs,
    getAuditStats,
    getUserActivity
} = require('../controllers/auditLogController');
const requireAuth = require('../middleware/requireAuth');

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
};

// Apply auth middleware to all routes
router.use(requireAuth);

// Apply admin middleware to all routes (since this is admin-only feature)
router.use(requireAdmin);

// User Management Routes
router.get('/users', getUsers);
router.get('/users/stats', getUserStats);
router.get('/users/:id', getUser);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Audit Log Routes
router.get('/audit-logs', getAuditLogs);
router.get('/audit-logs/stats', getAuditStats);
router.get('/audit-logs/user/:userId', getUserActivity);

module.exports = router;
