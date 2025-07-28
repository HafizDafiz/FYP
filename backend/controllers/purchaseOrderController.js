const PurchaseOrder = require('../models/purchaseOrderModel');
const Inventory = require('../models/inventoryModel');
const ReceivingReceipt = require('../models/receivingReceiptModel');
const { logAction } = require('./auditLogController');
const mongoose = require('mongoose');

// GET all purchase orders
const getPurchaseOrders = async (req, res) => {
    try {
        console.log('Fetching purchase orders from database...');
        const purchaseOrders = await PurchaseOrder.find({})
            .populate('items.productId', 'name sku category')
            .populate('createdBy', 'email name')
            .populate('approvedBy', 'email name')
            .sort({ createdAt: -1 });
        
        console.log('Found', purchaseOrders.length, 'purchase orders');
        res.status(200).json(purchaseOrders);
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET a single purchase order
const getPurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid purchase order ID' });
        }
        
        const purchaseOrder = await PurchaseOrder.findById(id)
            .populate('items.productId', 'name sku category')
            .populate('createdBy', 'email name')
            .populate('approvedBy', 'email name')
            .populate('statusHistory.changedBy', 'email name');
        
        if (!purchaseOrder) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        res.status(200).json(purchaseOrder);
    } catch (error) {
        console.error('Error fetching purchase order:', error);
        res.status(500).json({ error: error.message });
    }
};

// CREATE a new purchase order
const createPurchaseOrder = async (req, res) => {
    const { 
        vendorName, 
        vendorEmail, 
        vendorPhone, 
        vendorAddress, 
        items, 
        tax, 
        discount, 
        shippingCost,
        carrier,
        expectedDelivery,
        notes,
        internalNotes,
        priority,
        paymentTerms,
        department,
        deliveryLocation
    } = req.body;
    
    let emptyFields = [];
    
    if (!vendorName) emptyFields.push('vendorName');
    if (!vendorEmail) emptyFields.push('vendorEmail');
    if (!items || items.length === 0) emptyFields.push('items');
    
    if (emptyFields.length > 0) {
        return res.status(400).json({ error: 'Please fill in all required fields', emptyFields });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const createdBy = req.user._id;
        
        // Process items
        let subtotal = 0;
        const processedItems = [];
        
        for (const item of items) {
            // Check if product exists in inventory
            let product = null;
            if (item.productId) {
                product = await Inventory.findById(item.productId).session(session);
            }
            
            const totalPrice = item.quantity * item.unitPrice;
            subtotal += totalPrice;
            
            processedItems.push({
                productId: product ? product._id : null,
                productName: item.productName,
                sku: item.sku,
                description: item.description || '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: totalPrice,
                receivedQuantity: 0,
                pendingQuantity: item.quantity
            });
        }
        
        // Calculate totals
        const taxAmount = tax || 0;
        const discountAmount = discount || 0;
        const shippingAmount = shippingCost || 0;
        const total = subtotal + taxAmount - discountAmount + shippingAmount;
        
        // Create purchase order
        const purchaseOrder = new PurchaseOrder({
            vendorName,
            vendorEmail,
            vendorPhone,
            vendorAddress,
            items: processedItems,
            subtotal,
            tax: taxAmount,
            discount: discountAmount,
            shippingCost: shippingAmount,
            carrier,
            total,
            expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
            notes,
            internalNotes,
            priority: priority || 'Medium',
            paymentTerms: paymentTerms || 'Net 30',
            department,
            deliveryLocation,
            createdBy,
            statusHistory: [{
                status: 'Draft',
                changedAt: new Date(),
                changedBy: createdBy,
                notes: 'Purchase order created'
            }]
        });
        
        await purchaseOrder.save({ session });
        
        await session.commitTransaction();
        
        console.log('Created new purchase order:', purchaseOrder.poNumber);
        
        // Log the action
        await logAction(createdBy, 'Create Purchase Order', {
            entityType: 'PurchaseOrder',
            entityId: purchaseOrder._id,
            entityName: purchaseOrder.poNumber,
            description: `Created purchase order: ${purchaseOrder.poNumber} for ${vendorName} (Total: $${total})`
        });
        
        // Populate the response
        const populatedOrder = await PurchaseOrder.findById(purchaseOrder._id)
            .populate('items.productId', 'name sku category')
            .populate('createdBy', 'email name');
        
        res.status(201).json(populatedOrder);
    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating purchase order:', error);
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

// UPDATE purchase order status
const updatePurchaseOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid purchase order ID' });
    }
    
    try {
        const purchaseOrder = await PurchaseOrder.findById(id);
        if (!purchaseOrder) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        // Add to status history
        purchaseOrder.statusHistory.push({
            status: status,
            changedAt: new Date(),
            changedBy: req.user._id,
            notes: notes || `Status changed to ${status}`
        });
        
        purchaseOrder.status = status;
        await purchaseOrder.save();
        
        const updatedOrder = await PurchaseOrder.findById(id)
            .populate('items.productId', 'name sku category')
            .populate('createdBy', 'email name')
            .populate('approvedBy', 'email name');
        
        console.log('Updated purchase order status:', updatedOrder.poNumber);
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error updating purchase order:', error);
        res.status(400).json({ error: error.message });
    }
};

// APPROVE purchase order
const approvePurchaseOrder = async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid purchase order ID' });
    }
    
    try {
        const purchaseOrder = await PurchaseOrder.findById(id);
        if (!purchaseOrder) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        purchaseOrder.approvalStatus = 'Approved';
        purchaseOrder.approvedBy = req.user._id;
        purchaseOrder.approvedAt = new Date();
        
        if (purchaseOrder.status === 'Draft') {
            purchaseOrder.status = 'Sent';
        }
        
        // Add to status history
        purchaseOrder.statusHistory.push({
            status: 'Approved',
            changedAt: new Date(),
            changedBy: req.user._id,
            notes: notes || 'Purchase order approved'
        });
        
        await purchaseOrder.save();
        
        const updatedOrder = await PurchaseOrder.findById(id)
            .populate('items.productId', 'name sku category')
            .populate('createdBy', 'email name')
            .populate('approvedBy', 'email name');
        
        console.log('Approved purchase order:', updatedOrder.poNumber);
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error approving purchase order:', error);
        res.status(400).json({ error: error.message });
    }
};

// RECEIVE items from purchase order
const receiveItems = async (req, res) => {
    const { id } = req.params;
    const { receivedItems, trackingNumber, carrier, actualDelivery, notes } = req.body;
    
    console.log('Receive items request for PO:', id);
    console.log('Request body:', req.body);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid purchase order ID' });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const purchaseOrder = await PurchaseOrder.findById(id).session(session);
        if (!purchaseOrder) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        // Update received quantities and inventory
        for (const receivedItem of receivedItems) {
            console.log('Processing received item:', receivedItem);
            const orderItem = purchaseOrder.items.id(receivedItem.itemId);
            console.log('Found order item:', orderItem);
            
            if (!orderItem) {
                console.error('Item not found in purchase order:', receivedItem.itemId);
                console.error('Available items:', purchaseOrder.items.map(item => ({ id: item._id, name: item.productName })));
                throw new Error(`Item not found in purchase order: ${receivedItem.itemId}`);
            }
            
            // Update received quantity
            orderItem.receivedQuantity += receivedItem.quantityReceived;
            orderItem.pendingQuantity = orderItem.quantity - orderItem.receivedQuantity;
            
            // Update inventory
            if (orderItem.productId) {
                // Existing product - update quantity
                const product = await Inventory.findById(orderItem.productId).session(session);
                if (product) {
                    product.quantity += receivedItem.quantityReceived;
                    await product.save({ session });
                }
            } else {
                // New product - create inventory item
                const newProduct = new Inventory({
                    name: orderItem.productName,
                    sku: orderItem.sku,
                    type: 'Product', // Required field
                    description: orderItem.description || '',
                    quantity: receivedItem.quantityReceived,
                    rate: orderItem.unitPrice,
                    user_id: req.user._id.toString()
                });
                
                await newProduct.save({ session });
                orderItem.productId = newProduct._id;
            }
        }
        
        // Update tracking information
        if (trackingNumber) purchaseOrder.trackingNumber = trackingNumber;
        if (carrier) purchaseOrder.carrier = carrier;
        if (actualDelivery) purchaseOrder.actualDelivery = new Date(actualDelivery);
        if (notes) purchaseOrder.receivingNotes = notes;
        
        // Update receiving status
        const totalOrdered = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalReceived = purchaseOrder.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
        
        if (totalReceived === 0) {
            purchaseOrder.receivingStatus = 'Pending';
        } else if (totalReceived < totalOrdered) {
            purchaseOrder.receivingStatus = 'Partially Received';
            purchaseOrder.status = 'Partially Received';
        } else {
            purchaseOrder.receivingStatus = 'Fully Received';
            purchaseOrder.status = 'Received';
        }
        
        // Add to status history
        purchaseOrder.statusHistory.push({
            status: purchaseOrder.status,
            changedAt: new Date(),
            changedBy: req.user._id,
            notes: `Items received: ${receivedItems.length} item(s)`
        });
        
        await purchaseOrder.save({ session });
        
        // Create receiving receipt
        const receiptData = {
            purchaseOrderId: purchaseOrder._id,
            poNumber: purchaseOrder.poNumber,
            vendorName: purchaseOrder.vendorName,
            vendorEmail: purchaseOrder.vendorEmail,
            receivedAt: new Date(),
            receivedBy: req.user._id,
            items: receivedItems.map(receivedItem => {
                const orderItem = purchaseOrder.items.id(receivedItem.itemId);
                return {
                    purchaseOrderId: purchaseOrder._id,
                    purchaseOrderItemId: receivedItem.itemId,
                    productId: orderItem.productId,
                    productName: orderItem.productName,
                    sku: orderItem.sku,
                    quantityOrdered: orderItem.quantity,
                    quantityReceived: receivedItem.quantityReceived,
                    unitPrice: orderItem.unitPrice,
                    totalValue: orderItem.unitPrice * receivedItem.quantityReceived,
                    condition: receivedItem.condition || 'Good',
                    notes: receivedItem.notes || ''
                };
            }),
            trackingNumber: trackingNumber || '',
            carrier: carrier || '',
            deliveryDate: actualDelivery ? new Date(actualDelivery) : new Date(),
            status: 'Received',
            totalValue: receivedItems.reduce((sum, receivedItem) => {
                const orderItem = purchaseOrder.items.id(receivedItem.itemId);
                return sum + (orderItem.unitPrice * receivedItem.quantityReceived);
            }, 0),
            notes: req.body.notes || '',
            createdBy: req.user._id
        };
        
        const receivingReceipt = new ReceivingReceipt(receiptData);
        await receivingReceipt.save({ session });
        
        await session.commitTransaction();
        
        const updatedOrder = await PurchaseOrder.findById(id)
            .populate('items.productId', 'name sku category')
            .populate('createdBy', 'email name')
            .populate('approvedBy', 'email name');
        
        console.log('Received items for purchase order:', updatedOrder.poNumber);
        console.log('Created receiving receipt:', receivingReceipt.receiptNumber);
        res.status(200).json({ 
            purchaseOrder: updatedOrder, 
            receivingReceipt: receivingReceipt,
            message: 'Items received successfully and receipt created'
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error receiving items:', error);
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

// CANCEL purchase order
const cancelPurchaseOrder = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid purchase order ID' });
    }
    
    try {
        const purchaseOrder = await PurchaseOrder.findById(id);
        if (!purchaseOrder) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        if (purchaseOrder.status === 'Cancelled') {
            return res.status(400).json({ error: 'Purchase order is already cancelled' });
        }
        
        if (purchaseOrder.receivingStatus === 'Fully Received') {
            return res.status(400).json({ error: 'Cannot cancel fully received purchase order' });
        }
        
        purchaseOrder.status = 'Cancelled';
        
        // Add to status history
        purchaseOrder.statusHistory.push({
            status: 'Cancelled',
            changedAt: new Date(),
            changedBy: req.user._id,
            notes: reason || 'Purchase order cancelled'
        });
        
        await purchaseOrder.save();
        
        const updatedOrder = await PurchaseOrder.findById(id)
            .populate('items.productId', 'name sku category')
            .populate('createdBy', 'email name')
            .populate('approvedBy', 'email name');
        
        console.log('Cancelled purchase order:', updatedOrder.poNumber);
        res.status(200).json({ message: 'Purchase order cancelled successfully', purchaseOrder: updatedOrder });
    } catch (error) {
        console.error('Error cancelling purchase order:', error);
        res.status(400).json({ error: error.message });
    }
};

// DELETE purchase order
const deletePurchaseOrder = async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid purchase order ID' });
    }
    
    try {
        const purchaseOrder = await PurchaseOrder.findById(id);
        if (!purchaseOrder) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        // Only allow deletion if order is cancelled or draft
        if (!['Cancelled', 'Draft'].includes(purchaseOrder.status)) {
            return res.status(400).json({ error: 'Can only delete cancelled or draft purchase orders' });
        }
        
        await PurchaseOrder.findByIdAndDelete(id);
        console.log('Deleted purchase order:', purchaseOrder.poNumber);
        res.status(200).json({ message: 'Purchase order deleted successfully' });
    } catch (error) {
        console.error('Error deleting purchase order:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    approvePurchaseOrder,
    receiveItems,
    cancelPurchaseOrder,
    deletePurchaseOrder
};
