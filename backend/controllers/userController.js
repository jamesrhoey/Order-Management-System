const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const userController = {
    // Get user profile
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            console.error('Error fetching profile:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Change password
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Use the same comparePassword method as in auth controller
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            // Set the new password and let the model handle the hashing
            user.password = newPassword;
            await user.save();
            
            res.json({ message: 'Password updated successfully' });
        } catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = userController;
