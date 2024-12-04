const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const auth = require('../middleware/authMiddleware'); // Assuming you have authentication middleware

// Create a new sale
router.post('/', auth, saleController.createSale);

// Get all sales
router.get('/', auth, saleController.getAllSales);

// Get sale by ID
router.get('/:id', auth, saleController.getSaleById);

// Get sales by date range
router.get('/date-range', auth, saleController.getSalesByDateRange);

// Update sale
router.put('/:id', auth, saleController.updateSale);

// Delete sale
router.delete('/:id', auth, saleController.deleteSale);

module.exports = router;
