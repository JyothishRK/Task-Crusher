const mongoose = require('mongoose');
const UserActivity = require('../src/models/userActivity');
const User = require('../src/models/user');
const Task = require('../src/models/task');
const { logActivity } = require('../src/utils/activityLogger');

// Test database connection
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/task-app-test';

beforeAll(async () => {
    await mongoose.connect(MONGODB_URL);
});

afterAll(async () => {
    await mongoose.connection.close();
});

beforeEach(async () => {
    // Clean up test data
    await UserActivity.deleteMany({});
    await User.deleteMany({});
    await Task.deleteMany({});
});

describe('UserActivity Model Tests', () => {
    
    describe('Schema Validation', () => {
        
        test('should create activity with required fields', async () => {
            const userId = new mongoose.Types.ObjectId();
            const activityData = {
                userId,
                action: 'TASK_COMPLETED',
                message: 'User performed TASK_COMPLETED'
            };
            
            const activity = new UserActivity(activityData);
            const savedActivity = await activity.save();
            
            expect(savedActivity._id).toBeDefined();
            expect(savedActivity.userId).toEqual(userId);
            expect(savedActivity.action).toBe('TASK_COMPLETED');
            expect(savedActivity.message).toBe('User performed TASK_COMPLETED');
            expect(savedActivity.timestamp).toBeDefined();
            expect(savedActivity.__v).toBeUndefined(); // versionKey: false
        });
        
        test('should fail validation without required userId', async () => {
            const activityData = {
                action: 'TASK_COMPLETED',
                message: 'User performed TASK_COMPLETED'
            };
            
            const activity = new UserActivity(activityData);
            
            await expect(activity.save()).rejects.toThrow();
        });
        
        test('should fail validation without required action', async () => {
            const activityData = {
                userId: new mongoose.Types.ObjectId(),
                message: 'User performed TASK_COMPLETED'
            };
            
            const activity = new UserActivity(activityData);
            
            await expect(activity.save()).rejects.toThrow();
        });
        
        test('should fail validation without required message', async () => {
            const activityData = {
                userId: new mongoose.Types.ObjectId(),
                action: 'TASK_COMPLETED'
            };
            
            const activity = new UserActivity(activityData);
            
            await expect(activity.save()).rejects.toThrow();
        });
        
        test('should accept optional fields', async () => {
            const userId = new mongoose.Types.ObjectId();
            const taskId = new mongoose.Types.ObjectId();
            const activityData = {
                userId,
                action: 'TASK_COMPLETED',
                taskId,
                message: 'User performed TASK_COMPLETED :: ' + taskId,
                error: 'Test error message'
            };
            
            const activity = new UserActivity(activityData);
            const savedActivity = await activity.save();
            
            expect(savedActivity.taskId).toEqual(taskId);
            expect(savedActivity.error).toBe('Test error message');
        });
        
        test('should trim string fields', async () => {
            const activityData = {
                userId: new mongoose.Types.ObjectId(),
                action: '  TASK_COMPLETED  ',
                message: '  User performed TASK_COMPLETED  ',
                error: '  Test error  '
            };
            
            const activity = new UserActivity(activityData);
            const savedActivity = await activity.save();
            
            expect(savedActivity.action).toBe('TASK_COMPLETED');
            expect(savedActivity.message).toBe('User performed TASK_COMPLETED');
            expect(savedActivity.error).toBe('Test error');
        });
        
        test('should set default timestamp', async () => {
            const beforeSave = new Date();
            
            const activityData = {
                userId: new mongoose.Types.ObjectId(),
                action: 'TASK_COMPLETED',
                message: 'User performed TASK_COMPLETED'
            };
            
            const activity = new UserActivity(activityData);
            const savedActivity = await activity.save();
            
            const afterSave = new Date();
            
            expect(savedActivity.timestamp).toBeDefined();
            expect(savedActivity.timestamp.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
            expect(savedActivity.timestamp.getTime()).toBeLessThanOrEqual(afterSave.getTime());
        });
    });
    
    describe('References and Relationships', () => {
        
        test('should reference User model correctly', async () => {
            // Create a test user
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            const savedUser = await user.save();
            
            const activityData = {
                userId: savedUser._id,
                action: 'USER_LOGIN',
                message: 'User performed USER_LOGIN'
            };
            
            const activity = new UserActivity(activityData);
            const savedActivity = await activity.save();
            
            // Populate the user reference
            const populatedActivity = await UserActivity.findById(savedActivity._id).populate('userId');
            
            expect(populatedActivity.userId._id).toEqual(savedUser._id);
            expect(populatedActivity.userId.name).toBe('Test User');
        });
        
        test('should reference Task model correctly', async () => {
            // Create test user and task
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            const savedUser = await user.save();
            
            const task = new Task({
                userId: savedUser._id,
                title: 'Test Task',
                dueDate: new Date()
            });
            const savedTask = await task.save();
            
            const activityData = {
                userId: savedUser._id,
                action: 'TASK_COMPLETED',
                taskId: savedTask._id,
                message: `User performed TASK_COMPLETED :: ${savedTask._id}`
            };
            
            const activity = new UserActivity(activityData);
            const savedActivity = await activity.save();
            
            // Populate the task reference
            const populatedActivity = await UserActivity.findById(savedActivity._id).populate('taskId');
            
            expect(populatedActivity.taskId._id).toEqual(savedTask._id);
            expect(populatedActivity.taskId.title).toBe('Test Task');
        });
    });
    
    describe('Index Functionality', () => {
        
        test('should create compound indexes', async () => {
            const indexes = await UserActivity.collection.getIndexes();
            
            // Check for individual field indexes
            expect(indexes).toHaveProperty('userId_1');
            expect(indexes).toHaveProperty('action_1');
            expect(indexes).toHaveProperty('timestamp_1');
            
            // Check for compound indexes
            expect(indexes).toHaveProperty('userId_1_timestamp_-1');
            expect(indexes).toHaveProperty('userId_1_action_1');
            expect(indexes).toHaveProperty('userId_1_action_1_timestamp_-1');
        });
        
        test('should query efficiently with indexes', async () => {
            const userId = new mongoose.Types.ObjectId();
            
            // Create multiple activities
            const activities = [];
            for (let i = 0; i < 5; i++) {
                activities.push({
                    userId,
                    action: i % 2 === 0 ? 'TASK_CREATED' : 'TASK_COMPLETED',
                    message: `User performed action ${i}`,
                    timestamp: new Date(Date.now() + i * 1000)
                });
            }
            
            await UserActivity.insertMany(activities);
            
            // Test userId query
            const userActivities = await UserActivity.find({ userId }).sort({ timestamp: -1 });
            expect(userActivities).toHaveLength(5);
            
            // Test userId + action query
            const taskCreatedActivities = await UserActivity.find({ 
                userId, 
                action: 'TASK_CREATED' 
            });
            expect(taskCreatedActivities).toHaveLength(3);
            
            // Test compound query
            const recentTaskCompleted = await UserActivity.find({
                userId,
                action: 'TASK_COMPLETED'
            }).sort({ timestamp: -1 }).limit(1);
            
            expect(recentTaskCompleted).toHaveLength(1);
            expect(recentTaskCompleted[0].action).toBe('TASK_COMPLETED');
        });
    });
    
    describe('Schema Options', () => {
        
        test('should not include version key', async () => {
            const activityData = {
                userId: new mongoose.Types.ObjectId(),
                action: 'TASK_COMPLETED',
                message: 'User performed TASK_COMPLETED'
            };
            
            const activity = new UserActivity(activityData);
            const savedActivity = await activity.save();
            
            expect(savedActivity.__v).toBeUndefined();
            expect(savedActivity.toObject().__v).toBeUndefined();
        });
    });
});

describe('Activity Logger Function Tests', () => {
    
    describe('Parameter Validation', () => {
        
        test('should reject missing userId', async () => {
            const result = await logActivity(null, 'TASK_COMPLETED');
            expect(result).toBeNull();
        });
        
        test('should reject missing action', async () => {
            const userId = new mongoose.Types.ObjectId();
            const result = await logActivity(userId, null);
            expect(result).toBeNull();
        });
        
        test('should reject non-string action', async () => {
            const userId = new mongoose.Types.ObjectId();
            const result = await logActivity(userId, 123);
            expect(result).toBeNull();
        });
        
        test('should reject invalid userId ObjectId', async () => {
            const result = await logActivity('invalid-id', 'TASK_COMPLETED');
            expect(result).toBeNull();
        });
        
        test('should reject invalid taskId ObjectId', async () => {
            const userId = new mongoose.Types.ObjectId();
            const result = await logActivity(userId, 'TASK_COMPLETED', 'invalid-task-id');
            expect(result).toBeNull();
        });
        
        test('should accept valid parameters', async () => {
            const userId = new mongoose.Types.ObjectId();
            const result = await logActivity(userId, 'TASK_COMPLETED');
            
            expect(result).not.toBeNull();
            expect(result._id).toBeDefined();
            expect(result.userId).toEqual(userId);
            expect(result.action).toBe('TASK_COMPLETED');
        });
    });
    
    describe('Message Generation', () => {
        
        test('should generate success message without taskId', async () => {
            const userId = new mongoose.Types.ObjectId();
            const result = await logActivity(userId, 'USER_LOGIN');
            
            expect(result.message).toBe('User performed USER_LOGIN');
            expect(result.error).toBeUndefined();
        });
        
        test('should generate success message with taskId', async () => {
            const userId = new mongoose.Types.ObjectId();
            const taskId = new mongoose.Types.ObjectId();
            const result = await logActivity(userId, 'TASK_COMPLETED', taskId);
            
            expect(result.message).toBe(`User performed TASK_COMPLETED :: ${taskId}`);
            expect(result.taskId).toEqual(taskId);
            expect(result.error).toBeUndefined();
        });
        
        test('should generate error message without taskId', async () => {
            const userId = new mongoose.Types.ObjectId();
            const errorMsg = 'Database connection failed';
            const result = await logActivity(userId, 'USER_LOGIN', null, errorMsg);
            
            expect(result.message).toBe(`User attempted USER_LOGIN :: ERROR: ${errorMsg}`);
            expect(result.error).toBe(errorMsg);
        });
        
        test('should generate error message with taskId', async () => {
            const userId = new mongoose.Types.ObjectId();
            const taskId = new mongoose.Types.ObjectId();
            const errorMsg = 'Task not found';
            const result = await logActivity(userId, 'TASK_COMPLETED', taskId, errorMsg);
            
            expect(result.message).toBe(`User attempted TASK_COMPLETED :: ${taskId} :: ERROR: ${errorMsg}`);
            expect(result.taskId).toEqual(taskId);
            expect(result.error).toBe(errorMsg);
        });
        
        test('should trim action and error strings', async () => {
            const userId = new mongoose.Types.ObjectId();
            const result = await logActivity(userId, '  TASK_COMPLETED  ', null, '  Test error  ');
            
            expect(result.action).toBe('TASK_COMPLETED');
            expect(result.error).toBe('Test error');
        });
    });
    
    describe('Database Operations', () => {
        
        test('should save activity to database successfully', async () => {
            const userId = new mongoose.Types.ObjectId();
            const taskId = new mongoose.Types.ObjectId();
            
            const result = await logActivity(userId, 'TASK_CREATED', taskId);
            
            expect(result).not.toBeNull();
            expect(result._id).toBeDefined();
            
            // Verify it was actually saved to database
            const savedActivity = await UserActivity.findById(result._id);
            expect(savedActivity).not.toBeNull();
            expect(savedActivity.userId).toEqual(userId);
            expect(savedActivity.action).toBe('TASK_CREATED');
            expect(savedActivity.taskId).toEqual(taskId);
        });
        
        test('should handle database errors gracefully', async () => {
            // Mock console.error to capture error logging
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            // Close database connection to simulate database error
            await mongoose.connection.close();
            
            const userId = new mongoose.Types.ObjectId();
            const result = await logActivity(userId, 'TASK_COMPLETED');
            
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('ActivityLogger: Failed to log activity to database:'),
                expect.any(Object)
            );
            
            // Restore database connection
            await mongoose.connect(MONGODB_URL);
            consoleSpy.mockRestore();
        });
        
        test('should set timestamp automatically', async () => {
            const beforeLog = new Date();
            const userId = new mongoose.Types.ObjectId();
            
            const result = await logActivity(userId, 'TASK_COMPLETED');
            const afterLog = new Date();
            
            expect(result.timestamp).toBeDefined();
            expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime());
            expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime());
        });
    });
    
    describe('Success and Error Scenarios', () => {
        
        test('should handle success scenario correctly', async () => {
            const userId = new mongoose.Types.ObjectId();
            const taskId = new mongoose.Types.ObjectId();
            
            const result = await logActivity(userId, 'TASK_COMPLETED', taskId);
            
            expect(result).not.toBeNull();
            expect(result.userId).toEqual(userId);
            expect(result.action).toBe('TASK_COMPLETED');
            expect(result.taskId).toEqual(taskId);
            expect(result.message).toBe(`User performed TASK_COMPLETED :: ${taskId}`);
            expect(result.error).toBeUndefined();
        });
        
        test('should handle error scenario correctly', async () => {
            const userId = new mongoose.Types.ObjectId();
            const taskId = new mongoose.Types.ObjectId();
            const errorMsg = 'Permission denied';
            
            const result = await logActivity(userId, 'TASK_DELETED', taskId, errorMsg);
            
            expect(result).not.toBeNull();
            expect(result.userId).toEqual(userId);
            expect(result.action).toBe('TASK_DELETED');
            expect(result.taskId).toEqual(taskId);
            expect(result.message).toBe(`User attempted TASK_DELETED :: ${taskId} :: ERROR: ${errorMsg}`);
            expect(result.error).toBe(errorMsg);
        });
        
        test('should use same interface for both success and error', async () => {
            const userId = new mongoose.Types.ObjectId();
            
            // Success call
            const successResult = await logActivity(userId, 'TASK_CREATED');
            expect(successResult).not.toBeNull();
            expect(successResult.error).toBeUndefined();
            
            // Error call using same interface
            const errorResult = await logActivity(userId, 'TASK_CREATED', null, 'Validation failed');
            expect(errorResult).not.toBeNull();
            expect(errorResult.error).toBe('Validation failed');
        });
    });
    
    describe('All Parameter Combinations', () => {
        
        test('should handle userId and action only', async () => {
            const userId = new mongoose.Types.ObjectId();
            const result = await logActivity(userId, 'USER_LOGOUT');
            
            expect(result.userId).toEqual(userId);
            expect(result.action).toBe('USER_LOGOUT');
            expect(result.taskId).toBeUndefined();
            expect(result.error).toBeUndefined();
            expect(result.message).toBe('User performed USER_LOGOUT');
        });
        
        test('should handle userId, action, and taskId', async () => {
            const userId = new mongoose.Types.ObjectId();
            const taskId = new mongoose.Types.ObjectId();
            const result = await logActivity(userId, 'TASK_UPDATED', taskId);
            
            expect(result.userId).toEqual(userId);
            expect(result.action).toBe('TASK_UPDATED');
            expect(result.taskId).toEqual(taskId);
            expect(result.error).toBeUndefined();
            expect(result.message).toBe(`User performed TASK_UPDATED :: ${taskId}`);
        });
        
        test('should handle userId, action, and error', async () => {
            const userId = new mongoose.Types.ObjectId();
            const errorMsg = 'Network timeout';
            const result = await logActivity(userId, 'PROFILE_UPDATED', null, errorMsg);
            
            expect(result.userId).toEqual(userId);
            expect(result.action).toBe('PROFILE_UPDATED');
            expect(result.taskId).toBeUndefined();
            expect(result.error).toBe(errorMsg);
            expect(result.message).toBe(`User attempted PROFILE_UPDATED :: ERROR: ${errorMsg}`);
        });
        
        test('should handle all parameters', async () => {
            const userId = new mongoose.Types.ObjectId();
            const taskId = new mongoose.Types.ObjectId();
            const errorMsg = 'Insufficient permissions';
            const result = await logActivity(userId, 'TASK_DELETED', taskId, errorMsg);
            
            expect(result.userId).toEqual(userId);
            expect(result.action).toBe('TASK_DELETED');
            expect(result.taskId).toEqual(taskId);
            expect(result.error).toBe(errorMsg);
            expect(result.message).toBe(`User attempted TASK_DELETED :: ${taskId} :: ERROR: ${errorMsg}`);
        });
    });
});
describ
e('Integration Tests with Existing Models', () => {
    
    describe('Real User and Task Integration', () => {
        
        test('should log activity with real User ObjectId', async () => {
            // Create a real user
            const user = new User({
                name: 'Integration Test User',
                email: 'integration@example.com',
                password: 'testpass123'
            });
            const savedUser = await user.save();
            
            // Log activity with real user ID
            const result = await logActivity(savedUser._id, 'USER_LOGIN');
            
            expect(result).not.toBeNull();
            expect(result.userId).toEqual(savedUser._id);
            
            // Verify we can populate the user reference
            const populatedActivity = await UserActivity.findById(result._id).populate('userId');
            expect(populatedActivity.userId.name).toBe('Integration Test User');
            expect(populatedActivity.userId.email).toBe('integration@example.com');
        });
        
        test('should log activity with real Task ObjectId', async () => {
            // Create a real user and task
            const user = new User({
                name: 'Task Owner',
                email: 'taskowner@example.com',
                password: 'testpass123'
            });
            const savedUser = await user.save();
            
            const task = new Task({
                userId: savedUser._id,
                title: 'Integration Test Task',
                description: 'A task for integration testing',
                dueDate: new Date(Date.now() + 86400000), // Tomorrow
                priority: 'high',
                category: 'testing'
            });
            const savedTask = await task.save();
            
            // Log activity with real task ID
            const result = await logActivity(savedUser._id, 'TASK_CREATED', savedTask._id);
            
            expect(result).not.toBeNull();
            expect(result.userId).toEqual(savedUser._id);
            expect(result.taskId).toEqual(savedTask._id);
            
            // Verify we can populate both references
            const populatedActivity = await UserActivity.findById(result._id)
                .populate('userId')
                .populate('taskId');
            
            expect(populatedActivity.userId.name).toBe('Task Owner');
            expect(populatedActivity.taskId.title).toBe('Integration Test Task');
            expect(populatedActivity.taskId.priority).toBe('high');
        });
    });
    
    describe('Task Operation Logging', () => {
        
        test('should log task creation workflow', async () => {
            const user = new User({
                name: 'Task Creator',
                email: 'creator@example.com',
                password: 'testpass123'
            });
            const savedUser = await user.save();
            
            const task = new Task({
                userId: savedUser._id,
                title: 'New Task',
                dueDate: new Date(Date.now() + 86400000)
            });
            const savedTask = await task.save();
            
            // Log task creation
            await logActivity(savedUser._id, 'TASK_CREATED', savedTask._id);
            
            // Log task update
            savedTask.title = 'Updated Task';
            savedTask.priority = 'high';
            await savedTask.save();
            await logActivity(savedUser._id, 'TASK_UPDATED', savedTask._id);
            
            // Log task completion
            savedTask.isCompleted = true;
            await savedTask.save();
            await logActivity(savedUser._id, 'TASK_COMPLETED', savedTask._id);
            
            // Verify all activities were logged
            const activities = await UserActivity.find({ userId: savedUser._id })
                .sort({ timestamp: 1 });
            
            expect(activities).toHaveLength(3);
            expect(activities[0].action).toBe('TASK_CREATED');
            expect(activities[1].action).toBe('TASK_UPDATED');
            expect(activities[2].action).toBe('TASK_COMPLETED');
            
            // All should reference the same task
            activities.forEach(activity => {
                expect(activity.taskId).toEqual(savedTask._id);
            });
        });
        
        test('should log task deletion workflow', async () => {
            const user = new User({
                name: 'Task Deleter',
                email: 'deleter@example.com',
                password: 'testpass123'
            });
            const savedUser = await user.save();
            
            const task = new Task({
                userId: savedUser._id,
                title: 'Task to Delete',
                dueDate: new Date(Date.now() + 86400000)
            });
            const savedTask = await task.save();
            const taskId = savedTask._id;
            
            // Log task deletion
            await logActivity(savedUser._id, 'TASK_DELETED', taskId);
            
            // Actually delete the task
            await Task.findByIdAndDelete(taskId);
            
            // Verify activity was logged even though task is deleted
            const activity = await UserActivity.findOne({ 
                userId: savedUser._id, 
                action: 'TASK_DELETED' 
            });
            
            expect(activity).not.toBeNull();
            expect(activity.taskId).toEqual(taskId);
            expect(activity.message).toBe(`User performed TASK_DELETED :: ${taskId}`);
        });
        
        test('should log error scenarios during task operations', async () => {
            const user = new User({
                name: 'Error User',
                email: 'error@example.com',
                password: 'testpass123'
            });
            const savedUser = await user.save();
            
            const nonExistentTaskId = new mongoose.Types.ObjectId();
            
            // Log failed task update
            await logActivity(
                savedUser._id, 
                'TASK_UPDATED', 
                nonExistentTaskId, 
                'Task not found'
            );
            
            // Log failed task completion
            await logActivity(
                savedUser._id, 
                'TASK_COMPLETED', 
                nonExistentTaskId, 
                'Permission denied'
            );
            
            const errorActivities = await UserActivity.find({ 
                userId: savedUser._id,
                error: { $exists: true }
            });
            
            expect(errorActivities).toHaveLength(2);
            expect(errorActivities[0].error).toBe('Task not found');
            expect(errorActivities[1].error).toBe('Permission denied');
            
            // Verify error messages are properly formatted
            expect(errorActivities[0].message).toContain('User attempted TASK_UPDATED');
            expect(errorActivities[0].message).toContain('ERROR: Task not found');
        });
    });
    
    describe('Data Integrity and Relationships', () => {
        
        test('should maintain referential integrity', async () => {
            const user = new User({
                name: 'Integrity User',
                email: 'integrity@example.com',
                password: 'testpass123'
            });
            const savedUser = await user.save();
            
            const task = new Task({
                userId: savedUser._id,
                title: 'Integrity Task',
                dueDate: new Date(Date.now() + 86400000)
            });
            const savedTask = await task.save();
            
            // Log activity
            const activity = await logActivity(savedUser._id, 'TASK_CREATED', savedTask._id);
            
            // Verify references are valid ObjectIds
            expect(mongoose.Types.ObjectId.isValid(activity.userId)).toBe(true);
            expect(mongoose.Types.ObjectId.isValid(activity.taskId)).toBe(true);
            
            // Verify references point to existing documents
            const referencedUser = await User.findById(activity.userId);
            const referencedTask = await Task.findById(activity.taskId);
            
            expect(referencedUser).not.toBeNull();
            expect(referencedTask).not.toBeNull();
            expect(referencedUser._id).toEqual(savedUser._id);
            expect(referencedTask._id).toEqual(savedTask._id);
        });
        
        test('should handle orphaned references gracefully', async () => {
            const user = new User({
                name: 'Orphan User',
                email: 'orphan@example.com',
                password: 'testpass123'
            });
            const savedUser = await user.save();
            
            const task = new Task({
                userId: savedUser._id,
                title: 'Orphan Task',
                dueDate: new Date(Date.now() + 86400000)
            });
            const savedTask = await task.save();
            const taskId = savedTask._id;
            
            // Log activity
            await logActivity(savedUser._id, 'TASK_CREATED', taskId);
            
            // Delete the task (creating orphaned reference)
            await Task.findByIdAndDelete(taskId);
            
            // Activity should still exist with the reference
            const activity = await UserActivity.findOne({ 
                userId: savedUser._id,
                taskId: taskId
            });
            
            expect(activity).not.toBeNull();
            expect(activity.taskId).toEqual(taskId);
            
            // Populate should handle missing reference gracefully
            const populatedActivity = await UserActivity.findById(activity._id).populate('taskId');
            expect(populatedActivity.taskId).toBeNull();
        });
    });
    
    describe('Query Performance with Realistic Data', () => {
        
        test('should perform efficiently with large datasets', async () => {
            // Create test user
            const user = new User({
                name: 'Performance User',
                email: 'performance@example.com',
                password: 'testpass123'
            });
            const savedUser = await user.save();
            
            // Create multiple tasks
            const tasks = [];
            for (let i = 0; i < 10; i++) {
                const task = new Task({
                    userId: savedUser._id,
                    title: `Performance Task ${i}`,
                    dueDate: new Date(Date.now() + i * 86400000)
                });
                tasks.push(await task.save());
            }
            
            // Create many activities
            const activities = [];
            const actions = ['TASK_CREATED', 'TASK_UPDATED', 'TASK_COMPLETED'];
            
            for (let i = 0; i < 100; i++) {
                const taskIndex = i % tasks.length;
                const actionIndex = i % actions.length;
                
                activities.push(await logActivity(
                    savedUser._id,
                    actions[actionIndex],
                    tasks[taskIndex]._id
                ));
            }
            
            // Test query performance with indexes
            const startTime = Date.now();
            
            // Query by userId (should use userId index)
            const userActivities = await UserActivity.find({ userId: savedUser._id });
            expect(userActivities).toHaveLength(100);
            
            // Query by userId and action (should use compound index)
            const taskCreatedActivities = await UserActivity.find({
                userId: savedUser._id,
                action: 'TASK_CREATED'
            });
            expect(taskCreatedActivities.length).toBeGreaterThan(0);
            
            // Query with sorting by timestamp (should use compound index)
            const recentActivities = await UserActivity.find({ userId: savedUser._id })
                .sort({ timestamp: -1 })
                .limit(10);
            expect(recentActivities).toHaveLength(10);
            
            const endTime = Date.now();
            const queryTime = endTime - startTime;
            
            // Queries should complete reasonably quickly (under 100ms for this dataset)
            expect(queryTime).toBeLessThan(100);
        });
        
        test('should support complex compound queries', async () => {
            const user = new User({
                name: 'Complex Query User',
                email: 'complex@example.com',
                password: 'testpass123'
            });
            const savedUser = await user.save();
            
            // Create activities with different actions and timestamps
            const baseTime = Date.now();
            const activities = [
                { action: 'TASK_CREATED', offset: 0 },
                { action: 'TASK_UPDATED', offset: 1000 },
                { action: 'TASK_COMPLETED', offset: 2000 },
                { action: 'TASK_CREATED', offset: 3000 },
                { action: 'TASK_UPDATED', offset: 4000 }
            ];
            
            for (const { action, offset } of activities) {
                const activity = new UserActivity({
                    userId: savedUser._id,
                    action,
                    message: `User performed ${action}`,
                    timestamp: new Date(baseTime + offset)
                });
                await activity.save();
            }
            
            // Complex compound query: userId + action + timestamp range
            const midTime = new Date(baseTime + 2500);
            const recentUpdates = await UserActivity.find({
                userId: savedUser._id,
                action: 'TASK_UPDATED',
                timestamp: { $gte: midTime }
            }).sort({ timestamp: -1 });
            
            expect(recentUpdates).toHaveLength(1);
            expect(recentUpdates[0].action).toBe('TASK_UPDATED');
            expect(recentUpdates[0].timestamp.getTime()).toBeGreaterThanOrEqual(midTime.getTime());
        });
    });
});