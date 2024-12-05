const express = require('express');
const router = express.Router();
const { OrderManagementAI, SalesAnalysisAI, TransactionIntelligence } = require('../services/aiService');
const Sale = require('../models/saleModel');
const Order = require('../models/orderModel');
const Transaction = require('../models/transactionModel');
const auth = require('../middleware/auth');

// Initialize AI services
const orderAI = new OrderManagementAI();
const salesAI = new SalesAnalysisAI();
const transactionAI = new TransactionIntelligence();

// Analyze sales
router.get('/analyze-sales', auth, async (req, res) => {
    try {
        // Fetch actual sales data from the database
        const sales = await Sale.find({
            createdAt: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                $lte: new Date()
            }
        }).populate('items.productId');

        const analysis = await salesAI.analyzeSales(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            new Date()
        );

        res.json({
            success: true,
            data: {
                trends: {
                    dailyAverages: analysis.trends.dailyAverages || 0,
                    growth: analysis.trends.growth || 0,
                    peakDays: analysis.trends.peakDays || []
                },
                forecast: {
                    nextDayForecast: analysis.forecast.nextDayForecast || 0,
                    confidence: analysis.forecast.confidence || 'low',
                    trend: analysis.forecast.trend || 'stable'
                },
                insights: analysis.insights || [{
                    type: 'info',
                    message: 'Analyzing sales patterns...'
                }]
            }
        });
    } catch (error) {
        console.error('Error analyzing sales:', error);
        res.status(error.status || 500).json({
            success: false,
            error: error.message,
            data: {
                trends: { dailyAverages: 0, growth: 0, peakDays: [] },
                forecast: { nextDayForecast: 0, confidence: 'low', trend: 'stable' },
                insights: [{ type: 'error', message: error.message || 'Error analyzing sales data' }]
            }
        });
    }
});

// Analyze specific order
router.get('/analyze-order/:orderId', auth, async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .populate('orderDetails.product');

        if (!order) {
            throw new Error('Order not found');
        }

        const analysis = await orderAI.analyzeOrder(order);
        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('Error analyzing order:', error);
        res.status(error.status || 500).json({
            success: false,
            error: error.message,
            data: {
                likelihood: 50,
                confidence: 'low',
                recommendations: [{ message: error.message || 'Error analyzing order' }]
            }
        });
    }
});

// Detect transaction anomalies
router.get('/detect-anomalies', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            createdAt: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                $lte: new Date()
            }
        }).populate('orderId');

        const anomalies = await transactionAI.detectAnomalies(transactions);
        res.json({
            success: true,
            data: anomalies || []
        });
    } catch (error) {
        console.error('Error detecting anomalies:', error);
        res.status(error.status || 500).json({
            success: false,
            error: error.message,
            data: []
        });
    }
});

module.exports = router;