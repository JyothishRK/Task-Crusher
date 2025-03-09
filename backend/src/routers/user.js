const express = require('express');
const User = require('../models/user')
const router = new express.Router();
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendAccountDeletionEmail } = require('../emails/account')

router.post("/users", async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send(user)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch (e) {
        res.status(400).send()
    }
})

router.post("/users/logout", auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.status(201).send(req.user)
    } catch(e) {
        res.status(500).send({error: "something went wrong"})
    }
})

router.post("/users/logoutall", auth, async(req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.status(201).send(req.user)
    } catch(e) {
        res.status(500).send({error: "something went wrong"})
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(png|jpeg|jpg)$/)) {
            return cb(new Error("Please Upload an Image"))
        }
        cb(undefined, true)
    }
})

router.post("/users/me/avatar", auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete("/users/me/avatar", auth, async (req, res) => {
        req.user.avatar = undefined
        await req.user.save()
        res.send();
})

router.get("/users/:id/avatar", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-Type', 'image/jpg')
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send()
    }
})

router.get("/users/me", auth, async (req, res) => {
    res.send(req.user)
})

router.patch("/users/me", auth, async (req, res) => {
    const _id = req.user._id
    const changes = req.body

    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation) {
        return res.status(400).send('error : Invalid Update Operation');
    }

    try {
        // const user = await User.findByIdAndUpdate(_id, changes, {new: true, runValidators: true})
        updates.forEach((update) => {
            req.user[update] = changes[update];
        })
        await req.user.save()
        res.status(201).send(req.user)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.delete("/users/me", auth, async (req, res) => {
    try {
        console.log(req.user)
        const user = await User.deleteOne({ _id: req.user._id })
        sendAccountDeletionEmail(req.user.email, req.user.name)
        res.send(req.user); 
    } catch(e) {
        res.status(500).send();
    }
})


module.exports = router;