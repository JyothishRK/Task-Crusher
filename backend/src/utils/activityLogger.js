const mongoose = require('mongoose');
const UserActivity = require('../models/userActivity');

/**
 * Logs user activity to the database with automatic message generation
 * 
 * @param {string|ObjectId} userId - The user performing the action (required)
 * @param {string} action - The action type (required, e.g., "TASK_COMPLETED", "USER_LOGIN")
 * @param {string|ObjectId} taskId - The task involved in the action (optional)
 * @param {string} error - Error message if the action failed (optional)
 * @returns {Promise<UserActivity|null>} The created activity record or null if logging failed
 * 
 * @example
 * // Log successful task completion
 * const activity = await logActivity(userId, 'TASK_COMPLETED', taskId);
 * 
 * @example
 * // Log user login
 * const activity = await logActivity(userId, 'USER_LOGIN');
 * 
 * @example
 * // Log failed task update
 * const activity = await logActivity(userId, 'TASK_UPDATED', taskId, 'Permission denied');
 * 
 * @example
 * // Log error without task reference
 * const activity = await logActivity(userId, 'PROFILE_UPDATED', null, 'Validation failed');
 * 
 * Common Action Types:
 * - TASK_CREATED: When a new task is created
 * - TASK_UPDATED: When a task is modified
 * - TASK_COMPLETED: When a task is marked as complete
 * - TASK_DELETED: When a task is removed
 * - USER_LOGIN: When a user logs in
 * - USER_LOGOUT: When a user logs out
 * - PROFILE_UPDATED: When user profile is modified
 * 
 * Message Patterns:
 * - Success without task: "User performed {action}"
 * - Success with task: "User performed {action} :: {taskId}"
 * - Error without task: "User attempted {action} :: ERROR: {error}"
 * - Error with task: "User attempted {action} :: {taskId} :: ERROR: {error}"
 */
const logActivity = async (userId, action, taskId = null, error = null) => {
    try {
        // Parameter validation
        if (!userId) {
            console.error('ActivityLogger: userId is required');
            return null;
        }
        
        if (!action || typeof action !== 'string') {
            console.error('ActivityLogger: action is required and must be a string');
            return null;
        }

        // Validate ObjectId format for userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('ActivityLogger: userId must be a valid ObjectId');
            return null;
        }

        // Validate ObjectId format for taskId if provided
        if (taskId && !mongoose.Types.ObjectId.isValid(taskId)) {
            console.error('ActivityLogger: taskId must be a valid ObjectId when provided');
            return null;
        }

        // Generate human-readable message
        let message;
        if (error) {
            // Error scenario
            if (taskId) {
                message = `User attempted ${action} :: ${taskId} :: ERROR: ${error}`;
            } else {
                message = `User attempted ${action} :: ERROR: ${error}`;
            }
        } else {
            // Success scenario
            if (taskId) {
                message = `User performed ${action} :: ${taskId}`;
            } else {
                message = `User performed ${action}`;
            }
        }

        // Create activity record
        const activityData = {
            userId: new mongoose.Types.ObjectId(userId),
            action: action.trim(),
            message: message,
            timestamp: new Date()
        };

        // Add optional fields
        if (taskId) {
            activityData.taskId = new mongoose.Types.ObjectId(taskId);
        }
        
        if (error) {
            activityData.error = error.trim();
        }

        // Save to database
        const activity = new UserActivity(activityData);
        const savedActivity = await activity.save();
        
        return savedActivity;

    } catch (dbError) {
        // Fallback logging - don't let logging failures interrupt main application flow
        console.error('ActivityLogger: Failed to log activity to database:', {
            userId,
            action,
            taskId,
            error,
            dbError: dbError.message
        });
        
        // Return null to indicate logging failure, but don't throw
        return null;
    }
};

module.exports = {
    logActivity
};
/**
 *
 Middleware function for automatic activity logging in Express routes
 * 
 * @param {string} action - The action type to log
 * @param {function} getTaskId - Optional function to extract taskId from req (req) => taskId
 * @returns {function} Express middleware function
 * 
 * @example
 * // Basic usage in router
 * router.post('/tasks', auth, activityLoggerMiddleware('TASK_CREATED', (req) => req.body.taskId), async (req, res) => {
 *     // Route handler code
 * });
 * 
 * @example
 * // Usage without taskId
 * router.post('/login', activityLoggerMiddleware('USER_LOGIN'), async (req, res) => {
 *     // Route handler code
 * });
 */
const activityLoggerMiddleware = (action, getTaskId = null) => {
    return async (req, res, next) => {
        // Store original res.json to intercept response
        const originalJson = res.json;
        
        res.json = function(data) {
            // Log activity after successful response
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Extract userId from authenticated user
                const userId = req.user?._id;
                
                if (userId) {
                    // Extract taskId if function provided
                    const taskId = getTaskId ? getTaskId(req) : null;
                    
                    // Log successful activity (don't await to avoid blocking response)
                    logActivity(userId, action, taskId).catch(err => {
                        console.error('Activity logging failed in middleware:', err);
                    });
                }
            }
            
            // Call original json method
            return originalJson.call(this, data);
        };
        
        next();
    };
};

/**
 * Helper function to log activity with error handling for route handlers
 * 
 * @param {Object} req - Express request object (should have req.user._id)
 * @param {string} action - The action type
 * @param {string|ObjectId} taskId - Optional task ID
 * @param {string} error - Optional error message
 * @returns {Promise<void>} Promise that resolves regardless of logging success/failure
 * 
 * @example
 * // In a route handler
 * router.post('/tasks/:id/complete', auth, async (req, res) => {
 *     try {
 *         const task = await Task.findById(req.params.id);
 *         task.isCompleted = true;
 *         await task.save();
 *         
 *         // Log successful completion
 *         await logActivitySafe(req, 'TASK_COMPLETED', task._id);
 *         
 *         res.json(task);
 *     } catch (error) {
 *         // Log failed completion
 *         await logActivitySafe(req, 'TASK_COMPLETED', req.params.id, error.message);
 *         res.status(400).json({ error: error.message });
 *     }
 * });
 */
const logActivitySafe = async (req, action, taskId = null, error = null) => {
    try {
        const userId = req.user?._id;
        if (userId) {
            await logActivity(userId, action, taskId, error);
        }
    } catch (loggingError) {
        // Don't let logging errors affect the main application flow
        console.error('Activity logging failed:', loggingError);
    }
};

module.exports = {
    logActivity,
    activityLoggerMiddleware,
    logActivitySafe
};