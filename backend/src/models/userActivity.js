const mongoose = require('mongoose');
const CounterService = require('../services/counterService');

const userActivitySchema = new mongoose.Schema({
    activityId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
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
// activityId index is defined in schema field

// Pre-save middleware to assign activityId
userActivitySchema.pre('save', async function(next) {
    try {
        // Assign activityId for new documents
        if (this.isNew && !this.activityId) {
            this.activityId = await CounterService.getNextSequence('useractivities');
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

module.exports = UserActivity;