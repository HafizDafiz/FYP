const Inventory = require('../models/inventoryModel');
const SaleOrder = require('../models/saleModel');
const { logAction } = require('./auditLogController');
const mongoose = require('mongoose');

// GET all sales orders
const getSalesOrders = async (req, res) => {
    try {
        console.log('Fetching sales orders from database...');
        const salesOrders = await SaleOrder.find({})
            .populate('items.productId', 'name sku')
            .populate('createdBy', 'email')
            .sort({ createdAt: -1 });
        
        console.log('Found', salesOrders.length, 'sales orders');
        res.status(200).json(salesOrders);
    } catch (error) {
        console.error('Error fetching sales orders:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET a single sales order
const getSalesOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid sales order ID' });
        }
        
        const salesOrder = await SaleOrder.findById(id)
            .populate('items.productId', 'name sku')
            .populate('createdBy', 'email');
        
        if (!salesOrder) {
            return res.status(404).json({ error: 'Sales order not found' });
        }
        
        res.status(200).json(salesOrder);
    } catch (error) {
        console.error('Error fetching sales order:', error);
        res.status(500).json({ error: error.message });
    }
};

// CREATE a new sales order
const createSalesOrder = async (req, res) => {
    const { 
        customerName, 
        customerEmail, 
        customerPhone, 
        customerAddress, 
        items, 
        tax, 
        discount,
        shippingCost,
        carrier,
        expectedDelivery,
        notes 
    } = req.body;
    
    let emptyFields = [];
    
    if (!customerName) emptyFields.push('customerName');
    if (!customerEmail) emptyFields.push('customerEmail');
    if (!items || items.length === 0) emptyFields.push('items');
    
    if (emptyFields.length > 0) {
        return res.status(400).json({ error: 'Please fill in all required fields', emptyFields });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const createdBy = req.user._id;
        
        // Validate and process items
        let subtotal = 0;
        const processedItems = [];
        
        for (const item of items) {
            // Find the product in inventory
            const product = await Inventory.findById(item.productId).session(session);
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }
            
            // Check if enough stock is available
            if (product.quantity < item.quantity) {
                throw new Error(`Not enough stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`);
            }
            
            const totalPrice = item.quantity * product.rate;
            subtotal += totalPrice;
            
            processedItems.push({
                productId: product._id,
                productName: product.name,
                sku: product.sku,
                quantity: item.quantity,
                unitPrice: product.rate,
                totalPrice: totalPrice
            });
            
            // Update inventory quantity
            product.quantity -= item.quantity;
            await product.save({ session });
        }
        
        // Calculate totals
        const taxAmount = tax || 0;
        const discountAmount = discount || 0;
        const shippingAmount = shippingCost || 0;
        const total = subtotal + taxAmount + shippingAmount - discountAmount;
        
        // Create sales order
        const salesOrder = new SaleOrder({
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            items: processedItems,
            subtotal,
            tax: taxAmount,
            discount: discountAmount,
            shippingCost: shippingAmount,
            carrier,
            total,
            expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
            notes,
            createdBy
        });
        
        await salesOrder.save({ session });
        
        await session.commitTransaction();
        
        console.log('Created new sales order:', salesOrder.orderNumber);
        
        // Log the action
        await logAction(createdBy, 'Create Sale', {
            entityType: 'Sale',
            entityId: salesOrder._id,
            entityName: salesOrder.orderNumber,
            description: `Created sales order: ${salesOrder.orderNumber} for ${customerName} (Total: $${total})`
        });
        
        // Populate the response
        const populatedOrder = await SaleOrder.findById(salesOrder._id)
            .populate('items.productId', 'name sku')
            .populate('createdBy', 'email');
        
        res.status(201).json(populatedOrder);
    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating sales order:', error);
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

// UPDATE sales order status
const updateSalesOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status, paymentStatus, notes } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid sales order ID' });
    }
    
    try {
        const salesOrder = await SaleOrder.findById(id);
        if (!salesOrder) {
            return res.status(404).json({ error: 'Sales order not found' });
        }
        
        const updateData = {};
        if (status) updateData.status = status;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (notes) updateData.notes = notes;
        
        const updatedOrder = await SaleOrder.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('items.productId', 'name sku')
         .populate('createdBy', 'email');
        
        console.log('Updated sales order status:', updatedOrder.orderNumber);
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error updating sales order:', error);
        res.status(400).json({ error: error.message });
    }
};

// CANCEL sales order (restore inventory)
const cancelSalesOrder = async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid sales order ID' });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const salesOrder = await SaleOrder.findById(id).session(session);
        if (!salesOrder) {
            return res.status(404).json({ error: 'Sales order not found' });
        }
        
        if (salesOrder.status === 'Cancelled') {
            return res.status(400).json({ error: 'Sales order is already cancelled' });
        }
        
        // Restore inventory quantities
        for (const item of salesOrder.items) {
            const product = await Inventory.findById(item.productId).session(session);
            if (product) {
                product.quantity += item.quantity;
                await product.save({ session });
            }
        }
        
        // Update order status
        salesOrder.status = 'Cancelled';
        await salesOrder.save({ session });
        
        await session.commitTransaction();
        
        console.log('Cancelled sales order:', salesOrder.orderNumber);
        res.status(200).json({ message: 'Sales order cancelled successfully', salesOrder });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error cancelling sales order:', error);
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

// DELETE sales order
const deleteSalesOrder = async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid sales order ID' });
    }
    
    try {
        const salesOrder = await SaleOrder.findById(id);
        if (!salesOrder) {
            return res.status(404).json({ error: 'Sales order not found' });
        }
        
        // Only allow deletion if order is cancelled or pending
        if (!['Cancelled', 'Pending'].includes(salesOrder.status)) {
            return res.status(400).json({ error: 'Can only delete cancelled or pending orders' });
        }
        
        await SaleOrder.findByIdAndDelete(id);
        console.log('Deleted sales order:', salesOrder.orderNumber);
        res.status(200).json({ message: 'Sales order deleted successfully' });
    } catch (error) {
        console.error('Error deleting sales order:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getSalesOrders,
    getSalesOrder,
    createSalesOrder,
    updateSalesOrderStatus,
    cancelSalesOrder,
    deleteSalesOrder
};
