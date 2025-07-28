const mongoose = require('mongoose');

const saleOrderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        required: true
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
    }
});

const saleOrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: false,
        unique: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: false
    },
    customerAddress: {
        type: String,
        required: false
    },
    items: [saleOrderItemSchema],
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
    carrier: {
        type: String,
        required: false
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Partial', 'Refunded'],
        default: 'Pending'
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    expectedDelivery: {
        type: Date,
        required: false
    },
    notes: {
        type: String,
        required: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Generate order number before saving
saleOrderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        try {
            const count = await this.constructor.countDocuments();
            this.orderNumber = `SO-${String(count + 1).padStart(6, '0')}`;
        } catch (error) {
            console.error('Error generating order number:', error);
            this.orderNumber = `SO-${String(Date.now()).slice(-6)}`;
        }
    }
    next();
});

module.exports = mongoose.model('SaleOrder', saleOrderSchema, 'sales');