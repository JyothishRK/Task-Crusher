const express = require('express');
const router = new express.Router();

// Health check endpoint - lightweight, no database operations
router.get('/health', (req, res) => {
    const startTime = Date.now();
    
    try {
        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            service: 'task-app'
        };
        
        // Ensure response time is minimal
        const responseTime = Date.now() - startTime;
        
        res.status(200).json(response);
        
        // Optional: Log for monitoring (minimal logging)
        console.log(`Health check completed in ${responseTime}ms`);
        
    } catch (error) {
        const response = {
            status: 'error',
            timestamp: new Date().toISOString(),
            message: 'Service temporarily unavailable'
        };
        
        res.status(500).json(response);
        console.error('Health check error:', error.message);
    }
});

// Handle non-GET methods
router.all('/health', (req, res) => {
    if (req.method !== 'GET') {
        res.status(405).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            message: 'Method not allowed'
        });
    }
});

module.exports = router;