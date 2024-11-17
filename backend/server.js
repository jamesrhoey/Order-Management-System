require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');

const workoutRoutes = require('./routes/workouts');
const productRoutes = require('./routes/product');




// Create Express app
const app = express();
const path = require('path');

app.use('/uploads', express.static('uploads'));



const cors = require('cors');
app.use(cors()); // This will allow all origins (for development purposes)

// Middleware
app.use(express.json()); // Parse JSON body
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});



// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save images to the "uploads" folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Create a unique filename
    }
});

const upload = multer({ storage: storage });

// Routes
app.use('/api/workouts', workoutRoutes);
app.use('/api/products', productRoutes);

// Image upload route - This will handle the product image upload
app.post('/api/products', upload.single('image'), (req, res) => {
    const { productName, price, ingredients } = req.body;
    const imagePath = `/uploads/${req.file.filename}`; // Save the image path

    // Create a new product object (use your existing product model)
    const newProduct = new Product({
        productName,
        price,
        ingredients,
        image: imagePath
    });

    // Save the product to the database
    newProduct.save()
        .then(product => res.status(200).json(product))
        .catch(error => res.status(400).json({ error: error.message }));
});

// Connect to the database
const mongoUri = process.env.MONGO_URI;
const port = process.env.PORT || 3000;

if (!mongoUri) {
    console.error('MONGO_URI is not defined in the .env file.');
    process.exit(1);
}

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
