const express = require('express');
const router = express.Router();
const {
    getPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    approvePurchaseOrder,
    receiveItems,
    cancelPurchaseOrder,
    deletePurchaseOrder
} = require('../controllers/purchaseOrderController');
const requireAuth = require('../middleware/requireAuth');

// Require auth for all purchase order routes
router.use(requireAuth);

// GET all purchase orders
router.get('/', getPurchaseOrders);

// GET a single purchase order
router.get('/:id', getPurchaseOrder);

// POST create new purchase order
router.post('/', createPurchaseOrder);

// PATCH update purchase order status
router.patch('/:id/status', updatePurchaseOrderStatus);

// PATCH approve purchase order
router.patch('/:id/approve', approvePurchaseOrder);

// PATCH receive items from purchase order
router.patch('/:id/receive', receiveItems);

// PATCH cancel purchase order
router.patch('/:id/cancel', cancelPurchaseOrder);

// DELETE purchase order
router.delete('/:id', deletePurchaseOrder);

module.exports = router;
