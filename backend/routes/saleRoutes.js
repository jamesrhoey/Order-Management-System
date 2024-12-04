const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes
router.post('/', saleController.createSale);
router.get('/', saleController.getAllSales);
router.get('/:id', saleController.getSaleById);
router.get('/date-range', saleController.getSalesByDateRange);
router.put('/:id', saleController.updateSale);
router.delete('/:id', saleController.deleteSale);

module.exports = router;
