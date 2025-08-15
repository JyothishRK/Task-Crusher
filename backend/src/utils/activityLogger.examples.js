/**
 * Activity Logger Integration Examples
 * 
 * This file contains practical examples of how to integrate the activity logging system
 * into your existing Express.js routes and application logic.
 */

const express = require('express');
const { logActivity, activityLoggerMiddleware, logActivitySafe } = require('./activityLogger');
const Task = require('../models/task');
const User = require('../models/user');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

const router = express.Router();

// ============================================================================
// EXAMPLE 1: Manual Activity Logging in Route Handlers
// ============================================================================

/**
 * Task creation with manual activity logging
 */
router.post('/tasks', auth, async (req, res) => {
    try {
        const task = new Task({
            ...req.body,
            userId: req.user._id
        });
        
        const savedTask = await task.save();
        
        // Log successful task creation
        await logActivity(req.user._id, 'TASK_CREATED', savedTask._id);
        
        res.status(201).json(savedTask);
    } catch (error) {
        // Log failed task creation
        await logActivity(req.user._id, 'TASK_CREATED', null, error.message);
        
        res.status(400).json({ error: error.message });
    }
});

/**
 * Task completion with error handling
 */
router.patch('/tasks/:id/complete', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });
        
        if (!task) {
            // Log failed completion attempt
            await logActivity(req.user._id, 'TASK_COMPLETED', req.params.id, 'Task not found');
            return res.status(404).json({ error: 'Task not found' });
        }
        
        task.isCompleted = true;
        await task.save();
        
        // Log successful completion
        await logActivity(req.user._id, 'TASK_COMPLETED', task._id);
        
        res.json(task);
    } catch (error) {
        // Log failed completion
        await logActivity(req.user._id, 'TASK_COMPLETED', req.params.id, error.message);
        res.status(400).json({ error: error.message });
    }
});

// ============================================================================
// EXAMPLE 2: Using Activity Logger Middleware
// ============================================================================

/**
 * Task update with automatic success logging via middleware
 */
router.patch('/tasks/:id', 
    auth, 
    activityLoggerMiddleware('TASK_UPDATED', (req) => req.params.id),
    async (req, res) => {
        try {
            const task = await Task.findOneAndUpdate(
                { _id: req.params.id, userId: req.user._id },
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            
            // Middleware will automatically log TASK_UPDATED on successful response
            res.json(task);
        } catch (error) {
            // Log error manually since middleware only logs success
            await logActivity(req.user._id, 'TASK_UPDATED', req.params.id, error.message);
            res.status(400).json({ error: error.message });
        }
    }
);

/**
 * User profile update with middleware (no taskId)
 */
router.patch('/profile', 
    auth,
    activityLoggerMiddleware('PROFILE_UPDATED'),
    async (req, res) => {
        try {
            const updates = Object.keys(req.body);
            const allowedUpdates = ['name', 'email', 'age', 'emailEnabled', 'notificationTime'];
            const isValidOperation = updates.every(update => allowedUpdates.includes(update));
            
            if (!isValidOperation) {
                return res.status(400).json({ error: 'Invalid updates' });
            }
            
            updates.forEach(update => req.user[update] = req.body[update]);
            await req.user.save();
            
            // Middleware will automatically log PROFILE_UPDATED
            res.json(req.user);
        } catch (error) {
            await logActivity(req.user._id, 'PROFILE_UPDATED', null, error.message);
            res.status(400).json({ error: error.message });
        }
    }
);

// ============================================================================
// EXAMPLE 3: Using logActivitySafe Helper
// ============================================================================

/**
 * Task deletion with safe logging helper
 */
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });
        
        if (!task) {
            await logActivitySafe(req, 'TASK_DELETED', req.params.id, 'Task not found');
            return res.status(404).json({ error: 'Task not found' });
        }
        
        await Task.findByIdAndDelete(req.params.id);
        
        // Log successful deletion
        await logActivitySafe(req, 'TASK_DELETED', req.params.id);
        
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        // Log failed deletion
        await logActivitySafe(req, 'TASK_DELETED', req.params.id, error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// EXAMPLE 4: Authentication Flow Logging
// ============================================================================

/**
 * User login with activity logging
 */
router.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        
        // Log successful login
        await logActivity(user._id, 'USER_LOGIN');
        
        res.json({ user, token });
    } catch (error) {
        // For login failures, we might not have a userId, so we could log differently
        // or skip logging failed login attempts for security reasons
        res.status(400).json({ error: 'Login failed' });
    }
});

/**
 * User logout with activity logging
 */
router.post('/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();
        
        // Log successful logout
        await logActivity(req.user._id, 'USER_LOGOUT');
        
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        await logActivity(req.user._id, 'USER_LOGOUT', null, error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// EXAMPLE 5: Bulk Operations Logging
// ============================================================================

/**
 * Bulk task completion with individual activity logging
 */
router.patch('/tasks/bulk/complete', auth, async (req, res) => {
    const { taskIds } = req.body;
    const results = [];
    
    for (const taskId of taskIds) {
        try {
            const task = await Task.findOne({ 
                _id: taskId, 
                userId: req.user._id 
            });
            
            if (task) {
                task.isCompleted = true;
                await task.save();
                
                // Log each successful completion
                await logActivity(req.user._id, 'TASK_COMPLETED', taskId);
                results.push({ taskId, status: 'completed' });
            } else {
                // Log each failed completion
                await logActivity(req.user._id, 'TASK_COMPLETED', taskId, 'Task not found');
                results.push({ taskId, status: 'not_found' });
            }
        } catch (error) {
            await logActivity(req.user._id, 'TASK_COMPLETED', taskId, error.message);
            results.push({ taskId, status: 'error', error: error.message });
        }
    }
    
    res.json({ results });
});

// ============================================================================
// EXAMPLE 6: Activity Querying Examples
// ============================================================================

/**
 * Get user activity history
 */
router.get('/activities', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, action, startDate, endDate } = req.query;
        
        const query = { userId: req.user._id };
        
        // Filter by action type if provided
        if (action) {
            query.action = action;
        }
        
        // Filter by date range if provided
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }
        
        const activities = await UserActivity.find(query)
            .populate('taskId', 'title description')
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const total = await UserActivity.countDocuments(query);
        
        res.json({
            activities,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get activity statistics
 */
router.get('/activities/stats', auth, async (req, res) => {
    try {
        const stats = await UserActivity.aggregate([
            { $match: { userId: req.user._id } },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 },
                    lastActivity: { $max: '$timestamp' },
                    errorCount: {
                        $sum: {
                            $cond: [{ $ifNull: ['$error', false] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// EXAMPLE 7: Error Handling Patterns
// ============================================================================

/**
 * Comprehensive error handling with activity logging
 */
router.post('/tasks/:id/duplicate', auth, async (req, res) => {
    let originalTaskId = req.params.id;
    let newTaskId = null;
    
    try {
        // Find original task
        const originalTask = await Task.findOne({ 
            _id: originalTaskId, 
            userId: req.user._id 
        });
        
        if (!originalTask) {
            await logActivity(req.user._id, 'TASK_DUPLICATED', originalTaskId, 'Original task not found');
            return res.status(404).json({ error: 'Task not found' });
        }
        
        // Create duplicate
        const duplicateTask = new Task({
            userId: req.user._id,
            title: `${originalTask.title} (Copy)`,
            description: originalTask.description,
            dueDate: originalTask.dueDate,
            priority: originalTask.priority,
            category: originalTask.category
        });
        
        const savedTask = await duplicateTask.save();
        newTaskId = savedTask._id;
        
        // Log successful duplication
        await logActivity(req.user._id, 'TASK_DUPLICATED', originalTaskId);
        await logActivity(req.user._id, 'TASK_CREATED', newTaskId);
        
        res.status(201).json(savedTask);
        
    } catch (error) {
        // Log the error with context about which task we were trying to duplicate
        const errorContext = newTaskId ? 
            `Failed to save duplicate of ${originalTaskId}` : 
            `Failed to duplicate ${originalTaskId}`;
            
        await logActivity(req.user._id, 'TASK_DUPLICATED', originalTaskId, `${errorContext}: ${error.message}`);
        
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;