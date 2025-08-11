const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    dueDate: {
        type: Date,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    category: {
        type: String,
        trim: true,
        default: ''
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    repeatType: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'none'
    }
}, {
    timestamps: true
});

// Index for better query performance
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, isCompleted: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ userId: 1, category: 1 });

// Virtual for formatted due date
taskSchema.virtual('dueDateFormatted').get(function() {
    return this.dueDate ? this.dueDate.toISOString() : null;
});

// Method to check if task is overdue
taskSchema.methods.isOverdue = function() {
    if (this.isCompleted) return false;
    return this.dueDate < new Date();
};

// Method to get days until due
taskSchema.methods.daysUntilDue = function() {
    if (this.isCompleted) return 0;
    const now = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Pre-save middleware to handle repeat logic
taskSchema.pre('save', function(next) {
    // If task is completed and has repeat type, create next occurrence
    if (this.isCompleted && this.repeatType !== 'none') {
        // This could be expanded to create recurring tasks
        // For now, we'll just mark it as completed
    }
    next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;