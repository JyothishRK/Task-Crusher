const express = require('express');
const router = new express.Router();

// Health check endpoint - lightweight, no database operations
router.get('/health', (req, res) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
        const response = {
            status: 'ok',
            timestamp: timestamp,
            uptime: process.uptime(),
            service: 'task-app'
        };
        
        // Ensure response time is minimal
        const responseTime = Date.now() - startTime;
        
        res.status(200).json(response);
        
        // Enhanced logging for Render visibility
        console.log(`✅ [HEALTH] ${timestamp} - Health check SUCCESS (${responseTime}ms)`);
        console.log(`⏱️  [HEALTH] Service uptime: ${Math.floor(process.uptime())}s`);
        console.log(`🔄 [HEALTH] Keepalive ping received - service staying active`);
        
    } catch (error) {
        const response = {
            status: 'error',
            timestamp: timestamp,
            message: 'Service temporarily unavailable'
        };
        
        res.status(500).json(response);
        console.error(`❌ [HEALTH] ${timestamp} - Health check ERROR:`, error.message);
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