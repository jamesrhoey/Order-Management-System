const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const Order = require('../models/orderModel');
const { authenticateToken } = require('../middleware/authMiddleware');

// Create a new order
router.post('/', orderController.createOrder);

// Get all orders
router.get('/', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('orderDetails.product')
            .sort({ orderDate: -1, orderTime: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Update order status
router.patch('/:id/status', orderController.updateOrderStatus);

// Delete order
router.delete('/:id', orderController.deleteOrder);

// Get orders by date range
router.get('/range/date', orderController.getOrdersByDateRange);

module.exports = router;
