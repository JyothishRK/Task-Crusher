const TasksWorker = require('./tasksWorker');
const RecurrenceEngine = require('./recurrenceEngine');
const { logActivity } = require('../utils/activityLogger');
const { ErrorHandler, AppError } = require('../utils/errorHandler');

/**
 * Worker Service interface for background task processing
 * Provides a unified interface for all worker operations
 */
class WorkerService {
    /**
     * Process task recurrence based on operation type
     * 
     * @param {string} taskId - Task ID to process
     * @param {string} operation - Operation type ('create', 'complete', 'delete')
     * @param {string} userId - User ID (required for delete operation)
     * @returns {Promise<Object>} Processing result
     * @throws {Error} If processing fails
     */
    static async processTaskRecurrence(taskId, operation, userId = null) {
        try {
            if (!taskId || typeof taskId !== 'string') {
                throw new Error('Valid taskId is required');
            }

            if (!operation || typeof operation !== 'string') {
                throw new Error('Valid operation is required');
            }

            const validOperations = ['create', 'complete', 'delete'];
            if (!validOperations.includes(operation)) {
                throw new Error(`Invalid operation. Must be one of: ${validOperations.join(', ')}`);
            }

            let result;

            switch (operation) {
                case 'create':
                    result = await TasksWorker.processTaskCreation(taskId);
                    break;

                case 'complete':
                    result = await TasksWorker.processTaskCompletion(taskId);
                    break;

                case 'delete':
                    if (!userId) {
                        throw new Error('userId is required for delete operation');
                    }
                    result = await TasksWorker.processTaskDeletion(taskId, userId);
                    break;

                default:
                    throw new Error(`Unsupported operation: ${operation}`);
            }

            console.log(`WorkerService: Successfully processed ${operation} for task ${taskId}`);
            return {
                success: true,
                operation,
                taskId,
                result
            };

        } catch (error) {
            console.error(`WorkerService: Failed to process ${operation} for task ${taskId}:`, error);
            
            // Log error activity if userId is available with graceful degradation
            if (userId) {
                await ErrorHandler.gracefulDegradation(
                    () => logActivity(userId, `WORKER_${operation.toUpperCase()}_FAILED`, taskId, error.message),
                    null,
                    true
                );
            }

            throw ErrorHandler.workerProcessingFailed(operation, error);
        }
    }

    /**
     * Generate recurring tasks for an original task
     * 
     * @param {Object} originalTask - Original task object
     * @param {number} count - Number of occurrences to generate (default: 3)
     * @returns {Promise<Array>} Array of generated tasks
     * @throws {Error} If generation fails
     */
    static async generateRecurringTasks(originalTask, count = 3) {
        try {
            if (!originalTask || typeof originalTask !== 'object') {
                throw new Error('Valid original task is required');
            }

            if (!originalTask._id) {
                throw new Error('Original task must have an ID');
            }

            return await TasksWorker.processTaskCreation(originalTask._id.toString());

        } catch (error) {
            console.error('WorkerService: Failed to generate recurring tasks:', error);
            throw new Error(`Failed to generate recurring tasks: ${error.message}`);
        }
    }

    /**
     * Handle task completion for recurring tasks
     * 
     * @param {string} taskId - ID of completed task
     * @returns {Promise<Object>} Completion handling result
     * @throws {Error} If handling fails
     */
    static async handleTaskCompletion(taskId) {
        try {
            return await TasksWorker.processTaskCompletion(taskId);

        } catch (error) {
            console.error('WorkerService: Failed to handle task completion:', error);
            throw new Error(`Failed to handle task completion: ${error.message}`);
        }
    }

    /**
     * Handle task deletion for recurring tasks
     * 
     * @param {string} taskId - ID of deleted task
     * @param {string} userId - User ID who owns the task
     * @returns {Promise<number>} Number of deleted recurring tasks
     * @throws {Error} If handling fails
     */
    static async handleTaskDeletion(taskId, userId) {
        try {
            return await TasksWorker.processTaskDeletion(taskId, userId);

        } catch (error) {
            console.error('WorkerService: Failed to handle task deletion:', error);
            throw new Error(`Failed to handle task deletion: ${error.message}`);
        }
    }

    /**
     * Validate recurrence configuration
     * 
     * @param {Object} task - Task to validate
     * @returns {Promise<boolean>} True if valid
     * @throws {Error} If validation fails
     */
    static async validateRecurrence(task) {
        try {
            return RecurrenceEngine.validateRecurrenceRules(task);

        } catch (error) {
            console.error('WorkerService: Recurrence validation failed:', error);
            throw new Error(`Recurrence validation failed: ${error.message}`);
        }
    }

    /**
     * Get worker service health status
     * 
     * @returns {Promise<Object>} Health status
     */
    static async getHealthStatus() {
        try {
            const stats = await TasksWorker.getRecurringTaskStats();
            
            return {
                status: 'healthy',
                timestamp: new Date(),
                services: {
                    tasksWorker: 'operational',
                    recurrenceEngine: 'operational'
                },
                stats
            };

        } catch (error) {
            console.error('WorkerService: Health check failed:', error);
            return {
                status: 'unhealthy',
                timestamp: new Date(),
                error: error.message,
                services: {
                    tasksWorker: 'error',
                    recurrenceEngine: 'unknown'
                }
            };
        }
    }

    /**
     * Perform maintenance operations
     * 
     * @returns {Promise<Object>} Maintenance result
     * @throws {Error} If maintenance fails
     */
    static async performMaintenance() {
        try {
            console.log('WorkerService: Starting maintenance operations...');

            // Clean up orphaned recurring tasks
            const cleanedCount = await TasksWorker.cleanupOrphanedRecurringTasks();

            const result = {
                timestamp: new Date(),
                operations: {
                    orphanedTasksCleanup: {
                        completed: true,
                        cleanedCount
                    }
                },
                success: true
            };

            console.log('WorkerService: Maintenance operations completed successfully');
            return result;

        } catch (error) {
            console.error('WorkerService: Maintenance operations failed:', error);
            throw new Error(`Maintenance operations failed: ${error.message}`);
        }
    }

    /**
     * Get detailed statistics about worker operations
     * 
     * @param {string} userId - User ID for user-specific stats (optional)
     * @returns {Promise<Object>} Detailed statistics
     * @throws {Error} If query fails
     */
    static async getDetailedStats(userId = null) {
        try {
            const recurringStats = await TasksWorker.getRecurringTaskStats(userId);
            
            return {
                timestamp: new Date(),
                userId: userId || 'all_users',
                recurringTasks: recurringStats,
                workerStatus: {
                    tasksWorker: 'operational',
                    recurrenceEngine: 'operational'
                }
            };

        } catch (error) {
            console.error('WorkerService: Failed to get detailed stats:', error);
            throw new Error(`Failed to get detailed stats: ${error.message}`);
        }
    }
}

module.exports = WorkerService;