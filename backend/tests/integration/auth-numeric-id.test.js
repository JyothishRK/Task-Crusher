/**
 * Integration tests for Authentication with Numeric IDs
 */

// Load environment
require('dotenv').config();

const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');
const Counter = require('../../src/models/counter');
const jwt = require('jsonwebtoken');

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
    console.log('Running Authentication with Numeric IDs Tests...');
    
    try {
        // Test 1: JWT token generation includes numeric userId
        await setupTestDB();
        
        const user = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'testpass123'
        });
        await user.save();
        
        const token = await user.generateAuthToken();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        assert(decoded.userId, 'JWT should include numeric userId');
        assert.strictEqual(decoded.userId, user.userId);
        assert(decoded._id, 'JWT should include ObjectId for backward compatibility');
        
        console.log('  ✓ JWT token generation includes numeric userId');

        // Test 2: Authentication middleware works with numeric userId
        await setupTestDB();
        
        const user2 = new User({
            name: 'Test User 2',
            email: 'test2@example.com',
            password: 'testpass123'
        });
        await user2.save();
        
        const token2 = await user2.generateAuthToken();
        
        // Mock request and response objects
        const mockReq = {
            cookies: { auth_token: token2 },
            ip: '127.0.0.1',
            get: () => 'test-user-agent',
            path: '/test',
            method: 'GET'
        };
        
        const mockRes = {
            status: () => mockRes,
            send: () => mockRes
        };
        
        let nextCalled = false;
        const mockNext = () => { nextCalled = true; };
        
        // Import and test auth middleware
        const authMiddleware = require('../../src/middleware/auth');
        await authMiddleware(mockReq, mockRes, mockNext);
        
        assert(nextCalled, 'Auth middleware should call next()');
        assert(mockReq.user, 'Auth middleware should attach user to request');
        assert.strictEqual(mockReq.user.userId, user2.userId);
        assert.strictEqual(mockReq.token, token2);
        
        console.log('  ✓ authentication middleware works with numeric userId');

        // Test 3: User lookup by credentials works
        await setupTestDB();
        
        const user3 = new User({
            name: 'Test User 3',
            email: 'test3@example.com',
            password: 'testpass123'
        });
        await user3.save();
        
        const foundUser = await User.findByCredentials('test3@example.com', 'testpass123');
        assert.strictEqual(foundUser.userId, user3.userId);
        assert.strictEqual(foundUser.email, 'test3@example.com');
        
        console.log('  ✓ user lookup by credentials works');

        // Test 4: User lookup by numeric userId works
        await setupTestDB();
        
        const user4 = new User({
            name: 'Test User 4',
            email: 'test4@example.com',
            password: 'testpass123'
        });
        await user4.save();
        
        const foundUserById = await User.findByUserId(user4.userId);
        assert.strictEqual(foundUserById.userId, user4.userId);
        assert.strictEqual(foundUserById.email, 'test4@example.com');
        
        console.log('  ✓ user lookup by numeric userId works');

        // Test 5: Task creation with numeric userId works
        await setupTestDB();
        
        const user5 = new User({
            name: 'Test User 5',
            email: 'test5@example.com',
            password: 'testpass123'
        });
        await user5.save();
        
        const task = new Task({
            userId: user5.userId,
            title: 'Test Task',
            dueDate: new Date('2025-12-31')
        });
        await task.save();
        
        assert.strictEqual(task.userId, user5.userId);
        assert(task.taskId, 'Task should have numeric taskId');
        
        console.log('  ✓ task creation with numeric userId works');

        // Test 6: Task queries by numeric userId work
        await setupTestDB();
        
        const user6 = new User({
            name: 'Test User 6',
            email: 'test6@example.com',
            password: 'testpass123'
        });
        await user6.save();
        
        const task6a = new Task({
            userId: user6.userId,
            title: 'Task A',
            dueDate: new Date('2025-12-31'),
            priority: 'high'
        });
        await task6a.save();
        
        const task6b = new Task({
            userId: user6.userId,
            title: 'Task B',
            dueDate: new Date('2025-12-31'),
            priority: 'low'
        });
        await task6b.save();
        
        // Query tasks by userId
        const userTasks = await Task.find({ userId: user6.userId });
        assert.strictEqual(userTasks.length, 2);
        assert(userTasks.every(t => t.userId === user6.userId));
        
        // Query tasks by priority
        const highPriorityTasks = await Task.find({ userId: user6.userId, priority: 'high' });
        assert.strictEqual(highPriorityTasks.length, 1);
        assert.strictEqual(highPriorityTasks[0].title, 'Task A');
        
        console.log('  ✓ task queries by numeric userId work');

        // Test 7: Task lookup by numeric taskId works
        await setupTestDB();
        
        const user7 = new User({
            name: 'Test User 7',
            email: 'test7@example.com',
            password: 'testpass123'
        });
        await user7.save();
        
        const task7 = new Task({
            userId: user7.userId,
            title: 'Test Task 7',
            dueDate: new Date('2025-12-31')
        });
        await task7.save();
        
        const foundTask = await Task.findByTaskId(task7.taskId);
        assert.strictEqual(foundTask.taskId, task7.taskId);
        assert.strictEqual(foundTask.title, 'Test Task 7');
        
        console.log('  ✓ task lookup by numeric taskId works');

        // Test 8: User deletion cascades to tasks with numeric IDs
        await setupTestDB();
        
        const user8 = new User({
            name: 'Test User 8',
            email: 'test8@example.com',
            password: 'testpass123'
        });
        await user8.save();
        
        const task8 = new Task({
            userId: user8.userId,
            title: 'Task to be deleted',
            dueDate: new Date('2025-12-31')
        });
        await task8.save();
        
        // Verify task exists
        const tasksBefore = await Task.find({ userId: user8.userId });
        assert.strictEqual(tasksBefore.length, 1);
        
        // Delete user
        await user8.deleteOne();
        
        // Verify tasks are deleted
        const tasksAfter = await Task.find({ userId: user8.userId });
        assert.strictEqual(tasksAfter.length, 0);
        
        console.log('  ✓ user deletion cascades to tasks with numeric IDs');

        // Test 9: Backward compatibility with ObjectId tokens
        await setupTestDB();
        
        const user9 = new User({
            name: 'Test User 9',
            email: 'test9@example.com',
            password: 'testpass123'
        });
        await user9.save();
        
        // Create an old-style token with only ObjectId
        const oldToken = jwt.sign({ _id: user9._id.toString() }, process.env.JWT_SECRET);
        user9.tokens = user9.tokens.concat({ token: oldToken });
        await user9.save();
        
        // Mock request with old token
        const mockReqOld = {
            cookies: { auth_token: oldToken },
            ip: '127.0.0.1',
            get: () => 'test-user-agent',
            path: '/test',
            method: 'GET'
        };
        
        const mockResOld = {
            status: () => mockResOld,
            send: () => mockResOld
        };
        
        let nextCalledOld = false;
        const mockNextOld = () => { nextCalledOld = true; };
        
        // Test auth middleware with old token
        const authMiddleware2 = require('../../src/middleware/auth');
        await authMiddleware2(mockReqOld, mockResOld, mockNextOld);
        
        assert(nextCalledOld, 'Auth middleware should work with old tokens');
        assert(mockReqOld.user, 'Auth middleware should attach user to request');
        assert.strictEqual(mockReqOld.user.userId, user9.userId);
        
        console.log('  ✓ backward compatibility with ObjectId tokens works');

        // Test 10: New fields in tasks work correctly
        await setupTestDB();
        
        const user10 = new User({
            name: 'Test User 10',
            email: 'test10@example.com',
            password: 'testpass123'
        });
        await user10.save();
        
        const parentTask = new Task({
            userId: user10.userId,
            title: 'Parent Task',
            dueDate: new Date('2025-12-31'),
            links: ['https://example.com', 'https://docs.example.com'],
            additionalDetails: 'This is additional information'
        });
        await parentTask.save();
        
        const subtask = new Task({
            userId: user10.userId,
            title: 'Subtask',
            dueDate: new Date('2025-12-31'),
            parentId: parentTask.taskId
        });
        await subtask.save();
        
        // Verify new fields
        assert.strictEqual(parentTask.links.length, 2);
        assert.strictEqual(parentTask.links[0], 'https://example.com');
        assert.strictEqual(parentTask.additionalDetails, 'This is additional information');
        assert.strictEqual(subtask.parentId, parentTask.taskId);
        assert(subtask.isSubtask());
        
        console.log('  ✓ new fields in tasks work correctly');

        console.log('\n✅ All Authentication with Numeric IDs tests passed!');
        
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