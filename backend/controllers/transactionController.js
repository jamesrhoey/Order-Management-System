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
            console.log('Fetching transactions...');
            
            const transactions = await Transaction.find()
                .populate({
                    path: 'orderId',
                    select: 'customerName orderDate totalAmount deliveryAddress contactNumber orderDetails',
                    populate: {
                        path: 'orderDetails.product',
                        select: 'productName'
                    }
                })
                .sort({ createdAt: -1 });
            
            console.log('Raw transactions:', JSON.stringify(transactions, null, 2));
            
            if (!transactions) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'No transactions found',
                    data: [] 
                });
            }

            // Transform the data to include product names
            const transformedTransactions = transactions.map(transaction => {
                console.log('Processing transaction:', transaction._id);
                
                // Check if orderId exists and has orderDetails
                if (!transaction.orderId) {
                    console.log('No orderId for transaction:', transaction._id);
                    return {
                        ...transaction._doc,
                        orderId: {
                            customerName: 'N/A',
                            products: 'N/A',
                            deliveryAddress: 'N/A',
                            contactNumber: 'N/A'
                        }
                    };
                }

                // Safely access orderDetails
                const productNames = transaction.orderId.orderDetails
                    ? transaction.orderId.orderDetails
                        .filter(detail => detail && detail.product)
                        .map(detail => detail.product.productName)
                        .join(', ')
                    : 'N/A';

                return {
                    ...transaction._doc,
                    orderId: {
                        ...transaction.orderId._doc,
                        products: productNames,
                    }
                };
            });

            console.log('Transformed transactions:', JSON.stringify(transformedTransactions, null, 2));

            res.json({
                success: true,
                data: transformedTransactions
            });
        } catch (error) {
            console.error('Detailed error in getAllTransactions:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching transactions',
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

    // Create transaction from order
    createTransactionFromOrder: async (order, paymentMethod, paymentDetails, additionalInfo = {}) => {
        try {
            // Only create transaction if order is completed
            if (order.status !== 'Completed') {
                console.log('Skipping transaction creation - Order not completed');
                return null;
            }

            const newTransaction = new Transaction({
                orderId: order._id,
                amount: order.totalAmount,
                paymentMethod: paymentMethod,
                paymentDetails: {
                    ...paymentDetails,
                    customerName: order.customerName,
                    deliveryAddress: additionalInfo.deliveryAddress,
                    contactNumber: additionalInfo.contactNumber,
                    products: additionalInfo.products
                },
                notes: additionalInfo.notes,
                status: 'Completed'
            });

            const savedTransaction = await newTransaction.save();

            // Update order payment status
            await Order.findByIdAndUpdate(order._id, {
                status: 'Completed',
                '$set': { 'paymentStatus': 'Paid' }
            });

            console.log('Transaction created successfully:', savedTransaction);
            return savedTransaction;
        } catch (error) {
            console.error('Error creating transaction from order:', error);
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
