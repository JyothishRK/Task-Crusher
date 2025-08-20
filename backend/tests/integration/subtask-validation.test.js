/**
 * Integration tests for Subtask Relationship Validation
 */

// Load environment
require('dotenv').config();

const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');
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

async function runTests() {
    console.log('Running Subtask Relationship Validation Tests...');
    
    try {
        // Test 1: Valid subtask creation
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
            title: 'Valid Subtask',
            dueDate: new Date('2025-12-31'),
            parentId: parentTask.taskId
        });
        await subtask.save();
        
        assert.strictEqual(subtask.parentId, parentTask.taskId);
        assert(subtask.isSubtask());
        
        console.log('  ✓ valid subtask creation works');

        // Test 2: Reject subtask with non-existent parentId
        await setupTestDB();
        
        const user2 = new User({
            name: 'Test User 2',
            email: 'test2@example.com',
            password: 'testpass123'
        });
        await user2.save();
        
        const invalidSubtask = new Task({
            userId: user2.userId,
            title: 'Invalid Subtask',
            dueDate: new Date('2025-12-31'),
            parentId: 999 // Non-existent task
        });
        
        try {
            await invalidSubtask.save();
            assert.fail('Should have thrown parent not found error');
        } catch (error) {
            assert(error.message.includes('Parent task not found'));
        }
        
        console.log('  ✓ rejects subtask with non-existent parentId');

        // Test 3: Reject subtask with parent from different user
        await setupTestDB();
        
        const user3a = new User({
            name: 'User 3A',
            email: 'user3a@example.com',
            password: 'testpass123'
        });
        await user3a.save();
        
        const user3b = new User({
            name: 'User 3B',
            email: 'user3b@example.com',
            password: 'testpass123'
        });
        await user3b.save();
        
        const parentTask3 = new Task({
            userId: user3a.userId,
            title: 'Parent Task User A',
            dueDate: new Date('2025-12-31')
        });
        await parentTask3.save();
        
        const crossUserSubtask = new Task({
            userId: user3b.userId,
            title: 'Cross User Subtask',
            dueDate: new Date('2025-12-31'),
            parentId: parentTask3.taskId
        });
        
        try {
            await crossUserSubtask.save();
            assert.fail('Should have thrown same user validation error');
        } catch (error) {
            assert(error.message.includes('Parent task must belong to the same user'));
        }
        
        console.log('  ✓ rejects subtask with parent from different user');

        // Test 4: Prevent circular references
        await setupTestDB();
        
        const user4 = new User({
            name: 'Test User 4',
            email: 'test4@example.com',
            password: 'testpass123'
        });
        await user4.save();
        
        const task4a = new Task({
            userId: user4.userId,
            title: 'Task A',
            dueDate: new Date('2025-12-31')
        });
        await task4a.save();
        
        const task4b = new Task({
            userId: user4.userId,
            title: 'Task B',
            dueDate: new Date('2025-12-31'),
            parentId: task4a.taskId
        });
        await task4b.save();
        
        // Now try to make task4a a child of task4b (circular reference)
        task4a.parentId = task4b.taskId;
        
        try {
            await task4a.save();
            assert.fail('Should have thrown circular reference error');
        } catch (error) {
            assert(error.message.includes('Circular parent-child relationship not allowed'));
        }
        
        console.log('  ✓ prevents circular references');

        // Test 5: Multiple levels of subtasks
        await setupTestDB();
        
        const user5 = new User({
            name: 'Test User 5',
            email: 'test5@example.com',
            password: 'testpass123'
        });
        await user5.save();
        
        const mainTask = new Task({
            userId: user5.userId,
            title: 'Main Task',
            dueDate: new Date('2025-12-31')
        });
        await mainTask.save();
        
        const subtask5a = new Task({
            userId: user5.userId,
            title: 'Subtask A',
            dueDate: new Date('2025-12-31'),
            parentId: mainTask.taskId
        });
        await subtask5a.save();
        
        const subtask5b = new Task({
            userId: user5.userId,
            title: 'Sub-subtask B',
            dueDate: new Date('2025-12-31'),
            parentId: subtask5a.taskId
        });
        await subtask5b.save();
        
        // Verify the hierarchy
        const parentOfB = await subtask5b.getParent();
        assert.strictEqual(parentOfB.taskId, subtask5a.taskId);
        
        const parentOfA = await subtask5a.getParent();
        assert.strictEqual(parentOfA.taskId, mainTask.taskId);
        
        const childrenOfMain = await mainTask.getSubtasks();
        assert.strictEqual(childrenOfMain.length, 1);
        assert.strictEqual(childrenOfMain[0].taskId, subtask5a.taskId);
        
        const childrenOfA = await subtask5a.getSubtasks();
        assert.strictEqual(childrenOfA.length, 1);
        assert.strictEqual(childrenOfA[0].taskId, subtask5b.taskId);
        
        console.log('  ✓ supports multiple levels of subtasks');

        // Test 6: Parent task deletion handling
        await setupTestDB();
        
        const user6 = new User({
            name: 'Test User 6',
            email: 'test6@example.com',
            password: 'testpass123'
        });
        await user6.save();
        
        const parentTask6 = new Task({
            userId: user6.userId,
            title: 'Parent Task to Delete',
            dueDate: new Date('2025-12-31')
        });
        await parentTask6.save();
        
        const subtask6a = new Task({
            userId: user6.userId,
            title: 'Subtask A',
            dueDate: new Date('2025-12-31'),
            parentId: parentTask6.taskId
        });
        await subtask6a.save();
        
        const subtask6b = new Task({
            userId: user6.userId,
            title: 'Subtask B',
            dueDate: new Date('2025-12-31'),
            parentId: parentTask6.taskId
        });
        await subtask6b.save();
        
        // Verify subtasks exist
        const subtasksBefore = await Task.find({ parentId: parentTask6.taskId });
        assert.strictEqual(subtasksBefore.length, 2);
        
        // Delete parent task
        await Task.deleteOne({ taskId: parentTask6.taskId });
        
        // Verify subtasks still exist but parent references are now invalid
        const subtasksAfter = await Task.find({ parentId: parentTask6.taskId });
        assert.strictEqual(subtasksAfter.length, 2);
        
        // Verify we can't create new subtasks with the deleted parent
        const orphanSubtask = new Task({
            userId: user6.userId,
            title: 'Orphan Subtask',
            dueDate: new Date('2025-12-31'),
            parentId: parentTask6.taskId
        });
        
        try {
            await orphanSubtask.save();
            assert.fail('Should have thrown parent not found error');
        } catch (error) {
            assert(error.message.includes('Parent task not found'));
        }
        
        console.log('  ✓ handles parent task deletion correctly');

        // Test 7: Subtask methods work correctly
        await setupTestDB();
        
        const user7 = new User({
            name: 'Test User 7',
            email: 'test7@example.com',
            password: 'testpass123'
        });
        await user7.save();
        
        const parentTask7 = new Task({
            userId: user7.userId,
            title: 'Parent Task 7',
            dueDate: new Date('2025-12-31')
        });
        await parentTask7.save();
        
        const subtask7 = new Task({
            userId: user7.userId,
            title: 'Subtask 7',
            dueDate: new Date('2025-12-31'),
            parentId: parentTask7.taskId
        });
        await subtask7.save();
        
        // Test isSubtask method
        assert(!parentTask7.isSubtask());
        assert(subtask7.isSubtask());
        
        // Test getParent method
        const parent = await subtask7.getParent();
        assert.strictEqual(parent.taskId, parentTask7.taskId);
        
        const noParent = await parentTask7.getParent();
        assert.strictEqual(noParent, null);
        
        // Test getSubtasks method
        const subtasks = await parentTask7.getSubtasks();
        assert.strictEqual(subtasks.length, 1);
        assert.strictEqual(subtasks[0].taskId, subtask7.taskId);
        
        const noSubtasks = await subtask7.getSubtasks();
        assert.strictEqual(noSubtasks.length, 0);
        
        console.log('  ✓ subtask methods work correctly');

        // Test 8: Updating parentId validation
        await setupTestDB();
        
        const user8 = new User({
            name: 'Test User 8',
            email: 'test8@example.com',
            password: 'testpass123'
        });
        await user8.save();
        
        const task8a = new Task({
            userId: user8.userId,
            title: 'Task 8A',
            dueDate: new Date('2025-12-31')
        });
        await task8a.save();
        
        const task8b = new Task({
            userId: user8.userId,
            title: 'Task 8B',
            dueDate: new Date('2025-12-31')
        });
        await task8b.save();
        
        const task8c = new Task({
            userId: user8.userId,
            title: 'Task 8C',
            dueDate: new Date('2025-12-31')
        });
        await task8c.save();
        
        // Make 8B a child of 8A
        task8b.parentId = task8a.taskId;
        await task8b.save();
        
        // Now try to make 8A a child of 8B (should fail)
        task8a.parentId = task8b.taskId;
        
        try {
            await task8a.save();
            assert.fail('Should have thrown circular reference error');
        } catch (error) {
            assert(error.message.includes('Circular parent-child relationship not allowed'));
        }
        
        // But making 8C a child of 8A should work
        task8c.parentId = task8a.taskId;
        await task8c.save();
        
        assert.strictEqual(task8c.parentId, task8a.taskId);
        
        console.log('  ✓ updating parentId validation works correctly');

        console.log('\n✅ All Subtask Relationship Validation tests passed!');
        
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