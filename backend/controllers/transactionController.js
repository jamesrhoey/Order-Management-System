const Transaction = require('../models/transactionModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');

const transactionController = {
    // Create a new transaction
    createTransaction: async (req, res) => {
        try {
            const { 
                orderId, 
                amount, 
                paymentMethod, 
                paymentDetails,
                notes 
            } = req.body;

            // Validate orderId
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({ 
                    message: 'Invalid order ID format' 
                });
            }

            // Check if order exists
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ 
                    message: 'Order not found' 
                });
            }

            // Validate amount matches order total
            if (amount !== order.totalAmount) {
                return res.status(400).json({ 
                    message: 'Transaction amount does not match order total' 
                });
            }

            const newTransaction = new Transaction({
                orderId,
                amount,
                paymentMethod,
                paymentDetails,
                notes,
                status: 'Completed'
            });

            const savedTransaction = await newTransaction.save();

            // Update order status if transaction is successful
            await Order.findByIdAndUpdate(orderId, { 
                status: 'Completed',
                '$set': { 'paymentStatus': 'Paid' }
            });

            // Update inventory
            if (order.items && Array.isArray(order.items)) {
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $inc: { 
                                stockQuantity: -item.quantity,
                                soldQuantity: item.quantity 
                            }
                        }
                    );
                }
            }

            res.status(201).json({
                message: 'Transaction created successfully',
                transaction: savedTransaction
            });
        } catch (error) {
            console.error('Transaction creation error:', error);
            res.status(500).json({
                message: 'Error creating transaction',
                error: error.message
            });
        }
    },

    // Get transaction by ID
    getTransactionById: async (req, res) => {
        try {
            const transaction = await Transaction.findById(req.params.id)
                .populate('orderId', 'customerName orderDate totalAmount');
            
            if (!transaction) {
                return res.status(404).json({ message: 'Transaction not found' });
            }
            
            res.json(transaction);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get all transactions
    getAllTransactions: async (req, res) => {
        try {
            const transactions = await Transaction.find()
                .populate({
                    path: 'orderId',
                    select: 'customerName orderDate totalAmount items status',
                })
                .sort({ createdAt: -1 });
            
            if (!transactions) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'No transactions found',
                    data: [] 
                });
            }

            res.json({
                success: true,
                data: transactions
            });
        } catch (error) {
            console.error('Server error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching transactions',
                error: error.message 
            });
        }
    },

    // Get transactions by date range
    getTransactionsByDateRange: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            
            const transactions = await Transaction.find({
                transactionDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }).populate('orderId', 'customerName orderDate totalAmount');
            
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update transaction status
    updateTransactionStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const transaction = await Transaction.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            ).populate('orderId');

            if (!transaction) {
                return res.status(404).json({ message: 'Transaction not found' });
            }

            // Update order status based on transaction status
            if (status === 'Completed') {
                await Order.findByIdAndUpdate(transaction.orderId, {
                    status: 'Completed'
                });

                // Update inventory for each item in the order
                if (transaction.orderId && transaction.orderId.items) {
                    for (const item of transaction.orderId.items) {
                        await Product.findByIdAndUpdate(
                            item.productId,
                            {
                                $inc: { 
                                    stockQuantity: -item.quantity,
                                    soldQuantity: item.quantity 
                                }
                            }
                        );
                    }
                }
            } else if (status === 'Failed') {
                await Order.findByIdAndUpdate(transaction.orderId, {
                    status: 'Payment Failed'
                });
            } else if (status === 'Refunded') {
                await Order.findByIdAndUpdate(transaction.orderId, {
                    status: 'Refunded'
                });
            }

            res.json({
                message: 'Transaction status updated successfully',
                transaction
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Add this new method
    createTransactionFromOrder: async (order, paymentMethod, paymentDetails, additionalDetails) => {
        try {
            const transaction = new Transaction({
                orderId: order._id,
                amount: order.totalAmount,
                paymentMethod: paymentMethod,
                paymentDetails: paymentDetails,
                transactionDate: new Date(),
                notes: additionalDetails.notes,
                deliveryAddress: additionalDetails.deliveryAddress,
                contactNumber: additionalDetails.contactNumber,
                products: additionalDetails.products
            });

            return await transaction.save();
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    },

    // Add this new method to transactionController
    getCompletedTransactions: async (req, res) => {
        try {
            const transactions = await Transaction.find({ status: 'Completed' })
                .populate('orderId', 'customerName orderDate totalAmount items')
                .sort({ createdAt: -1 });
            
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    deleteTransaction: async (req, res) => {
        try {
            const transaction = await Transaction.findByIdAndDelete(req.params.id);

            if (!transaction) {
                return res.status(404).json({ message: 'Transaction not found' });
            }

            // Optionally, update the order status if the transaction is deleted
            await Order.findByIdAndUpdate(transaction.orderId, {
                status: 'Transaction Deleted'
            });

            res.json({ message: 'Transaction deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = transactionController;
