const Sale = require('../models/saleModel');

// Get all sales
const getAllSales = async (req, res) => {
    try {
        const sales = await Sale.find().sort({ date: -1 });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get sales by date range
const getSalesByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Create date objects and set time to start and end of day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const sales = await Sale.find({
            saleDate: {
                $gte: start,
                $lte: end
            }
        }).sort({ saleDate: -1 });

        // Transform the response to match the expected format
        const transformedSales = sales.map(sale => ({
            _id: sale._id,
            transactionId: sale.transactionId,
            totalAmount: sale.totalAmount,
            customerDetails: {
                name: sale.customerDetails?.name || 'N/A',
                address: sale.customerDetails?.address || 'N/A',
                contactNumber: sale.customerDetails?.contactNumber || 'N/A'
            },
            items: sale.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal
            })),
            saleDate: sale.saleDate,
            salesPerson: sale.salesPerson || 'System'
        }));

        res.json(transformedSales);
    } catch (error) {
        console.error('Error in getSalesByDateRange:', error);
        res.status(500).json({ 
            message: error.message,
            details: 'Error fetching sales by date range'
        });
    }
};

// Get sales summary
const getSalesSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let matchStage = {};
        
        // Add date filtering if dates are provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            matchStage = {
                saleDate: {
                    $gte: start,
                    $lte: end
                }
            };
        }

        const summary = await Sale.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$totalAmount' },
                    averageSale: { $avg: '$totalAmount' },
                    totalTransactions: { $sum: 1 },
                    totalItems: { $sum: { $size: '$items' } }
                }
            }
        ]);

        // Provide default values if no sales found
        const defaultSummary = {
            totalSales: 0,
            averageSale: 0,
            totalTransactions: 0,
            totalItems: 0
        };

        res.json(summary[0] || defaultSummary);
    } catch (error) {
        console.error('Error in getSalesSummary:', error);
        res.status(500).json({ 
            message: error.message,
            details: 'Error generating sales summary'
        });
    }
};

// Create new sale
const createSale = async (req, res) => {
    try {
        const sale = new Sale({
            ...req.body,
            saleDate: new Date() // Ensure saleDate is set to current time
        });
        const newSale = await sale.save();
        res.status(201).json(newSale);
    } catch (error) {
        console.error('Error in createSale:', error);
        res.status(400).json({ 
            message: error.message,
            details: 'Error creating sale record'
        });
    }
};

module.exports = {
    getAllSales,
    getSalesByDateRange,
    getSalesSummary,
    createSale
};
