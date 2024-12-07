const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get user profile (protected route)
router.get('/profile', authenticateToken, userController.getProfile);

// Change password (protected route)
router.post('/change-password', authenticateToken, userController.changePassword);

// Get all users (protected route)
router.get('/', authenticateToken, userController.getAllUsers);

// Get user by ID
router.get('/:id', authenticateToken, userController.getUserById);

// Update user
router.put('/:id', authenticateToken, userController.updateUser);

// Delete user
router.delete('/:id', authenticateToken, userController.deleteUser);

module.exports = router;
