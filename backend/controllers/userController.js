const User = require('../models/userModel');
const { logAction } = require('./auditLogController');
const jwt = require('jsonwebtoken')

const createToken = (_id, role) => {
    return jwt.sign({ _id, role}, process.env.SECRET, { expiresIn: '3d' })
}
// login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.login(email, password);

        // create a token
        const token = createToken(user._id, user.role);

        // Log successful login
        await logAction(user._id, 'Login', {
            description: `User logged in successfully`,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            success: true
        });

        res.status(200).json({ 
            email: user.email,
            name: user.name,
            role: user.role,
            token
            });
    } catch (error) {
        // Log failed login attempt
        if (email) {
            const existingUser = await User.findOne({ email }).select('_id name email role');
            if (existingUser) {
                await logAction(existingUser._id, 'Login', {
                    description: `Failed login attempt`,
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    success: false,
                    errorMessage: error.message
                });
            }
        }
        
        res.status(400).json({ error: error.message });
    }
}
// signup user
const signupUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const user = await User.signup(name, email, password, role);

        // create a token
        const token = createToken(user._id, user.role);

        // Log successful signup
        await logAction(user._id, 'Create User', {
            description: `User account created successfully`,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            success: true
        });

        res.status(200).json({ 
            email: user.email, 
            name: user.name,
            role: user.role,
            token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// logout user (for audit logging)
const logoutUser = async (req, res) => {
    try {
        if (req.user) {
            // Log logout
            await logAction(req.user._id, 'Logout', {
                description: `User logged out`,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                success: true
            });
        }
        
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = { signupUser, loginUser, logoutUser };