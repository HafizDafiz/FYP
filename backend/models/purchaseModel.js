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
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
