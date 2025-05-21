const Inventory = require('../models/inventoryModel');
const mongoose = require('mongoose');


// GET all inventory
const getInventories = async (req, res) => {
    const user_id = req.user._id;
    
    const inventory = await Inventory.find({ user_id }).sort({ createdAt: -1 });
    res.status(200).json(inventory);
};

// GET a single inventory
const getInventory = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such inventory' });
    }
    const inventory = await Inventory.findById(id);

    if (!inventory) {
        return res.status(404).json({ error: 'Inventory not found' });
    }

    res.status(200).json(inventory);
};

// CREATE a new inventory
const createInventory = async (req, res) => {
    const { name, quantity } = req.body;
    let emptyFields = [];
    if (!name) {
        emptyFields.push('name');
    }
    if (!quantity) {
        emptyFields.push('quantity');
    }
    if (emptyFields.length > 0) {
    return res.status(400).json({ error: 'Please fill in all fields', emptyFields })
    }

    try {
        const user_id = req.user._id;
        const inventory = await Inventory.create({ name, quantity , user_id });
        res.status(200).json(inventory);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// DELETE a inventory
const deleteInventory = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'No such inventory' });
    }
    const inventory = await Inventory.findOneAndDelete({ _id: id });

    if (!inventory) {
        return res.status(400).json({ error: 'Inventory not found' });
    }

    res.status(200).json(inventory);
}
// UPDATE a inventory
const updateInventory = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'No such inventory' });
    }
    const inventory = await Inventory.findOneAndUpdate({ _id: id }, {
        ...req.body
    });

    if (!inventory) {
        return res.status(400).json({ error: 'Inventory not found' });
    }

    res.status(200).json(inventory);
}

module.exports = {
    createInventory,
    getInventories,
    getInventory,   
    deleteInventory,
    updateInventory
}