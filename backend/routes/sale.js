const express = require('express');
const router = express.Router();
const {
    getSalesOrders,
    getSalesOrder,
    createSalesOrder,
    updateSalesOrderStatus,
    cancelSalesOrder,
    deleteSalesOrder
} = require('../controllers/saleController');
const requireAuth = require('../middleware/requireAuth');

// Require auth for all sales routes
router.use(requireAuth);

// GET all sales orders
router.get('/', getSalesOrders);

// GET a single sales order
router.get('/:id', getSalesOrder);

// POST create new sales order
router.post('/', createSalesOrder);

// PATCH update sales order status
router.patch('/:id/status', updateSalesOrderStatus);

// PATCH cancel sales order
router.patch('/:id/cancel', cancelSalesOrder);

// DELETE sales order
router.delete('/:id', deleteSalesOrder);

module.exports = router;
