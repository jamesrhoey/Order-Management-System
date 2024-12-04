const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const authController = {
    // Login user
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            console.log('Login attempt for username:', username);

            // Find user
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Create token with explicit payload
            const payload = {
                id: user._id,
                username: user.username,
                role: user.role
            };

            console.log('Creating token with payload:', payload);
            console.log('Using JWT_SECRET:', process.env.JWT_SECRET);

            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            console.log('Token created successfully:', token);

            // Send response
            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Error during login',
                error: error.message
            });
        }
    },

    // Register new user
    register: async (req, res) => {
        try {
            const { username, password, role } = req.body;

            // Check if user exists
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }

            // Create new user
            const user = new User({
                username,
                password,
                role: role || 'staff'
            });

            await user.save();

            // Optionally, you might want to automatically log in the user after registration
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.status(201).json({ 
                message: 'User registered successfully',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Verify token
    verifyToken: async (req, res) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            res.json({
                success: true,
                decoded
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Token verification failed',
                error: error.message
            });
        }
    },

    // Logout user
    logout: async (req, res) => {
        try {
            // In a real application, you might want to invalidate the token here
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = authController;
