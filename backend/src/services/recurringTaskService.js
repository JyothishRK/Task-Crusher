const Task = require('../models/task');

/**
 * Service class for managing recurring task operations
 * Handles generation, calculation, and maintenance of recurring task instances
 */
class RecurringTaskService {
    /**
     * Generate recurring instances for a parent task
     * @param {Object} parentTask - The parent task object
     * @param {number} count - Number of instances to generate (default: 3)
     * @returns {Promise<Array>} Array of generated task instances
     */
    static async generateInstances(parentTask, count = 3) {
        if (!parentTask) {
            throw new Error('Parent task is required');
        }

        if (!parentTask.repeatType || parentTask.repeatType === 'none') {
            throw new Error('Parent task must have a valid repeat type');
        }

        if (count <= 0) {
            throw new Error('Count must be greater than 0');
        }

        // Validate that this is a recurring parent task (not an instance)
        if (parentTask.parentRecurringId !== null && parentTask.parentRecurringId !== undefined) {
            throw new Error('Cannot generate instances from a recurring instance');
        }

        const Task = require('../models/task');
        const generatedInstances = [];

        try {
            // Calculate future dates for the instances
            const futureDates = this.calculateFutureDates(parentTask.dueDate, parentTask.repeatType, count);

            // Generate each instance
            for (const futureDate of futureDates) {
                const instanceData = {
                    // Copy all properties from parent except specific fields
                    userId: parentTask.userId,
                    parentId: parentTask.parentId, // Preserve subtask relationship if any
                    links: [...(parentTask.links || [])],
                    additionalDetails: parentTask.additionalDetails,
                    title: parentTask.title,
                    description: parentTask.description,
                    dueDate: futureDate,
                    priority: parentTask.priority,
                    category: parentTask.category,
                    isCompleted: false, // New instances are always incomplete
                    repeatType: 'none', // Instances don't repeat themselves
                    parentRecurringId: parentTask.taskId // Link to parent recurring task
                };

                // Create the new task instance
                const taskInstance = new Task(instanceData);
                await taskInstance.save();
                generatedInstances.push(taskInstance);
            }

            return generatedInstances;

        } catch (error) {
            // If any instance creation fails, clean up any created instances
            if (generatedInstances.length > 0) {
                try {
                    const instanceIds = generatedInstances.map(instance => instance.taskId);
                    await Task.deleteMany({ taskId: { $in: instanceIds } });
                } catch (cleanupError) {
                    console.error('Failed to cleanup partial instances:', cleanupError);
                }
            }
            throw new Error(`Failed to generate recurring instances: ${error.message}`);
        }
    }

    /**
     * Calculate the next occurrence date based on repeat type
     * @param {Date} baseDate - The base date to calculate from
     * @param {string} repeatType - The repeat type (daily, weekly, monthly)
     * @returns {Date} The next occurrence date
     */
    static calculateNextDate(baseDate, repeatType) {
        if (!baseDate || !(baseDate instanceof Date)) {
            throw new Error('Invalid base date provided');
        }

        if (!repeatType || !['daily', 'weekly', 'monthly'].includes(repeatType)) {
            throw new Error('Invalid repeat type. Must be daily, weekly, or monthly');
        }

        const nextDate = new Date(baseDate);

        switch (repeatType) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
                
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
                
            case 'monthly':
                // Handle month-end dates and leap years
                const originalDay = nextDate.getDate();
                nextDate.setMonth(nextDate.getMonth() + 1);
                
                // If the original day doesn't exist in the new month (e.g., Jan 31 -> Feb 31)
                // Set to the last day of the new month
                if (nextDate.getDate() !== originalDay) {
                    nextDate.setDate(0); // Sets to last day of previous month (which is our target month)
                }
                break;
                
            default:
                throw new Error(`Unsupported repeat type: ${repeatType}`);
        }

        return nextDate;
    }

    /**
     * Handle due date changes for recurring tasks
     * @param {Object} task - The task being edited
     * @param {Date} newDueDate - The new due date
     * @returns {Promise<Object>} Result with regeneration info
     */
    static async handleDueDateChange(task, newDueDate) {
        if (!task) {
            throw new Error('Task is required');
        }

        if (!newDueDate || !(newDueDate instanceof Date)) {
            throw new Error('Valid new due date is required');
        }

        // Only handle recurring parent tasks
        if (!task.isRecurringParent()) {
            return {
                deletedCount: 0,
                generatedCount: 0,
                message: 'Task is not a recurring parent, no instances to regenerate'
            };
        }

        const Task = require('../models/task');
        const currentDate = new Date();

        try {
            // Delete all future recurring instances
            const deletedCount = await Task.deleteMany({
                parentRecurringId: task.taskId,
                userId: task.userId,
                dueDate: { $gte: currentDate }
            }).then(result => result.deletedCount);

            // Update the task's due date
            task.dueDate = newDueDate;
            await task.save();

            // Generate new instances based on the new due date
            const newInstances = await this.generateInstances(task, 3);

            return {
                deletedCount,
                generatedCount: newInstances.length,
                message: `Deleted ${deletedCount} future instances and generated ${newInstances.length} new instances`,
                newInstances: newInstances.map(instance => ({
                    taskId: instance.taskId,
                    dueDate: instance.dueDate
                }))
            };

        } catch (error) {
            throw new Error(`Failed to handle due date change: ${error.message}`);
        }
    }

    /**
     * Handle repeat type changes for recurring tasks
     * @param {Object} task - The task being edited
     * @param {string} newRepeatType - The new repeat type
     * @returns {Promise<Object>} Result with regeneration info
     */
    static async handleRepeatTypeChange(task, newRepeatType) {
        if (!task) {
            throw new Error('Task is required');
        }

        if (!newRepeatType || !['none', 'daily', 'weekly', 'monthly'].includes(newRepeatType)) {
            throw new Error('Valid repeat type is required (none, daily, weekly, monthly)');
        }

        const Task = require('../models/task');
        const currentDate = new Date();
        let deletedCount = 0;
        let generatedCount = 0;

        try {
            // If the task was previously recurring, delete all future instances
            if (task.isRecurringParent()) {
                deletedCount = await Task.deleteMany({
                    parentRecurringId: task.taskId,
                    userId: task.userId,
                    dueDate: { $gte: currentDate }
                }).then(result => result.deletedCount);
            }

            // Update the task's repeat type
            task.repeatType = newRepeatType;
            await task.save();

            // If the new repeat type is not 'none', generate new instances
            if (newRepeatType !== 'none') {
                const newInstances = await this.generateInstances(task, 3);
                generatedCount = newInstances.length;

                return {
                    deletedCount,
                    generatedCount,
                    message: `Changed repeat type to ${newRepeatType}. Deleted ${deletedCount} old instances and generated ${generatedCount} new instances`,
                    newInstances: newInstances.map(instance => ({
                        taskId: instance.taskId,
                        dueDate: instance.dueDate
                    }))
                };
            } else {
                return {
                    deletedCount,
                    generatedCount: 0,
                    message: `Changed repeat type to none. Deleted ${deletedCount} recurring instances`,
                    newInstances: []
                };
            }

        } catch (error) {
            throw new Error(`Failed to handle repeat type change: ${error.message}`);
        }
    }

    /**
     * Daily maintenance to ensure recurring instances exist
     * Called by cron job to generate missing recurring tasks
     * @returns {Promise<Object>} Result with generation statistics
     */
    static async ensureRecurringInstances() {
        const Task = require('../models/task');
        const startTime = new Date();
        
        const { logRecurringTaskInfo, logRecurringTaskError, logRecurringTaskWarning, logCronJob, logPerformanceMetrics } = require('../utils/logger');
        
        logCronJob('recurring_task_maintenance', 'START', { timestamp: startTime });
        
        try {
            logRecurringTaskInfo('generation', 'Starting recurring task instance generation check');
            
            // Get all recurring parent tasks (tasks with repeatType !== 'none' and no parentRecurringId)
            const recurringParents = await Task.find({
                repeatType: { $ne: 'none' },
                $or: [
                    { parentRecurringId: null },
                    { parentRecurringId: { $exists: false } }
                ]
            });
            
            logRecurringTaskInfo('generation', `Found ${recurringParents.length} recurring parent tasks to check`, {
                parentTaskIds: recurringParents.map(t => t.taskId)
            });
            
            let totalGenerated = 0;
            let tasksProcessed = 0;
            let errors = [];
            const results = [];
            
            // Check each recurring parent task
            for (const parentTask of recurringParents) {
                const taskStartTime = Date.now();
                
                try {
                    logRecurringTaskInfo('generation', `Processing recurring task: ${parentTask.title}`, {
                        taskId: parentTask.taskId,
                        repeatType: parentTask.repeatType,
                        dueDate: parentTask.dueDate
                    });
                    
                    // Get existing instances for this parent
                    const existingInstances = await parentTask.getRecurringInstances();
                    
                    // Find the latest instance date
                    let latestInstanceDate = parentTask.dueDate;
                    if (existingInstances.length > 0) {
                        const sortedInstances = existingInstances.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
                        latestInstanceDate = sortedInstances[0].dueDate;
                    }
                    
                    // Calculate how many days ahead we need to generate
                    const currentDate = new Date();
                    const targetDate = new Date(currentDate);
                    targetDate.setDate(currentDate.getDate() + 3); // Generate for next 3 days
                    
                    logRecurringTaskInfo('generation', `Date comparison window established`, {
                        parentTaskId: parentTask.taskId,
                        currentDate: currentDate.toISOString(),
                        targetDate: targetDate.toISOString(),
                        targetDateString: targetDate.toDateString(),
                        latestInstanceDate: latestInstanceDate.toISOString()
                    });
                    
                    // Generate missing instances
                    const missingInstances = [];
                    let nextDate = new Date(latestInstanceDate);
                    
                    // Start from the next occurrence after the latest instance
                    nextDate = this.calculateNextDate(nextDate, parentTask.repeatType);
                    
                    logRecurringTaskInfo('generation', `Starting date comparison loop with fixed logic`, {
                        parentTaskId: parentTask.taskId,
                        firstNextDate: nextDate.toISOString(),
                        firstNextDateString: nextDate.toDateString(),
                        targetDateString: targetDate.toDateString(),
                        comparisonMethod: 'toDateString() - date-only comparison'
                    });
                    
                    while (this.validateDateComparison(nextDate, targetDate, parentTask.taskId) && 
                           this.compareDatesOnly(nextDate, targetDate) <= 0) {
                        
                        // Log each comparison for debugging
                        const oldComparisonResult = nextDate <= targetDate;
                        const newComparisonResult = this.compareDatesOnly(nextDate, targetDate) <= 0;
                        
                        if (oldComparisonResult !== newComparisonResult) {
                            logRecurringTaskInfo('generation', `Date comparison fix applied - old vs new logic difference detected`, {
                                parentTaskId: parentTask.taskId,
                                nextDate: nextDate.toISOString(),
                                targetDate: targetDate.toISOString(),
                                oldComparison: `${nextDate.toISOString()} <= ${targetDate.toISOString()} = ${oldComparisonResult}`,
                                newComparison: `compareDatesOnly(${nextDate.toDateString()}, ${targetDate.toDateString()}) <= 0 = ${newComparisonResult}`,
                                fixApplied: true
                            });
                        }
                        // Check if instance already exists for this date
                        const existsForDate = existingInstances.some(instance => {
                            const instanceDate = new Date(instance.dueDate);
                            return instanceDate.toDateString() === nextDate.toDateString();
                        });
                        
                        if (!existsForDate) {
                            missingInstances.push(new Date(nextDate));
                        }
                        
                        // Calculate next occurrence with error handling
                        try {
                            const previousDate = new Date(nextDate);
                            nextDate = this.calculateNextDate(nextDate, parentTask.repeatType);
                            
                            // Validate that the calculation produced a reasonable result
                            if (!nextDate || !(nextDate instanceof Date) || isNaN(nextDate.getTime())) {
                                logRecurringTaskError('generation', 'calculateNextDate returned invalid result', {
                                    parentTaskId: parentTask.taskId,
                                    previousDate: previousDate.toISOString(),
                                    repeatType: parentTask.repeatType,
                                    result: nextDate
                                });
                                break; // Exit the loop to prevent infinite loop
                            }
                            
                            // Check for infinite loop protection (date should always advance)
                            if (nextDate.getTime() <= previousDate.getTime()) {
                                logRecurringTaskError('generation', 'calculateNextDate did not advance the date - potential infinite loop', {
                                    parentTaskId: parentTask.taskId,
                                    previousDate: previousDate.toISOString(),
                                    nextDate: nextDate.toISOString(),
                                    repeatType: parentTask.repeatType
                                });
                                break; // Exit the loop to prevent infinite loop
                            }
                            
                        } catch (calculateError) {
                            logRecurringTaskError('generation', 'calculateNextDate threw an error', {
                                parentTaskId: parentTask.taskId,
                                currentDate: nextDate.toISOString(),
                                repeatType: parentTask.repeatType,
                                error: calculateError.message,
                                stack: calculateError.stack
                            });
                            break; // Exit the loop on calculation error
                        }
                    }
                    
                    logRecurringTaskInfo('generation', `Date comparison loop completed`, {
                        parentTaskId: parentTask.taskId,
                        finalNextDate: nextDate.toISOString(),
                        finalNextDateString: nextDate.toDateString(),
                        targetDateString: targetDate.toDateString(),
                        missingInstancesFound: missingInstances.length,
                        comparisonExceeded: `${nextDate.toDateString()} > ${targetDate.toDateString()}`
                    });
                    
                    // Generate the missing instances
                    let generatedForTask = 0;
                    if (missingInstances.length > 0) {
                        logRecurringTaskInfo('generation', `Generating ${missingInstances.length} missing instances`, {
                            parentTaskId: parentTask.taskId,
                            missingDates: missingInstances.map(d => d.toISOString())
                        });
                        
                        for (const instanceDate of missingInstances) {
                            try {
                                const newInstance = await this.createRecurringInstance(parentTask, instanceDate);
                                generatedForTask++;
                                logRecurringTaskInfo('generation', `Generated recurring instance successfully`, {
                                    parentTaskId: parentTask.taskId,
                                    instanceTaskId: newInstance.taskId,
                                    instanceDate: instanceDate.toISOString()
                                });
                            } catch (instanceError) {
                                logRecurringTaskError('generation', `Failed to generate instance for date ${instanceDate.toISOString()}`, {
                                    parentTaskId: parentTask.taskId,
                                    instanceDate: instanceDate.toISOString(),
                                    error: instanceError.message,
                                    stack: instanceError.stack
                                });
                                errors.push({
                                    parentTaskId: parentTask.taskId,
                                    date: instanceDate,
                                    error: instanceError.message
                                });
                            }
                        }
                    } else {
                        logRecurringTaskInfo('generation', `No missing instances found for task ${parentTask.taskId}`, {
                            existingInstancesCount: existingInstances.length
                        });
                    }
                    
                    results.push({
                        parentTaskId: parentTask.taskId,
                        parentTitle: parentTask.title,
                        existingInstances: existingInstances.length,
                        generatedInstances: generatedForTask,
                        latestInstanceDate: latestInstanceDate
                    });
                    
                    totalGenerated += generatedForTask;
                    tasksProcessed++;
                    
                    const taskDuration = Date.now() - taskStartTime;
                    logPerformanceMetrics('recurring_task_processing', taskDuration, {
                        parentTaskId: parentTask.taskId,
                        existingInstances: existingInstances.length,
                        generatedInstances: generatedForTask
                    });
                    
                } catch (taskError) {
                    logRecurringTaskError('generation', `Error processing recurring task ${parentTask.taskId}`, {
                        parentTaskId: parentTask.taskId,
                        parentTitle: parentTask.title,
                        error: taskError.message,
                        stack: taskError.stack
                    });
                    errors.push({
                        parentTaskId: parentTask.taskId,
                        error: taskError.message
                    });
                }
            }
            
            const endTime = new Date();
            const duration = endTime - startTime;
            
            const result = {
                success: true,
                timestamp: startTime,
                duration: `${duration}ms`,
                summary: {
                    recurringParentsFound: recurringParents.length,
                    tasksProcessed,
                    totalInstancesGenerated: totalGenerated,
                    errorsCount: errors.length
                },
                results,
                errors: errors.length > 0 ? errors : undefined
            };
            
            logRecurringTaskInfo('generation', 'Recurring task instance generation completed successfully', {
                processed: tasksProcessed,
                generated: totalGenerated,
                errors: errors.length,
                duration: `${duration}ms`,
                timestampFixApplied: true,
                comparisonMethod: 'date-only using toDateString()'
            });
            
            logCronJob('recurring_task_maintenance', 'SUCCESS', result.summary);
            logPerformanceMetrics('recurring_task_maintenance', duration, result.summary);
            
            return result;
            
        } catch (error) {
            const endTime = new Date();
            const duration = endTime - startTime;
            
            logRecurringTaskError('generation', 'Recurring task instance generation failed catastrophically', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`
            });
            
            logCronJob('recurring_task_maintenance', 'ERROR', {
                error: error.message,
                duration: `${duration}ms`
            });
            
            return {
                success: false,
                timestamp: startTime,
                duration: `${duration}ms`,
                error: error.message,
                details: error
            };
        }
    }
    
    /**
     * Create a single recurring instance from a parent task
     * @param {Object} parentTask - The parent recurring task
     * @param {Date} instanceDate - The due date for the new instance
     * @returns {Promise<Object>} The created task instance
     */
    static async createRecurringInstance(parentTask, instanceDate) {
        const Task = require('../models/task');
        
        // Get the next available taskId
        const lastTask = await Task.findOne().sort({ taskId: -1 });
        const nextTaskId = lastTask ? lastTask.taskId + 1 : 1;
        
        // Create the recurring instance
        const instanceData = {
            taskId: nextTaskId,
            userId: parentTask.userId,
            title: parentTask.title,
            description: parentTask.description,
            dueDate: instanceDate,
            priority: parentTask.priority,
            category: parentTask.category,
            repeatType: 'none', // Instances don't have repeat types
            parentRecurringId: parentTask.taskId,
            parentId: null, // Not a subtask
            isCompleted: false
        };
        
        const newInstance = new Task(instanceData);
        await newInstance.save();
        
        return newInstance;
    }

    /**
     * Calculate multiple future occurrence dates
     * @param {Date} baseDate - The base date to calculate from
     * @param {string} repeatType - The repeat type (daily, weekly, monthly)
     * @param {number} count - Number of future dates to calculate
     * @returns {Array<Date>} Array of future occurrence dates
     */
    static calculateFutureDates(baseDate, repeatType, count = 3) {
        if (count <= 0) {
            throw new Error('Count must be greater than 0');
        }

        const futureDates = [];
        let currentDate = new Date(baseDate);

        for (let i = 0; i < count; i++) {
            currentDate = this.calculateNextDate(currentDate, repeatType);
            futureDates.push(new Date(currentDate));
        }

        return futureDates;
    }

    /**
     * Validate if a date is valid for the given repeat type
     * @param {Date} date - The date to validate
     * @param {string} repeatType - The repeat type
     * @returns {boolean} True if date is valid for the repeat type
     */
    static isValidDateForRepeatType(date, repeatType) {
        if (!date || !(date instanceof Date)) {
            return false;
        }

        // For monthly repeats, check if it's a valid day of month
        if (repeatType === 'monthly') {
            const day = date.getDate();
            // Day should be between 1-31
            return day >= 1 && day <= 31;
        }

        // Daily and weekly repeats accept any valid date
        return !isNaN(date.getTime());
    }

    /**
     * Get the next valid date for monthly repeats (handles month-end edge cases)
     * @param {Date} baseDate - The base date
     * @param {number} monthsToAdd - Number of months to add
     * @returns {Date} The next valid date
     */
    static getNextMonthlyDate(baseDate, monthsToAdd = 1) {
        const nextDate = new Date(baseDate);
        const originalDay = nextDate.getDate();
        
        nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
        
        // Handle cases where the day doesn't exist in the target month
        if (nextDate.getDate() !== originalDay) {
            // Set to the last day of the target month
            nextDate.setDate(0);
        }
        
        return nextDate;
    }

    /**
     * Check if recurring instances already exist for specific dates
     * @param {number} parentTaskId - The parent task ID
     * @param {Array<Date>} dates - Array of dates to check
     * @param {number} userId - User ID for security validation
     * @returns {Promise<Array<Date>>} Array of dates that don't have instances
     */
    static async getMissingInstanceDates(parentTaskId, dates, userId) {
        const Task = require('../models/task');
        
        const existingInstances = await Task.find({
            parentRecurringId: parentTaskId,
            userId: userId,
            dueDate: { $in: dates }
        }).select('dueDate');

        const existingDates = existingInstances.map(instance => 
            instance.dueDate.toISOString().split('T')[0]
        );

        return dates.filter(date => 
            !existingDates.includes(date.toISOString().split('T')[0])
        );
    }

    /**
     * Generate only missing recurring instances (used by cron job)
     * @param {Object} parentTask - The parent task object
     * @param {Array<Date>} targetDates - Specific dates to ensure instances exist for
     * @returns {Promise<Array>} Array of newly generated task instances
     */
    static async generateMissingInstances(parentTask, targetDates) {
        if (!parentTask || !targetDates || targetDates.length === 0) {
            return [];
        }

        const missingDates = await this.getMissingInstanceDates(
            parentTask.taskId, 
            targetDates, 
            parentTask.userId
        );

        if (missingDates.length === 0) {
            return [];
        }

        const Task = require('../models/task');
        const generatedInstances = [];

        try {
            for (const missingDate of missingDates) {
                const instanceData = {
                    userId: parentTask.userId,
                    parentId: parentTask.parentId,
                    links: [...(parentTask.links || [])],
                    additionalDetails: parentTask.additionalDetails,
                    title: parentTask.title,
                    description: parentTask.description,
                    dueDate: missingDate,
                    priority: parentTask.priority,
                    category: parentTask.category,
                    isCompleted: false,
                    repeatType: 'none',
                    parentRecurringId: parentTask.taskId
                };

                const taskInstance = new Task(instanceData);
                await taskInstance.save();
                generatedInstances.push(taskInstance);
            }

            return generatedInstances;

        } catch (error) {
            // Cleanup on failure
            if (generatedInstances.length > 0) {
                try {
                    const instanceIds = generatedInstances.map(instance => instance.taskId);
                    await Task.deleteMany({ taskId: { $in: instanceIds } });
                } catch (cleanupError) {
                    console.error('Failed to cleanup partial instances:', cleanupError);
                }
            }
            throw new Error(`Failed to generate missing instances: ${error.message}`);
        }
    }

    /**
     * Delete recurring instances from a specific date
     * @param {number} parentTaskId - The parent task ID
     * @param {Date} fromDate - Delete instances from this date onwards
     * @param {number} userId - User ID for security validation
     * @returns {Promise<number>} Number of deleted instances
     */
    static async deleteRecurringInstances(parentTaskId, fromDate, userId) {
        if (!parentTaskId || !userId) {
            throw new Error('Parent task ID and user ID are required');
        }

        if (!fromDate || !(fromDate instanceof Date)) {
            throw new Error('Valid from date is required');
        }

        const Task = require('../models/task');

        try {
            const result = await Task.deleteMany({
                parentRecurringId: parentTaskId,
                userId: userId,
                dueDate: { $gte: fromDate }
            });

            return result.deletedCount;

        } catch (error) {
            throw new Error(`Failed to delete recurring instances: ${error.message}`);
        }
    }

    /**
     * Compare two dates using date-only comparison (the fixed method)
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
     */
    static compareDatesOnly(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        
        // Normalize to date-only by setting time to midnight
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        
        if (d1.getTime() < d2.getTime()) return -1;
        if (d1.getTime() > d2.getTime()) return 1;
        return 0;
    }

    /**
     * Test and log date comparison behavior for debugging
     * @param {Date} cronTime - The CRON execution time
     * @param {Date} taskTime - The task scheduled time
     * @param {number} parentTaskId - Parent task ID for logging
     * @returns {Object} Comparison results
     */
    static testDateComparison(cronTime, taskTime, parentTaskId) {
        const { logRecurringTaskInfo } = require('../utils/logger');
        
        try {
            const targetDate = new Date(cronTime);
            targetDate.setDate(cronTime.getDate() + 3);
            
            const oldComparison = taskTime <= targetDate;
            const newComparison = this.compareDatesOnly(taskTime, targetDate) <= 0;
            
            const result = {
                cronTime: cronTime.toISOString(),
                taskTime: taskTime.toISOString(),
                targetDate: targetDate.toISOString(),
                oldComparison: {
                    expression: `${taskTime.toISOString()} <= ${targetDate.toISOString()}`,
                    result: oldComparison
                },
                newComparison: {
                    expression: `compareDatesOnly(${taskTime.toDateString()}, ${targetDate.toDateString()}) <= 0`,
                    result: newComparison
                },
                fixEffective: oldComparison !== newComparison,
                wouldBeGenerated: newComparison
            };
            
            logRecurringTaskInfo('generation', 'Date comparison test results', {
                parentTaskId,
                ...result
            });
            
            return result;
            
        } catch (error) {
            const { logRecurringTaskError } = require('../utils/logger');
            logRecurringTaskError('generation', 'Date comparison test failed', {
                parentTaskId,
                error: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    /**
     * Validate date comparison inputs and log potential issues
     * @param {Date} nextDate - The next occurrence date
     * @param {Date} targetDate - The target comparison date
     * @param {number} parentTaskId - Parent task ID for logging
     * @returns {boolean} True if dates are valid for comparison
     */
    static validateDateComparison(nextDate, targetDate, parentTaskId) {
        const { logRecurringTaskError, logRecurringTaskWarning } = require('../utils/logger');
        
        try {
            // Check if dates are valid Date objects
            if (!nextDate || !(nextDate instanceof Date) || isNaN(nextDate.getTime())) {
                logRecurringTaskError('generation', 'Invalid nextDate in date comparison', {
                    parentTaskId,
                    nextDate: nextDate ? nextDate.toString() : 'null/undefined',
                    nextDateType: typeof nextDate
                });
                return false;
            }
            
            if (!targetDate || !(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
                logRecurringTaskError('generation', 'Invalid targetDate in date comparison', {
                    parentTaskId,
                    targetDate: targetDate ? targetDate.toString() : 'null/undefined',
                    targetDateType: typeof targetDate
                });
                return false;
            }
            
            // Check for extreme date values that might indicate calculation errors
            const minDate = new Date('1900-01-01');
            const maxDate = new Date('2100-12-31');
            
            if (nextDate < minDate || nextDate > maxDate) {
                logRecurringTaskWarning('generation', 'nextDate is outside reasonable range', {
                    parentTaskId,
                    nextDate: nextDate.toISOString(),
                    minDate: minDate.toISOString(),
                    maxDate: maxDate.toISOString()
                });
            }
            
            if (targetDate < minDate || targetDate > maxDate) {
                logRecurringTaskWarning('generation', 'targetDate is outside reasonable range', {
                    parentTaskId,
                    targetDate: targetDate.toISOString(),
                    minDate: minDate.toISOString(),
                    maxDate: maxDate.toISOString()
                });
            }
            
            // Check if toDateString() method works correctly
            try {
                const nextDateString = nextDate.toDateString();
                const targetDateString = targetDate.toDateString();
                
                if (!nextDateString || !targetDateString) {
                    logRecurringTaskError('generation', 'toDateString() returned invalid result', {
                        parentTaskId,
                        nextDate: nextDate.toISOString(),
                        targetDate: targetDate.toISOString(),
                        nextDateString,
                        targetDateString
                    });
                    return false;
                }
            } catch (dateStringError) {
                logRecurringTaskError('generation', 'toDateString() method failed', {
                    parentTaskId,
                    nextDate: nextDate.toISOString(),
                    targetDate: targetDate.toISOString(),
                    error: dateStringError.message
                });
                return false;
            }
            
            return true;
            
        } catch (error) {
            logRecurringTaskError('generation', 'Date comparison validation failed with unexpected error', {
                parentTaskId,
                error: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    /**
     * Atomically delete and regenerate recurring instances
     * @param {Object} task - The parent task
     * @param {Date} fromDate - Delete instances from this date onwards
     * @param {number} count - Number of new instances to generate
     * @returns {Promise<Object>} Result with deletion and generation info
     */
    static async deleteAndRegenerateInstances(task, fromDate, count = 3) {
        if (!task || !task.isRecurringParent()) {
            throw new Error('Valid recurring parent task is required');
        }

        const mongoose = require('mongoose');
        const Task = require('../models/task');

        // Start a transaction for atomic operation
        const session = await mongoose.startSession();
        
        try {
            await session.withTransaction(async () => {
                // Delete existing future instances
                const deleteResult = await Task.deleteMany({
                    parentRecurringId: task.taskId,
                    userId: task.userId,
                    dueDate: { $gte: fromDate }
                }, { session });

                // Generate new instances
                const futureDates = this.calculateFutureDates(task.dueDate, task.repeatType, count);
                const newInstances = [];

                for (const futureDate of futureDates) {
                    const instanceData = {
                        userId: task.userId,
                        parentId: task.parentId,
                        links: [...(task.links || [])],
                        additionalDetails: task.additionalDetails,
                        title: task.title,
                        description: task.description,
                        dueDate: futureDate,
                        priority: task.priority,
                        category: task.category,
                        isCompleted: false,
                        repeatType: 'none',
                        parentRecurringId: task.taskId
                    };

                    const taskInstance = new Task(instanceData);
                    await taskInstance.save({ session });
                    newInstances.push(taskInstance);
                }

                return {
                    deletedCount: deleteResult.deletedCount,
                    generatedCount: newInstances.length,
                    newInstances
                };
            });

            // If we get here, the transaction was successful
            const result = await Task.find({
                parentRecurringId: task.taskId,
                userId: task.userId,
                dueDate: { $gte: fromDate }
            }).sort({ dueDate: 1 });

            return {
                deletedCount: 0, // This would be set by the transaction
                generatedCount: result.length,
                message: `Successfully regenerated ${result.length} recurring instances`,
                newInstances: result.map(instance => ({
                    taskId: instance.taskId,
                    dueDate: instance.dueDate
                }))
            };

        } catch (error) {
            throw new Error(`Failed to delete and regenerate instances: ${error.message}`);
        } finally {
            await session.endSession();
        }
    }
}

module.exports = RecurringTaskService;