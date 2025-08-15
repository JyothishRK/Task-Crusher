const mongoose = require('mongoose');
const CounterService = require('../services/counterService');

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
    originalDueDate: {
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
    },
    taskId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    parentTaskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null,
        validate: {
            validator: async function(value) {
                if (!value) return true;
                // Prevent self-reference
                if (value.equals(this._id)) return false;
                // Check if parent exists and belongs to same user
                const parent = await this.constructor.findById(value);
                return parent && parent.userId.equals(this.userId);
            },
            message: 'Parent task must exist and belong to the same user'
        }
    },
    parentRecurringId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null
    },
    links: [{
        type: String,
        trim: true,
        validate: {
            validator: function(url) {
                return /^https?:\/\/.+/.test(url);
            },
            message: 'Links must be valid URLs'
        }
    }],
    additionalNotes: {
        type: String,
        trim: true,
        default: '',
        maxlength: 2000
    }
}, {
    timestamps: true
});

// Index for better query performance
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, isCompleted: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ userId: 1, category: 1 });
taskSchema.index({ parentTaskId: 1 }); // New: for sub-task queries
taskSchema.index({ parentRecurringId: 1 }); // New: for recurring task cleanup
// taskId index is defined in schema field
taskSchema.index({ userId: 1, repeatType: 1 }); // New: for recurring task queries

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

// Pre-save middleware to assign taskId, validate constraints, and handle repeat logic
taskSchema.pre('save', async function(next) {
    try {
        // Assign taskId for new documents
        if (this.isNew && !this.taskId) {
            this.taskId = await CounterService.getNextSequence('tasks');
        }

        // Set originalDueDate for new documents
        if (this.isNew && !this.originalDueDate) {
            this.originalDueDate = this.dueDate;
        }

        // Prevent repeatType changes on existing tasks
        if (!this.isNew && this.isModified('repeatType')) {
            throw new Error('Cannot change repeatType on existing tasks');
        }

        // Sub-task validation rules
        if (this.parentTaskId) {
            // Sub-tasks must have repeatType = "none"
            if (this.repeatType !== 'none') {
                throw new Error('Sub-tasks cannot have a repeatType other than "none"');
            }

            // Get parent task to validate due date constraint
            const parentTask = await this.constructor.findById(this.parentTaskId);
            if (parentTask) {
                // Sub-task dueDate must be same or before parent task dueDate
                if (this.dueDate > parentTask.dueDate) {
                    throw new Error('Sub-task due date must be same or before parent task due date');
                }
            }
        }

        // If task is completed and has repeat type, create next occurrence
        if (this.isCompleted && this.repeatType !== 'none') {
            // This could be expanded to create recurring tasks
            // For now, we'll just mark it as completed
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;