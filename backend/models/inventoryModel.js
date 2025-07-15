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

});

// Bind this schema to the "products" collection
module.exports = mongoose.model('Inventory', inventorySchema);
