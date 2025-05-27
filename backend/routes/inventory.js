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

// require auth for all inventory routes
router.use(requireAuth);

//GET all inventory
router.get('/inventory/items', getInventories);

//GET a single inventory
router.get('/inventory/items/:id', getInventory);


//POST a new inventory
router.post('/inventory/items', createInventory)
    
//DELETE a inventory
router.delete('/inventory/items', deleteInventory);

//UPDATE a inventory
router.patch('/inventory/items/:id', updateInventory);

module.exports = router;