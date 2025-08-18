const express = require('express');
const User = require('../models/user')
const router = new express.Router();
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendAccountDeletionEmail } = require('../emails/account')
const { setAuthCookie, clearAuthCookie } = require('../utils/tokenUtils')
const { logAuthError, logAuthInfo, logSecurityEvent } = require('../utils/logger')

router.post("/users", async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        
        // Log successful user creation (without sensitive data)
        logAuthInfo('New user created', { 
            userId: user.userId ? user.userId.toString() : user._id.toString(),
            numericUserId: user.userId,
            email: user.email 
        });
        
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        
        // Set authentication cookie instead of returning token in response
        setAuthCookie(res, token)
        
        // Return only user information, no token
        res.status(201).send({user})
    } catch(e) {
        // Log signup failure (without sensitive data)
        logAuthError('User signup failed', { 
            error: e.message,
            email: req.body?.email 
        });
        
        // Ensure no cookie is set on failure
        res.status(400).send(e)
    }
})

router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        
        // Log successful login
        logAuthInfo('User login successful', { 
            userId: user.userId ? user.userId.toString() : user._id.toString(),
            numericUserId: user.userId,
            email: user.email 
        });
        
        // Set authentication cookie instead of returning token in response
        setAuthCookie(res, token)
        
        // Return only user information, no token
        res.send({user})
    } catch (e) {
        // Log login failure
        logAuthError('User login failed', { 
            error: e.message,
            email: req.body?.email 
        });
        
        // Log potential security event for failed login attempts
        logSecurityEvent('Failed login attempt', { 
            email: req.body?.email,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent')
        });
        
        // Ensure no cookie is set on failure
        res.status(400).send()
    }
})

router.post("/users/logout", auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        
        // Log successful logout
        logAuthInfo('User logout successful', { 
            userId: req.user.userId ? req.user.userId.toString() : req.user._id.toString(),
            numericUserId: req.user.userId
        });
        
        // Clear authentication cookie
        clearAuthCookie(res)
        
        res.status(201).send(req.user)
    } catch(e) {
        // Log logout error
        logAuthError('User logout failed', { 
            error: e.message,
            userId: req.user?.userId ? req.user.userId.toString() : req.user?._id?.toString(),
            numericUserId: req.user?.userId
        });
        
        res.status(500).send({error: "something went wrong"})
    }
})

router.post("/users/logoutall", auth, async(req, res) => {
    try {
        const tokenCount = req.user.tokens.length;
        req.user.tokens = []
        await req.user.save()
        
        // Log successful logout from all devices
        logAuthInfo('User logout from all devices successful', { 
            userId: req.user.userId ? req.user.userId.toString() : req.user._id.toString(),
            numericUserId: req.user.userId,
            tokensCleared: tokenCount 
        });
        
        // Clear authentication cookie
        clearAuthCookie(res)
        
        res.status(201).send(req.user)
    } catch(e) {
        // Log logout all error
        logAuthError('User logout from all devices failed', { 
            error: e.message,
            userId: req.user?.userId ? req.user.userId.toString() : req.user?._id?.toString(),
            numericUserId: req.user?.userId
        });
        
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
        // Try to find by numeric userId first, then fallback to ObjectId
        let user;
        const id = req.params.id;
        
        if (!isNaN(id)) {
            // If id is numeric, search by userId
            user = await User.findOne({ userId: parseInt(id) });
        }
        
        if (!user) {
            // Fallback to ObjectId search for backward compatibility
            user = await User.findById(id);
        }
        
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
    const allowedUpdates = ['name', 'email', 'password', 'age', 'emailEnabled', 'notificationTime']
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
        // Use the document's deleteOne method to trigger middleware
        await req.user.deleteOne();
        sendAccountDeletionEmail(req.user.email, req.user.name)
        res.send(req.user); 
    } catch(e) {
        res.status(500).send();
    }
})


module.exports = router;