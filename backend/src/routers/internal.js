const express = require('express');
const WorkerService = require('../workers/workerService');
const { logActivity } = require('../utils/activityLogger');

const router = new express.Router();

/**
 * Internal API Security Middleware
 * Restricts access to internal APIs
 */
const internalAuth = (req, res, next) => {
    // Check if request is from localhost or internal network
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';
    
    // Check for internal API key (if configured)
    const internalApiKey = process.env.INTERNAL_API_KEY;
    const providedKey = req.headers['x-internal-api-key'];
    
    if (internalApiKey && providedKey !== internalApiKey) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid internal API key'
        });
    }
    
    // For development, allow localhost without API key
    if (!isLocalhost && !internalApiKey) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Internal API access restricted'
        });
    }
    
    next();
};

/**
 * Request validation middleware
 */
const validateWorkerRequest = (req, res, next) => {
    const { taskId, operation, userId } = req.body;
    
    if (!taskId || typeof taskId !== 'string') {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Valid taskId is required'
        });
    }
    
    if (!operation || typeof operation !== 'string') {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Valid operation is required'
        });
    }
    
    const validOperations = ['create', 'complete', 'delete'];
    if (!validOperations.includes(operation)) {
        return res.status(400).json({
            error: 'Bad Request',
            message: `Invalid operation. Must be one of: ${validOperations.join(', ')}`
        });
    }
    
    if (operation === 'delete' && !userId) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'userId is required for delete operation'
        });
    }
    
    next();
};

/**
 * POST /internal/worker/tasks/recurrence
 * Process task recurrence operations
 */
router.post('/worker/tasks/recurrence', internalAuth, validateWorkerRequest, async (req, res) => {
    try {
        const { taskId, operation, userId } = req.body;
        
        console.log(`Internal API: Processing ${operation} for task ${taskId}`);
        
        const result = await WorkerService.processTaskRecurrence(taskId, operation, userId);
        
        res.status(200).json({
            success: true,
            message: `Successfully processed ${operation} for task ${taskId}`,
            data: result
        });
        
    } catch (error) {
        console.error('Internal API: Worker recurrence processing failed:', error);
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

/**
 * POST /internal/worker/tasks/cleanup
 * Clean up recurring tasks
 */
router.post('/worker/tasks/cleanup', internalAuth, async (req, res) => {
    try {
        console.log('Internal API: Starting cleanup operations');
        
        const result = await WorkerService.performMaintenance();
        
        res.status(200).json({
            success: true,
            message: 'Cleanup operations completed successfully',
            data: result
        });
        
    } catch (error) {
        console.error('Internal API: Cleanup operations failed:', error);
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

/**
 * GET /internal/worker/health
 * Get worker service health status
 */
router.get('/worker/health', internalAuth, async (req, res) => {
    try {
        const health = await WorkerService.getHealthStatus();
        
        const statusCode = health.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            success: health.status === 'healthy',
            data: health
        });
        
    } catch (error) {
        console.error('Internal API: Health check failed:', error);
        
        res.status(503).json({
            success: false,
            error: 'Service Unavailable',
            message: 'Health check failed',
            details: error.message
        });
    }
});

/**
 * GET /internal/worker/stats
 * Get worker service statistics
 */
router.get('/worker/stats', internalAuth, async (req, res) => {
    try {
        const { userId } = req.query;
        
        const stats = await WorkerService.getDetailedStats(userId);
        
        res.status(200).json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('Internal API: Stats retrieval failed:', error);
        
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

/**
 * POST /internal/worker/validate
 * Validate recurrence configuration
 */
router.post('/worker/validate', internalAuth, async (req, res) => {
    try {
        const { task } = req.body;
        
        if (!task || typeof task !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'Valid task object is required'
            });
        }
        
        const isValid = await WorkerService.validateRecurrence(task);
        
        res.status(200).json({
            success: true,
            data: {
                valid: isValid,
                task: task
            }
        });
        
    } catch (error) {
        console.error('Internal API: Recurrence validation failed:', error);
        
        res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: error.message
        });
    }
});

/**
 * Error handling middleware for internal routes
 */
router.use((error, req, res, next) => {
    console.error('Internal API Error:', error);
    
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred in the internal API'
    });
});

/**
 * 404 handler for internal routes
 */
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Internal API endpoint not found'
    });
});

module.exports = router;