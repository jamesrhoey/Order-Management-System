const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        console.log('Auth Header:', authHeader); // Debug log
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token is required'
            });
        }

        // Extract token and trim any whitespace
        const token = authHeader.split(' ')[1].trim();
        console.log('Extracted Token:', token); // Debug log

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded); // Debug log
            
            req.user = decoded;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
                error: error.message
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: error.message
        });
    }
};

module.exports = authMiddleware;
