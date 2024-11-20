// Inside server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const productRoutes = require('./routes/product');
const path = require('path');

// Create Express app
const app = express();

// CORS
app.use('/api/products', cors());  // Allow cross-origin requests for products
app.use('/uploads', express.static('uploads'));  // Serve uploaded files from 'uploads'

// Middleware
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Configure multer storage for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // Store uploaded images in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Add timestamp to filenames to avoid collisions
    }
});

const upload = multer({ storage: storage });

// Routes
app.use('/api/products', productRoutes); // Use the product routes

// Connect to the database
const mongoUri = process.env.MONGO_URI || "mongodb+srv://james:0827James@mernapp.zomz5.mongodb.net/oms?retryWrites=true&w=majority&appName=MERNapp";
const port = process.env.PORT || 4000;

mongoose
    .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to MongoDB:', error.message);
    });
