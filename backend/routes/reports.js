const express = require('express');
const router = express.Router();
const {
  generateReport
} = require('../controllers/reportsController');

// GET reports data for a date range
router.get('/', generateReport);

module.exports = router;
