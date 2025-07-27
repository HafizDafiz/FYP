const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userRole: {
        type: String,
        required: true,
        enum: ['admin', 'staff']
    },
    action: {
        type: String,
        required: true,
        enum: [
            'Login',
            'Logout', 
            'Create Product',
            'Update Product',
            'Delete Product',
            'Create Sale',
            'Update Sale',
            'Delete Sale',
            'Create Purchase Order',
            'Update Purchase Order',
            'Delete Purchase Order',
            'Approve Purchase Order',
            'Receive Items',
            'Create User',
            'Update User',
            'Delete User',
            'Generate Report',
            'Upload Document',
            'Delete Document',
            'Update Stock',
            'Create Receiving Receipt',
            'Update Receiving Receipt',
            'Delete Receiving Receipt',
            'Other'
        ]
    },
    entityType: {
        type: String,
        required: false,
        enum: ['User', 'Product', 'Sale', 'PurchaseOrder', 'ReceivingReceipt', 'Document', 'Report', 'Other']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    entityName: {
        type: String,
        required: false
    },
    details: {
        type: String,
        required: false
    },
    changes: {
        before: {
            type: mongoose.Schema.Types.Mixed,
            required: false
        },
        after: {
            type: mongoose.Schema.Types.Mixed,
            required: false
        }
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        source: {
            type: String,
            default: 'Web Application'
        }
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    success: {
        type: Boolean,
        default: true
    },
    errorMessage: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

// Create indexes for better query performance
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
