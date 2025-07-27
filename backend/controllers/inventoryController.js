const Inventory = require('../models/inventoryModel');
const { logAction } = require('./auditLogController');
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
    
    // Log the action
    await logAction(req.user._id, 'Create Product', {
      entityType: 'Product',
      entityId: inventory._id,
      entityName: inventory.name,
      description: `Created product: ${inventory.name} (SKU: ${inventory.sku})`
    });
    
    console.log('Created new product:', inventory);
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Log failed action
    await logAction(req.user._id, 'Create Product', {
      description: `Failed to create product: ${name}`,
      success: false,
      errorMessage: error.message
    });
    
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
    
    // Log the action
    await logAction(req.user._id, 'Delete Product', {
      entityType: 'Product',
      entityId: inventory._id,
      entityName: inventory.name,
      description: `Deleted product: ${inventory.name} (SKU: ${inventory.sku})`
    });
    
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

    // Log the action
    const changes = {
      before: {
        name: existingInventory.name,
        sku: existingInventory.sku,
        quantity: existingInventory.quantity,
        rate: existingInventory.rate
      },
      after: {
        name: inventory.name,
        sku: inventory.sku,
        quantity: inventory.quantity,
        rate: inventory.rate
      }
    };

    await logAction(req.user._id, 'Update Product', {
      entityType: 'Product',
      entityId: inventory._id,
      entityName: inventory.name,
      description: `Updated product: ${inventory.name}`,
      changes
    });

    res.status(200).json(inventory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// UPDATE inventory at specific location
const updateLocationStock = async (req, res) => {
  const { id } = req.params;
  const { locationId, locationName, quantity, operation = 'set' } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid inventory item ID' });
  }

  try {
    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    if (!locationId || !locationName || quantity === undefined) {
      return res.status(400).json({ error: 'Location ID, name, and quantity are required' });
    }

    // Find or create location stock entry
    let locationStock = inventory.locationStock.find(stock => stock.locationId === locationId);
    
    if (locationStock) {
      // Update existing location stock
      if (operation === 'add') {
        locationStock.quantity += parseInt(quantity);
      } else if (operation === 'subtract') {
        locationStock.quantity = Math.max(0, locationStock.quantity - parseInt(quantity));
      } else {
        locationStock.quantity = parseInt(quantity);
      }
    } else {
      // Create new location stock entry
      inventory.locationStock.push({
        locationId,
        locationName,
        quantity: parseInt(quantity)
      });
    }

    await inventory.save();
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error updating location stock:', error);
    res.status(400).json({ error: error.message });
  }
};

// GET inventory by location
const getInventoryByLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    
    if (!locationId) {
      return res.status(400).json({ error: 'Location ID is required' });
    }

    // Find all inventory items that have stock at the specified location
    const inventoryItems = await Inventory.find({
      'locationStock.locationId': locationId,
      'locationStock.quantity': { $gt: 0 }
    });

    // Transform to include only the location-specific data
    const locationInventory = inventoryItems.map(item => {
      const locationStock = item.locationStock.find(stock => stock.locationId === locationId);
      return {
        ...item.toObject(),
        locationQuantity: locationStock?.quantity || 0,
        locationStock: locationStock
      };
    });

    res.status(200).json(locationInventory);
  } catch (error) {
    console.error('Error fetching inventory by location:', error);
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  createInventory,
  getInventories,
  getInventory,
  deleteInventory,
  updateInventory,
  updateLocationStock,
  getInventoryByLocation,
};

