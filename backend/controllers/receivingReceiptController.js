const ReceivingReceipt = require('../models/receivingReceiptModel');
const PurchaseOrder = require('../models/purchaseOrderModel');
const Inventory = require('../models/inventoryModel');
const mongoose = require('mongoose');

// GET all receiving receipts
const getReceivingReceipts = async (req, res) => {
    try {
        console.log('Fetching receiving receipts from database...');
        
        const receipts = await ReceivingReceipt.find({})
            .populate('purchaseOrderId', 'poNumber vendorName total')
            .populate('items.productId', 'name sku category')
            .populate('receivedBy', 'email name')
            .populate('inspectedBy', 'email name')
            .populate('approvedBy', 'email name')
            .populate('createdBy', 'email name')
            .sort({ receivedAt: -1 });
        
        console.log('Found', receipts.length, 'receiving receipts');
        res.status(200).json(receipts);
    } catch (error) {
        console.error('Error fetching receiving receipts:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET a single receiving receipt
const getReceivingReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid receiving receipt ID' });
        }
        
        const receipt = await ReceivingReceipt.findById(id)
            .populate('purchaseOrderId', 'poNumber vendorName vendorEmail total expectedDelivery')
            .populate('items.productId', 'name sku category description')
            .populate('receivedBy', 'email name')
            .populate('inspectedBy', 'email name')
            .populate('approvedBy', 'email name')
            .populate('createdBy', 'email name');
        
        if (!receipt) {
            return res.status(404).json({ error: 'Receiving receipt not found' });
        }
        
        res.status(200).json(receipt);
    } catch (error) {
        console.error('Error fetching receiving receipt:', error);
        res.status(500).json({ error: error.message });
    }
};

// CREATE a new receiving receipt
const createReceivingReceipt = async (req, res) => {
    const { 
        purchaseOrderId, 
        items, 
        deliveryDate,
        trackingNumber,
        carrier,
        qualityInspection,
        receivingLocation,
        storageLocation,
        notes,
        discrepancyNotes
    } = req.body;
    
    let emptyFields = [];
    
    if (!purchaseOrderId) emptyFields.push('purchaseOrderId');
    if (!items || items.length === 0) emptyFields.push('items');
    
    if (emptyFields.length > 0) {
        return res.status(400).json({ error: 'Please fill in all required fields', emptyFields });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Validate purchase order
        const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId).session(session);
        if (!purchaseOrder) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        const createdBy = req.user._id;
        
        // Process items
        const processedItems = [];
        let totalValue = 0;
        
        for (const item of items) {
            if (!item.quantityReceived || item.quantityReceived <= 0) {
                continue; // Skip items with no quantity received
            }
            
            // Find the corresponding item in the purchase order
            const poItem = purchaseOrder.items.id(item.purchaseOrderItemId);
            if (!poItem) {
                throw new Error(`Purchase order item not found: ${item.purchaseOrderItemId}`);
            }
            
            const itemTotalValue = item.quantityReceived * poItem.unitPrice;
            totalValue += itemTotalValue;
            
            processedItems.push({
                purchaseOrderId: purchaseOrderId,
                purchaseOrderItemId: item.purchaseOrderItemId,
                productId: poItem.productId,
                productName: poItem.productName,
                sku: poItem.sku,
                quantityOrdered: poItem.quantity,
                quantityReceived: item.quantityReceived,
                unitPrice: poItem.unitPrice,
                totalValue: itemTotalValue,
                condition: item.condition || 'Good',
                location: item.location || storageLocation,
                batchNumber: item.batchNumber,
                serialNumber: item.serialNumber,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                notes: item.notes
            });
        }
        
        if (processedItems.length === 0) {
            return res.status(400).json({ error: 'No items to receive' });
        }
        
        // Create receiving receipt
        const receivingReceipt = new ReceivingReceipt({
            purchaseOrderId,
            poNumber: purchaseOrder.poNumber,
            vendorName: purchaseOrder.vendorName,
            vendorEmail: purchaseOrder.vendorEmail,
            items: processedItems,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
            trackingNumber,
            carrier,
            totalValue,
            qualityInspection: qualityInspection || { passed: true },
            receivingLocation,
            storageLocation,
            notes,
            discrepancyNotes,
            receivedBy: createdBy,
            createdBy
        });
        
        await receivingReceipt.save({ session });
        
        await session.commitTransaction();
        
        console.log('Created new receiving receipt:', receivingReceipt.receiptNumber);
        
        // Populate the response
        const populatedReceipt = await ReceivingReceipt.findById(receivingReceipt._id)
            .populate('purchaseOrderId', 'poNumber vendorName total')
            .populate('items.productId', 'name sku category')
            .populate('receivedBy', 'email name')
            .populate('createdBy', 'email name');
        
        res.status(201).json(populatedReceipt);
    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating receiving receipt:', error);
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

// UPDATE receiving receipt status
const updateReceivingReceiptStatus = async (req, res) => {
    const { id } = req.params;
    const { status, inspectionNotes, approvalNotes } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid receiving receipt ID' });
    }
    
    try {
        const receipt = await ReceivingReceipt.findById(id);
        if (!receipt) {
            return res.status(404).json({ error: 'Receiving receipt not found' });
        }
        
        const updateData = { status };
        
        if (status === 'Inspected') {
            updateData.inspectedBy = req.user._id;
            updateData.inspectedAt = new Date();
            if (inspectionNotes) {
                updateData['qualityInspection.inspectionNotes'] = inspectionNotes;
                updateData['qualityInspection.inspectedBy'] = req.user._id;
                updateData['qualityInspection.inspectionDate'] = new Date();
            }
        } else if (status === 'Approved') {
            updateData.approvedBy = req.user._id;
            updateData.approvedAt = new Date();
            if (approvalNotes) {
                updateData.notes = approvalNotes;
            }
        }
        
        const updatedReceipt = await ReceivingReceipt.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('purchaseOrderId', 'poNumber vendorName total')
        .populate('items.productId', 'name sku category')
        .populate('receivedBy', 'email name')
        .populate('inspectedBy', 'email name')
        .populate('approvedBy', 'email name')
        .populate('createdBy', 'email name');
        
        console.log('Updated receiving receipt status:', updatedReceipt.receiptNumber);
        res.status(200).json(updatedReceipt);
    } catch (error) {
        console.error('Error updating receiving receipt:', error);
        res.status(400).json({ error: error.message });
    }
};

// APPROVE receiving receipt
const approveReceivingReceipt = async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid receiving receipt ID' });
    }
    
    try {
        const receipt = await ReceivingReceipt.findById(id);
        if (!receipt) {
            return res.status(404).json({ error: 'Receiving receipt not found' });
        }
        
        if (receipt.status === 'Approved') {
            return res.status(400).json({ error: 'Receipt is already approved' });
        }
        
        receipt.status = 'Approved';
        receipt.approvedBy = req.user._id;
        receipt.approvedAt = new Date();
        if (notes) receipt.notes = notes;
        
        await receipt.save();
        
        const updatedReceipt = await ReceivingReceipt.findById(id)
            .populate('purchaseOrderId', 'poNumber vendorName total')
            .populate('items.productId', 'name sku category')
            .populate('receivedBy', 'email name')
            .populate('inspectedBy', 'email name')
            .populate('approvedBy', 'email name')
            .populate('createdBy', 'email name');
        
        console.log('Approved receiving receipt:', updatedReceipt.receiptNumber);
        res.status(200).json(updatedReceipt);
    } catch (error) {
        console.error('Error approving receiving receipt:', error);
        res.status(400).json({ error: error.message });
    }
};

// REJECT receiving receipt
const rejectReceivingReceipt = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid receiving receipt ID' });
    }
    
    try {
        const receipt = await ReceivingReceipt.findById(id);
        if (!receipt) {
            return res.status(404).json({ error: 'Receiving receipt not found' });
        }
        
        if (receipt.status === 'Rejected') {
            return res.status(400).json({ error: 'Receipt is already rejected' });
        }
        
        receipt.status = 'Rejected';
        receipt.discrepancyNotes = reason || 'Receipt rejected';
        receipt.inspectedBy = req.user._id;
        receipt.inspectedAt = new Date();
        
        await receipt.save();
        
        const updatedReceipt = await ReceivingReceipt.findById(id)
            .populate('purchaseOrderId', 'poNumber vendorName total')
            .populate('items.productId', 'name sku category')
            .populate('receivedBy', 'email name')
            .populate('inspectedBy', 'email name')
            .populate('approvedBy', 'email name')
            .populate('createdBy', 'email name');
        
        console.log('Rejected receiving receipt:', updatedReceipt.receiptNumber);
        res.status(200).json({ message: 'Receipt rejected successfully', receipt: updatedReceipt });
    } catch (error) {
        console.error('Error rejecting receiving receipt:', error);
        res.status(400).json({ error: error.message });
    }
};

// DELETE receiving receipt
const deleteReceivingReceipt = async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid receiving receipt ID' });
    }
    
    try {
        const receipt = await ReceivingReceipt.findById(id);
        if (!receipt) {
            return res.status(404).json({ error: 'Receiving receipt not found' });
        }
        
        // Only allow deletion if receipt is not approved
        if (receipt.status === 'Approved') {
            return res.status(400).json({ error: 'Cannot delete approved receipt' });
        }
        
        await ReceivingReceipt.findByIdAndDelete(id);
        console.log('Deleted receiving receipt:', receipt.receiptNumber);
        res.status(200).json({ message: 'Receiving receipt deleted successfully' });
    } catch (error) {
        console.error('Error deleting receiving receipt:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET receiving receipts by purchase order
const getReceivingReceiptsByPO = async (req, res) => {
    const { purchaseOrderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(purchaseOrderId)) {
        return res.status(400).json({ error: 'Invalid purchase order ID' });
    }
    
    try {
        const receipts = await ReceivingReceipt.find({ purchaseOrderId })
            .populate('items.productId', 'name sku category')
            .populate('receivedBy', 'email name')
            .populate('inspectedBy', 'email name')
            .populate('approvedBy', 'email name')
            .populate('createdBy', 'email name')
            .sort({ receivedAt: -1 });
        
        res.status(200).json(receipts);
    } catch (error) {
        console.error('Error fetching receipts by PO:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET receiving receipt statistics
const getReceivingReceiptStats = async (req, res) => {
    try {
        const stats = await ReceivingReceipt.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$totalValue' }
                }
            }
        ]);
        
        const totalReceipts = await ReceivingReceipt.countDocuments();
        const totalValue = await ReceivingReceipt.aggregate([
            { $group: { _id: null, total: { $sum: '$totalValue' } } }
        ]);
        
        const recentReceipts = await ReceivingReceipt.find({})
            .populate('purchaseOrderId', 'poNumber vendorName')
            .populate('receivedBy', 'email name')
            .sort({ receivedAt: -1 })
            .limit(10);
        
        res.status(200).json({
            totalReceipts,
            totalValue: totalValue[0]?.total || 0,
            statusBreakdown: stats,
            recentReceipts
        });
    } catch (error) {
        console.error('Error fetching receipt stats:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getReceivingReceipts,
    getReceivingReceipt,
    createReceivingReceipt,
    updateReceivingReceiptStatus,
    approveReceivingReceipt,
    rejectReceivingReceipt,
    deleteReceivingReceipt,
    getReceivingReceiptsByPO,
    getReceivingReceiptStats
};
