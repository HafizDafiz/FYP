const express = require('express');
const router = express.Router();
const { loginUser, getUser } = require('./controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.get('/me', requireAuth, getUser);

module.exports = router;
