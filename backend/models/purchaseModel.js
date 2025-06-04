const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  InventoryId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Inventory'
  },
  quantityPurchased:{
    type: Number,
    required: true
  },
  purchasedDate: {
    type: Date,
  }
  });

module.exports = mongoose.model('Purchase', purchaseSchema);
