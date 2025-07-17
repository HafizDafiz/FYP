const express = require('express');
const router = express.Router();
const {
    getReceivingReceipts,
    getReceivingReceipt,
    createReceivingReceipt,
    updateReceivingReceiptStatus,
    approveReceivingReceipt,
    rejectReceivingReceipt,
    deleteReceivingReceipt,
    getReceivingReceiptsByPO,
    getReceivingReceiptStats
} = require('../controllers/receivingReceiptController');
const requireAuth = require('../middleware/requireAuth');

// Require auth for all receiving receipt routes
router.use(requireAuth);

// GET all receiving receipts
router.get('/', getReceivingReceipts);

// GET receiving receipt statistics
router.get('/stats', getReceivingReceiptStats);

// GET receiving receipts by purchase order
router.get('/purchase-order/:purchaseOrderId', getReceivingReceiptsByPO);

// GET a single receiving receipt
router.get('/:id', getReceivingReceipt);

// POST create new receiving receipt
router.post('/', createReceivingReceipt);

// PATCH update receiving receipt status
router.patch('/:id/status', updateReceivingReceiptStatus);

// PATCH approve receiving receipt
router.patch('/:id/approve', approveReceivingReceipt);

// PATCH reject receiving receipt
router.patch('/:id/reject', rejectReceivingReceipt);

// DELETE receiving receipt
router.delete('/:id', deleteReceivingReceipt);

module.exports = router;
