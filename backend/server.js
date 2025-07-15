require('dotenv').config();
const cors = require("cors");

const express = require('express');
const mongoose = require('mongoose');

const inventoryRoutes = require('./routes/inventory');
const purchaseRoutes = require('./routes/purchase');
const saleRoutes = require('./routes/sale')
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');

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
app.use('/api/purchases', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);  // Changed from /api/inventories to /api/inventory
app.use('/api/sales', saleRoutes);
// require auth for all purchase routes




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
