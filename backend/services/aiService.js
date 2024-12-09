const Sale = require('../models/saleModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');

class OrderManagementAI {
    async analyzeOrder(order) {
        try {
            // Analyze order patterns and make predictions
            const similarOrders = await this.findSimilarOrders(order);
            const prediction = this.predictOrderSuccess(order, similarOrders);
            const recommendations = this.generateRecommendations(order, similarOrders);

            return {
                prediction,
                recommendations,
                similarOrders: similarOrders.slice(0, 3) // Return top 3 similar orders
            };
        } catch (error) {
            console.error('Error in order analysis:', error);
            throw error;
        }
    }

    async findSimilarOrders(order) {
        try {
            // Find orders with similar products or customer patterns
            const similarOrders = await Order.find({
                'orderDetails.product': { 
                    $in: order.orderDetails.map(detail => detail.product) 
                },
                _id: { $ne: order._id },
                status: 'Completed'
            })
            .populate('orderDetails.product')
            .limit(5);

            return similarOrders;
        } catch (error) {
            console.error('Error finding similar orders:', error);
            return [];
        }
    }

    predictOrderSuccess(order, similarOrders) {
        // Simple prediction based on similar orders
        if (!similarOrders || similarOrders.length === 0) {
            return {
                likelihood: 50, // Neutral prediction when no similar orders
                confidence: 'low',
                factors: {
                    similarOrdersCount: 0,
                    successfulSimilarOrders: 0
                }
            };
        }

        const successfulOrders = similarOrders.filter(o => o.status === 'Completed').length;
        const successRate = (successfulOrders / similarOrders.length) * 100;

        return {
            likelihood: successRate,
            confidence: similarOrders.length > 3 ? 'high' : 'medium',
            factors: {
                similarOrdersCount: similarOrders.length,
                successfulSimilarOrders: successfulOrders
            }
        };
    }

    generateRecommendations(order, similarOrders) {
        const recommendations = [];

        if (!similarOrders || similarOrders.length === 0) {
            recommendations.push({
                type: 'general',
                message: 'No similar orders found to generate specific recommendations.'
            });
            return recommendations;
        }

        // Analyze delivery timing
        const deliveryTimes = similarOrders
            .filter(o => o.createdAt)
            .map(o => new Date(o.createdAt));

        if (deliveryTimes.length > 0) {
            const avgDeliveryTime = deliveryTimes.reduce((a, b) => a + b.getTime(), 0) / deliveryTimes.length;
            recommendations.push({
                type: 'delivery',
                message: `Recommended delivery time based on similar orders: ${new Date(avgDeliveryTime).toLocaleTimeString()}`
            });
        }

        // Product recommendations
        const relatedProducts = this.findRelatedProducts(order, similarOrders);
        if (relatedProducts.length > 0) {
            recommendations.push({
                type: 'product',
                message: 'Customers who ordered these items also bought:',
                products: relatedProducts
            });
        }

        return recommendations;
    }

    findRelatedProducts(order, similarOrders) {
        try {
            const orderProductIds = order.orderDetails.map(detail => 
                detail.product._id ? detail.product._id.toString() : detail.product.toString()
            );
            const relatedProducts = new Set();

            similarOrders.forEach(similarOrder => {
                similarOrder.orderDetails.forEach(detail => {
                    const product = detail.product;
                    if (product && product.productName) {
                        const productId = product._id ? product._id.toString() : product.toString();
                        if (!orderProductIds.includes(productId)) {
                            relatedProducts.add(product.productName);
                        }
                    }
                });
            });

            return Array.from(relatedProducts);
        } catch (error) {
            console.error('Error finding related products:', error);
            return [];
        }
    }
}

class SalesAnalysisAI {
    async analyzeSales(startDate, endDate) {
        try {
            const sales = await Sale.find({
                createdAt: { $gte: startDate, $lte: endDate }
            }).populate('items.productId');

            if (!sales || sales.length === 0) {
                return {
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
                    insights: [{
                        type: 'info',
                        message: 'No sales data available for analysis'
                    }]
                };
            }

            const analysis = {
                trends: this.analyzeTrends(sales),
                forecast: await this.generateForecast(sales),
                insights: this.generateInsights(sales)
            };

            return analysis;
        } catch (error) {
            console.error('Error in sales analysis:', error);
            throw error;
        }
    }

    analyzeTrends(sales) {
        try {
            // Group sales by date
            const dailySales = {};
            sales.forEach(sale => {
                const date = new Date(sale.createdAt).toISOString().split('T')[0];
                dailySales[date] = (dailySales[date] || 0) + sale.totalAmount;
            });

            // Calculate trend metrics
            const values = Object.values(dailySales);
            const trend = {
                dailyAverages: values.reduce((a, b) => a + b, 0) / values.length || 0,
                peakDays: Object.entries(dailySales)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([date, amount]) => ({ date, amount })),
                growth: this.calculateGrowthRate(values)
            };

            return trend;
        } catch (error) {
            console.error('Error analyzing trends:', error);
            return {
                dailyAverages: 0,
                peakDays: [],
                growth: 0
            };
        }
    }

    async generateForecast(sales) {
        try {
            // Group sales by date
            const dailySales = {};
            sales.forEach(sale => {
                const date = new Date(sale.createdAt).toISOString().split('T')[0];
                dailySales[date] = (dailySales[date] || 0) + sale.totalAmount;
            });

            const values = Object.values(dailySales);
            if (values.length < 7) {
                return {
                    nextDayForecast: values.reduce((a, b) => a + b, 0) / values.length || 0,
                    confidence: 'low',
                    trend: 'stable'
                };
            }

            const movingAverage = values.slice(-7).reduce((a, b) => a + b, 0) / 7;

            return {
                nextDayForecast: movingAverage,
                confidence: this.calculateForecastConfidence(values),
                trend: this.calculateTrendDirection(values)
            };
        } catch (error) {
            console.error('Error generating forecast:', error);
            return {
                nextDayForecast: 0,
                confidence: 'low',
                trend: 'stable'
            };
        }
    }

    generateInsights(sales) {
        try {
            const insights = [];
            
            // Product performance insights
            const productPerformance = {};
            sales.forEach(sale => {
                sale.items.forEach(item => {
                    if (item.productId && item.productId.productName) {
                        const productName = item.productId.productName;
                        productPerformance[productName] = (productPerformance[productName] || 0) + item.quantity;
                    }
                });
            });

            // Top performing products
            const topProducts = Object.entries(productPerformance)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([productName, quantity]) => `${productName} (${quantity} units)`);

            if (topProducts.length > 0) {
                insights.push({
                    type: 'top_products',
                    message: 'Top performing products:',
                    data: topProducts
                });
            }

            // Sales patterns
            const salesByHour = {};
            sales.forEach(sale => {
                const hour = new Date(sale.createdAt).getHours();
                salesByHour[hour] = (salesByHour[hour] || 0) + 1;
            });

            if (Object.keys(salesByHour).length > 0) {
                const peakHour = Object.entries(salesByHour)
                    .sort(([,a], [,b]) => b - a)[0];

                insights.push({
                    type: 'peak_hours',
                    message: `Peak sales hour is ${peakHour[0]}:00 with ${peakHour[1]} sales`
                });
            }

            return insights;
        } catch (error) {
            console.error('Error generating insights:', error);
            return [{
                type: 'error',
                message: 'Unable to generate insights from available data'
            }];
        }
    }

    calculateGrowthRate(values) {
        try {
            if (!values || values.length < 2) return 0;
            const oldValue = values[0];
            const newValue = values[values.length - 1];
            return oldValue === 0 ? 0 : ((newValue - oldValue) / oldValue) * 100;
        } catch (error) {
            console.error('Error calculating growth rate:', error);
            return 0;
        }
    }

    calculateForecastConfidence(values) {
        try {
            if (!values || values.length < 7) return 'low';

            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            if (mean === 0) return 'low';

            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
            const standardDeviation = Math.sqrt(variance);
            const coefficientOfVariation = (standardDeviation / mean) * 100;

            if (coefficientOfVariation < 20) return 'high';
            if (coefficientOfVariation < 40) return 'medium';
            return 'low';
        } catch (error) {
            console.error('Error calculating forecast confidence:', error);
            return 'low';
        }
    }

    calculateTrendDirection(values) {
        try {
            if (!values || values.length < 4) return 'stable';

            const firstHalf = values.slice(0, Math.floor(values.length / 2));
            const secondHalf = values.slice(Math.floor(values.length / 2));
            
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            
            const difference = secondAvg - firstAvg;
            if (difference > firstAvg * 0.1) return 'increasing';
            if (difference < -firstAvg * 0.1) return 'decreasing';
            return 'stable';
        } catch (error) {
            console.error('Error calculating trend direction:', error);
            return 'stable';
        }
    }
}

class TransactionIntelligence {
    async detectAnomalies(transactions) {
        try {
            if (!transactions || transactions.length === 0) {
                return [];
            }

            const anomalies = [];
            const stats = await this.calculateTransactionStats(transactions);

            transactions.forEach(transaction => {
                try {
                    // Skip invalid transactions
                    if (!transaction || typeof transaction.totalAmount === 'undefined') {
                        return;
                    }

                    const anomalyScore = this.calculateAnomalyScore(transaction, stats);
                    if (anomalyScore > 0.7) { // 70% threshold for anomalies
                        anomalies.push({
                            transactionId: transaction._id ? 
                                transaction._id.toString().slice(-4) : 
                                Math.random().toString(36).substring(2, 6),
                            score: Math.round(anomalyScore * 100),
                            amount: transaction.totalAmount,
                            date: transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A',
                            reasons: this.getAnomalyReasons(transaction, stats),
                            details: {
                                averageAmount: Math.round(stats.averageAmount),
                                deviation: Math.round(Math.abs(transaction.totalAmount - stats.averageAmount)),
                                percentageDeviation: Math.round((Math.abs(transaction.totalAmount - stats.averageAmount) / stats.averageAmount) * 100)
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error processing transaction for anomalies:', error);
                }
            });

            return anomalies;
        } catch (error) {
            console.error('Error in anomaly detection:', error);
            return [];
        }
    }

    async calculateTransactionStats(transactions) {
        try {
            // Filter out invalid transactions
            const validTransactions = transactions.filter(t => t && typeof t.totalAmount === 'number');
            if (validTransactions.length === 0) {
                return {
                    averageAmount: 0,
                    standardDeviation: 0,
                    maxAmount: 0,
                    minAmount: 0
                };
            }

            const amounts = validTransactions.map(t => t.totalAmount);
            const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            
            return {
                averageAmount: average,
                standardDeviation: this.calculateStandardDeviation(amounts),
                maxAmount: Math.max(...amounts),
                minAmount: Math.min(...amounts)
            };
        } catch (error) {
            console.error('Error calculating transaction stats:', error);
            return {
                averageAmount: 0,
                standardDeviation: 0,
                maxAmount: 0,
                minAmount: 0
            };
        }
    }

    calculateAnomalyScore(transaction, stats) {
        try {
            if (!transaction || typeof transaction.totalAmount !== 'number' || !stats.standardDeviation) {
                return 0;
            }

            const amountDiff = Math.abs(transaction.totalAmount - stats.averageAmount);
            const amountScore = amountDiff / (stats.standardDeviation * 2);
            
            // Cap the score at 1 (100%)
            return Math.min(amountScore, 1);
        } catch (error) {
            console.error('Error calculating anomaly score:', error);
            return 0;
        }
    }

    getAnomalyReasons(transaction, stats) {
        try {
            if (!transaction || typeof transaction.totalAmount !== 'number') {
                return ['Invalid transaction data'];
            }

            const reasons = [];
            const amount = transaction.totalAmount;
            const average = stats.averageAmount;

            if (amount > average * 2) {
                reasons.push(`Transaction amount (₱${amount.toLocaleString()}) is ${Math.round((amount/average - 1) * 100)}% higher than average (₱${Math.round(average).toLocaleString()})`);
            }
            if (amount < average * 0.5) {
                reasons.push(`Transaction amount (₱${amount.toLocaleString()}) is ${Math.round((1 - amount/average) * 100)}% lower than average (₱${Math.round(average).toLocaleString()})`);
            }
            if (amount === stats.maxAmount) {
                reasons.push('This is the highest transaction amount in the current period');
            }
            if (amount === stats.minAmount) {
                reasons.push('This is the lowest transaction amount in the current period');
            }

            return reasons.length > 0 ? reasons : ['Unusual transaction pattern detected'];
        } catch (error) {
            console.error('Error getting anomaly reasons:', error);
            return ['Unable to determine specific anomaly reasons'];
        }
    }

    calculateStandardDeviation(values) {
        try {
            if (!Array.isArray(values) || values.length === 0) {
                return 0;
            }

            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
            return Math.sqrt(variance);
        } catch (error) {
            console.error('Error calculating standard deviation:', error);
            return 0;
        }
    }
}

module.exports = {
    OrderManagementAI,
    SalesAnalysisAI,
    TransactionIntelligence
}; 