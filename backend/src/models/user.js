const mongoose = require('mongoose')
const validater = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('../models/task')
const { getNextSequence } = require('../utils/counterUtils')

const userSchema = new mongoose.Schema({
    userId: {
        type: Number,
        unique: true
    },
    name : {
        type: String,
        required : true,
        trim : true,
    },
    password :{
        type : String,
        required : true,
        trim: true,
        minlength: 7,
        validate(value) {
            if(value.toLowerCase().includes('password')) {
                throw new Error("Password cannot Contain 'password'");
            }
        }
    },
    email : {
        type : String,
        required : true,
        trim: true,
        lowercase : true,
        unique: true,
        validate(value) {
            if(!validater.isEmail(value)) {
                throw new Error("Invalid Email");
            }
        }
    },
    age : {
        type : Number,
        default : 0,
        validate(value) {
            if(value < 0) {
                throw new Error("Age must be non negative number");
            }
        }
    },
    emailEnabled: {
        type: Boolean,
        default: true
    },
    notificationTime: {
        type: String,
        default: "09:00",
        validate(value) {
            // Validate time format HH:MM (24-hour format)
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(value)) {
                throw new Error("Time must be in HH:MM format (24-hour)");
            }
        }
    },
    tokens: [{
        token : {
            type : String,
            required: true,
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps : true,
})

// Index for better query performance
userSchema.index({ userId: 1 });
userSchema.index({ email: 1 });

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: 'userId',
    foreignField: 'userId'
});

userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({userId: user.userId, _id: user._id.toString()}, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({token})
    await user.save()   
    return token
}

//Login Process
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if(!user) {
        throw new Error("Unable to Login")
    }
    const verify = await bcrypt.compare(password, user.password)
    if(!verify) {
        throw new Error("Unable to Login")
    }
    return user
}

//Find user by numeric userId
userSchema.statics.findByUserId = async (userId) => {
    const user = await User.findOne({ userId })
    if(!user) {
        throw new Error("User not found")
    }
    return user
}

//Generate userId and Password Hashing
userSchema.pre('save', async function(next) {
    const user = this

    // Generate userId for new users
    if(user.isNew && !user.userId) {
        try {
            user.userId = await getNextSequence('userId');
        } catch (error) {
            return next(new Error(`Failed to generate userId: ${error.message}`));
        }
    }

    // Hash password if modified
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next()
})

//User Deletion -> All corresponding task deletion
userSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const user = this
    await Task.deleteMany({userId: user.userId})
    next()
})

// Also handle findOneAndDelete
userSchema.pre('findOneAndDelete', async function (next) {
    const user = await this.model.findOne(this.getQuery())
    if (user) {
        await Task.deleteMany({userId: user.userId})
    }
    next()
})

const User = mongoose.model('User', userSchema);

module.exports = User;