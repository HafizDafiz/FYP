const User = require('../models/userModel');
const { logAction } = require('./auditLogController');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

// GET all users (admin only)
const getUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            role, 
            search,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (role && ['admin', 'staff'].includes(role)) {
            filter.role = role;
        }
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [users, totalCount] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(filter)
        ]);

        // Log the action
        await logAction(req.user._id, 'View Users', {
            description: `Viewed users list with filters: ${JSON.stringify(filter)}`
        });

        res.status(200).json({
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                hasNextPage: skip + users.length < totalCount,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET single user
const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const user = await User.findById(id).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log the action
        await logAction(req.user._id, 'View User', {
            entityType: 'User',
            entityId: id,
            entityName: user.name,
            description: `Viewed user details for ${user.email}`
        });

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: error.message });
    }
};

// CREATE new user (admin only)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validation
        const emptyFields = [];
        if (!name) emptyFields.push('name');
        if (!email) emptyFields.push('email');
        if (!password) emptyFields.push('password');
        if (!role) emptyFields.push('role');

        if (emptyFields.length > 0) {
            return res.status(400).json({ 
                error: 'Please fill in all required fields', 
                emptyFields 
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Email is not valid' });
        }

        if (!validator.isStrongPassword(password)) {
            return res.status(400).json({ 
                error: 'Password not strong enough. Must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 symbol.' 
            });
        }

        if (!['admin', 'staff'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hash,
            role
        });

        // Log the action
        await logAction(req.user._id, 'Create User', {
            entityType: 'User',
            entityId: user._id,
            entityName: user.name,
            description: `Created new user: ${user.email} with role: ${user.role}`
        });

        // Return user without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message });
    }
};

// UPDATE user (admin only)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, password } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent admin from demoting themselves
        if (req.user._id.toString() === id && role && role !== 'admin') {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }

        const updateData = {};
        const changes = { before: {}, after: {} };

        if (name && name !== existingUser.name) {
            changes.before.name = existingUser.name;
            changes.after.name = name;
            updateData.name = name;
        }

        if (email && email !== existingUser.email) {
            if (!validator.isEmail(email)) {
                return res.status(400).json({ error: 'Email is not valid' });
            }
            
            // Check if new email already exists
            const emailExists = await User.findOne({ email, _id: { $ne: id } });
            if (emailExists) {
                return res.status(400).json({ error: 'Email already in use' });
            }
            
            changes.before.email = existingUser.email;
            changes.after.email = email;
            updateData.email = email;
        }

        if (role && role !== existingUser.role) {
            if (!['admin', 'staff'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }
            
            changes.before.role = existingUser.role;
            changes.after.role = role;
            updateData.role = role;
        }

        if (password) {
            if (!validator.isStrongPassword(password)) {
                return res.status(400).json({ 
                    error: 'Password not strong enough. Must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 symbol.' 
                });
            }
            
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            updateData.password = hash;
            changes.after.passwordChanged = true;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No changes to update' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        // Log the action
        await logAction(req.user._id, 'Update User', {
            entityType: 'User',
            entityId: id,
            entityName: updatedUser.name,
            description: `Updated user: ${updatedUser.email}`,
            changes
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE user (admin only)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Prevent admin from deleting themselves
        if (req.user._id.toString() === id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Store user data for logging before deletion
        const userData = {
            name: user.name,
            email: user.email,
            role: user.role
        };

        await User.findByIdAndDelete(id);

        // Log the action
        await logAction(req.user._id, 'Delete User', {
            entityType: 'User',
            entityId: id,
            entityName: userData.name,
            description: `Deleted user: ${userData.email} (${userData.role})`
        });

        res.status(200).json({ 
            message: 'User deleted successfully',
            deletedUser: userData
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET user statistics
const getUserStats = async (req, res) => {
    try {
        const [totalUsers, adminUsers, staffUsers, recentUsers] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ role: 'staff' }),
            User.find()
                .select('-password')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        // Log the action
        await logAction(req.user._id, 'View User Stats', {
            description: 'Viewed user statistics dashboard'
        });

        res.status(200).json({
            totalUsers,
            adminUsers,
            staffUsers,
            recentUsers
        });
    } catch (error) {
        console.error('Error fetching user statistics:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getUserStats
};
