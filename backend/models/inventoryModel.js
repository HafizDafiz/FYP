const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  type: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  rate: {
    type: Number,
    required: false
  },
  quantity: {
    type: Number,
    required: true
  },
  user_id: {
    type: String,
    required: false
  }
}, { timestamps: true });

// Bind this schema to the "products" collection explicitly
module.exports = mongoose.model('Inventory', inventorySchema, 'products');
