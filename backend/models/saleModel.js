const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    InventoryId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Inventory'
    },
    quantitySold: {
        type: Number,
        required: true
    },
    saleDate: {
        type: Date
    }
    
});

module.exports = mongoose.model('Sale', saleSchema)