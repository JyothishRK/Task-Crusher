/**
 * Unit tests for Task Router with Hierarchical Fetching
 */

const assert = require('assert');
const mongoose = require('mongoose');
const Task = require('../../src/models/task');
const User = require('../../src/models/user');
const Counter = require('../../src/models/counter');
const { buildTaskFilters, buildSortCriteria, buildPaginationOptions } = require('../../src/utils/taskQueryUtils');

// Test database setup
let isConnected = false;

async function setupTestDB() {
    if (!isConnected) {
        const testDbUri = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/task-app-test';
        await mongoose.connect(testDbUri);
        isConnected = true;
    }
    // Clean up before each test
    await Task.deleteMany({});
    await User.deleteMany({});
    await Counter.deleteMany({});
}

async function cleanupTestDB() {
    if (isConnected) {
        await Task.deleteMany({});
        await User.deleteMany({});
        await Counter.deleteMany({});
        await mongoose.disconnect();
        isConnected = false;
    }
}

describe('Task Router - Hierarchical Fetching', () => {
    
    describe('GET /tasks endpoint (top-level tasks only)', () => {
        
        it('should return only top-level tasks (parentId is null)', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create parent task
            const parentTask = new Task({
                userId: user.userId,
                title: 'Parent Task',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
            // Create subtask
            const subtask = new Task({
                userId: user.userId,
                title: 'Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: parentTask.taskId
            });
            await subtask.save();
            
            // Simulate GET /tasks endpoint logic
            const userId = user.userId;
            const match = buildTaskFilters({}, { userId, parentId: null });
            const sort = buildSortCriteria();
            const { limit, skip } = buildPaginationOptions({});
            
            const tasks = await Task.find(match)
                .sort(sort)
                .limit(limit)
                .skip(skip);
            
            assert.strictEqual(tasks.length, 1);
            assert.strictEqual(tasks[0].title, 'Parent Task');
            assert.strictEqual(tasks[0].parentId, null);
        });

        it('should apply filters correctly to top-level tasks', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create completed parent task
            const completedParent = new Task({
                userId: user.userId,
                title: 'Completed Parent',
                dueDate: new Date('2025-12-31'),
                isCompleted: true,
                priority: 'high'
            });
            await completedParent.save();
            
            // Create incomplete parent task
            const incompleteParent = new Task({
                userId: user.userId,
                title: 'Incomplete Parent',
                dueDate: new Date('2025-12-31'),
                isCompleted: false,
                priority: 'low'
            });
            await incompleteParent.save();
            
            // Create subtask (should not appear in results)
            const subtask = new Task({
                userId: user.userId,
                title: 'Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: completedParent.taskId,
                isCompleted: true,
                priority: 'high'
            });
            await subtask.save();
            
            // Test completed filter
            const queryParams = { completed: 'true' };
            const match = buildTaskFilters(queryParams, { userId: user.userId, parentId: null });
            const tasks = await Task.find(match);
            
            assert.strictEqual(tasks.length, 1);
            assert.strictEqual(tasks[0].title, 'Completed Parent');
            assert.strictEqual(tasks[0].isCompleted, true);
        });

        it('should apply priority filter to top-level tasks', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create high priority parent task
            const highPriorityParent = new Task({
                userId: user.userId,
                title: 'High Priority Parent',
                dueDate: new Date('2025-12-31'),
                priority: 'high'
            });
            await highPriorityParent.save();
            
            // Create low priority parent task
            const lowPriorityParent = new Task({
                userId: user.userId,
                title: 'Low Priority Parent',
                dueDate: new Date('2025-12-31'),
                priority: 'low'
            });
            await lowPriorityParent.save();
            
            // Test priority filter
            const queryParams = { priority: 'high' };
            const match = buildTaskFilters(queryParams, { userId: user.userId, parentId: null });
            const tasks = await Task.find(match);
            
            assert.strictEqual(tasks.length, 1);
            assert.strictEqual(tasks[0].title, 'High Priority Parent');
            assert.strictEqual(tasks[0].priority, 'high');
        });

        it('should apply pagination to top-level tasks', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create multiple parent tasks
            for (let i = 1; i <= 5; i++) {
                const task = new Task({
                    userId: user.userId,
                    title: `Parent Task ${i}`,
                    dueDate: new Date('2025-12-31')
                });
                await task.save();
            }
            
            // Test pagination
            const queryParams = { limit: '2', skip: '1' };
            const match = buildTaskFilters({}, { userId: user.userId, parentId: null });
            const sort = buildSortCriteria();
            const { limit, skip } = buildPaginationOptions(queryParams);
            
            const tasks = await Task.find(match)
                .sort(sort)
                .limit(limit)
                .skip(skip);
            
            assert.strictEqual(tasks.length, 2);
            assert.strictEqual(tasks[0].title, 'Parent Task 2');
            assert.strictEqual(tasks[1].title, 'Parent Task 3');
        });

        it('should apply sorting to top-level tasks', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create tasks with different due dates
            const task1 = new Task({
                userId: user.userId,
                title: 'Task A',
                dueDate: new Date('2025-12-31')
            });
            await task1.save();
            
            const task2 = new Task({
                userId: user.userId,
                title: 'Task B',
                dueDate: new Date('2025-01-01')
            });
            await task2.save();
            
            // Test sorting by dueDate descending
            const match = buildTaskFilters({}, { userId: user.userId, parentId: null });
            const sort = buildSortCriteria('dueDate:desc');
            
            const tasks = await Task.find(match).sort(sort);
            
            assert.strictEqual(tasks.length, 2);
            assert.strictEqual(tasks[0].title, 'Task A'); // Later date first
            assert.strictEqual(tasks[1].title, 'Task B');
        });
    });

    describe('GET /tasks/:taskId/subtasks endpoint', () => {
        
        it('should return subtasks for a valid parent task', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create parent task
            const parentTask = new Task({
                userId: user.userId,
                title: 'Parent Task',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
            // Create subtasks
            const subtask1 = new Task({
                userId: user.userId,
                title: 'Subtask 1',
                dueDate: new Date('2025-12-31'),
                parentId: parentTask.taskId
            });
            await subtask1.save();
            
            const subtask2 = new Task({
                userId: user.userId,
                title: 'Subtask 2',
                dueDate: new Date('2025-12-31'),
                parentId: parentTask.taskId
            });
            await subtask2.save();
            
            // Simulate GET /tasks/:taskId/subtasks endpoint logic
            const taskId = parentTask.taskId;
            const userId = user.userId;
            
            // Verify parent task exists and belongs to user
            const parentExists = await Task.findOne({ taskId, userId });
            assert(parentExists, 'Parent task should exist');
            
            // Get subtasks
            const match = buildTaskFilters({}, { userId, parentId: taskId });
            const sort = buildSortCriteria();
            const { limit, skip } = buildPaginationOptions({});
            
            const subtasks = await Task.find(match)
                .sort(sort)
                .limit(limit)
                .skip(skip);
            
            assert.strictEqual(subtasks.length, 2);
            assert(subtasks.some(task => task.title === 'Subtask 1'));
            assert(subtasks.some(task => task.title === 'Subtask 2'));
            assert(subtasks.every(task => task.parentId === taskId));
        });

        it('should return error for invalid taskId parameter', async () => {
            await setupTestDB();
            
            // Simulate invalid taskId validation
            const taskId = 'invalid-id';
            const isValidTaskId = !isNaN(parseInt(taskId));
            
            assert.strictEqual(isValidTaskId, false);
            // In actual implementation, this would return 400 Bad Request
        });

        it('should return error for non-existent parent task', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Simulate checking for non-existent parent task
            const taskId = 999;
            const userId = user.userId;
            
            const parentTask = await Task.findOne({ taskId, userId });
            assert.strictEqual(parentTask, null);
            // In actual implementation, this would return 404 Not Found
        });

        it('should return error for parent task belonging to different user', async () => {
            await setupTestDB();
            
            const user1 = new User({
                name: 'User One',
                email: 'user1@example.com',
                password: 'testpass123'
            });
            await user1.save();
            
            const user2 = new User({
                name: 'User Two',
                email: 'user2@example.com',
                password: 'testpass123'
            });
            await user2.save();
            
            // Create parent task for user1
            const parentTask = new Task({
                userId: user1.userId,
                title: 'Parent Task',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
            // Try to access with user2's credentials
            const taskId = parentTask.taskId;
            const userId = user2.userId;
            
            const parentExists = await Task.findOne({ taskId, userId });
            assert.strictEqual(parentExists, null);
            // In actual implementation, this would return 404 Not Found
        });

        it('should apply filters to subtasks', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create parent task
            const parentTask = new Task({
                userId: user.userId,
                title: 'Parent Task',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
            // Create completed subtask
            const completedSubtask = new Task({
                userId: user.userId,
                title: 'Completed Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: parentTask.taskId,
                isCompleted: true
            });
            await completedSubtask.save();
            
            // Create incomplete subtask
            const incompleteSubtask = new Task({
                userId: user.userId,
                title: 'Incomplete Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: parentTask.taskId,
                isCompleted: false
            });
            await incompleteSubtask.save();
            
            // Test completed filter
            const queryParams = { completed: 'true' };
            const match = buildTaskFilters(queryParams, { userId: user.userId, parentId: parentTask.taskId });
            const subtasks = await Task.find(match);
            
            assert.strictEqual(subtasks.length, 1);
            assert.strictEqual(subtasks[0].title, 'Completed Subtask');
            assert.strictEqual(subtasks[0].isCompleted, true);
        });

        it('should apply priority filter to subtasks', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create parent task
            const parentTask = new Task({
                userId: user.userId,
                title: 'Parent Task',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
            // Create high priority subtask
            const highPrioritySubtask = new Task({
                userId: user.userId,
                title: 'High Priority Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: parentTask.taskId,
                priority: 'high'
            });
            await highPrioritySubtask.save();
            
            // Create low priority subtask
            const lowPrioritySubtask = new Task({
                userId: user.userId,
                title: 'Low Priority Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: parentTask.taskId,
                priority: 'low'
            });
            await lowPrioritySubtask.save();
            
            // Test priority filter
            const queryParams = { priority: 'high' };
            const match = buildTaskFilters(queryParams, { userId: user.userId, parentId: parentTask.taskId });
            const subtasks = await Task.find(match);
            
            assert.strictEqual(subtasks.length, 1);
            assert.strictEqual(subtasks[0].title, 'High Priority Subtask');
            assert.strictEqual(subtasks[0].priority, 'high');
        });

        it('should apply pagination to subtasks', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create parent task
            const parentTask = new Task({
                userId: user.userId,
                title: 'Parent Task',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
            // Create multiple subtasks
            for (let i = 1; i <= 5; i++) {
                const subtask = new Task({
                    userId: user.userId,
                    title: `Subtask ${i}`,
                    dueDate: new Date('2025-12-31'),
                    parentId: parentTask.taskId
                });
                await subtask.save();
            }
            
            // Test pagination
            const queryParams = { limit: '2', skip: '1' };
            const match = buildTaskFilters({}, { userId: user.userId, parentId: parentTask.taskId });
            const sort = buildSortCriteria();
            const { limit, skip } = buildPaginationOptions(queryParams);
            
            const subtasks = await Task.find(match)
                .sort(sort)
                .limit(limit)
                .skip(skip);
            
            assert.strictEqual(subtasks.length, 2);
            assert.strictEqual(subtasks[0].title, 'Subtask 2');
            assert.strictEqual(subtasks[1].title, 'Subtask 3');
        });

        it('should apply sorting to subtasks', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create parent task
            const parentTask = new Task({
                userId: user.userId,
                title: 'Parent Task',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
            // Create subtasks with different due dates
            const subtask1 = new Task({
                userId: user.userId,
                title: 'Subtask A',
                dueDate: new Date('2025-12-31'),
                parentId: parentTask.taskId
            });
            await subtask1.save();
            
            const subtask2 = new Task({
                userId: user.userId,
                title: 'Subtask B',
                dueDate: new Date('2025-01-01'),
                parentId: parentTask.taskId
            });
            await subtask2.save();
            
            // Test sorting by dueDate descending
            const match = buildTaskFilters({}, { userId: user.userId, parentId: parentTask.taskId });
            const sort = buildSortCriteria('dueDate:desc');
            
            const subtasks = await Task.find(match).sort(sort);
            
            assert.strictEqual(subtasks.length, 2);
            assert.strictEqual(subtasks[0].title, 'Subtask A'); // Later date first
            assert.strictEqual(subtasks[1].title, 'Subtask B');
        });
    });
});

// Simple test runner
function describe(name, fn) {
    console.log(`\n${name}`);
    fn();
}

function it(name, fn) {
    const testPromise = (async () => {
        try {
            await fn();
            console.log(`  ✓ ${name}`);
        } catch (error) {
            console.log(`  ✗ ${name}`);
            console.error(`    ${error.message}`);
            process.exit(1);
        }
    })();
    
    return testPromise;
}

// Run the tests if this file is executed directly
if (require.main === module) {
    console.log('Running Task Router Tests...');
    
    // Run cleanup after all tests
    process.on('exit', () => {
        cleanupTestDB().catch(console.error);
    });
    
    process.on('SIGINT', () => {
        cleanupTestDB().then(() => process.exit(0)).catch(console.error);
    });
}