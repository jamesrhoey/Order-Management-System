const Sale = require('../models/saleModel');
const Transaction = require('../models/transactionModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');

const saleController = {
    createSale: async (req, res) => {
        try {
            const { 
                transactionId, 
                items, 
                salesPerson, 
                customerDetails 
            } = req.body;

            // Calculate total amount
            const totalAmount = items.reduce((sum, item) => 
                sum + (item.quantity * item.unitPrice), 0);

            const newSale = new Sale({
                transactionId,
                totalAmount,
                items,
                salesPerson,
                customerDetails
            });

            const savedSale = await newSale.save();

            res.status(201).json({
                success: true,
                message: 'Sale created successfully',
                data: savedSale
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating sale',
                error: error.message
            });
        }
    },

    getSaleById: async (req, res) => {
        try {
            const sale = await Sale.findById(req.params.id)
                .populate('transactionId')
                .populate('items.productId');

            if (!sale) {
                return res.status(404).json({
                    success: false,
                    message: 'Sale not found'
                });
            }

            res.json({
                success: true,
                data: sale
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getAllSales: async (req, res) => {
        try {
            console.log('Getting all sales...');
            console.log('User making request:', req.user);

            const sales = await Sale.find()
                .populate('transactionId')
                .populate('items.productId')
                .sort({ createdAt: -1 });

            console.log('Number of sales found:', sales.length);
            console.log('Raw sales data:', JSON.stringify(sales, null, 2));
            
            if (sales.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No sales records found',
                    data: []
                });
            }

            res.json({
                success: true,
                count: sales.length,
                data: sales
            });
        } catch (error) {
            console.error('Error in getAllSales:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching sales',
                error: error.message
            });
        }
    },

    getSalesByDateRange: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            
            const sales = await Sale.find({
                saleDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }).populate('transactionId')
              .populate('items.productId');

            res.json({
                success: true,
                data: sales
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    updateSale: async (req, res) => {
        try {
            const updatedSale = await Sale.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            ).populate('transactionId')
             .populate('items.productId');

            if (!updatedSale) {
                return res.status(404).json({
                    success: false,
                    message: 'Sale not found'
                });
            }

            res.json({
                success: true,
                message: 'Sale updated successfully',
                data: updatedSale
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    deleteSale: async (req, res) => {
        try {
            const sale = await Sale.findByIdAndDelete(req.params.id);

            if (!sale) {
                return res.status(404).json({
                    success: false,
                    message: 'Sale not found'
                });
            }

            res.json({
                success: true,
                message: 'Sale deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = saleController;
