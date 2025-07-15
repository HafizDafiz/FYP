const Inventory = require('../models/inventoryModel');
const mongoose = require('mongoose');

// GET all inventory items (shared among all users - from products collection)
const getInventories = async (req, res) => {
  try {
    console.log('Fetching products from database...');
    
    // Let's also check the collection name and any existing data
    const collectionName = Inventory.collection.name;
    console.log('Collection name:', collectionName);
    
    const inventory = await Inventory.find({}).sort({ createdAt: -1 });
    console.log('Found', inventory.length, 'products');
    
    // Log first item to see structure
    if (inventory.length > 0) {
      console.log('Sample product:', inventory[0]);
    }
    
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
};


// GET a single inventory item by ID
const getInventory = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const inventory = await Inventory.findById(id);
    
    if (!inventory) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
};


// CREATE a new inventory item in products collection
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
    console.log('Created new product:', inventory);
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error creating product:', error);
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
    // Fetch existing inventory first
    const existingInventory = await Inventory.findById(id);
    if (!existingInventory) {
      return res.status(400).json({ error: 'Inventory item not found' });
    }

    // Merge existing user_id with req.body so user_id is not lost
    const updatedData = { ...req.body, user_id: existingInventory.user_id };

    const inventory = await Inventory.findOneAndUpdate(
      { _id: id },
      updatedData,
      { new: true, runValidators: true }
    );

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

