const { OrderManagementAI, SalesAnalysisAI, TransactionIntelligence } = require('../services/aiService');
const Sale = require('../models/saleModel');
const Order = require('../models/orderModel');

const orderAI = new OrderManagementAI();
const salesAI = new SalesAnalysisAI();
const transactionAI = new TransactionIntelligence();

const aiController = {
    // Order Management AI endpoints
    analyzeOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await Order.findById(orderId)
                .populate('orderDetails.product');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            const analysis = await orderAI.analyzeOrder(order);
            res.json({
                success: true,
                data: analysis
            });
        } catch (error) {
            console.error('Error analyzing order:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Sales Analysis AI endpoints
    analyzeSales: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required'
                });
            }

            const analysis = await salesAI.analyzeSales(
                new Date(startDate),
                new Date(endDate)
            );

            res.json({
                success: true,
                data: analysis
            });
        } catch (error) {
            console.error('Error analyzing sales:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Transaction Intelligence endpoints
    detectAnomalies: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            
            const query = {};
            if (startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const transactions = await Sale.find(query)
                .sort({ createdAt: -1 })
                .limit(100);

            const anomalies = await transactionAI.detectAnomalies(transactions);

            res.json({
                success: true,
                data: anomalies
            });
        } catch (error) {
            console.error('Error detecting anomalies:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Dashboard insights
    getDashboardInsights: async (req, res) => {
        try {
            // Get date range for analysis
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 30); // Last 30 days

            // Get sales analysis
            let salesAnalysis = {
                trends: {
                    dailyAverages: 0,
                    peakDays: [],
                    growth: 0
                },
                forecast: {
                    nextDayForecast: 0,
                    confidence: 'low',
                    trend: 'stable'
                },
                insights: []
            };

            const sales = await Sale.find({
                createdAt: { $gte: startDate, $lte: endDate }
            }).populate('items.productId');

            if (sales.length > 0) {
                salesAnalysis = await salesAI.analyzeSales(startDate, endDate);
            }

            // Get recent orders for analysis
            const recentOrders = await Order.find({
                createdAt: { $gte: startDate, $lte: endDate }
            }).populate('orderDetails.product').sort({ createdAt: -1 }).limit(10);

            // Get order predictions for recent orders
            const orderPredictions = await Promise.all(
                recentOrders.map(async order => {
                    const analysis = await orderAI.analyzeOrder(order);
                    return {
                        orderId: order._id,
                        customerName: order.customerName,
                        prediction: analysis.prediction
                    };
                })
            );

            // Get transaction anomalies
            const transactions = await Sale.find({
                createdAt: { $gte: startDate, $lte: endDate }
            }).sort({ createdAt: -1 });

            let anomalies = [];
            if (transactions.length > 0) {
                anomalies = await transactionAI.detectAnomalies(transactions);
            }

            res.json({
                success: true,
                data: {
                    salesInsights: {
                        trends: salesAnalysis.trends,
                        forecast: salesAnalysis.forecast,
                        topInsights: salesAnalysis.insights.slice(0, 3)
                    },
                    orderPredictions: orderPredictions.slice(0, 5),
                    recentAnomalies: anomalies.slice(0, 3)
                }
            });
        } catch (error) {
            console.error('Error getting dashboard insights:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = aiController; 