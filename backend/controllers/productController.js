const Product = require('../models/productModel');
const mongoose = require('mongoose');

// Create a new product
exports.createProduct = async (req, res) => {
    try {
        const { productId, productName, category, price, ingredients } = req.body;
        
        // Validate that ingredients is already an array
        if (!Array.isArray(ingredients)) {
            return res.status(400).json({ 
                message: 'Ingredients must be an array' 
            });
        }

        // Validate category
        const validCategories = ['Starters', 'Pasta', 'Mains', 'Dessert'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                message: 'Invalid category. Must be one of: Starters, Pasta, Mains, Dessert'
            });
        }

        // Create new product
        const product = new Product({
            productId,
            productName,
            category,
            price,
            ingredients
        });

        const savedProduct = await product.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ 
            message: error.message 
        });
    }
};

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const { category } = req.query; // Add query parameter for category filtering
        
        let query = {};
        if (category) {
            query.category = category;
        }

        const products = await Product.find(query);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { productName, category, price, ingredients } = req.body;
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Validate category if it's being updated
        if (category) {
            const validCategories = ['Starters', 'Pasta', 'Mains', 'Dessert'];
            if (!validCategories.includes(category)) {
                return res.status(400).json({
                    message: 'Invalid category. Must be one of: Starters, Pasta, Mains, Dessert'
                });
            }
        }

        // Update fields if provided
        product.productName = productName || product.productName;
        product.category = category || product.category;
        product.price = price || product.price;
        if (ingredients) {
            if (Array.isArray(ingredients)) {
                product.ingredients = ingredients;
            } else if (typeof ingredients === 'string') {
                product.ingredients = ingredients.split(',').map(item => item.trim());
            }
        }

        await product.save();
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const validCategories = ['Starters', 'Pasta', 'Mains', 'Dessert'];
        
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                message: 'Invalid category. Must be one of: Starters, Pasta, Mains, Dessert'
            });
        }

        const products = await Product.findByCategory(category);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

