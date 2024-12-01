const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');

const orderController = {
    // Create a new order
    createOrder: async (req, res) => {
        try {
            console.log('Received order data:', req.body);

            const { 
                customerName, 
                deliveryAddress, 
                contactNumber, 
                paymentMethod, 
                products, // Array of MongoDB ObjectIds
                notes,
                orderDate,
                orderTime,
                status 
            } = req.body;

            // Validate required fields
            if (!customerName || !deliveryAddress || !contactNumber || !paymentMethod || !products) {
                return res.status(400).json({ 
                    message: 'Missing required fields',
                    received: req.body 
                });
            }

            // Create order details array with product references
            const orderDetails = [];
            let totalAmount = 0;

            try {
                // Process each product
                for (let productId of products) {
                    // Validate MongoDB ObjectId
                    if (!mongoose.Types.ObjectId.isValid(productId)) {
                        return res.status(400).json({ 
                            message: `Invalid product ID format: ${productId}` 
                        });
                    }

                    const product = await Product.findById(productId);
                    if (!product) {
                        return res.status(404).json({ 
                            message: `Product not found: ${productId}` 
                        });
                    }
                    
                    orderDetails.push({
                        product: productId,
                        price: product.price,
                        quantity: 1
                    });
                    
                    totalAmount += product.price;
                }
            } catch (productError) {
                console.error('Error processing products:', productError);
                return res.status(400).json({ 
                    message: 'Error processing products',
                    error: productError.message 
                });
            }

            const newOrder = new Order({
                customerName,
                deliveryAddress,
                contactNumber,
                orderDate,
                orderTime,
                paymentMethod,
                orderDetails,
                totalAmount,
                notes,
                status: status || 'Pending'
            });

            const savedOrder = await newOrder.save();
            
            res.status(201).json({ 
                message: 'Order created successfully',
                order: savedOrder 
            });
        } catch (error) {
            console.error('Order creation error:', error);
            res.status(500).json({ 
                message: 'Error creating order',
                error: error.message
            });
        }
    },

    // Get all orders
    getAllOrders: async (req, res) => {
        try {
            const orders = await Order.find()
                .populate('orderDetails.product', 'productName price')
                .sort({ createdAt: -1 }); // Most recent orders first
            res.json(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Get order by ID
    getOrderById: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id)
                .populate('orderDetails.product', 'productName price');
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json(order);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update order status
    updateOrderStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const order = await Order.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            );
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json({ 
                message: 'Order status updated successfully',
                order 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get orders by date range
    getOrdersByDateRange: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const orders = await Order.findByDateRange(
                new Date(startDate),
                new Date(endDate)
            ).populate('orderDetails.product', 'productName price');
            res.json(orders);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = orderController;
