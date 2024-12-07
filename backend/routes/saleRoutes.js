const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get all sales
router.get('/', authenticateToken, saleController.getAllSales);

// Get sales by date range
router.get('/range', authenticateToken, saleController.getSalesByDateRange);

// Get sales summary
router.get('/summary', authenticateToken, saleController.getSalesSummary);

// Create new sale
router.post('/', authenticateToken, saleController.createSale);

module.exports = router;
