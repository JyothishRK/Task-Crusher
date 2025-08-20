/**
 * Integration tests for Hierarchical Task Fetching
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
        try {
            await mongoose.connect(testDbUri);
            isConnected = true;
        } catch (error) {
            console.log('Database connection failed, skipping integration tests');
            return false;
        }
    }
    // Clean up before each test
    await Task.deleteMany({});
    await User.deleteMany({});
    await Counter.deleteMany({});
    return true;
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

describe('Hierarchical Task Fetching - Integration Tests', () => {
    
    describe('End-to-end hierarchical workflow', () => {
        
        it('should create parent tasks and subtasks, then fetch hierarchically', async () => {
            const dbConnected = await setupTestDB();
            if (!dbConnected) {
                console.log('  ⚠ Skipping test - database not available');
                return;
            }
            
            // Create user
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create parent tasks
            const parentTask1 = new Task({
                userId: user.userId,
                title: 'Project A',
                description: 'Main project task',
                dueDate: new Date('2025-12-31'),
                priority: 'high',
                category: 'work'
            });
            await parentTask1.save();
            
            const parentTask2 = new Task({
                userId: user.userId,
                title: 'Project B',
                description: 'Another main project',
                dueDate: new Date('2025-11-30'),
                priority: 'medium',
                category: 'personal'
            });
            await parentTask2.save();
            
            // Create subtasks for Project A
            const subtaskA1 = new Task({
                userId: user.userId,
                title: 'Design Phase',
                description: 'Create initial designs',
                dueDate: new Date('2025-06-30'),
                priority: 'high',
                category: 'work',
                parentId: parentTask1.taskId
            });
            await subtaskA1.save();
            
            const subtaskA2 = new Task({
                userId: user.userId,
                title: 'Development Phase',
                description: 'Implement the solution',
                dueDate: new Date('2025-09-30'),
                priority: 'high',
                category: 'work',
                parentId: parentTask1.taskId
            });
            await subtaskA2.save();
            
            // Create subtasks for Project B
            const subtaskB1 = new Task({
                userId: user.userId,
                title: 'Research',
                description: 'Gather information',
                dueDate: new Date('2025-05-31'),
                priority: 'medium',
                category: 'personal',
                parentId: parentTask2.taskId
            });
            await subtaskB1.save();
            
            // Test 1: Fetch all top-level tasks (should only return parent tasks)
            const topLevelTasks = await Task.find({
                userId: user.userId,
                parentId: null
            }).sort({ dueDate: 1 });
            
            assert.strictEqual(topLevelTasks.length, 2);
            assert.strictEqual(topLevelTasks[0].title, 'Project B'); // Earlier due date
            assert.strictEqual(topLevelTasks[1].title, 'Project A');
            assert(topLevelTasks.every(task => task.parentId === null));
            
            // Test 2: Fetch subtasks for Project A
            const subtasksA = await Task.find({
                userId: user.userId,
                parentId: parentTask1.taskId
            }).sort({ dueDate: 1 });
            
            assert.strictEqual(subtasksA.length, 2);
            assert.strictEqual(subtasksA[0].title, 'Design Phase');
            assert.strictEqual(subtasksA[1].title, 'Development Phase');
            assert(subtasksA.every(task => task.parentId === parentTask1.taskId));
            
            // Test 3: Fetch subtasks for Project B
            const subtasksB = await Task.find({
                userId: user.userId,
                parentId: parentTask2.taskId
            }).sort({ dueDate: 1 });
            
            assert.strictEqual(subtasksB.length, 1);
            assert.strictEqual(subtasksB[0].title, 'Research');
            assert.strictEqual(subtasksB[0].parentId, parentTask2.taskId);
            
            // Test 4: Verify filtering works on top-level tasks
            const highPriorityParents = await Task.find({
                userId: user.userId,
                parentId: null,
                priority: 'high'
            });
            
            assert.strictEqual(highPriorityParents.length, 1);
            assert.strictEqual(highPriorityParents[0].title, 'Project A');
            
            // Test 5: Verify filtering works on subtasks
            const highPrioritySubtasks = await Task.find({
                userId: user.userId,
                parentId: parentTask1.taskId,
                priority: 'high'
            });
            
            assert.strictEqual(highPrioritySubtasks.length, 2);
            assert(highPrioritySubtasks.every(task => task.priority === 'high'));
        });

        it('should handle multiple levels of hierarchy', async () => {
            const dbConnected = await setupTestDB();
            if (!dbConnected) {
                console.log('  ⚠ Skipping test - database not available');
                return;
            }
            
            // Create user
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create parent task
            const parentTask = new Task({
                userId: user.userId,
                title: 'Main Project',
                dueDate: new Date('2025-12-31')
            });
            await parentTask.save();
            
            // Create subtask
            const subtask = new Task({
                userId: user.userId,
                title: 'Phase 1',
                dueDate: new Date('2025-06-30'),
                parentId: parentTask.taskId
            });
            await subtask.save();
            
            // Create sub-subtask (grandchild)
            const subSubtask = new Task({
                userId: user.userId,
                title: 'Task 1.1',
                dueDate: new Date('2025-03-31'),
                parentId: subtask.taskId
            });
            await subSubtask.save();
            
            // Test: Top-level should only return main project
            const topLevel = await Task.find({
                userId: user.userId,
                parentId: null
            });
            
            assert.strictEqual(topLevel.length, 1);
            assert.strictEqual(topLevel[0].title, 'Main Project');
            
            // Test: Subtasks of main project should only return Phase 1
            const level1Subtasks = await Task.find({
                userId: user.userId,
                parentId: parentTask.taskId
            });
            
            assert.strictEqual(level1Subtasks.length, 1);
            assert.strictEqual(level1Subtasks[0].title, 'Phase 1');
            
            // Test: Subtasks of Phase 1 should return Task 1.1
            const level2Subtasks = await Task.find({
                userId: user.userId,
                parentId: subtask.taskId
            });
            
            assert.strictEqual(level2Subtasks.length, 1);
            assert.strictEqual(level2Subtasks[0].title, 'Task 1.1');
        });

        it('should isolate tasks between different users', async () => {
            const dbConnected = await setupTestDB();
            if (!dbConnected) {
                console.log('  ⚠ Skipping test - database not available');
                return;
            }
            
            // Create two users
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
            
            // Create tasks for user1
            const user1Task = new Task({
                userId: user1.userId,
                title: 'User 1 Task',
                dueDate: new Date('2025-12-31')
            });
            await user1Task.save();
            
            const user1Subtask = new Task({
                userId: user1.userId,
                title: 'User 1 Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: user1Task.taskId
            });
            await user1Subtask.save();
            
            // Create tasks for user2
            const user2Task = new Task({
                userId: user2.userId,
                title: 'User 2 Task',
                dueDate: new Date('2025-12-31')
            });
            await user2Task.save();
            
            // Test: User1 should only see their own top-level tasks
            const user1TopLevel = await Task.find({
                userId: user1.userId,
                parentId: null
            });
            
            assert.strictEqual(user1TopLevel.length, 1);
            assert.strictEqual(user1TopLevel[0].title, 'User 1 Task');
            
            // Test: User2 should only see their own top-level tasks
            const user2TopLevel = await Task.find({
                userId: user2.userId,
                parentId: null
            });
            
            assert.strictEqual(user2TopLevel.length, 1);
            assert.strictEqual(user2TopLevel[0].title, 'User 2 Task');
            
            // Test: User1 should only see their own subtasks
            const user1Subtasks = await Task.find({
                userId: user1.userId,
                parentId: user1Task.taskId
            });
            
            assert.strictEqual(user1Subtasks.length, 1);
            assert.strictEqual(user1Subtasks[0].title, 'User 1 Subtask');
            
            // Test: User2 should not be able to access user1's subtasks
            const user2AccessToUser1Subtasks = await Task.find({
                userId: user2.userId,
                parentId: user1Task.taskId
            });
            
            assert.strictEqual(user2AccessToUser1Subtasks.length, 0);
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
    console.log('Running Hierarchical Task Fetching Integration Tests...');
    
    // Run cleanup after all tests
    process.on('exit', () => {
        cleanupTestDB().catch(console.error);
    });
    
    process.on('SIGINT', () => {
        cleanupTestDB().then(() => process.exit(0)).catch(console.error);
    });
}