const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const documentSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['report', 'invoice', 'receipt', 'order', 'other']
  },
  description: {
    type: String,
    default: ''
  },
  dateRange: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  fileData: {
    type: String, // Base64 encoded PDF data
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    totalStockAdded: Number,
    totalSalesAmount: Number,
    totalItemsSold: Number,
    numberOfOrders: Number
  },
  tags: [{
    type: String
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index for efficient querying
documentSchema.index({ type: 1, createdAt: -1 });
documentSchema.index({ generatedBy: 1, createdAt: -1 });
documentSchema.index({ isArchived: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
