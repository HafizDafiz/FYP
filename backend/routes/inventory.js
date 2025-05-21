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
router.get('/', getInventories);

//GET a single inventory
router.get('/:id', getInventory);


//POST a new inventory
router.post('/', createInventory)
    
//DELETE a inventory
router.delete('/:id', deleteInventory);

//UPDATE a inventory
router.patch('/:id', updateInventory);

module.exports = router;