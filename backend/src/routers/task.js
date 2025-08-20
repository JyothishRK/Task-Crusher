const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const { buildTaskFilters, buildSortCriteria, buildPaginationOptions } = require('../utils/taskQueryUtils');

const router = new express.Router();

// Create a new task
router.post("/tasks", auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        userId: req.user.userId || req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
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

        updates.forEach((update) => {
            task[update] = req.body[update];
        });

        await task.save();
        res.send(task);
    } catch (e) {
        res.status(400).send(e);
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

module.exports = router;