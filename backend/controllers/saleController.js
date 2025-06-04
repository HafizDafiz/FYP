const Inventory = require('../models/inventoryModel')
const Sale = require('../models/saleModel');

exports.createSale = async (req, res) => {
    const { inventoryId, quantitySold } = req.body;

    try {
        const inventory = await Inventory.findById(inventoryId);
        if (!inventory) return res.status(404).json ({ message: 'Inventory not found'});

        if (inventory.quantity < quantitySold)
        return res.status(400).json({ message: 'Not enough inventory'})

        inventory.quantity -= quantitySold;
        await inventory.save();

        const sale = new Sale({
            inventoryId,
            quantitySold,
            saleDate: new Date(),
        });
        await sale.save();

        res.status(201).json({ message: 'Sale completed', sale});
    } catch (err) {
        res.status(500).json({message: 'Error creating sale', error: err.message});
        }
    };
