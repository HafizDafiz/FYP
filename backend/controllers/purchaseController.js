const Inventory = require('../models/inventoryModel');
const Purchase = require('../models/purchaseModel');



exports.createPurchase = async (req, res) => {
  const { inventoryId, name, description, quantityPurchased, rate } = req.body;

  // Generate SKU if not provided
  const generateSKU = () => {
    return 'SKU-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  };
  const sku = req.body.sku || generateSKU();

  try {
    let inventory;

    if (inventoryId) {
      inventory = await Inventory.findById(inventoryId);
      if (!inventory) return res.status(404).json({ message: 'Inventory not found' });

      inventory.quantity += quantityPurchased;
      await inventory.save();
    } else {
      // Look for inventory by name
      inventory = await Inventory.findOne({ name });

      if (inventory) {
        inventory.quantity += quantityPurchased;
        await inventory.save();
      } else {
        inventory = new Inventory({
          name,
          sku,
          description,
          quantity: quantityPurchased,
          rate
        });
        await inventory.save();
      }
    }

    const purchase = new Purchase({
      inventoryId: inventory._id,
      quantityPurchased,
      purchasedDate: new Date()
    });

    await purchase.save();

    res.status(201).json({ message: 'Purchase successful', inventory });
  } catch (err) {
    res.status(500).json({ message: 'Error creating purchase', error: err.message });
  }
};


