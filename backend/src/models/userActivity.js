const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true,
        ref: 'User'
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    taskId: {
        type: Number,
        ref: 'Task',
        required: false
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    error: {
        type: String,
        required: false,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false
});

// Compound indexes for query optimization
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ userId: 1, action: 1 });
userActivitySchema.index({ userId: 1, action: 1, timestamp: -1 });
userActivitySchema.index({ taskId: 1 });

// Static methods for common queries
userActivitySchema.statics.findByUserId = async function(userId, limit = 50) {
    return await this.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit);
};

userActivitySchema.statics.findByTaskId = async function(taskId, limit = 50) {
    return await this.find({ taskId })
        .sort({ timestamp: -1 })
        .limit(limit);
};

userActivitySchema.statics.findByAction = async function(userId, action, limit = 50) {
    return await this.find({ userId, action })
        .sort({ timestamp: -1 })
        .limit(limit);
};

userActivitySchema.statics.createActivity = async function(userId, action, message, taskId = null, error = null) {
    const activity = new this({
        userId,
        action,
        message,
        taskId,
        error
    });
    return await activity.save();
};

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

module.exports = UserActivity;