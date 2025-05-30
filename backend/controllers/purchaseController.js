const Purchase = require('../models/purchaseModel');
const Inventory = require('../models/inventoryModel')
const mongoose = require('mongoose');

// GET all purchases
const getPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find().sort({ purchaseDate: -1 });
        res.status(200).json(purchases);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
};
// GET a single purchase    
const getPurchase = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such purchase' });
    }
    try {
        const purchase = await Purchase.findById(id);
        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }
        res.status(200).json(purchase);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch purchase' });
    }
};
// CREATE a new purchase
const createPurchase = async (req, res) => {
  const { itemName, SKU, quantity, location, price, vendorName } = req.body;

  let emptyFields = [];
  if (!itemName) emptyFields.push('itemName');
  if (!SKU) emptyFields.push('SKU');
  if (!quantity) emptyFields.push('quantity');
  if (!location) emptyFields.push('location');
  if (!price) emptyFields.push('price');
  if (!vendorName) emptyFields.push('vendorName');

  if (emptyFields.length > 0) {
    return res.status(400).json({ error: 'Please fill in all fields', emptyFields });
  }

  try {
    const user_id = req.user._id;
    const purchase = await Purchase.create({ itemName, SKU, quantity, location, price, vendorName, user_id });
    const existingItem = await Inventory.findOne({ sku: SKU });
    
    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity;
      await existingItem.save();
    } else {
      // Create new inventory item
      await Inventory.create({
        name: itemName,
        sku: SKU,
        type: 'Apparel', // Optional: or derive from another field
        description: 'Added from purchase by ${vendorName}',
        rate: price,
        quantity,
        user_id
      });
    }

    res.status(200).json(purchase);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// DELETE a purchase
const deletePurchase = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'No such purchase' });
    }
    try {
        const purchase = await Purchase.findOneAndDelete({ _id: id });
        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }
        res.status(200).json({ message: 'Purchase deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete purchase' });
    }
};
// UPDATE a purchase
const updatePurchase = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'No such purchase' });
    }
    const { itemName, SKU, quantity, location, price, vendorName } = req.body;

    let emptyFields = [];
    if (!itemName) emptyFields.push('ItemName');
    if (!SKU) emptyFields.push('SKU');
    if (quantity === undefined) emptyFields.push('quantity');
    if (!location) emptyFields.push('location');
    if (price === undefined) emptyFields.push('price');
    if (!vendorName) emptyFields.push('vendorName');

    if (emptyFields.length > 0) {
        return res.status(400).json({ error: 'Please fill in all fields', emptyFields });
    }

    try {
        const purchase = await Purchase.findOneAndUpdate(
            { _id: id },
            { itemName, SKU, quantity, location, price, vendorName },
            { new: true }
        );
        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }
        res.status(200).json(purchase);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
module.exports = {
    getPurchases,
    getPurchase,
    createPurchase,
    deletePurchase,
    updatePurchase
};