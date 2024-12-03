const Product = require('../models/productModel');
const mongoose = require('mongoose');

// Create a new product
exports.createProduct = async (req, res) => {
    try {
        const { productId, productName, price, ingredients, image } = req.body;
        
        const product = new Product({
            productId,
            productName,
            price,
            ingredients: ingredients.split(',').map(item => item.trim()),
            image
        });

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
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
        const { productName, price, ingredients, image } = req.body;
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.productName = productName || product.productName;
        product.price = price || product.price;
        if (ingredients) {
            product.ingredients = ingredients.split(',').map(item => item.trim());
        }
        product.image = image || product.image;

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