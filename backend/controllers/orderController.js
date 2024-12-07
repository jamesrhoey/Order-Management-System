const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');
const transactionController = require('./transactionController');
const Sale = require('../models/saleModel');

// Helper function to create sale from order
const createSaleFromOrder = async (order) => {
    try {
        // Ensure order is populated with product details
        const populatedOrder = await Order.findById(order._id)
            .populate('orderDetails.product', 'productName price');

        // Format items for sale record
        const items = populatedOrder.orderDetails.map(detail => {
            const quantity = detail.quantity || 1;
            const unitPrice = detail.price;
            return {
                productId: detail.product._id,
                quantity: quantity,
                unitPrice: unitPrice,
                subtotal: quantity * unitPrice
            };
        });

        // Create sale data with required fields
        const saleData = {
            transactionId: populatedOrder._id,
            amount: populatedOrder.totalAmount,
            paymentMethod: populatedOrder.paymentMethod,
            totalAmount: populatedOrder.totalAmount,
            items: items,
            customerDetails: {
                name: populatedOrder.customerName,
                address: populatedOrder.deliveryAddress,
                contactNumber: populatedOrder.contactNumber
            },
            saleDate: new Date(),
            salesPerson: 'System'
        };

        // Create and save the sale record
        const newSale = new Sale(saleData);
        await newSale.save();

        console.log('Sale record created successfully:', newSale);
        return newSale;
    } catch (error) {
        console.error('Error creating sale from order:', error);
        throw error;
    }
};

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
                        product: product._id, // Store the reference
                        productData: {        // Store essential product data
                            productName: product.productName,
                            price: product.price,
                            ingredients: product.ingredients
                        },
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

            // Create and save the new order
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
            
            // If order status is Completed, create transaction immediately
            let transaction = null;
            if (savedOrder.status === 'Completed') {
                // Populate the order details to get product names
                const populatedOrder = await Order.findById(savedOrder._id)
                    .populate('orderDetails.product', 'productName');
                
                const productNames = populatedOrder.orderDetails
                    .map(detail => detail.product.productName)
                    .join(', ');

                // Create default payment details object
                const paymentDetails = {
                    method: paymentMethod,
                    amount: totalAmount,
                    status: 'Completed'
                };

                transaction = await transactionController.createTransactionFromOrder(
                    savedOrder,
                    paymentMethod,
                    paymentDetails,
                    {
                        notes: notes,
                        deliveryAddress: deliveryAddress,
                        contactNumber: contactNumber,
                        products: productNames
                    }
                );

                // Create sale record
                await createSaleFromOrder(populatedOrder);

                // Update product inventory
                for (const detail of populatedOrder.orderDetails) {
                    await Product.findByIdAndUpdate(
                        detail.product._id,
                        {
                            $inc: { 
                                stockQuantity: -detail.quantity,
                                soldQuantity: detail.quantity 
                            }
                        }
                    );
                }
            }

            res.status(201).json({
                message: 'Order created successfully',
                order: savedOrder,
                transaction: transaction
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
            const query = {};
            
            if (req.query.startDate && req.query.endDate) {
                const startDate = new Date(req.query.startDate);
                const endDate = new Date(req.query.endDate);
                query.orderDate = {
                    $gte: startDate.toISOString().split('T')[0],
                    $lt: endDate.toISOString().split('T')[0]
                };
            }
            
            let orders = await Order.find(query)
                .populate({
                    path: 'orderDetails.product',
                    select: 'productName price ingredients'
                })
                .lean()
                .sort({ createdAt: -1 });

            // Transform orders to ensure product data is always available
            orders = orders.map(order => ({
                ...order,
                orderDetails: order.orderDetails.map(detail => ({
                    ...detail,
                    product: detail.product || detail.productData || {
                        _id: 'deleted',
                        productName: 'Product No Longer Available',
                        price: detail.price,
                        ingredients: ['N/A']
                    }
                }))
            }));

            res.json(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ 
                message: 'Error fetching orders',
                error: error.message 
            });
        }
    },

    // Get completed orders
    getCompletedOrders: async (req, res) => {
        try {
            const orders = await Order.find({ status: 'Completed' })
                .populate('orderDetails.product', 'productName price')
                .sort({ createdAt: -1 });
            res.json(orders);
        } catch (error) {
            console.error('Error fetching completed orders:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Get order by ID
    getOrderById: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id)
                .populate('orderDetails.product', 'productName price ingredients');
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
            ).populate('orderDetails.product', 'productName');

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            // If status is completed, create a transaction
            if (status === 'Completed') {
                // Get product names for the transaction
                const productNames = order.orderDetails
                    .map(detail => detail.product.productName)
                    .join(', ');

                // Create transaction
                await transactionController.createTransactionFromOrder(
                    order,
                    order.paymentMethod,
                    {}, // paymentDetails can be empty for now
                    {
                        notes: order.notes,
                        deliveryAddress: order.deliveryAddress,
                        contactNumber: order.contactNumber,
                        products: productNames
                    }
                );

                // Create sale record
                await createSaleFromOrder(order);

                // Update product inventory
                for (const detail of order.orderDetails) {
                    await Product.findByIdAndUpdate(
                        detail.product._id,
                        {
                            $inc: { 
                                stockQuantity: -detail.quantity,
                                soldQuantity: detail.quantity 
                            }
                        }
                    );
                }
            }

            res.json({ 
                message: 'Order status updated successfully',
                order 
            });
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({ 
                message: 'Error updating order status',
                error: error.message 
            });
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
    },

    // Delete order by ID
    deleteOrder: async (req, res) => {
        try {
            const order = await Order.findByIdAndDelete(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json({ 
                message: 'Order deleted successfully',
                deletedOrder: order 
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Error deleting order',
                error: error.message 
            });
        }
    }
};

module.exports = orderController;
