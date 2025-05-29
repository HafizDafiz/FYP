const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  SKU: {
    type: String,
    required: true,
    unique: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  vendorName: {
    type: String,
    required: true
  },
  user_id: { 
    type: String,
    required: true }
},
{ timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
