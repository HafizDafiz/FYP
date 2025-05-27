const express = require('express');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Middleware to protect routes
router.use(requireAuth);

// Admin dashboard route
router.get('/admin', (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admins only' });
  }

  res.status(200).json({
    message: 'Welcome to the Admin Dashboard',
    user: req.user,
    // You can add dashboard data here
  });
});

// Staff dashboard route
router.get('/staff', (req, res) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Access denied: Staff only' });
  }

  res.status(200).json({
    message: 'Welcome to the Staff Dashboard',
    user: req.user,
    // You can add dashboard data here
  });
});

module.exports = router;
