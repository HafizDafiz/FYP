const Inventory = require('../models/inventoryModel');
const Sale = require('../models/saleModel');
const PurchaseOrder = require('../models/purchaseOrderModel');
const ReceivingReceipt = require('../models/receivingReceiptModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// Get Admin Dashboard Data
const getAdminDashboardData = async (req, res) => {
  try {
    // Get current date and calculate date ranges
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Sales Activity
    const [todaySales, yesterdaySales, thisMonthSales, lastMonthSales] = await Promise.all([
      Sale.aggregate([
        { $match: { saleDate: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Sale.aggregate([
        { $match: { saleDate: { $gte: startOfYesterday, $lt: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Sale.aggregate([
        { $match: { saleDate: { $gte: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Sale.aggregate([
        { $match: { saleDate: { $gte: startOfLastMonth, $lt: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Inventory Statistics
    const [totalProducts, lowStockItems, outOfStockItems, totalInventoryValue] = await Promise.all([
      Inventory.countDocuments(),
      Inventory.countDocuments({ quantity: { $lt: 20, $gt: 0 } }), // Low stock threshold
      Inventory.countDocuments({ quantity: 0 }),
      Inventory.aggregate([
        { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$price'] } } } }
      ])
    ]);

    // Recent Products (last 10 added)
    const recentProducts = await Inventory.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name sku quantity price createdAt');

    // Purchase Order Statistics
    const [totalPOs, pendingPOs, completedPOs] = await Promise.all([
      PurchaseOrder.countDocuments(),
      PurchaseOrder.countDocuments({ status: { $in: ['Draft', 'Sent', 'Acknowledged'] } }),
      PurchaseOrder.countDocuments({ status: 'Received' })
    ]);

    // Recent Sales (last 10)
    const recentSales = await Sale.find()
      .sort({ saleDate: -1 })
      .limit(10)
      .select('saleDate customerName totalAmount status items');

    // User Statistics
    const [totalUsers, adminUsers, staffUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'staff' })
    ]);

    // Recent Receiving Receipts
    const recentReceivingReceipts = await ReceivingReceipt.find()
      .populate('purchaseOrderId', 'poNumber vendorName')
      .sort({ receivedAt: -1 })
      .limit(5)
      .select('receiptNumber receivedAt status items');

    // Top Selling Products (this month)
    const topProducts = await Sale.aggregate([
      { $match: { saleDate: { $gte: startOfThisMonth } } },
      { $unwind: '$items' },
      { $group: { 
        _id: '$items.productName', 
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      }},
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // Format the response
    const dashboardData = {
      salesActivity: {
        todaySales: todaySales[0]?.total || 0,
        yesterdaySales: yesterdaySales[0]?.total || 0,
        thisMonth: thisMonthSales[0]?.total || 0,
        lastMonth: lastMonthSales[0]?.total || 0
      },
      inventoryStats: {
        totalProducts: totalProducts || 0,
        lowStock: lowStockItems || 0,
        outOfStock: outOfStockItems || 0,
        totalValue: totalInventoryValue[0]?.total || 0
      },
      purchaseStats: {
        totalPOs: totalPOs || 0,
        pendingPOs: pendingPOs || 0,
        completedPOs: completedPOs || 0
      },
      userStats: {
        totalUsers: totalUsers || 0,
        adminUsers: adminUsers || 0,
        staffUsers: staffUsers || 0
      },
      recentProducts: recentProducts || [],
      recentSales: recentSales || [],
      recentReceivingReceipts: recentReceivingReceipts || [],
      topProducts: topProducts || [],
      quickActions: [
        { title: 'Add New Product', icon: '📦', action: 'add-product', path: '/items/add' },
        { title: 'View Orders', icon: '🛒', action: 'view-orders', path: '/purchase' },
        { title: 'Generate Report', icon: '📊', action: 'generate-report', path: '/reports' },
        { title: 'Manage Users', icon: '👥', action: 'manage-users', path: '/users' }
      ]
    };

    res.status(200).json({
      message: 'Admin Dashboard Data',
      user: req.user,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// Get Staff Dashboard Data
const getStaffDashboardData = async (req, res) => {
  try {
    // Get current date and calculate date ranges
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Sales Activity (limited for staff)
    const [todaySales, thisMonthSales] = await Promise.all([
      Sale.aggregate([
        { $match: { saleDate: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Sale.aggregate([
        { $match: { saleDate: { $gte: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Inventory Statistics (limited)
    const [totalProducts, lowStockItems, outOfStockItems] = await Promise.all([
      Inventory.countDocuments(),
      Inventory.countDocuments({ quantity: { $lt: 20, $gt: 0 } }),
      Inventory.countDocuments({ quantity: 0 })
    ]);

    // Recent Products (last 5)
    const recentProducts = await Inventory.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name sku quantity price');

    // Recent Sales (last 5)
    const recentSales = await Sale.find()
      .sort({ saleDate: -1 })
      .limit(5)
      .select('saleDate customerName totalAmount status');

    // Purchase Orders assigned to this staff member
    const myPOs = await PurchaseOrder.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('poNumber vendorName status total');

    const dashboardData = {
      salesActivity: {
        todaySales: todaySales[0]?.total || 0,
        thisMonth: thisMonthSales[0]?.total || 0
      },
      inventoryStats: {
        totalProducts: totalProducts || 0,
        lowStock: lowStockItems || 0,
        outOfStock: outOfStockItems || 0
      },
      recentProducts: recentProducts || [],
      recentSales: recentSales || [],
      myPurchaseOrders: myPOs || [],
      quickActions: [
        { title: 'Add New Product', icon: '📦', action: 'add-product', path: '/items/add' },
        { title: 'Create Sale', icon: '🛒', action: 'create-sale', path: '/sales' },
        { title: 'Stock Taking', icon: '📋', action: 'stock-taking', path: '/stock-taking' },
        { title: 'View Inventory', icon: '📊', action: 'view-inventory', path: '/items' }
      ]
    };

    res.status(200).json({
      message: 'Staff Dashboard Data',
      user: req.user,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching staff dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

module.exports = {
  getAdminDashboardData,
  getStaffDashboardData
};
