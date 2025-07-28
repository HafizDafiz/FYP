const mongoose = require('mongoose');

// Purchase Order Item Schema
const purchaseOrderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: false // Allow creating new items
    },
    productName: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    receivedQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    pendingQuantity: {
        type: Number,
        default: function() {
            return this.quantity - this.receivedQuantity;
        }
    }
});

// Purchase Order Schema
const purchaseOrderSchema = new mongoose.Schema({
    poNumber: {
        type: String,
        required: false,
        unique: true
    },
    
    // Vendor Information
    vendorName: {
        type: String,
        required: true
    },
    vendorEmail: {
        type: String,
        required: true
    },
    vendorPhone: {
        type: String,
        required: false
    },
    vendorAddress: {
        type: String,
        required: false
    },
    
    // Purchase Order Details
    items: [purchaseOrderItemSchema],
    
    // Financial Information
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Status and Workflow
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Acknowledged', 'Partially Received', 'Received', 'Cancelled', 'Closed'],
        default: 'Draft'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    
    // Dates
    orderDate: {
        type: Date,
        default: Date.now
    },
    expectedDelivery: {
        type: Date,
        required: false
    },
    actualDelivery: {
        type: Date,
        required: false
    },
    
    // Additional Information
    notes: {
        type: String,
        required: false
    },
    internalNotes: {
        type: String,
        required: false
    },
    
    // Approval Workflow
    approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    approvedAt: {
        type: Date,
        required: false
    },
    
    // Payment Information
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Partial', 'Overdue'],
        default: 'Pending'
    },
    paymentTerms: {
        type: String,
        default: 'Net 30'
    },
    
    // Receiving Information
    receivingStatus: {
        type: String,
        enum: ['Pending', 'Partially Received', 'Fully Received'],
        default: 'Pending'
    },
    receivingNotes: {
        type: String,
        required: false
    },
    
    // Tracking and History
    trackingNumber: {
        type: String,
        required: false
    },
    carrier: {
        type: String,
        required: false
    },
    
    // History tracking
    statusHistory: [{
        status: String,
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    }],
    
    // User tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Department/Location
    department: {
        type: String,
        required: false
    },
    deliveryLocation: {
        type: String,
        required: false
    }
}, { 
    timestamps: true 
});

// Generate PO number before saving
purchaseOrderSchema.pre('save', async function(next) {
    if (!this.poNumber) {
        try {
            const count = await this.constructor.countDocuments();
            this.poNumber = `PO-${String(count + 1).padStart(6, '0')}`;
        } catch (error) {
            console.error('Error generating PO number:', error);
            this.poNumber = `PO-${String(Date.now()).slice(-6)}`;
        }
    }
    next();
});

// Update pending quantities before saving
purchaseOrderSchema.pre('save', function(next) {
    this.items.forEach(item => {
        item.pendingQuantity = item.quantity - item.receivedQuantity;
    });
    next();
});

// Add status to history when status changes
purchaseOrderSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date(),
            changedBy: this.createdBy
        });
    }
    next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
