require('dotenv').config();
const cors = require("cors");

const express = require('express');
const mongoose = require('mongoose');

const inventoryRoutes = require('./routes/inventory');
const purchaseRoutes = require('./routes/purchase');
const purchaseOrderRoutes = require('./routes/purchaseOrder');
const receivingReceiptRoutes = require('./routes/receivingReceipt');
const saleRoutes = require('./routes/sale')
const shipmentRoutes = require('./routes/shipment');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const documentsRoutes = require('./routes/documents');
const userManagementRoutes = require('./routes/userManagement');

const requireAuth = require('./middleware/requireAuth');

// express app
const app = express();
   

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});


// routes
app.use('/api/user', userRoutes);
app.use(requireAuth);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/receiving-receipts', receivingReceiptRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/shipments', shipmentRoutes);

// connect to db
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log('connected to db & listening on port', process.env.PORT);
    });
  })
  .catch((error) => {
    console.log(error);
  });
