const Task = require('../models/task');
const CounterService = require('./counterService');
const { logActivity } = require('../utils/activityLogger');
const { ErrorHandler, AppError } = require('../utils/errorHandler');
const mongoose = require('mongoose');

/**
 * Task Service for managing task business logic
 * Handles task CRUD operations, validation, and hierarchy management
 */
class TaskService {
    /**
     * Create a new task with auto-incremented taskId
     * 
     * @param {Object} taskData - Task data
     * @param {string} userId - User ID who owns the task
     * @returns {Promise<Object>} Created task
     * @throws {Error} If creation fails
     */
    static async createTask(taskData, userId) {
        try {
            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                throw ErrorHandler.validationError('Valid userId is required');
            }

            // Validate parent task if provided
            if (taskData.parentTaskId) {
                await this.validateSubTaskConstraints(taskData, null);
            }

            // Create task with userId
            const task = new Task({
                ...taskData,
                userId: new mongoose.Types.ObjectId(userId)
            });

            const savedTask = await task.save();
            
            // Log activity with graceful degradation
            await ErrorHandler.gracefulDegradation(
                () => logActivity(userId, 'TASK_CREATED', savedTask._id),
                null,
                true
            );

            return savedTask;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            
            if (error.name === 'ValidationError') {
                throw ErrorHandler.validationError(error.message, error.errors);
            }
            
            if (error.code === 11000) {
                throw ErrorHandler.databaseError(error);
            }
            
            console.error('TaskService: Failed to create task:', error);
            throw new AppError(`Failed to create task: ${error.message}`);
        }
    }

    /**
     * Update an existing task
     * 
     * @param {string} taskId - Task ID to update
     * @param {Object} updates - Updates to apply
     * @param {string} userId - User ID who owns the task
     * @returns {Promise<Object>} Updated task
     * @throws {Error} If update fails
     */
    static async updateTask(taskId, updates, userId) {
        try {
            if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
                throw new Error('Valid taskId is required');
            }

            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Valid userId is required');
            }

            // Find task and verify ownership
            const task = await Task.findOne({
                _id: taskId,
                userId: new mongoose.Types.ObjectId(userId)
            });

            if (!task) {
                throw new Error('Task not found or access denied');
            }

            // Validate sub-task constraints if parentTaskId is being updated
            if (updates.parentTaskId !== undefined) {
                await this.validateSubTaskConstraints({ ...task.toObject(), ...updates }, null);
            }

            // Apply updates
            Object.keys(updates).forEach(key => {
                task[key] = updates[key];
            });

            const updatedTask = await task.save();

            // Log activity
            await logActivity(userId, 'TASK_UPDATED', updatedTask._id).catch(err => {
                console.error('Failed to log task update:', err);
            });

            return updatedTask;
        } catch (error) {
            console.error('TaskService: Failed to update task:', error);
            throw new Error(`Failed to update task: ${error.message}`);
        }
    }

    /**
     * Delete a task
     * 
     * @param {string} taskId - Task ID to delete
     * @param {string} userId - User ID who owns the task
     * @returns {Promise<Object>} Deleted task
     * @throws {Error} If deletion fails
     */
    static async deleteTask(taskId, userId) {
        try {
            if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
                throw new Error('Valid taskId is required');
            }

            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Valid userId is required');
            }

            // Find and delete task
            const task = await Task.findOneAndDelete({
                _id: taskId,
                userId: new mongoose.Types.ObjectId(userId)
            });

            if (!task) {
                throw new Error('Task not found or access denied');
            }

            // Log activity
            await logActivity(userId, 'TASK_DELETED', task._id).catch(err => {
                console.error('Failed to log task deletion:', err);
            });

            return task;
        } catch (error) {
            console.error('TaskService: Failed to delete task:', error);
            throw new Error(`Failed to delete task: ${error.message}`);
        }
    }

    /**
     * Get a task with its sub-tasks
     * 
     * @param {string} taskId - Task ID to retrieve
     * @param {string} userId - User ID who owns the task
     * @returns {Promise<Object>} Task with sub-tasks
     * @throws {Error} If retrieval fails
     */
    static async getTaskWithSubtasks(taskId, userId) {
        try {
            if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
                throw new Error('Valid taskId is required');
            }

            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Valid userId is required');
            }

            // Find main task
            const task = await Task.findOne({
                _id: taskId,
                userId: new mongoose.Types.ObjectId(userId)
            });

            if (!task) {
                throw new Error('Task not found or access denied');
            }

            // Find sub-tasks
            const subTasks = await Task.find({
                parentTaskId: taskId,
                userId: new mongoose.Types.ObjectId(userId)
            }).sort({ dueDate: 1 });

            return {
                ...task.toObject(),
                subTasks
            };
        } catch (error) {
            console.error('TaskService: Failed to get task with subtasks:', error);
            throw new Error(`Failed to get task with subtasks: ${error.message}`);
        }
    }

    /**
     * Validate sub-task constraints
     * 
     * @param {Object} taskData - Task data to validate
     * @param {Object} parentTask - Parent task (optional, will be fetched if not provided)
     * @returns {Promise<boolean>} True if valid
     * @throws {Error} If validation fails
     */
    static async validateSubTaskConstraints(taskData, parentTask = null) {
        try {
            if (!taskData.parentTaskId) {
                return true; // Not a sub-task, no constraints to validate
            }

            // Get parent task if not provided
            if (!parentTask) {
                parentTask = await Task.findById(taskData.parentTaskId);
                if (!parentTask) {
                    throw new Error('Parent task not found');
                }
            }

            // Validate parent task belongs to same user
            if (!parentTask.userId.equals(taskData.userId)) {
                throw new Error('Parent task must belong to the same user');
            }

            // Validate repeatType constraint
            if (taskData.repeatType && taskData.repeatType !== 'none') {
                throw new Error('Sub-tasks cannot have a repeatType other than "none"');
            }

            // Validate due date constraint
            if (taskData.dueDate && new Date(taskData.dueDate) > new Date(parentTask.dueDate)) {
                throw new Error('Sub-task due date must be same or before parent task due date');
            }

            return true;
        } catch (error) {
            console.error('TaskService: Sub-task validation failed:', error);
            throw error;
        }
    }

    /**
     * Cascade delete recurring tasks with same parentRecurringId
     * 
     * @param {string} parentRecurringId - Parent recurring task ID
     * @param {string} userId - User ID who owns the tasks
     * @returns {Promise<number>} Number of deleted tasks
     * @throws {Error} If deletion fails
     */
    static async cascadeDeleteRecurringTasks(parentRecurringId, userId) {
        try {
            if (!parentRecurringId || !mongoose.Types.ObjectId.isValid(parentRecurringId)) {
                throw new Error('Valid parentRecurringId is required');
            }

            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Valid userId is required');
            }

            // Find and delete all tasks with same parentRecurringId
            const result = await Task.deleteMany({
                parentRecurringId: new mongoose.Types.ObjectId(parentRecurringId),
                userId: new mongoose.Types.ObjectId(userId)
            });

            // Log activity for cascade deletion
            if (result.deletedCount > 0) {
                await logActivity(userId, 'RECURRING_TASKS_DELETED', parentRecurringId).catch(err => {
                    console.error('Failed to log recurring tasks deletion:', err);
                });
            }

            return result.deletedCount;
        } catch (error) {
            console.error('TaskService: Failed to cascade delete recurring tasks:', error);
            throw new Error(`Failed to cascade delete recurring tasks: ${error.message}`);
        }
    }

    /**
     * Get tasks by various filters
     * 
     * @param {string} userId - User ID
     * @param {Object} filters - Filter options
     * @param {Object} options - Query options (limit, skip, sort)
     * @returns {Promise<Array>} Filtered tasks
     * @throws {Error} If query fails
     */
    static async getTasksByFilters(userId, filters = {}, options = {}) {
        try {
            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Valid userId is required');
            }

            const query = { userId: new mongoose.Types.ObjectId(userId) };

            // Apply filters
            if (filters.isCompleted !== undefined) {
                query.isCompleted = filters.isCompleted;
            }

            if (filters.priority) {
                query.priority = filters.priority;
            }

            if (filters.category) {
                query.category = filters.category;
            }

            if (filters.repeatType) {
                query.repeatType = filters.repeatType;
            }

            if (filters.parentTaskId !== undefined) {
                query.parentTaskId = filters.parentTaskId ? 
                    new mongoose.Types.ObjectId(filters.parentTaskId) : null;
            }

            // Build query
            let taskQuery = Task.find(query);

            // Apply sorting
            if (options.sortBy) {
                const parts = options.sortBy.split(':');
                const sortField = parts[0];
                const sortOrder = parts[1] === 'desc' ? -1 : 1;
                taskQuery = taskQuery.sort({ [sortField]: sortOrder });
            } else {
                taskQuery = taskQuery.sort({ dueDate: 1 }); // Default sort
            }

            // Apply pagination
            if (options.limit) {
                taskQuery = taskQuery.limit(parseInt(options.limit));
            }

            if (options.skip) {
                taskQuery = taskQuery.skip(parseInt(options.skip));
            }

            const tasks = await taskQuery.exec();
            return tasks;
        } catch (error) {
            console.error('TaskService: Failed to get tasks by filters:', error);
            throw new Error(`Failed to get tasks by filters: ${error.message}`);
        }
    }

    /**
     * Get task statistics for a user
     * 
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Task statistics
     * @throws {Error} If query fails
     */
    static async getTaskStatistics(userId) {
        try {
            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Valid userId is required');
            }

            const userObjectId = new mongoose.Types.ObjectId(userId);

            const stats = await Task.aggregate([
                { $match: { userId: userObjectId } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        completed: { $sum: { $cond: ['$isCompleted', 1, 0] } },
                        pending: { $sum: { $cond: ['$isCompleted', 0, 1] } },
                        overdue: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$isCompleted', false] },
                                            { $lt: ['$dueDate', new Date()] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
                        recurring: { $sum: { $cond: [{ $ne: ['$repeatType', 'none'] }, 1, 0] } },
                        subTasks: { $sum: { $cond: [{ $ne: ['$parentTaskId', null] }, 1, 0] } }
                    }
                }
            ]);

            return stats.length > 0 ? stats[0] : {
                total: 0,
                completed: 0,
                pending: 0,
                overdue: 0,
                highPriority: 0,
                recurring: 0,
                subTasks: 0
            };
        } catch (error) {
            console.error('TaskService: Failed to get task statistics:', error);
            throw new Error(`Failed to get task statistics: ${error.message}`);
        }
    }
}

module.exports = TaskService;