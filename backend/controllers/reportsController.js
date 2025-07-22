const Inventory = require('../models/inventoryModel');
const Sale = require('../models/saleModel');
const Purchase = require('../models/purchaseModel');
const mongoose = require('mongoose');

// Generate report data for the specified date range
const generateReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      return res.status(400).json({ error: 'Start date cannot be greater than end date' });
    }

    // Get inventory additions (new items created within date range)
    const inventoryAdditions = await Inventory.find({
      createdAt: {
        $gte: start,
        $lte: end
      }
    }).select('name quantity type description rate createdAt user_id')
      .sort({ createdAt: -1 });

    // Get purchases within date range
    const purchases = await Purchase.find({
      purchasedDate: {
        $gte: start,
        $lte: end
      }
    }).populate('InventoryId', 'name type')
      .sort({ purchasedDate: -1 });

    // Get sales within date range
    const sales = await Sale.find({
      orderDate: {
        $gte: start,
        $lte: end
      }
    }).select('orderNumber customerName items subtotal tax discount total orderDate status')
      .sort({ orderDate: -1 });

    // Calculate totals
    const totalInventoryQuantity = inventoryAdditions.reduce((sum, item) => sum + item.quantity, 0);
    const totalPurchasesQuantity = purchases.reduce((sum, purchase) => sum + purchase.quantityPurchased, 0);
    const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSalesQuantity = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    // Format response data
    const reportData = {
      dateRange: {
        startDate,
        endDate
      },
      inventory: {
        items: inventoryAdditions.map(item => ({
          _id: item._id,
          name: item.name,
          quantity: item.quantity,
          type: item.type,
          description: item.description,
          rate: item.rate,
          dateAdded: item.createdAt,
          supplier: 'N/A' // Inventory doesn't have supplier info
        })),
        totalQuantity: totalInventoryQuantity
      },
      purchases: {
        items: purchases.map(purchase => ({
          _id: purchase._id,
          name: purchase.InventoryId?.name || 'Unknown Item',
          type: purchase.InventoryId?.type || 'Unknown',
          quantity: purchase.quantityPurchased,
          dateAdded: purchase.purchasedDate,
          supplier: 'N/A' // Purchase model doesn't have supplier info
        })),
        totalQuantity: totalPurchasesQuantity
      },
      sales: {
        orders: sales.map(sale => ({
          _id: sale._id,
          orderNumber: sale.orderNumber,
          customerName: sale.customerName,
          items: sale.items.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          })),
          subtotal: sale.subtotal,
          tax: sale.tax,
          discount: sale.discount,
          total: sale.total,
          saleDate: sale.orderDate,
          status: sale.status
        })),
        totalAmount: totalSalesAmount,
        totalQuantity: totalSalesQuantity
      },
      summary: {
        totalStockAdded: totalInventoryQuantity + totalPurchasesQuantity,
        totalSalesAmount,
        totalItemsSold: totalSalesQuantity,
        numberOfOrders: sales.length
      }
    };

    res.status(200).json(reportData);

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

module.exports = {
  generateReport
};
