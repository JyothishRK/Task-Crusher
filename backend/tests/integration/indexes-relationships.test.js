/**
 * Integration tests for Model Indexes and Relationships
 */

// Load environment
require('dotenv').config();

const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');
const UserActivity = require('../../src/models/userActivity');
const Counter = require('../../src/models/counter');

// Test database setup
let isConnected = false;

async function setupTestDB() {
    if (!isConnected) {
        const mainDbUri = process.env.MONGODB_URL;
        const testDbUri = mainDbUri.replace(/\/[^\/]*$/, '/task-app-test');
        await mongoose.connect(testDbUri);
        isConnected = true;
    }
    // Clean up before each test
    await UserActivity.deleteMany({});
    await Task.deleteMany({});
    await User.deleteMany({});
    await Counter.deleteMany({});
}

async function cleanupTestDB() {
    if (isConnected) {
        await UserActivity.deleteMany({});
        await Task.deleteMany({});
        await User.deleteMany({});
        await Counter.deleteMany({});
        await mongoose.disconnect();
        isConnected = false;
    }
}

async function runTests() {
    console.log('Running Indexes and Relationships Tests...');
    
    try {
        // Test 1: Verify numeric ID indexes work correctly
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
        
        // Test userId index
        const foundUser = await User.findOne({ userId: user.userId });
        assert.strictEqual(foundUser.userId, user.userId);
        
        // Test taskId index
        const foundTask = await Task.findOne({ taskId: task.taskId });
        assert.strictEqual(foundTask.taskId, task.taskId);
        
        console.log('  ✓ numeric ID indexes work correctly');

        // Test 2: Verify virtual relationships work with numeric IDs
        await setupTestDB();
        
        const user2 = new User({
            name: 'Test User 2',
            email: 'test2@example.com',
            password: 'testpass123'
        });
        await user2.save();
        
        const task1 = new Task({
            userId: user2.userId,
            title: 'Task 1',
            dueDate: new Date('2025-12-31')
        });
        await task1.save();
        
        const task2 = new Task({
            userId: user2.userId,
            title: 'Task 2',
            dueDate: new Date('2025-12-31')
        });
        await task2.save();
        
        // Test virtual relationship
        const userWithTasks = await User.findOne({ userId: user2.userId }).populate('tasks');
        assert.strictEqual(userWithTasks.tasks.length, 2);
        assert(userWithTasks.tasks.some(t => t.title === 'Task 1'));
        assert(userWithTasks.tasks.some(t => t.title === 'Task 2'));
        
        console.log('  ✓ virtual relationships work with numeric IDs');

        // Test 3: Verify parent-child task relationships
        await setupTestDB();
        
        const user3 = new User({
            name: 'Test User 3',
            email: 'test3@example.com',
            password: 'testpass123'
        });
        await user3.save();
        
        const parentTask = new Task({
            userId: user3.userId,
            title: 'Parent Task',
            dueDate: new Date('2025-12-31')
        });
        await parentTask.save();
        
        const subtask1 = new Task({
            userId: user3.userId,
            title: 'Subtask 1',
            dueDate: new Date('2025-12-31'),
            parentId: parentTask.taskId
        });
        await subtask1.save();
        
        const subtask2 = new Task({
            userId: user3.userId,
            title: 'Subtask 2',
            dueDate: new Date('2025-12-31'),
            parentId: parentTask.taskId
        });
        await subtask2.save();
        
        // Test parent-child relationships
        const parent = await subtask1.getParent();
        assert.strictEqual(parent.taskId, parentTask.taskId);
        
        const subtasks = await parentTask.getSubtasks();
        assert.strictEqual(subtasks.length, 2);
        assert(subtasks.some(t => t.title === 'Subtask 1'));
        assert(subtasks.some(t => t.title === 'Subtask 2'));
        
        console.log('  ✓ parent-child task relationships work correctly');

        // Test 4: Verify UserActivity relationships with numeric IDs
        await setupTestDB();
        
        const user4 = new User({
            name: 'Test User 4',
            email: 'test4@example.com',
            password: 'testpass123'
        });
        await user4.save();
        
        const task4 = new Task({
            userId: user4.userId,
            title: 'Test Task 4',
            dueDate: new Date('2025-12-31')
        });
        await task4.save();
        
        // Create activities
        await UserActivity.createActivity(user4.userId, 'login', 'User logged in');
        await UserActivity.createActivity(user4.userId, 'task_created', 'Task created', task4.taskId);
        await UserActivity.createActivity(user4.userId, 'task_updated', 'Task updated', task4.taskId);
        
        // Test UserActivity queries by numeric IDs
        const userActivities = await UserActivity.findByUserId(user4.userId);
        assert.strictEqual(userActivities.length, 3);
        assert(userActivities.every(a => a.userId === user4.userId));
        
        const taskActivities = await UserActivity.findByTaskId(task4.taskId);
        assert.strictEqual(taskActivities.length, 2);
        assert(taskActivities.every(a => a.taskId === task4.taskId));
        
        console.log('  ✓ UserActivity relationships work with numeric IDs');

        // Test 5: Verify compound indexes work efficiently
        await setupTestDB();
        
        const user5 = new User({
            name: 'Test User 5',
            email: 'test5@example.com',
            password: 'testpass123'
        });
        await user5.save();
        
        // Create multiple tasks with different properties
        for (let i = 0; i < 5; i++) {
            await new Task({
                userId: user5.userId,
                title: `Task ${i}`,
                dueDate: new Date(`2025-${String(i + 1).padStart(2, '0')}-01`),
                priority: i % 2 === 0 ? 'high' : 'low',
                category: i % 2 === 0 ? 'work' : 'personal',
                isCompleted: i % 3 === 0
            }).save();
        }
        
        // Test compound index queries
        const highPriorityTasks = await Task.find({ userId: user5.userId, priority: 'high' });
        assert.strictEqual(highPriorityTasks.length, 3);
        
        const workTasks = await Task.find({ userId: user5.userId, category: 'work' });
        assert.strictEqual(workTasks.length, 3);
        
        const completedTasks = await Task.find({ userId: user5.userId, isCompleted: true });
        assert.strictEqual(completedTasks.length, 2);
        
        console.log('  ✓ compound indexes work efficiently');

        // Test 6: Verify user deletion cascades to tasks
        await setupTestDB();
        
        const user6 = new User({
            name: 'Test User 6',
            email: 'test6@example.com',
            password: 'testpass123'
        });
        await user6.save();
        
        const task6 = new Task({
            userId: user6.userId,
            title: 'Task to be deleted',
            dueDate: new Date('2025-12-31')
        });
        await task6.save();
        
        // Verify task exists
        const tasksBefore = await Task.find({ userId: user6.userId });
        assert.strictEqual(tasksBefore.length, 1);
        
        // Delete user (this should cascade to tasks)
        const userToDelete = await User.findOne({ userId: user6.userId });
        await userToDelete.deleteOne();
        
        // Verify tasks are deleted
        const tasksAfter = await Task.find({ userId: user6.userId });
        assert.strictEqual(tasksAfter.length, 0);
        
        console.log('  ✓ user deletion cascades to tasks correctly');

        // Test 7: Verify unique constraints work
        await setupTestDB();
        
        const user7 = new User({
            name: 'Test User 7',
            email: 'test7@example.com',
            password: 'testpass123'
        });
        await user7.save();
        
        // Try to create user with same email
        const duplicateUser = new User({
            name: 'Duplicate User',
            email: 'test7@example.com',
            password: 'testpass123'
        });
        
        try {
            await duplicateUser.save();
            assert.fail('Should have thrown duplicate email error');
        } catch (error) {
            assert(error.message.includes('duplicate key') || error.code === 11000);
        }
        
        console.log('  ✓ unique constraints work correctly');

        // Test 8: Verify static methods work with numeric IDs
        await setupTestDB();
        
        const user8 = new User({
            name: 'Test User 8',
            email: 'test8@example.com',
            password: 'testpass123'
        });
        await user8.save();
        
        const task8 = new Task({
            userId: user8.userId,
            title: 'Test Task 8',
            dueDate: new Date('2025-12-31')
        });
        await task8.save();
        
        // Test static methods
        const foundUserById = await User.findByUserId(user8.userId);
        assert.strictEqual(foundUserById.userId, user8.userId);
        
        const foundTaskById = await Task.findByTaskId(task8.taskId);
        assert.strictEqual(foundTaskById.taskId, task8.taskId);
        
        const foundUserByCredentials = await User.findByCredentials('test8@example.com', 'testpass123');
        assert.strictEqual(foundUserByCredentials.userId, user8.userId);
        
        console.log('  ✓ static methods work with numeric IDs');

        console.log('\n✅ All Indexes and Relationships tests passed!');
        
    } catch (error) {
        console.log(`\n❌ Test failed: ${error.message}`);
        throw error;
    } finally {
        await cleanupTestDB();
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    runTests().catch((error) => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}