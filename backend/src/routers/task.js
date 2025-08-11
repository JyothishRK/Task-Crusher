const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

// Create a new task
router.post("/tasks", auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        userId: req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Get all tasks for the authenticated user with filtering, pagination, and sorting
// GET: /tasks?completed=true&priority=high&category=work&limit=10&skip=0&sortBy=dueDate:asc
router.get("/tasks", auth, async (req, res) => {
    const match = {};
    const sort = {};

    // Filter by completion status
    if (req.query.completed !== undefined) {
        match.isCompleted = req.query.completed === "true";
    }

    // Filter by priority
    if (req.query.priority) {
        match.priority = req.query.priority;
    }

    // Filter by category
    if (req.query.category) {
        match.category = req.query.category;
    }

    // Sort options
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(":");
        sort[parts[0]] = (parts[1] === 'desc') ? -1 : 1;
    } else {
        // Default sort by due date ascending
        sort.dueDate = 1;
    }

    try {
        const tasks = await Task.find({
            userId: req.user._id,
            ...match
        }).sort(sort)
        .limit(parseInt(req.query.limit) || 10)
        .skip(parseInt(req.query.skip) || 0);

        res.send(tasks);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get a specific task by ID
router.get("/tasks/:id", auth, async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

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
    const allowedUpdates = ['title', 'description', 'dueDate', 'priority', 'category', 'isCompleted', 'repeatType'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Update Operation' });
    }

    try {
        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

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
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

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
            userId: req.user._id,
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
            userId: req.user._id,
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
            userId: req.user._id,
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
            userId: req.user._id,
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

module.exports = router;