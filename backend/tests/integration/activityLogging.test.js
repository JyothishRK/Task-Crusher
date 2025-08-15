// Integration test for activity logging verification
const mongoose = require('mongoose');
const Task = require('../../src/models/task');
const User = require('../../src/models/user');
const UserActivity = require('../../src/models/userActivity');
const Counter = require('../../src/models/counter');
const { logActivity } = require('../../src/utils/activityLogger');
const TasksWorker = require('../../src/workers/tasksWorker');

// Test database connection
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/task-app-integration-test';

describe('Activity Logging Integration Tests', () => {
    let testUser;
    let testUserId;

    beforeAll(async () => {
        await mongoose.connect(MONGODB_URL);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clean up test data
        await Task.deleteMany({});
        await User.deleteMany({});
        await UserActivity.deleteMany({});
        await Counter.deleteMany({});

        // Create test user
        testUser = new User({
            name: 'Activity Test User',
            email: 'activity@example.com',
            password: 'testpass123'
        });
        await testUser.save();
        testUserId = testUser._id.toString();
    });

    afterEach(async () => {
        // Clean up test data
        await Task.deleteMany({});
        await User.deleteMany({});
        await UserActivity.deleteMany({});
        await Counter.deleteMany({});
    });

    describe('Basic Activity Logging', () => {
        test('should log task creation activity', async () => {
            const task = new Task({
                title: 'Activity Test Task',
                dueDate: new Date(Date.now() + 86400000),
                userId: testUser._id
            });
            await task.save();

            // Log activity
            const activity = await logActivity(testUserId, 'TASK_CREATED', task._id.toString());

            expect(activity).not.toBeNull();
            expect(activity.userId).toEqual(testUser._id);
            expect(activity.action).toBe('TASK_CREATED');
            expect(activity.taskId).toEqual(task._id);
            expect(activity.message).toBe(`User performed TASK_CREATED :: ${task._id}`);
            expect(activity.activityId).toBeDefined();
            expect(activity.activityId).toBeGreaterThan(0);
        });

        test('should log task completion activity', async () => {
            const task = new Task({
                title: 'Completion Test Task',
                dueDate: new Date(Date.now() + 86400000),
                userId: testUser._id
            });
            await task.save();

            // Mark as completed and log
            task.isCompleted = true;
            await task.save();

            const activity = await logActivity(testUserId, 'TASK_COMPLETED', task._id.toString());

            expect(activity.action).toBe('TASK_COMPLETED');
            expect(activity.message).toBe(`User performed TASK_COMPLETED :: ${task._id}`);
        });

        test('should log task deletion activity', async () => {
            const task = new Task({
                title: 'Deletion Test Task',
                dueDate: new Date(Date.now() + 86400000),
                userId: testUser._id
            });
            await task.save();
            const taskId = task._id.toString();

            // Delete task and log
            await Task.findByIdAndDelete(task._id);
            const activity = await logActivity(testUserId, 'TASK_DELETED', taskId);

            expect(activity.action).toBe('TASK_DELETED');
            expect(activity.taskId.toString()).toBe(taskId);
        });
    });

    describe('Worker Activity Logging', () => {
        test('should log recurring task creation by workers', async () => {
            const originalTask = new Task({
                title: 'Worker Recurring Task',
                dueDate: new Date(Date.now() + 86400000),
                repeatType: 'daily',
                userId: testUser._id
            });
            await originalTask.save();

            // Process task creation (should log activities)
            await TasksWorker.processTaskCreation(originalTask._id.toString());

            // Check for logged activities
            const activities = await UserActivity.find({ 
                userId: testUser._id,
                action: 'RECURRING_TASK_CREATED'
            });

            expect(activities.length).toBe(3); // Should have 3 recurring task creation logs

            activities.forEach(activity => {
                expect(activity.action).toBe('RECURRING_TASK_CREATED');
                expect(activity.message).toContain('User performed RECURRING_TASK_CREATED');
                expect(activity.taskId).toBeDefined();
                expect(activity.activityId).toBeDefined();
            });
        });

        test('should log recurring task completion processing', async () => {
            // Create and setup recurring task
            const task = new Task({
                title: 'Completion Processing Test',
                dueDate: new Date(Date.now() + 86400000),
                repeatType: 'weekly',
                userId: testUser._id
            });
            await task.save();

            // Generate initial recurring tasks
            await TasksWorker.processTaskCreation(task._id.toString());

            // Mark as completed and process
            task.isCompleted = true;
            await task.save();
            await TasksWorker.processTaskCompletion(task._id.toString());

            // Check for completion-related activities
            const activities = await UserActivity.find({ 
                userId: testUser._id,
                action: { $in: ['RECURRING_TASK_UPDATED', 'RECURRING_TASK_CREATED'] }
            });

            expect(activities.length).toBeGreaterThan(0);
        });

        test('should log recurring task deletion cleanup', async () => {
            // Create recurring task
            const task = new Task({
                title: 'Deletion Cleanup Test',
                dueDate: new Date(Date.now() + 86400000),
                repeatType: 'monthly',
                userId: testUser._id
            });
            await task.save();

            // Generate recurring tasks
            await TasksWorker.processTaskCreation(task._id.toString());

            // Delete and process cleanup
            await Task.findByIdAndDelete(task._id);
            await TasksWorker.processTaskDeletion(task._id.toString(), testUserId);

            // Check for deletion activity
            const activities = await UserActivity.find({ 
                userId: testUser._id,
                action: 'RECURRING_TASKS_DELETED'
            });

            expect(activities.length).toBe(1);
            expect(activities[0].message).toContain('RECURRING_TASKS_DELETED');
        });
    });

    describe('Error Activity Logging', () => {
        test('should log activity with error information', async () => {
            const errorMessage = 'Test error for logging';
            
            const activity = await logActivity(
                testUserId, 
                'TASK_UPDATED', 
                new mongoose.Types.ObjectId().toString(),
                errorMessage
            );

            expect(activity.error).toBe(errorMessage);
            expect(activity.message).toContain('User attempted TASK_UPDATED');
            expect(activity.message).toContain('ERROR: Test error for logging');
        });

        test('should handle logging failures gracefully', async () => {
            // Test with invalid userId (should return null but not throw)
            const result = await logActivity('invalid-id', 'TEST_ACTION');
            expect(result).toBeNull();
        });
    });

    describe('Activity Logging Performance', () => {
        test('should handle concurrent activity logging', async () => {
            const promises = [];
            const numActivities = 10;

            // Create multiple concurrent activity logs
            for (let i = 0; i < numActivities; i++) {
                const promise = logActivity(testUserId, `TEST_ACTION_${i}`, null);
                promises.push(promise);
            }

            const results = await Promise.all(promises);

            // All should succeed
            results.forEach(result => {
                expect(result).not.toBeNull();
                expect(result.activityId).toBeDefined();
            });

            // Verify all activities were logged
            const activities = await UserActivity.find({ userId: testUser._id });
            expect(activities).toHaveLength(numActivities);

            // Verify unique activity IDs
            const activityIds = activities.map(a => a.activityId);
            const uniqueIds = new Set(activityIds);
            expect(uniqueIds.size).toBe(numActivities);
        });

        test('should maintain activity logging under high load', async () => {
            const tasks = [];
            const numTasks = 20;

            // Create multiple tasks rapidly
            for (let i = 0; i < numTasks; i++) {
                const task = new Task({
                    title: `Load Test Task ${i}`,
                    dueDate: new Date(Date.now() + (i + 1) * 86400000),
                    userId: testUser._id
                });
                await task.save();
                tasks.push(task);
            }

            // Log activities for all tasks
            const promises = tasks.map(task => 
                logActivity(testUserId, 'TASK_CREATED', task._id.toString())
            );

            const results = await Promise.all(promises);

            // Verify all activities were logged successfully
            results.forEach(result => {
                expect(result).not.toBeNull();
            });

            const activities = await UserActivity.find({ 
                userId: testUser._id,
                action: 'TASK_CREATED'
            });
            expect(activities).toHaveLength(numTasks);
        });
    });

    describe('Activity Query and Retrieval', () => {
        test('should retrieve activities with proper indexing', async () => {
            // Create various activities
            const activities = [
                { action: 'TASK_CREATED', taskId: new mongoose.Types.ObjectId() },
                { action: 'TASK_UPDATED', taskId: new mongoose.Types.ObjectId() },
                { action: 'TASK_COMPLETED', taskId: new mongoose.Types.ObjectId() },
                { action: 'TASK_DELETED', taskId: new mongoose.Types.ObjectId() }
            ];

            // Log all activities
            for (const activityData of activities) {
                await logActivity(testUserId, activityData.action, activityData.taskId.toString());
            }

            // Test various queries
            const allActivities = await UserActivity.find({ userId: testUser._id });
            expect(allActivities).toHaveLength(4);

            const taskCreatedActivities = await UserActivity.find({ 
                userId: testUser._id,
                action: 'TASK_CREATED'
            });
            expect(taskCreatedActivities).toHaveLength(1);

            const recentActivities = await UserActivity.find({ userId: testUser._id })
                .sort({ timestamp: -1 })
                .limit(2);
            expect(recentActivities).toHaveLength(2);
        });

        test('should support activity filtering and pagination', async () => {
            // Create multiple activities over time
            for (let i = 0; i < 10; i++) {
                await logActivity(testUserId, `ACTION_${i % 3}`, null);
                // Small delay to ensure different timestamps
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Test pagination
            const page1 = await UserActivity.find({ userId: testUser._id })
                .sort({ timestamp: -1 })
                .limit(5);
            expect(page1).toHaveLength(5);

            const page2 = await UserActivity.find({ userId: testUser._id })
                .sort({ timestamp: -1 })
                .skip(5)
                .limit(5);
            expect(page2).toHaveLength(5);

            // Test filtering by action
            const action0Activities = await UserActivity.find({ 
                userId: testUser._id,
                action: 'ACTION_0'
            });
            expect(action0Activities.length).toBeGreaterThan(0);
        });
    });

    describe('Activity Data Integrity', () => {
        test('should maintain referential integrity with users and tasks', async () => {
            const task = new Task({
                title: 'Integrity Test Task',
                dueDate: new Date(Date.now() + 86400000),
                userId: testUser._id
            });
            await task.save();

            const activity = await logActivity(testUserId, 'TASK_CREATED', task._id.toString());

            // Test population of references
            const populatedActivity = await UserActivity.findById(activity._id)
                .populate('userId')
                .populate('taskId');

            expect(populatedActivity.userId._id).toEqual(testUser._id);
            expect(populatedActivity.userId.name).toBe('Activity Test User');
            expect(populatedActivity.taskId._id).toEqual(task._id);
            expect(populatedActivity.taskId.title).toBe('Integrity Test Task');
        });

        test('should handle orphaned references gracefully', async () => {
            const task = new Task({
                title: 'Temporary Task',
                dueDate: new Date(Date.now() + 86400000),
                userId: testUser._id
            });
            await task.save();

            // Log activity
            const activity = await logActivity(testUserId, 'TASK_CREATED', task._id.toString());

            // Delete the task (creating orphaned reference)
            await Task.findByIdAndDelete(task._id);

            // Activity should still exist
            const existingActivity = await UserActivity.findById(activity._id);
            expect(existingActivity).not.toBeNull();
            expect(existingActivity.taskId).toEqual(task._id);

            // Population should handle missing reference gracefully
            const populatedActivity = await UserActivity.findById(activity._id)
                .populate('taskId');
            expect(populatedActivity.taskId).toBeNull();
        });
    });
});