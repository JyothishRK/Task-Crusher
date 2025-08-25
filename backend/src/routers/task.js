const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const { buildTaskFilters, buildSortCriteria, buildPaginationOptions } = require('../utils/taskQueryUtils');

const router = new express.Router();

// Create a new task
router.post("/tasks", auth, async (req, res) => {
    try {
        // Additional validation for subtasks with repeat types
        if (req.body.parentId && req.body.repeatType && req.body.repeatType !== 'none') {
            return res.status(400).send({ 
                error: 'Subtasks cannot have repeat types',
                code: 'SUBTASK_REPEAT_VIOLATION'
            });
        }

        const task = new Task({
            ...req.body,
            userId: req.user.userId || req.user._id
        });

        await task.save();
        
        // Generate recurring instances if this is a recurring task
        let generatedInstances = [];
        let response = {
            task: task,
            recurringInstancesGenerated: 0
        };

        if (task.repeatType && task.repeatType !== 'none' && !task.isSubtask()) {
            try {
                const RecurringTaskService = require('../services/recurringTaskService');
                generatedInstances = await RecurringTaskService.generateInstances(task, 3);
                response.recurringInstancesGenerated = generatedInstances.length;
                response.message = `Task created successfully with ${generatedInstances.length} recurring instances generated`;
                
                // Include the generated instances in the response for debugging/verification
                if (process.env.NODE_ENV === 'development') {
                    response.generatedInstances = generatedInstances.map(instance => ({
                        taskId: instance.taskId,
                        title: instance.title,
                        dueDate: instance.dueDate,
                        parentRecurringId: instance.parentRecurringId
                    }));
                }
            } catch (recurringError) {
                // If recurring instance generation fails, log the error but don't fail the task creation
                const { logRecurringTaskError } = require('../utils/logger');
                logRecurringTaskError('creation', 'Failed to generate recurring instances during task creation', {
                    parentTaskId: task.taskId,
                    repeatType: task.repeatType,
                    error: recurringError.message,
                    stack: recurringError.stack
                });
                
                response.warning = 'Task created successfully, but failed to generate recurring instances';
                response.recurringError = recurringError.message;
            }
        } else {
            response.message = 'Task created successfully';
        }

        res.status(201).send(response);
    } catch (e) {
        // Enhanced error handling
        if (e.message && e.message.includes('Subtasks cannot have repeat types')) {
            return res.status(400).send({ 
                error: 'Subtasks cannot have repeat types',
                code: 'SUBTASK_REPEAT_VIOLATION'
            });
        }
        
        res.status(400).send({ 
            error: e.message || 'Failed to create task',
            details: e
        });
    }
});

// Get all top-level tasks for the authenticated user with filtering, pagination, and sorting
// GET: /tasks?completed=true&priority=high&category=work&limit=10&skip=0&sortBy=dueDate:asc
router.get("/tasks", auth, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;
        // Only return top-level tasks (parentId is null)
        const match = buildTaskFilters(req.query, { userId, parentId: null });
        const sort = buildSortCriteria(req.query.sortBy);
        const { limit, skip } = buildPaginationOptions(req.query);

        const tasks = await Task.find(match)
            .sort(sort)
            .limit(limit)
            .skip(skip);

        res.send(tasks);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get a specific task by ID
router.get("/tasks/:id", auth, async (req, res) => {
    try {
        // Try to find by numeric taskId first, then fallback to ObjectId
        let task;
        const id = req.params.id;
        const userId = req.user.userId || req.user._id;
        
        if (!isNaN(id)) {
            // If id is numeric, search by taskId
            task = await Task.findOne({ taskId: parseInt(id), userId });
        }
        
        if (!task) {
            // Fallback to ObjectId search for backward compatibility
            task = await Task.findOne({ _id: id, userId });
        }

        if (!task) {
            return res.status(404).send({ error: 'Task not found' });
        }

        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Update a task
router.patch("/tasks/:id", auth, async (req, res) => {
    const allowedUpdates = ['title', 'description', 'dueDate', 'priority', 'category', 'isCompleted', 'repeatType', 'links', 'additionalDetails', 'parentId'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Update Operation' });
    }

    try {
        // Try to find by numeric taskId first, then fallback to ObjectId
        let task;
        const id = req.params.id;
        const userId = req.user.userId || req.user._id;
        
        if (!isNaN(id)) {
            // If id is numeric, search by taskId
            task = await Task.findOne({ taskId: parseInt(id), userId });
        }
        
        if (!task) {
            // Fallback to ObjectId search for backward compatibility
            task = await Task.findOne({ _id: id, userId });
        }

        if (!task) {
            return res.status(404).send({ error: 'Task not found' });
        }

        // Additional validation for subtasks with repeat types
        if (req.body.parentId && req.body.repeatType && req.body.repeatType !== 'none') {
            return res.status(400).send({ 
                error: 'Subtasks cannot have repeat types',
                code: 'SUBTASK_REPEAT_VIOLATION'
            });
        }

        // Check if this is a recurring task edit that requires special handling
        const isDueDateChange = updates.includes('dueDate') && task.isRecurringParent();
        const isRepeatTypeChange = updates.includes('repeatType') && task.isRecurringParent();
        
        let recurringResult = null;

        // Handle recurring task changes
        if (isDueDateChange || isRepeatTypeChange) {
            const RecurringTaskService = require('../services/recurringTaskService');
            
            try {
                if (isDueDateChange && isRepeatTypeChange) {
                    // Both due date and repeat type are changing
                    // First handle repeat type change, then due date
                    const repeatResult = await RecurringTaskService.handleRepeatTypeChange(task, req.body.repeatType);
                    
                    // Update the task with new due date
                    task.dueDate = new Date(req.body.dueDate);
                    
                    // If the new repeat type is not 'none', regenerate with new due date
                    if (req.body.repeatType !== 'none') {
                        const dueDateResult = await RecurringTaskService.handleDueDateChange(task, new Date(req.body.dueDate));
                        recurringResult = {
                            ...repeatResult,
                            dueDateChange: dueDateResult,
                            message: `Updated repeat type and due date. ${repeatResult.message}. ${dueDateResult.message}`
                        };
                    } else {
                        recurringResult = repeatResult;
                    }
                } else if (isDueDateChange) {
                    // Only due date is changing
                    recurringResult = await RecurringTaskService.handleDueDateChange(task, new Date(req.body.dueDate));
                } else if (isRepeatTypeChange) {
                    // Only repeat type is changing
                    recurringResult = await RecurringTaskService.handleRepeatTypeChange(task, req.body.repeatType);
                }
            } catch (recurringError) {
                const { logRecurringTaskError } = require('../utils/logger');
                logRecurringTaskError('update', 'Recurring task update failed', {
                    taskId: task.taskId,
                    updates: updates,
                    error: recurringError.message,
                    stack: recurringError.stack
                });
                
                return res.status(400).send({
                    error: 'Failed to update recurring task',
                    details: recurringError.message
                });
            }
        } else {
            // Regular task update - apply all changes
            updates.forEach((update) => {
                task[update] = req.body[update];
            });
            await task.save();
        }

        // Prepare response
        let response = {
            task: task,
            message: 'Task updated successfully'
        };

        // Include recurring task update information if applicable
        if (recurringResult) {
            response.recurringUpdate = {
                deletedInstances: recurringResult.deletedCount || 0,
                generatedInstances: recurringResult.generatedCount || 0,
                message: recurringResult.message
            };
            
            // Include new instances in development mode
            if (process.env.NODE_ENV === 'development' && recurringResult.newInstances) {
                response.recurringUpdate.newInstances = recurringResult.newInstances;
            }
            
            response.message = `Task updated successfully. ${recurringResult.message}`;
        }

        res.send(response);
    } catch (e) {
        // Enhanced error handling
        if (e.message && e.message.includes('Subtasks cannot have repeat types')) {
            return res.status(400).send({ 
                error: 'Subtasks cannot have repeat types',
                code: 'SUBTASK_REPEAT_VIOLATION'
            });
        }
        
        res.status(400).send({ 
            error: e.message || 'Failed to update task',
            details: e
        });
    }
});

// Delete a task
router.delete("/tasks/:id", auth, async (req, res) => {
    try {
        // Try to find and delete by numeric taskId first, then fallback to ObjectId
        let task;
        const id = req.params.id;
        const userId = req.user.userId || req.user._id;
        
        if (!isNaN(id)) {
            // If id is numeric, search by taskId
            task = await Task.findOneAndDelete({ taskId: parseInt(id), userId });
        }
        
        if (!task) {
            // Fallback to ObjectId search for backward compatibility
            task = await Task.findOneAndDelete({ _id: id, userId });
        }

        if (!task) {
            return res.status(404).send({ error: 'Task not found' });
        }

        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get tasks by priority
router.get("/tasks/priority/:priority", auth, async (req, res) => {
    try {
        const tasks = await Task.find({
            userId: req.user.userId || req.user._id,
            priority: req.params.priority
        }).sort({ dueDate: 1 });

        res.send(tasks);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get tasks by category
router.get("/tasks/category/:category", auth, async (req, res) => {
    try {
        const tasks = await Task.find({
            userId: req.user.userId || req.user._id,
            category: req.params.category
        }).sort({ dueDate: 1 });

        res.send(tasks);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get overdue tasks
router.get("/tasks/overdue", auth, async (req, res) => {
    try {
        const tasks = await Task.find({
            userId: req.user.userId || req.user._id,
            isCompleted: false,
            dueDate: { $lt: new Date() }
        }).sort({ dueDate: 1 });

        res.send(tasks);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get today's tasks
router.get("/tasks/today", auth, async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const tasks = await Task.find({
            userId: req.user.userId || req.user._id,
            dueDate: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        }).sort({ priority: -1, dueDate: 1 });

        res.send(tasks);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get subtasks for a specific parent task
// GET: /tasks/:taskId/subtasks?completed=true&priority=high&category=work&limit=10&skip=0&sortBy=dueDate:asc
router.get("/tasks/:taskId/subtasks", auth, async (req, res) => {
    try {
        const taskId = parseInt(req.params.taskId);
        const userId = req.user.userId || req.user._id;

        // Validate taskId parameter
        if (isNaN(taskId)) {
            return res.status(400).send({ error: 'Invalid taskId parameter' });
        }

        // Verify parent task exists and belongs to the user
        const parentTask = await Task.findOne({ taskId, userId });
        if (!parentTask) {
            return res.status(404).send({ error: 'Parent task not found' });
        }

        // Build query for subtasks
        const match = buildTaskFilters(req.query, { userId, parentId: taskId });
        const sort = buildSortCriteria(req.query.sortBy);
        const { limit, skip } = buildPaginationOptions(req.query);

        const subtasks = await Task.find(match)
            .sort(sort)
            .limit(limit)
            .skip(skip);

        res.send(subtasks);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get recurring instances of a specific task
// GET: /tasks/:id/recurring?future=true&limit=10&skip=0&sortBy=dueDate:asc
router.get("/tasks/:id/recurring", auth, async (req, res) => {
    try {
        // Try to find by numeric taskId first, then fallback to ObjectId
        let task;
        const id = req.params.id;
        const userId = req.user.userId || req.user._id;
        
        if (!isNaN(id)) {
            // If id is numeric, search by taskId
            task = await Task.findOne({ taskId: parseInt(id), userId });
        }
        
        if (!task) {
            // Fallback to ObjectId search for backward compatibility
            task = await Task.findOne({ _id: id, userId });
        }

        if (!task) {
            return res.status(404).send({ error: 'Task not found' });
        }

        let instances = [];
        let parentTaskId;
        let parentTask = null;

        if (task.isRecurringParent()) {
            // This is a parent recurring task - get its instances
            parentTaskId = task.taskId;
            parentTask = task;
            instances = await task.getRecurringInstances();
        } else if (task.isRecurringInstance()) {
            // This is a recurring instance - get all instances of its parent
            parentTaskId = task.parentRecurringId;
            parentTask = await Task.findOne({ taskId: parentTaskId, userId });
            if (parentTask) {
                instances = await parentTask.getRecurringInstances();
            }
        } else {
            return res.status(400).send({ 
                error: 'Task is not part of a recurring series',
                code: 'NOT_RECURRING_TASK'
            });
        }

        // Apply filters
        if (req.query.future === 'true') {
            const currentDate = new Date();
            instances = instances.filter(instance => instance.dueDate >= currentDate);
        }

        if (req.query.completed !== undefined) {
            const isCompleted = req.query.completed === 'true';
            instances = instances.filter(instance => instance.isCompleted === isCompleted);
        }

        if (req.query.priority) {
            instances = instances.filter(instance => instance.priority === req.query.priority);
        }

        if (req.query.category) {
            instances = instances.filter(instance => instance.category === req.query.category);
        }

        // Apply sorting
        if (req.query.sortBy) {
            const [field, order] = req.query.sortBy.split(':');
            const sortOrder = order === 'desc' ? -1 : 1;
            
            instances.sort((a, b) => {
                let aVal = a[field];
                let bVal = b[field];
                
                // Handle date fields
                if (field === 'dueDate' || field === 'createdAt') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }
                
                // Handle string fields
                if (typeof aVal === 'string') {
                    return aVal.localeCompare(bVal) * sortOrder;
                }
                
                // Handle numeric and date fields
                if (aVal < bVal) return -1 * sortOrder;
                if (aVal > bVal) return 1 * sortOrder;
                return 0;
            });
        } else {
            // Default sort by due date ascending
            instances.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        }

        // Apply pagination
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 50; // Default limit of 50
        const totalInstances = instances.length;
        instances = instances.slice(skip, skip + limit);

        const response = {
            parentTaskId,
            parentTask: parentTask ? {
                taskId: parentTask.taskId,
                title: parentTask.title,
                description: parentTask.description,
                dueDate: parentTask.dueDate,
                priority: parentTask.priority,
                category: parentTask.category,
                repeatType: parentTask.repeatType,
                isCompleted: parentTask.isCompleted
            } : null,
            totalInstances,
            returnedInstances: instances.length,
            skip,
            limit,
            filters: {
                future: req.query.future === 'true',
                completed: req.query.completed,
                priority: req.query.priority,
                category: req.query.category
            },
            instances: instances.map(instance => ({
                taskId: instance.taskId,
                title: instance.title,
                description: instance.description,
                dueDate: instance.dueDate,
                priority: instance.priority,
                category: instance.category,
                isCompleted: instance.isCompleted,
                parentRecurringId: instance.parentRecurringId,
                createdAt: instance.createdAt,
                updatedAt: instance.updatedAt
            }))
        };

        res.send(response);
    } catch (e) {
        res.status(500).send({ 
            error: e.message || 'Failed to get recurring instances',
            details: e
        });
    }
});

module.exports = router;