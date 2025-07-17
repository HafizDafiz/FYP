const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { getAdminDashboardData, getStaffDashboardData } = require('../controllers/dashboardController');

const router = express.Router();

// Middleware to protect routes
router.use(requireAuth);

// Admin dashboard route
router.get('/admin', getAdminDashboardData);

// Staff dashboard route
router.get('/staff', getStaffDashboardData);

module.exports = router;
