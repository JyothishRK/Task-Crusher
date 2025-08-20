/**
 * Unit tests for Task Model with Numeric ID and New Fields
 */

const assert = require('assert');
const mongoose = require('mongoose');
const Task = require('../../src/models/task');
const User = require('../../src/models/user');
const Counter = require('../../src/models/counter');

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

describe('Task Model with Numeric ID and New Fields', () => {
    
    describe('taskId generation', () => {
        
        it('should generate taskId automatically for new tasks', async () => {
            await setupTestDB();
            
            // Create a user first
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const taskData = {
                userId: user.userId,
                title: 'Test Task',
                description: 'Test description',
                dueDate: new Date('2025-12-31')
            };
            
            const task = new Task(taskData);
            await task.save();
            
            assert.strictEqual(task.taskId, 1);
            assert.strictEqual(typeof task.taskId, 'number');
        });

        it('should generate sequential taskIds for multiple tasks', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const task1 = new Task({
                userId: user.userId,
                title: 'Task One',
                dueDate: new Date('2025-12-31')
            });
            await task1.save();
            
            const task2 = new Task({
                userId: user.userId,
                title: 'Task Two',
                dueDate: new Date('2025-12-31')
            });
            await task2.save();
            
            const task3 = new Task({
                userId: user.userId,
                title: 'Task Three',
                dueDate: new Date('2025-12-31')
            });
            await task3.save();
            
            assert.strictEqual(task1.taskId, 1);
            assert.strictEqual(task2.taskId, 2);
            assert.strictEqual(task3.taskId, 3);
        });

        it('should not generate taskId if already provided', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const task = new Task({
                taskId: 100,
                userId: user.userId,
                title: 'Test Task',
                dueDate: new Date('2025-12-31')
            });
            await task.save();
            
            assert.strictEqual(task.taskId, 100);
        });
    });

    describe('new fields', () => {
        
        it('should handle links array field', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const task = new Task({
                userId: user.userId,
                title: 'Test Task',
                dueDate: new Date('2025-12-31'),
                links: ['https://example.com', 'https://docs.example.com']
            });
            await task.save();
            
            assert.strictEqual(task.links.length, 2);
            assert.strictEqual(task.links[0], 'https://example.com');
            assert.strictEqual(task.links[1], 'https://docs.example.com');
        });

        it('should handle empty links array by default', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const task = new Task({
                userId: user.userId,
                title: 'Test Task',
                dueDate: new Date('2025-12-31')
            });
            await task.save();
            
            assert(Array.isArray(task.links));
            assert.strictEqual(task.links.length, 0);
        });

        it('should handle additionalDetails field', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const task = new Task({
                userId: user.userId,
                title: 'Test Task',
                dueDate: new Date('2025-12-31'),
                additionalDetails: 'This is additional information about the task'
            });
            await task.save();
            
            assert.strictEqual(task.additionalDetails, 'This is additional information about the task');
        });

        it('should default additionalDetails to empty string', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const task = new Task({
                userId: user.userId,
                title: 'Test Task',
                dueDate: new Date('2025-12-31')
            });
            await task.save();
            
            assert.strictEqual(task.additionalDetails, '');
        });
    });

    describe('parent-child relationships', () => {
        
        it('should create subtask with valid parentId', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const parentTask = new Task({
                userId: user.userId,
                title: 'Parent Task',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
            const subtask = new Task({
                userId: user.userId,
                title: 'Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: parentTask.taskId
            });
            await subtask.save();
            
            assert.strictEqual(subtask.parentId, parentTask.taskId);
            assert(subtask.isSubtask());
        });

        it('should reject subtask with non-existent parentId', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const subtask = new Task({
                userId: user.userId,
                title: 'Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: 999 // Non-existent task
            });
            
            try {
                await subtask.save();
                assert.fail('Should have thrown parent not found error');
            } catch (error) {
                assert(error.message.includes('Parent task not found'));
            }
        });

        it('should reject subtask with parent from different user', async () => {
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
            
            const parentTask = new Task({
                userId: user1.userId,
                title: 'Parent Task',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
            const subtask = new Task({
                userId: user2.userId,
                title: 'Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: parentTask.taskId
            });
            
            try {
                await subtask.save();
                assert.fail('Should have thrown same user validation error');
            } catch (error) {
                assert(error.message.includes('Parent task must belong to the same user'));
            }
        });

        it('should default parentId to null for main tasks', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const task = new Task({
                userId: user.userId,
                title: 'Main Task',
                dueDate: new Date('2025-12-31')
            });
            await task.save();
            
            assert.strictEqual(task.parentId, null);
            assert(!task.isSubtask());
        });
    });

    describe('task methods', () => {
        
        it('should identify subtasks correctly', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const parentTask = new Task({
                userId: user.userId,
                title: 'Parent Task',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
            const subtask = new Task({
                userId: user.userId,
                title: 'Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: parentTask.taskId
            });
            await subtask.save();
            
            assert(!parentTask.isSubtask());
            assert(subtask.isSubtask());
        });

        it('should get parent task', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const parentTask = new Task({
                userId: user.userId,
                title: 'Parent Task',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
            const subtask = new Task({
                userId: user.userId,
                title: 'Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: parentTask.taskId
            });
            await subtask.save();
            
            const parent = await subtask.getParent();
            assert.strictEqual(parent.taskId, parentTask.taskId);
            assert.strictEqual(parent.title, 'Parent Task');
        });

        it('should get subtasks', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const parentTask = new Task({
                userId: user.userId,
                title: 'Parent Task',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
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
            
            const subtasks = await parentTask.getSubtasks();
            assert.strictEqual(subtasks.length, 2);
            assert(subtasks.some(task => task.title === 'Subtask 1'));
            assert(subtasks.some(task => task.title === 'Subtask 2'));
        });

        it('should find task by taskId', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const task = new Task({
                userId: user.userId,
                title: 'Test Task',
                dueDate: new Date('2025-12-31')
            });
            await task.save();
            
            const foundTask = await Task.findByTaskId(task.taskId);
            assert.strictEqual(foundTask.taskId, task.taskId);
            assert.strictEqual(foundTask.title, 'Test Task');
        });

        it('should throw error for non-existent taskId', async () => {
            await setupTestDB();
            
            try {
                await Task.findByTaskId(999);
                assert.fail('Should have thrown task not found error');
            } catch (error) {
                assert.strictEqual(error.message, 'Task not found');
            }
        });
    });

    describe('existing functionality', () => {
        
        it('should maintain existing validation rules', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const task = new Task({
                userId: user.userId,
                title: '', // Invalid: empty title
                dueDate: new Date('2025-12-31')
            });
            
            try {
                await task.save();
                assert.fail('Should have thrown validation error');
            } catch (error) {
                assert(error.message.includes('Path `title` is required') || 
                       error.message.includes('shorter than the minimum'));
            }
        });

        it('should maintain existing methods', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const task = new Task({
                userId: user.userId,
                title: 'Test Task',
                dueDate: new Date('2024-01-01'), // Past date
                isCompleted: false
            });
            await task.save();
            
            assert(task.isOverdue());
            assert(task.daysUntilDue() < 0);
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
    console.log('Running Task Model Tests...');
    
    // Run cleanup after all tests
    process.on('exit', () => {
        cleanupTestDB().catch(console.error);
    });
    
    process.on('SIGINT', () => {
        cleanupTestDB().then(() => process.exit(0)).catch(console.error);
    });
}