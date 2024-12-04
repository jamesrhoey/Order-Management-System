const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const authController = {
    // Login user
    login: async (req, res) => {
        try {
            console.log('Login attempt received:', { 
                username: req.body.username,
                bodyReceived: !!req.body
            });

            // Check if JWT_SECRET is available
            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET is not defined in environment variables');
                return res.status(500).json({ message: 'Server configuration error' });
            }

            const { username, password } = req.body;

            // Validate input
            if (!username || !password) {
                console.log('Missing credentials');
                return res.status(400).json({ message: 'Please provide username and password' });
            }

            // Find user
            console.log('Finding user in database...');
            const user = await User.findOne({ username });
            
            if (!user) {
                console.log('User not found:', username);
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            console.log('User found, checking password...');
            // Check password
            const isMatch = await user.comparePassword(password);
            
            if (!isMatch) {
                console.log('Password mismatch for user:', username);
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            console.log('Password matched, generating token...');
            console.log('JWT_SECRET available:', !!process.env.JWT_SECRET);
            
            // Create token
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            console.log('Login successful for user:', username);
            // Send response
            res.json({
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Detailed login error:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            res.status(500).json({ 
                message: 'Server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

            res.status(201).json({ message: 'User registered successfully' });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Verify token
    verifyToken: async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('-password');
            res.json(user);
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(500).json({ message: 'Server error' });
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
