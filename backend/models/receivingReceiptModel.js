const mongoose = require('mongoose');

// Receiving Receipt Item Schema
const receivingReceiptItemSchema = new mongoose.Schema({
    purchaseOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseOrder',
        required: true
    },
    purchaseOrderItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: false
    },
    productName: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        required: true
    },
    quantityOrdered: {
        type: Number,
        required: true,
        min: 0
    },
    quantityReceived: {
        type: Number,
        required: true,
        min: 0
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalValue: {
        type: Number,
        required: true,
        min: 0
    },
    condition: {
        type: String,
        enum: ['Good', 'Damaged', 'Defective', 'Partial'],
        default: 'Good'
    },
    location: {
        type: String,
        required: false
    },
    batchNumber: {
        type: String,
        required: false
    },
    serialNumber: {
        type: String,
        required: false
    },
    expiryDate: {
        type: Date,
        required: false
    },
    notes: {
        type: String,
        required: false
    }
});

// Receiving Receipt Schema
const receivingReceiptSchema = new mongoose.Schema({
    receiptNumber: {
        type: String,
        required: false,
        unique: true
    },
    
    // Purchase Order Reference
    purchaseOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseOrder',
        required: true
    },
    poNumber: {
        type: String,
        required: true
    },
    
    // Vendor Information
    vendorName: {
        type: String,
        required: true
    },
    vendorEmail: {
        type: String,
        required: false
    },
    
    // Receipt Details
    items: [receivingReceiptItemSchema],
    
    // Delivery Information
    deliveryDate: {
        type: Date,
        default: Date.now
    },
    trackingNumber: {
        type: String,
        required: false
    },
    carrier: {
        type: String,
        required: false
    },
    
    // Financial Information
    totalValue: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Quality Control
    qualityInspection: {
        passed: {
            type: Boolean,
            default: true
        },
        inspectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false
        },
        inspectionDate: {
            type: Date,
            required: false
        },
        inspectionNotes: {
            type: String,
            required: false
        }
    },
    
    // Receipt Status
    status: {
        type: String,
        enum: ['Received', 'Inspected', 'Approved', 'Rejected', 'Partial'],
        default: 'Received'
    },
    
    // Locations
    receivingLocation: {
        type: String,
        required: false
    },
    storageLocation: {
        type: String,
        required: false
    },
    
    // Additional Information
    notes: {
        type: String,
        required: false
    },
    discrepancyNotes: {
        type: String,
        required: false
    },
    
    // Receiving Personnel
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    inspectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    
    // Timestamps
    receivedAt: {
        type: Date,
        default: Date.now
    },
    inspectedAt: {
        type: Date,
        required: false
    },
    approvedAt: {
        type: Date,
        required: false
    },
    
    // System Information
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Generate receipt number before saving
receivingReceiptSchema.pre('save', async function(next) {
    if (!this.receiptNumber) {
        try {
            const count = await this.constructor.countDocuments();
            this.receiptNumber = `RR-${String(count + 1).padStart(6, '0')}`;
        } catch (error) {
            console.error('Error generating receipt number:', error);
            this.receiptNumber = `RR-${String(Date.now()).slice(-6)}`;
        }
    }
    next();
});

// Calculate total value before saving
receivingReceiptSchema.pre('save', function(next) {
    this.totalValue = this.items.reduce((sum, item) => sum + item.totalValue, 0);
    next();
});

// Create indexes for better query performance
receivingReceiptSchema.index({ purchaseOrderId: 1 });
receivingReceiptSchema.index({ poNumber: 1 });
receivingReceiptSchema.index({ vendorName: 1 });
receivingReceiptSchema.index({ receivedAt: -1 });
receivingReceiptSchema.index({ status: 1 });
// receiptNumber index is already created by unique: true

module.exports = mongoose.model('ReceivingReceipt', receivingReceiptSchema, 'receiving_receipts');
