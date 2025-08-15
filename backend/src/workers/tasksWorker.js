const Task = require('../models/task');
const RecurrenceEngine = require('./recurrenceEngine');
const { logActivity } = require('../utils/activityLogger');
const mongoose = require('mongoose');

/**
 * Tasks Worker for handling background task operations
 * Manages recurring task generation, completion handling, and cleanup
 */
class TasksWorker {
    /**
     * Process task creation for recurring tasks
     * Generates the next 3 occurrences for recurring tasks
     * 
     * @param {string} taskId - ID of the created task
     * @returns {Promise<Array>} Array of created recurring tasks
     * @throws {Error} If processing fails
     */
    static async processTaskCreation(taskId) {
        try {
            if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
                throw new Error('Valid taskId is required');
            }

            // Find the original task
            const originalTask = await Task.findById(taskId);
            if (!originalTask) {
                throw new Error('Original task not found');
            }

            // Only process if it's a recurring task
            if (originalTask.repeatType === 'none') {
                return []; // No recurring tasks to create
            }

            // Validate recurrence rules
            RecurrenceEngine.validateRecurrenceRules(originalTask);

            // Generate next 3 occurrences
            const occurrences = RecurrenceEngine.generateOccurrences(
                originalTask.dueDate,
                originalTask.repeatType,
                3
            );

            const createdTasks = [];

            for (const occurrenceDate of occurrences) {
                const recurringTask = new Task({
                    userId: originalTask.userId,
                    title: originalTask.title,
                    description: originalTask.description,
                    dueDate: occurrenceDate,
                    originalDueDate: occurrenceDate, // Set original due date for recurring instances
                    priority: originalTask.priority,
                    category: originalTask.category,
                    repeatType: originalTask.repeatType,
                    parentRecurringId: originalTask._id,
                    links: originalTask.links,
                    additionalNotes: originalTask.additionalNotes,
                    isCompleted: false
                });

                const savedTask = await recurringTask.save();
                createdTasks.push(savedTask);

                // Log activity for recurring task creation
                await logActivity(
                    originalTask.userId,
                    'RECURRING_TASK_CREATED',
                    savedTask._id
                ).catch(err => {
                    console.error('Failed to log recurring task creation:', err);
                });
            }

            console.log(`TasksWorker: Created ${createdTasks.length} recurring tasks for task ${taskId}`);
            return createdTasks;

        } catch (error) {
            console.error('TasksWorker: Failed to process task creation:', error);
            throw new Error(`Failed to process task creation: ${error.message}`);
        }
    }

    /**
     * Process task completion for recurring tasks
     * Updates next occurrence and generates new future occurrence
     * 
     * @param {string} taskId - ID of the completed task
     * @returns {Promise<Object>} Result with updated and created tasks
     * @throws {Error} If processing fails
     */
    static async processTaskCompletion(taskId) {
        try {
            if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
                throw new Error('Valid taskId is required');
            }

            // Find the completed task
            const completedTask = await Task.findById(taskId);
            if (!completedTask) {
                throw new Error('Completed task not found');
            }

            // Only process if it's a recurring task
            if (completedTask.repeatType === 'none') {
                return { updatedTask: null, createdTask: null };
            }

            let updatedTask = null;
            let createdTask = null;

            // Find the next occurrence (if any)
            const nextOccurrence = await Task.findOne({
                parentRecurringId: completedTask.parentRecurringId || completedTask._id,
                isCompleted: false,
                dueDate: { $gt: completedTask.dueDate }
            }).sort({ dueDate: 1 });

            if (nextOccurrence) {
                // Set parentRecurringId to the original task
                nextOccurrence.parentRecurringId = completedTask.parentRecurringId || completedTask._id;
                updatedTask = await nextOccurrence.save();

                // Log activity for next occurrence update
                await logActivity(
                    completedTask.userId,
                    'RECURRING_TASK_UPDATED',
                    updatedTask._id
                ).catch(err => {
                    console.error('Failed to log recurring task update:', err);
                });
            }

            // Generate the third future occurrence to maintain 3 future instances
            const baseTaskId = completedTask.parentRecurringId || completedTask._id;
            const futureOccurrences = await Task.find({
                parentRecurringId: baseTaskId,
                isCompleted: false,
                dueDate: { $gt: new Date() }
            }).sort({ dueDate: -1 }).limit(1);

            if (futureOccurrences.length > 0) {
                const lastFutureTask = futureOccurrences[0];
                const nextOccurrenceDate = RecurrenceEngine.calculateNextOccurrence(
                    lastFutureTask.dueDate,
                    completedTask.repeatType
                );

                // Create new future occurrence
                const newRecurringTask = new Task({
                    userId: completedTask.userId,
                    title: completedTask.title,
                    description: completedTask.description,
                    dueDate: nextOccurrenceDate,
                    originalDueDate: nextOccurrenceDate, // Set original due date for recurring instances
                    priority: completedTask.priority,
                    category: completedTask.category,
                    repeatType: completedTask.repeatType,
                    parentRecurringId: baseTaskId,
                    links: completedTask.links,
                    additionalNotes: completedTask.additionalNotes,
                    isCompleted: false
                });

                createdTask = await newRecurringTask.save();

                // Log activity for new recurring task creation
                await logActivity(
                    completedTask.userId,
                    'RECURRING_TASK_CREATED',
                    createdTask._id
                ).catch(err => {
                    console.error('Failed to log recurring task creation:', err);
                });
            }

            console.log(`TasksWorker: Processed completion for recurring task ${taskId}`);
            return { updatedTask, createdTask };

        } catch (error) {
            console.error('TasksWorker: Failed to process task completion:', error);
            throw new Error(`Failed to process task completion: ${error.message}`);
        }
    }

    /**
     * Process task deletion for recurring tasks
     * Deletes all tasks with the same parentRecurringId
     * 
     * @param {string} taskId - ID of the deleted task
     * @param {string} userId - User ID who owns the task
     * @returns {Promise<number>} Number of deleted recurring tasks
     * @throws {Error} If processing fails
     */
    static async processTaskDeletion(taskId, userId) {
        try {
            if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
                throw new Error('Valid taskId is required');
            }

            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Valid userId is required');
            }

            // Find the deleted task to get its parentRecurringId
            // Note: The task might already be deleted, so we need to handle this case
            let parentRecurringId = taskId;

            // Try to find if there are any tasks with this taskId as parentRecurringId
            const relatedTasks = await Task.find({
                parentRecurringId: new mongoose.Types.ObjectId(taskId),
                userId: new mongoose.Types.ObjectId(userId)
            });

            if (relatedTasks.length === 0) {
                // Check if this task was itself a recurring task instance
                const taskWithParent = await Task.findOne({
                    _id: new mongoose.Types.ObjectId(taskId),
                    userId: new mongoose.Types.ObjectId(userId)
                });

                if (taskWithParent && taskWithParent.parentRecurringId) {
                    parentRecurringId = taskWithParent.parentRecurringId;
                } else {
                    // No recurring tasks to delete
                    return 0;
                }
            }

            // Delete all tasks with the same parentRecurringId
            const deleteResult = await Task.deleteMany({
                parentRecurringId: new mongoose.Types.ObjectId(parentRecurringId),
                userId: new mongoose.Types.ObjectId(userId)
            });

            // Log activity for cascade deletion
            if (deleteResult.deletedCount > 0) {
                await logActivity(
                    userId,
                    'RECURRING_TASKS_DELETED',
                    parentRecurringId,
                    null
                ).catch(err => {
                    console.error('Failed to log recurring tasks deletion:', err);
                });
            }

            console.log(`TasksWorker: Deleted ${deleteResult.deletedCount} recurring tasks for task ${taskId}`);
            return deleteResult.deletedCount;

        } catch (error) {
            console.error('TasksWorker: Failed to process task deletion:', error);
            throw new Error(`Failed to process task deletion: ${error.message}`);
        }
    }

    /**
     * Clean up orphaned recurring tasks
     * Removes recurring tasks that have no parent task
     * 
     * @returns {Promise<number>} Number of cleaned up tasks
     * @throws {Error} If cleanup fails
     */
    static async cleanupOrphanedRecurringTasks() {
        try {
            // Find all tasks with parentRecurringId
            const recurringTasks = await Task.find({
                parentRecurringId: { $ne: null }
            });

            let cleanedCount = 0;

            for (const task of recurringTasks) {
                // Check if parent task exists
                const parentExists = await Task.findById(task.parentRecurringId);
                
                if (!parentExists) {
                    // Parent doesn't exist, delete this orphaned task
                    await Task.findByIdAndDelete(task._id);
                    cleanedCount++;

                    // Log cleanup activity
                    await logActivity(
                        task.userId,
                        'ORPHANED_RECURRING_TASK_CLEANED',
                        task._id
                    ).catch(err => {
                        console.error('Failed to log orphaned task cleanup:', err);
                    });
                }
            }

            console.log(`TasksWorker: Cleaned up ${cleanedCount} orphaned recurring tasks`);
            return cleanedCount;

        } catch (error) {
            console.error('TasksWorker: Failed to cleanup orphaned recurring tasks:', error);
            throw new Error(`Failed to cleanup orphaned recurring tasks: ${error.message}`);
        }
    }

    /**
     * Get statistics about recurring tasks
     * 
     * @param {string} userId - User ID (optional, for user-specific stats)
     * @returns {Promise<Object>} Recurring task statistics
     * @throws {Error} If query fails
     */
    static async getRecurringTaskStats(userId = null) {
        try {
            const matchCondition = {};
            if (userId) {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    throw new Error('Valid userId is required');
                }
                matchCondition.userId = new mongoose.Types.ObjectId(userId);
            }

            const stats = await Task.aggregate([
                { $match: matchCondition },
                {
                    $group: {
                        _id: null,
                        totalTasks: { $sum: 1 },
                        recurringTasks: {
                            $sum: { $cond: [{ $ne: ['$repeatType', 'none'] }, 1, 0] }
                        },
                        recurringInstances: {
                            $sum: { $cond: [{ $ne: ['$parentRecurringId', null] }, 1, 0] }
                        },
                        dailyRecurring: {
                            $sum: { $cond: [{ $eq: ['$repeatType', 'daily'] }, 1, 0] }
                        },
                        weeklyRecurring: {
                            $sum: { $cond: [{ $eq: ['$repeatType', 'weekly'] }, 1, 0] }
                        },
                        monthlyRecurring: {
                            $sum: { $cond: [{ $eq: ['$repeatType', 'monthly'] }, 1, 0] }
                        }
                    }
                }
            ]);

            return stats.length > 0 ? stats[0] : {
                totalTasks: 0,
                recurringTasks: 0,
                recurringInstances: 0,
                dailyRecurring: 0,
                weeklyRecurring: 0,
                monthlyRecurring: 0
            };

        } catch (error) {
            console.error('TasksWorker: Failed to get recurring task stats:', error);
            throw new Error(`Failed to get recurring task stats: ${error.message}`);
        }
    }
}

module.exports = TasksWorker;