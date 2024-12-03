const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
// const { authenticateToken } = require('../middleware/authMiddleware');

// Remove this line for testing
// router.use(authenticateToken);

// Create a new transaction
router.post('/', transactionController.createTransaction);

// Get all transactions
router.get('/', transactionController.getAllTransactions);

// Get transaction by ID
router.get('/:id', transactionController.getTransactionById);

// Get transactions by date range
router.get('/date-range', transactionController.getTransactionsByDateRange);

// Update transaction status
router.patch('/:id/status', transactionController.updateTransactionStatus);

// Get completed transactions
router.get('/completed', transactionController.getCompletedTransactions);

// Delete transaction
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
