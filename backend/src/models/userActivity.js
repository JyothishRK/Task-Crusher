const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    action: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
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
        default: Date.now,
        index: true
    }
}, {
    versionKey: false
});

// Compound indexes for query optimization
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ userId: 1, action: 1 });
userActivitySchema.index({ userId: 1, action: 1, timestamp: -1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

module.exports = UserActivity;