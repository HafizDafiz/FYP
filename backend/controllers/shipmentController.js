const Shipment = require('../models/shipmentModel');
const SaleOrder = require('../models/saleModel');
const Inventory = require('../models/inventoryModel');
const mongoose = require('mongoose');

// GET all shipments
const getShipments = async (req, res) => {
    try {
        const shipments = await Shipment.find()
            .populate('salesOrderId', 'orderNumber customerName total')
            .populate('createdBy', 'email')
            .sort({ createdAt: -1 });
        
        res.status(200).json(shipments);
    } catch (error) {
        console.error('Error fetching shipments:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET a single shipment by ID
const getShipment = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid shipment ID' });
        }
        
        const shipment = await Shipment.findById(id)
            .populate('salesOrderId', 'orderNumber customerName total orderDate')
            .populate('createdBy', 'email')
            .populate('trackingHistory.updatedBy', 'email');
        
        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        
        res.status(200).json(shipment);
    } catch (error) {
        console.error('Error fetching shipment:', error);
        res.status(500).json({ error: error.message });
    }
};

// CREATE a new shipment from sales order
const createShipment = async (req, res) => {
    try {
        const {
            salesOrderId,
            shippingAddress,
            carrier,
            shippingMethod,
            trackingNumber,
            estimatedDelivery,
            shippingCost,
            weight,
            dimensions,
            priority,
            notes,
            signatureRequired,
            insuranceValue
        } = req.body;

        // Validate required fields
        const requiredFields = ['salesOrderId', 'shippingAddress', 'carrier', 'shippingMethod', 'shippingCost'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                error: 'Missing required fields', 
                missingFields 
            });
        }

        // Validate sales order exists
        const salesOrder = await SaleOrder.findById(salesOrderId);
        if (!salesOrder) {
            return res.status(404).json({ error: 'Sales order not found' });
        }

        // Check if sales order is confirmed or processing
        if (!['Confirmed', 'Processing'].includes(salesOrder.status)) {
            return res.status(400).json({ 
                error: 'Sales order must be confirmed or processing to create shipment' 
            });
        }

        // Check if shipment already exists for this sales order
        const existingShipment = await Shipment.findOne({ salesOrderId });
        if (existingShipment) {
            return res.status(400).json({ 
                error: 'Shipment already exists for this sales order' 
            });
        }

        // Create shipment
        const shipment = new Shipment({
            salesOrderId,
            salesOrderNumber: salesOrder.orderNumber,
            customerName: salesOrder.customerName,
            customerEmail: salesOrder.customerEmail,
            customerPhone: salesOrder.customerPhone,
            shippingAddress,
            items: salesOrder.items,
            carrier,
            shippingMethod,
            trackingNumber,
            estimatedDelivery,
            shippingCost,
            weight,
            dimensions,
            priority: priority || 'Normal',
            notes,
            signatureRequired: signatureRequired || false,
            insuranceValue,
            createdBy: req.user._id
        });

        const savedShipment = await shipment.save();

        // Update sales order status to 'Shipped' if shipment is created
        salesOrder.status = 'Shipped';
        await salesOrder.save();

        // Populate the response
        const populatedShipment = await Shipment.findById(savedShipment._id)
            .populate('salesOrderId', 'orderNumber customerName total')
            .populate('createdBy', 'email');

        res.status(201).json(populatedShipment);
    } catch (error) {
        console.error('Error creating shipment:', error);
        res.status(500).json({ error: error.message });
    }
};

// UPDATE shipment status
const updateShipmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, location, notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid shipment ID' });
        }

        const shipment = await Shipment.findById(id);
        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        // Add tracking entry
        shipment.trackingHistory.push({
            status,
            location,
            notes,
            timestamp: new Date(),
            updatedBy: req.user._id
        });

        // Update shipment status
        shipment.status = status;

        // If delivered, set actual delivery date
        if (status === 'Delivered') {
            shipment.actualDelivery = new Date();
            
            // Also update the sales order status
            const salesOrder = await SaleOrder.findById(shipment.salesOrderId);
            if (salesOrder) {
                salesOrder.status = 'Delivered';
                await salesOrder.save();
            }
        }

        await shipment.save();

        const updatedShipment = await Shipment.findById(id)
            .populate('salesOrderId', 'orderNumber customerName total')
            .populate('createdBy', 'email')
            .populate('trackingHistory.updatedBy', 'email');

        res.status(200).json(updatedShipment);
    } catch (error) {
        console.error('Error updating shipment status:', error);
        res.status(500).json({ error: error.message });
    }
};

// UPDATE shipment details
const updateShipment = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid shipment ID' });
        }

        const shipment = await Shipment.findById(id);
        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        // Don't allow updating certain fields
        const restrictedFields = ['shipmentNumber', 'salesOrderId', 'createdBy'];
        restrictedFields.forEach(field => delete updateData[field]);

        const updatedShipment = await Shipment.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('salesOrderId', 'orderNumber customerName total')
        .populate('createdBy', 'email');

        res.status(200).json(updatedShipment);
    } catch (error) {
        console.error('Error updating shipment:', error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE shipment (only if not shipped)
const deleteShipment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid shipment ID' });
        }

        const shipment = await Shipment.findById(id);
        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        // Only allow deletion if shipment hasn't been shipped
        if (['Shipped', 'In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status)) {
            return res.status(400).json({ 
                error: 'Cannot delete shipment that has already been shipped' 
            });
        }

        await Shipment.findByIdAndDelete(id);

        // Update sales order status back to processing
        const salesOrder = await SaleOrder.findById(shipment.salesOrderId);
        if (salesOrder) {
            salesOrder.status = 'Processing';
            await salesOrder.save();
        }

        res.status(200).json({ message: 'Shipment deleted successfully' });
    } catch (error) {
        console.error('Error deleting shipment:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET shipments by sales order
const getShipmentsBySalesOrder = async (req, res) => {
    try {
        const { salesOrderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(salesOrderId)) {
            return res.status(400).json({ error: 'Invalid sales order ID' });
        }

        const shipments = await Shipment.find({ salesOrderId })
            .populate('salesOrderId', 'orderNumber customerName total')
            .populate('createdBy', 'email')
            .sort({ createdAt: -1 });

        res.status(200).json(shipments);
    } catch (error) {
        console.error('Error fetching shipments by sales order:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET shipment tracking
const getShipmentTracking = async (req, res) => {
    try {
        const { trackingNumber } = req.params;

        const shipment = await Shipment.findOne({ trackingNumber })
            .populate('salesOrderId', 'orderNumber customerName')
            .populate('trackingHistory.updatedBy', 'email');

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found with this tracking number' });
        }

        // Return only tracking-relevant information
        const trackingInfo = {
            shipmentNumber: shipment.shipmentNumber,
            trackingNumber: shipment.trackingNumber,
            status: shipment.status,
            carrier: shipment.carrier,
            shippingMethod: shipment.shippingMethod,
            estimatedDelivery: shipment.estimatedDelivery,
            actualDelivery: shipment.actualDelivery,
            shippingAddress: shipment.shippingAddress,
            trackingHistory: shipment.trackingHistory,
            customerName: shipment.customerName,
            salesOrderNumber: shipment.salesOrderNumber
        };

        res.status(200).json(trackingInfo);
    } catch (error) {
        console.error('Error fetching shipment tracking:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getShipments,
    getShipment,
    createShipment,
    updateShipmentStatus,
    updateShipment,
    deleteShipment,
    getShipmentsBySalesOrder,
    getShipmentTracking
};
