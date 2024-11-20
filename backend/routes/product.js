const express = require('express');
const {
    createProduct,
    getProducts,
    getProduct,
    deleteProduct,
    updateProduct,
    upload
} = require('../controllers/productController');

const router = express.Router();

// Use multer's upload middleware for the POST route

router.post('/', upload.single('image'), createProduct); // POST to create product
router.patch('/:id', upload.single('image'), updateProduct);  // Single file upload

router.get('/', getProducts);

router.get('/:id', getProduct);

router.delete('/:id', deleteProduct);

router.patch('/:id', updateProduct);

module.exports = router;
