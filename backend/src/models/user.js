const mongoose = require('mongoose')
const validater = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('../models/task')

const userSchema = new mongoose.Schema({
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

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
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
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)
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

//Password Hashing
userSchema.pre('save', async function(next) {
    const user = this

    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next()
})

//User Deletion -> All correspnding task deletion
userSchema.pre('deleteOne', async function (next) {
    const user = this
    await Task.deleteMany({owner: user._id})
    next()
})

const User = mongoose.model('User', userSchema);

module.exports = User;