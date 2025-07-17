const express = require('express');
const router = express.Router();
const {
    getShipments,
    getShipment,
    createShipment,
    updateShipmentStatus,
    updateShipment,
    deleteShipment,
    getShipmentsBySalesOrder,
    getShipmentTracking
} = require('../controllers/shipmentController');
const requireAuth = require('../middleware/requireAuth');

// Require auth for all shipment routes
router.use(requireAuth);

// GET all shipments
router.get('/', getShipments);

// GET a single shipment
router.get('/:id', getShipment);

// POST create new shipment
router.post('/', createShipment);

// PATCH update shipment status
router.patch('/:id/status', updateShipmentStatus);

// PATCH update shipment details
router.patch('/:id', updateShipment);

// DELETE shipment
router.delete('/:id', deleteShipment);

// GET shipments by sales order
router.get('/sales-order/:salesOrderId', getShipmentsBySalesOrder);

// GET shipment tracking by tracking number (public route, no auth required)
router.get('/tracking/:trackingNumber', getShipmentTracking);

module.exports = router;
