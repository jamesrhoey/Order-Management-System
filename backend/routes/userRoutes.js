const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Get user profile
router.get('/profile', authMiddleware, userController.getProfile);

// Change password
router.post('/change-password', authMiddleware, userController.changePassword);

module.exports = router;
