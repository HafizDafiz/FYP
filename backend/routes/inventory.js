const express = require('express');
const {
  createInventory,
  getInventories,
  getInventory,
  deleteInventory,
  updateInventory
} = require('../controllers/inventoryController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Require auth for all inventory routes
router.use(requireAuth);

// GET all inventory items
router.get('/items', getInventories);

// GET a single inventory item
router.get('/items/:id', getInventory);

// POST a new inventory item
router.post('/items', createInventory);

// DELETE an inventory item
router.delete('/items/:id', deleteInventory);

// UPDATE an inventory item
router.patch('/items/:id', updateInventory);

module.exports = router;