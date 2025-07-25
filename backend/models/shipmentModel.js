const mongoose = require('mongoose');

const shipmentItemSchema = new mongoose.Schema({
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

const shipmentTrackingSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        required: false
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const shipmentSchema = new mongoose.Schema({
    shipmentNumber: {
        type: String,
        required: false,
        unique: true
    },
    salesOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SaleOrder',
        required: true
    },
    salesOrderNumber: {
        type: String,
        required: true
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
    shippingAddress: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true,
            default: 'Singapore'
        }
    },
    items: [shipmentItemSchema],
    carrier: {
        type: String,
        enum: ['FedEx', 'UPS', 'USPS', 'DHL', 'Local Delivery', 'Customer Pickup'],
        required: true
    },
    shippingMethod: {
        type: String,
        enum: ['Standard', 'Express', 'Next Day', 'Two Day', 'Ground', 'Overnight'],
        required: true
    },
    trackingNumber: {
        type: String,
        required: false
    },
    estimatedDelivery: {
        type: Date,
        required: false
    },
    actualDelivery: {
        type: Date,
        required: false
    },
    shippingCost: {
        type: Number,
        required: true,
        min: 0
    },
    weight: {
        type: Number,
        required: false,
        min: 0
    },
    dimensions: {
        length: {
            type: Number,
            required: false,
            min: 0
        },
        width: {
            type: Number,
            required: false,
            min: 0
        },
        height: {
            type: Number,
            required: false,
            min: 0
        },
        unit: {
            type: String,
            enum: ['in', 'cm'],
            default: 'in'
        }
    },
    status: {
        type: String,
        enum: ['Pending', 'Preparing', 'Ready to Ship', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed Delivery', 'Returned', 'Cancelled'],
        default: 'Pending'
    },
    priority: {
        type: String,
        enum: ['Low', 'Normal', 'High', 'Urgent'],
        default: 'Normal'
    },
    trackingHistory: [shipmentTrackingSchema],
    notes: {
        type: String,
        required: false
    },
    shipmentDate: {
        type: Date,
        required: false
    },
    deliveredBy: {
        type: String,
        required: false
    },
    receivedBy: {
        type: String,
        required: false
    },
    signatureRequired: {
        type: Boolean,
        default: false
    },
    insuranceValue: {
        type: Number,
        required: false,
        min: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Generate shipment number before saving
shipmentSchema.pre('save', async function(next) {
    if (!this.shipmentNumber) {
        try {
            const count = await this.constructor.countDocuments();
            this.shipmentNumber = `SH-${String(count + 1).padStart(6, '0')}`;
        } catch (error) {
            console.error('Error generating shipment number:', error);
            this.shipmentNumber = `SH-${String(Date.now()).slice(-6)}`;
        }
    }
    next();
});

// Add tracking entry when status changes
shipmentSchema.pre('save', function(next) {
    if (this.isModified('status') && !this.isNew) {
        this.trackingHistory.push({
            status: this.status,
            timestamp: new Date(),
            updatedBy: this.createdBy // This should be updated to current user in controller
        });
    }
    next();
});

module.exports = mongoose.model('Shipment', shipmentSchema, 'shipments');
