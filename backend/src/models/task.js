const mongoose = require('mongoose');
const { getNextSequence } = require('../utils/counterUtils');

const taskSchema = new mongoose.Schema({
    taskId: {
        type: Number,
        unique: true
    },
    userId: {
        type: Number,
        required: true,
        ref: 'User'
    },
    parentId: {
        type: Number,
        ref: 'Task',
        default: null
    },
    links: [{
        type: String,
        trim: true
    }],
    additionalDetails: {
        type: String,
        trim: true,
        default: ''
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
    },
    parentRecurringId: {
        type: Number,
        ref: 'Task',
        default: null
    }
}, {
    timestamps: true
});

// Index for better query performance
taskSchema.index({ taskId: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, isCompleted: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ userId: 1, category: 1 });
taskSchema.index({ parentId: 1 });
taskSchema.index({ userId: 1, parentId: 1 });

// New indexes for recurring task functionality
taskSchema.index({ parentRecurringId: 1, dueDate: 1 }); // For recurring instance queries
taskSchema.index({ userId: 1, parentRecurringId: 1 }); // For user's recurring tasks
taskSchema.index({ repeatType: 1, parentRecurringId: 1 }); // For cron job queries

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

// Method to check if task is a subtask
taskSchema.methods.isSubtask = function() {
    return this.parentId !== null && this.parentId !== undefined;
};

// Method to get parent task
taskSchema.methods.getParent = async function() {
    if (!this.isSubtask()) return null;
    const Task = mongoose.model('Task');
    return await Task.findOne({ taskId: this.parentId });
};

// Method to get all subtasks
taskSchema.methods.getSubtasks = async function() {
    const Task = mongoose.model('Task');
    return await Task.find({ parentId: this.taskId, userId: this.userId });
};

// Method to check if task is a recurring parent (original recurring task)
taskSchema.methods.isRecurringParent = function() {
    return this.repeatType !== 'none' && (this.parentRecurringId === null || this.parentRecurringId === undefined);
};

// Method to check if task is a recurring instance (generated from parent)
taskSchema.methods.isRecurringInstance = function() {
    return this.parentRecurringId !== null && this.parentRecurringId !== undefined;
};

// Method to get all recurring instances of this task
taskSchema.methods.getRecurringInstances = async function() {
    if (!this.isRecurringParent()) return [];
    const Task = mongoose.model('Task');
    return await Task.find({ 
        parentRecurringId: this.taskId, 
        userId: this.userId 
    }).sort({ dueDate: 1 });
};

// Method to get future recurring instances from a specific date
taskSchema.methods.getFutureRecurringInstances = async function(fromDate = new Date()) {
    if (!this.isRecurringParent()) return [];
    const Task = mongoose.model('Task');
    return await Task.find({ 
        parentRecurringId: this.taskId, 
        userId: this.userId,
        dueDate: { $gte: fromDate }
    }).sort({ dueDate: 1 });
};

// Method to delete recurring instances from a specific date
taskSchema.methods.deleteRecurringInstances = async function(fromDate = new Date()) {
    if (!this.isRecurringParent()) return 0;
    const Task = mongoose.model('Task');
    const result = await Task.deleteMany({ 
        parentRecurringId: this.taskId, 
        userId: this.userId,
        dueDate: { $gte: fromDate }
    });
    return result.deletedCount;
};

// Static method to find task by taskId
taskSchema.statics.findByTaskId = async function(taskId) {
    const task = await this.findOne({ taskId });
    if (!task) {
        throw new Error('Task not found');
    }
    return task;
};

// Static method to generate recurring instances
taskSchema.statics.generateRecurringInstances = async function(parentTask, count = 3) {
    // Avoid circular dependency by calling the service method directly
    if (!parentTask || !parentTask.repeatType || parentTask.repeatType === 'none') {
        return [];
    }
    
    const RecurringTaskService = require('../services/recurringTaskService');
    return await RecurringTaskService.generateInstances(parentTask, count);
};

// Static method to cleanup recurring instances
taskSchema.statics.cleanupRecurringInstances = async function(parentTaskId, fromDate, userId) {
    const result = await this.deleteMany({ 
        parentRecurringId: parentTaskId, 
        userId: userId,
        dueDate: { $gte: fromDate }
    });
    return result.deletedCount;
};

// Pre-save middleware to generate taskId and validate parentId
taskSchema.pre('save', async function(next) {
    const task = this;

    // Generate taskId for new tasks
    if (task.isNew && !task.taskId) {
        try {
            task.taskId = await getNextSequence('taskId');
        } catch (error) {
            return next(new Error(`Failed to generate taskId: ${error.message}`));
        }
    }

    // Validate parentId if provided
    if (task.parentId !== null && task.parentId !== undefined) {
        try {
            const Task = mongoose.model('Task');
            const parentTask = await Task.findOne({ taskId: task.parentId });
            
            if (!parentTask) {
                return next(new Error('Parent task not found'));
            }
            
            if (parentTask.userId !== task.userId) {
                return next(new Error('Parent task must belong to the same user'));
            }
            
            // Prevent circular references (check if parent is already a child of this task)
            if (parentTask.parentId === task.taskId) {
                return next(new Error('Circular parent-child relationship not allowed'));
            }
            
            // For existing tasks, prevent making a parent task a child of its descendant
            if (task.taskId) {
                const descendants = await Task.find({ parentId: task.taskId, userId: task.userId });
                const descendantIds = descendants.map(d => d.taskId);
                if (descendantIds.includes(task.parentId)) {
                    return next(new Error('Cannot make parent task a child of its descendant'));
                }
            }
        } catch (error) {
            return next(new Error(`Parent validation failed: ${error.message}`));
        }
    }

    // Validate parentRecurringId if provided
    if (task.parentRecurringId !== null && task.parentRecurringId !== undefined) {
        try {
            const Task = mongoose.model('Task');
            const parentRecurringTask = await Task.findOne({ taskId: task.parentRecurringId });
            
            if (!parentRecurringTask) {
                return next(new Error('Parent recurring task not found'));
            }
            
            if (parentRecurringTask.userId !== task.userId) {
                return next(new Error('Parent recurring task must belong to the same user'));
            }
            
            // Ensure the parent recurring task has a repeat type
            if (parentRecurringTask.repeatType === 'none') {
                return next(new Error('Parent recurring task must have a repeat type'));
            }
            
            // Prevent self-reference
            if (parentRecurringTask.taskId === task.taskId) {
                return next(new Error('Task cannot be its own recurring parent'));
            }
        } catch (error) {
            return next(new Error(`Parent recurring task validation failed: ${error.message}`));
        }
    }

    // Validate subtask constraints for recurring tasks
    if (task.isSubtask() && task.repeatType !== 'none') {
        return next(new Error('Subtasks cannot have repeat types'));
    }

    // Handle repeat logic (existing functionality)
    if (task.isCompleted && task.repeatType !== 'none') {
        // This could be expanded to create recurring tasks
        // For now, we'll just mark it as completed
    }

    next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;