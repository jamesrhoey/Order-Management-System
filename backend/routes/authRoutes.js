const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
    // Simple test credentials
    const { username, password } = req.body;
    
    // Very basic auth - replace with proper authentication
    if (username === "admin" && password === "password") {
        const token = jwt.sign(
            { username: username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

module.exports = router;
