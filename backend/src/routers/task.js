const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()


router.post("/tasks", auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner : req.user._id
    })

    try {
        await task.save()
        res.send(task);
    } catch(e) {
        res.status(500).send(e);
    }
})

//GET: /tasks?completed=true
//GET: /tasks?limit=10&skip=0
//GET: /task?sortBy=createdAt:asc,createdAt:desc
router.get("/tasks", auth, async (req, res) => {
    const match = {}
    const sort = {}
    if(req.query.completed) {
        match.completed = req.query.completed == "true"
    }
    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(":")
        // console.log("", parts)
        sort[parts[0]] = (parts[1] === 'desc') ? -1 : 1
    }
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit) || 5,
                skip: parseInt(req.query.skip) || 0,
                sort
            }
        });
        res.send(req.user.tasks);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.get("/tasks/:id", auth, async (req, res) => {
    try {
        const task = await Task.findById(_id)
    } catch(e) {
        res.status(500).send(e);
    }
})

router.patch("/tasks/:id", auth, async (req, res) => {


    const allowedUpdates = ['description', 'completed']
    const updates = Object.keys(req.body)
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation) {
        return res.status(400).send('Invalid Update Operation');
    }

    try {
        const task = await Task.findOne({_id: req.params._id, owner : req.user._id})
        // const task = await Task.findByIdAndUpdate(_id, changes, {new: true, runValidators: true})
        if(!task) {
            res.status(404).send('Data with ID not found');
        }
        updates.forEach((update) => {
            task[update] = changes[update]
        })
        await task.save()
        res.send(task)
    } catch(e) {
        res.status(400).send('Something went wrong');
    }
})

router.delete("/tasks/:id", auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id : req.params._id, owner: req.user._id})
        if(!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch(e) {
        res.status(500).send();
    }
})


module.exports = router