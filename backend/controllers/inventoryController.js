const Inventory = require('../models/inventoryModel');
const mongoose = require('mongoose');

// GET all inventory items (shared among all users)
const getInventories = async (req, res) => {
  try {
    const inventory = await Inventory.find({}).sort({ createdAt: -1 });
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET a single inventory item
const getInventory = async (req, res) => {
  try {
    console.log('req.user:', req.user);  // Should print user object
    const user_id = req.user._id;
    
    const inventory = await Inventory.find({ user_id }).sort({ createdAt: -1 });
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: error.message });
  }
};


// CREATE a new inventory item
const createInventory = async (req, res) => {
  const { name, sku, type, description, rate, quantity } = req.body;
  let emptyFields = [];

  if (!name) emptyFields.push('name');
  if (!sku) emptyFields.push('sku');
  if (!type) emptyFields.push('type');
  if (rate == null) emptyFields.push('rate'); // allow 0 rate
  if (quantity == null) emptyFields.push('quantity');

  if (emptyFields.length > 0) {
    return res.status(400).json({ error: 'Please fill in all fields', emptyFields });
  }

  try {
    const user_id = req.user._id;
    const inventory = await Inventory.create({
      name,
      sku,
      type,
      description,
      rate,
      quantity,
      user_id,
    });
    res.status(200).json(inventory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE an inventory item
const deleteInventory = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'No such inventory item' });
  }

  try {
    const inventory = await Inventory.findOneAndDelete({ _id: id });
    if (!inventory) {
      return res.status(400).json({ error: 'Inventory item not found' });
    }
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE an inventory item
const updateInventory = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'No such inventory item' });
  }

  try {
    const inventory = await Inventory.findOneAndUpdate({ _id: id }, { ...req.body }, { new: true });
    if (!inventory) {
      return res.status(400).json({ error: 'Inventory item not found' });
    }
    res.status(200).json(inventory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createInventory,
  getInventories,
  getInventory,
  deleteInventory,
  updateInventory,
};
