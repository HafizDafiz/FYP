// const express = require('express');
// const router = express.Router();
// const {
//   getPurchases,
//   getPurchase,
//   createPurchase,
//   deletePurchase,
//   updatePurchase
// } = require('../controllers/purchaseController');

// // example routes
// router.get('/', getPurchases);
// router.post('/', createPurchase);
// router.get('/:id', getPurchase);
// router.delete('/:id', deletePurchase);
// router.patch('/:id', updatePurchase);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { createPurchase} = require('../controllers/purchaseController');

router.post('/', createPurchase);

module.exports = router;