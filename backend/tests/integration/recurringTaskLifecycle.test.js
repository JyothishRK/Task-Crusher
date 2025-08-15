// Integration test for recurring task lifecycle
const mongoose = require('mongoose');
const Task = require('../../src/models/task');
const User = require('../../src/models/user');
const Counter = require('../../src/models/counter');
const TasksWorker = require('../../src/workers/tasksWorker');
const WorkerService = require('../../src/workers/workerService');
const CounterService = require('../../src/services/counterService');

// Test database connection
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/task-app-integration-test';

describe('Recurring Task Lifecycle Integration Tests', () => {
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
        await Counter.deleteMany({});

        // Create test user
        testUser = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'testpass123'
        });
        await testUser.save();
        testUserId = testUser._id.toString();
    });

    afterEach(async () => {
        // Clean up test data
        await Task.deleteMany({});
        await User.deleteMany({});
        await Counter.deleteMany({});
    });

    describe('Recurring Task Creation', () => {
        test('should create recurring task with auto-incremented ID', async () => {
            const taskData = {
                title: 'Daily Standup',
                description: 'Team daily standup meeting',
                dueDate: new Date(Date.now() + 86400000), // Tomorrow
                priority: 'high',
                category: 'work',
                repeatType: 'daily'
            };

            const task = new Task({
                ...taskData,
                userId: testUser._id
            });

            const savedTask = await task.save();

            expect(savedTask.taskId).toBeDefined();
            expect(savedTask.taskId).toBeGreaterThan(0);
            expect(savedTask.originalDueDate).toEqual(savedTask.dueDate);
            expect(savedTask.repeatType).toBe('daily');
        });

        test('should generate 3 recurring instances when task is created', async () => {
            const originalTask = new Task({
                title: 'Weekly Review',
                dueDate: new Date(Date.now() + 86400000),
                repeatType: 'weekly',
                userId: testUser._id
            });

            await originalTask.save();

            // Process task creation
            const recurringTasks = await TasksWorker.processTaskCreation(originalTask._id.toString());

            expect(recurringTasks).toHaveLength(3);
            
            // Verify all recurring tasks have correct properties
            recurringTasks.forEach((task, index) => {
                expect(task.title).toBe('Weekly Review');
                expect(task.repeatType).toBe('weekly');
                expect(task.parentRecurringId).toEqual(originalTask._id);
                expect(task.userId).toEqual(testUser._id);
                expect(task.isCompleted).toBe(false);
                expect(task.taskId).toBeDefined();
                expect(task.originalDueDate).toEqual(task.dueDate);
            });

            // Verify dates are properly spaced (weekly)
            const sortedTasks = recurringTasks.sort((a, b) => a.dueDate - b.dueDate);
            for (let i = 1; i < sortedTasks.length; i++) {
                const daysDiff = Math.round((sortedTasks[i].dueDate - sortedTasks[i-1].dueDate) / (1000 * 60 * 60 * 24));
                expect(daysDiff).toBe(7);
            }
        });
    });

    describe('Recurring Task Completion', () => {
        test('should handle task completion and generate new occurrence', async () => {
            // Create original task
            const originalTask = new Task({
                title: 'Daily Backup',
                dueDate: new Date(Date.now() + 86400000),
                repeatType: 'daily',
                userId: testUser._id
            });
            await originalTask.save();

            // Generate initial recurring tasks
            await TasksWorker.processTaskCreation(originalTask._id.toString());

            // Mark original task as completed
            originalTask.isCompleted = true;
            await originalTask.save();

            // Process completion
            const result = await TasksWorker.processTaskCompletion(originalTask._id.toString());

            expect(result.createdTask).toBeDefined();
            expect(result.createdTask.title).toBe('Daily Backup');
            expect(result.createdTask.repeatType).toBe('daily');
            expect(result.createdTask.isCompleted).toBe(false);
        });
    });

    describe('Recurring Task Deletion', () => {
        test('should delete all recurring instances when parent is deleted', async () => {
            // Create original task
            const originalTask = new Task({
                title: 'Monthly Report',
                dueDate: new Date(Date.now() + 86400000),
                repeatType: 'monthly',
                userId: testUser._id
            });
            await originalTask.save();

            // Generate recurring tasks
            await TasksWorker.processTaskCreation(originalTask._id.toString());

            // Verify recurring tasks exist
            const beforeDeletion = await Task.find({ parentRecurringId: originalTask._id });
            expect(beforeDeletion.length).toBeGreaterThan(0);

            // Delete original task
            await Task.findByIdAndDelete(originalTask._id);

            // Process deletion
            const deletedCount = await TasksWorker.processTaskDeletion(
                originalTask._id.toString(),
                testUserId
            );

            expect(deletedCount).toBe(beforeDeletion.length);

            // Verify all recurring tasks are deleted
            const afterDeletion = await Task.find({ parentRecurringId: originalTask._id });
            expect(afterDeletion).toHaveLength(0);
        });
    });

    describe('Counter Service Integration', () => {
        test('should generate unique sequential IDs across multiple tasks', async () => {
            const tasks = [];
            const taskIds = [];

            // Create multiple tasks
            for (let i = 0; i < 5; i++) {
                const task = new Task({
                    title: `Test Task ${i}`,
                    dueDate: new Date(Date.now() + 86400000),
                    userId: testUser._id
                });
                await task.save();
                tasks.push(task);
                taskIds.push(task.taskId);
            }

            // Verify all IDs are unique and sequential
            const uniqueIds = new Set(taskIds);
            expect(uniqueIds.size).toBe(5);

            // Verify sequential order
            taskIds.sort((a, b) => a - b);
            for (let i = 1; i < taskIds.length; i++) {
                expect(taskIds[i]).toBe(taskIds[i-1] + 1);
            }
        });

        test('should handle concurrent task creation', async () => {
            const promises = [];
            const numTasks = 10;

            // Create multiple tasks concurrently
            for (let i = 0; i < numTasks; i++) {
                const promise = (async () => {
                    const task = new Task({
                        title: `Concurrent Task ${i}`,
                        dueDate: new Date(Date.now() + 86400000),
                        userId: testUser._id
                    });
                    return await task.save();
                })();
                promises.push(promise);
            }

            const tasks = await Promise.all(promises);
            const taskIds = tasks.map(task => task.taskId);

            // Verify all IDs are unique
            const uniqueIds = new Set(taskIds);
            expect(uniqueIds.size).toBe(numTasks);

            // Verify all IDs are positive integers
            taskIds.forEach(id => {
                expect(typeof id).toBe('number');
                expect(id).toBeGreaterThan(0);
                expect(Number.isInteger(id)).toBe(true);
            });
        });
    });

    describe('Sub-task Integration', () => {
        test('should create and validate sub-task relationships', async () => {
            // Create parent task
            const parentTask = new Task({
                title: 'Project Setup',
                dueDate: new Date(Date.now() + 7 * 86400000), // 7 days from now
                userId: testUser._id
            });
            await parentTask.save();

            // Create sub-task
            const subTask = new Task({
                title: 'Setup Database',
                dueDate: new Date(Date.now() + 3 * 86400000), // 3 days from now
                parentTaskId: parentTask._id,
                userId: testUser._id
            });
            await subTask.save();

            expect(subTask.parentTaskId).toEqual(parentTask._id);
            expect(subTask.repeatType).toBe('none');
            expect(subTask.dueDate.getTime()).toBeLessThanOrEqual(parentTask.dueDate.getTime());
        });

        test('should prevent invalid sub-task creation', async () => {
            // Create parent task
            const parentTask = new Task({
                title: 'Parent Task',
                dueDate: new Date(Date.now() + 86400000),
                userId: testUser._id
            });
            await parentTask.save();

            // Try to create sub-task with due date after parent
            const invalidSubTask = new Task({
                title: 'Invalid Sub-task',
                dueDate: new Date(Date.now() + 2 * 86400000), // After parent
                parentTaskId: parentTask._id,
                userId: testUser._id
            });

            await expect(invalidSubTask.save()).rejects.toThrow();
        });

        test('should prevent sub-tasks from having recurring patterns', async () => {
            const parentTask = new Task({
                title: 'Parent Task',
                dueDate: new Date(Date.now() + 86400000),
                userId: testUser._id
            });
            await parentTask.save();

            const invalidSubTask = new Task({
                title: 'Invalid Recurring Sub-task',
                dueDate: new Date(Date.now() + 86400000),
                parentTaskId: parentTask._id,
                repeatType: 'daily', // Should not be allowed
                userId: testUser._id
            });

            await expect(invalidSubTask.save()).rejects.toThrow();
        });
    });

    describe('Worker Service Integration', () => {
        test('should process task operations through WorkerService', async () => {
            const task = new Task({
                title: 'Worker Test Task',
                dueDate: new Date(Date.now() + 86400000),
                repeatType: 'weekly',
                userId: testUser._id
            });
            await task.save();

            // Test create operation
            const createResult = await WorkerService.processTaskRecurrence(
                task._id.toString(),
                'create'
            );

            expect(createResult.success).toBe(true);
            expect(createResult.operation).toBe('create');
            expect(createResult.result).toHaveLength(3);

            // Test complete operation
            task.isCompleted = true;
            await task.save();

            const completeResult = await WorkerService.processTaskRecurrence(
                task._id.toString(),
                'complete'
            );

            expect(completeResult.success).toBe(true);
            expect(completeResult.operation).toBe('complete');
        });

        test('should handle worker service errors gracefully', async () => {
            // Test with invalid task ID
            await expect(
                WorkerService.processTaskRecurrence('invalid-id', 'create')
            ).rejects.toThrow();

            // Test with invalid operation
            await expect(
                WorkerService.processTaskRecurrence('507f1f77bcf86cd799439011', 'invalid')
            ).rejects.toThrow();
        });
    });

    describe('End-to-End Workflow', () => {
        test('should complete full recurring task workflow', async () => {
            // 1. Create recurring task
            const originalTask = new Task({
                title: 'E2E Test Task',
                description: 'End-to-end test for recurring tasks',
                dueDate: new Date(Date.now() + 86400000),
                priority: 'medium',
                category: 'testing',
                repeatType: 'daily',
                links: ['https://example.com'],
                additionalNotes: 'This is a test task',
                userId: testUser._id
            });
            await originalTask.save();

            // Verify task creation
            expect(originalTask.taskId).toBeDefined();
            expect(originalTask.originalDueDate).toEqual(originalTask.dueDate);

            // 2. Generate recurring instances
            const recurringTasks = await TasksWorker.processTaskCreation(originalTask._id.toString());
            expect(recurringTasks).toHaveLength(3);

            // 3. Complete original task
            originalTask.isCompleted = true;
            await originalTask.save();

            const completionResult = await TasksWorker.processTaskCompletion(originalTask._id.toString());
            expect(completionResult.createdTask).toBeDefined();

            // 4. Verify total task count
            const allTasks = await Task.find({ userId: testUser._id });
            expect(allTasks.length).toBeGreaterThanOrEqual(4); // Original + 3 recurring + 1 new

            // 5. Delete original task and cleanup
            await Task.findByIdAndDelete(originalTask._id);
            const deletedCount = await TasksWorker.processTaskDeletion(
                originalTask._id.toString(),
                testUserId
            );

            expect(deletedCount).toBeGreaterThan(0);

            // 6. Verify cleanup
            const remainingTasks = await Task.find({ 
                parentRecurringId: originalTask._id 
            });
            expect(remainingTasks).toHaveLength(0);
        });
    });
});