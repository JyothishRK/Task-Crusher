/**
 * Unit tests for UserActivity Model with Numeric References
 */

const assert = require('assert');
const mongoose = require('mongoose');
const UserActivity = require('../../src/models/userActivity');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');
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

describe('UserActivity Model with Numeric References', () => {
    
    describe('basic functionality', () => {
        
        it('should create activity with numeric userId', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const activity = new UserActivity({
                userId: user.userId,
                action: 'login',
                message: 'User logged in successfully'
            });
            await activity.save();
            
            assert.strictEqual(activity.userId, user.userId);
            assert.strictEqual(typeof activity.userId, 'number');
            assert.strictEqual(activity.action, 'login');
            assert.strictEqual(activity.message, 'User logged in successfully');
            assert(activity.timestamp instanceof Date);
        });

        it('should create activity with numeric taskId', async () => {
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
            
            const activity = new UserActivity({
                userId: user.userId,
                action: 'task_created',
                message: 'Task created successfully',
                taskId: task.taskId
            });
            await activity.save();
            
            assert.strictEqual(activity.userId, user.userId);
            assert.strictEqual(activity.taskId, task.taskId);
            assert.strictEqual(typeof activity.taskId, 'number');
        });

        it('should create activity without taskId', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const activity = new UserActivity({
                userId: user.userId,
                action: 'profile_updated',
                message: 'User profile updated'
            });
            await activity.save();
            
            assert.strictEqual(activity.userId, user.userId);
            assert.strictEqual(activity.taskId, undefined);
        });

        it('should create activity with error field', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const activity = new UserActivity({
                userId: user.userId,
                action: 'task_creation_failed',
                message: 'Failed to create task',
                error: 'Validation error: title is required'
            });
            await activity.save();
            
            assert.strictEqual(activity.userId, user.userId);
            assert.strictEqual(activity.error, 'Validation error: title is required');
        });
    });

    describe('validation', () => {
        
        it('should require userId', async () => {
            await setupTestDB();
            
            const activity = new UserActivity({
                action: 'test_action',
                message: 'Test message'
            });
            
            try {
                await activity.save();
                assert.fail('Should have thrown validation error');
            } catch (error) {
                assert(error.message.includes('userId') && error.message.includes('required'));
            }
        });

        it('should require action', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const activity = new UserActivity({
                userId: user.userId,
                message: 'Test message'
            });
            
            try {
                await activity.save();
                assert.fail('Should have thrown validation error');
            } catch (error) {
                assert(error.message.includes('action') && error.message.includes('required'));
            }
        });

        it('should require message', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const activity = new UserActivity({
                userId: user.userId,
                action: 'test_action'
            });
            
            try {
                await activity.save();
                assert.fail('Should have thrown validation error');
            } catch (error) {
                assert(error.message.includes('message') && error.message.includes('required'));
            }
        });
    });

    describe('static methods', () => {
        
        it('should find activities by userId', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create multiple activities
            await UserActivity.createActivity(user.userId, 'login', 'User logged in');
            await UserActivity.createActivity(user.userId, 'logout', 'User logged out');
            await UserActivity.createActivity(user.userId, 'profile_update', 'Profile updated');
            
            const activities = await UserActivity.findByUserId(user.userId);
            
            assert.strictEqual(activities.length, 3);
            assert(activities.every(activity => activity.userId === user.userId));
            // Should be sorted by timestamp descending
            assert(activities[0].timestamp >= activities[1].timestamp);
            assert(activities[1].timestamp >= activities[2].timestamp);
        });

        it('should find activities by taskId', async () => {
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
            
            // Create activities for the task
            await UserActivity.createActivity(user.userId, 'task_created', 'Task created', task.taskId);
            await UserActivity.createActivity(user.userId, 'task_updated', 'Task updated', task.taskId);
            await UserActivity.createActivity(user.userId, 'task_completed', 'Task completed', task.taskId);
            
            const activities = await UserActivity.findByTaskId(task.taskId);
            
            assert.strictEqual(activities.length, 3);
            assert(activities.every(activity => activity.taskId === task.taskId));
        });

        it('should find activities by action', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create activities with different actions
            await UserActivity.createActivity(user.userId, 'login', 'First login');
            await UserActivity.createActivity(user.userId, 'login', 'Second login');
            await UserActivity.createActivity(user.userId, 'logout', 'User logged out');
            
            const loginActivities = await UserActivity.findByAction(user.userId, 'login');
            
            assert.strictEqual(loginActivities.length, 2);
            assert(loginActivities.every(activity => activity.action === 'login'));
            assert(loginActivities.every(activity => activity.userId === user.userId));
        });

        it('should create activity using static method', async () => {
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
            
            const activity = await UserActivity.createActivity(
                user.userId,
                'task_created',
                'Task created successfully',
                task.taskId
            );
            
            assert.strictEqual(activity.userId, user.userId);
            assert.strictEqual(activity.taskId, task.taskId);
            assert.strictEqual(activity.action, 'task_created');
            assert.strictEqual(activity.message, 'Task created successfully');
        });

        it('should create activity with error using static method', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const activity = await UserActivity.createActivity(
                user.userId,
                'task_creation_failed',
                'Failed to create task',
                null,
                'Validation error'
            );
            
            assert.strictEqual(activity.userId, user.userId);
            assert.strictEqual(activity.taskId, null);
            assert.strictEqual(activity.error, 'Validation error');
        });

        it('should limit results in query methods', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            // Create many activities
            for (let i = 0; i < 10; i++) {
                await UserActivity.createActivity(user.userId, 'test_action', `Message ${i}`);
            }
            
            const activities = await UserActivity.findByUserId(user.userId, 5);
            
            assert.strictEqual(activities.length, 5);
        });
    });

    describe('integration with other models', () => {
        
        it('should work with multiple users and tasks', async () => {
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
            
            const task1 = new Task({
                userId: user1.userId,
                title: 'Task One',
                dueDate: new Date('2025-12-31')
            });
            await task1.save();
            
            const task2 = new Task({
                userId: user2.userId,
                title: 'Task Two',
                dueDate: new Date('2025-12-31')
            });
            await task2.save();
            
            // Create activities for different users and tasks
            await UserActivity.createActivity(user1.userId, 'task_created', 'Task created', task1.taskId);
            await UserActivity.createActivity(user2.userId, 'task_created', 'Task created', task2.taskId);
            await UserActivity.createActivity(user1.userId, 'login', 'User logged in');
            
            const user1Activities = await UserActivity.findByUserId(user1.userId);
            const user2Activities = await UserActivity.findByUserId(user2.userId);
            const task1Activities = await UserActivity.findByTaskId(task1.taskId);
            const task2Activities = await UserActivity.findByTaskId(task2.taskId);
            
            assert.strictEqual(user1Activities.length, 2);
            assert.strictEqual(user2Activities.length, 1);
            assert.strictEqual(task1Activities.length, 1);
            assert.strictEqual(task2Activities.length, 1);
            
            assert.strictEqual(task1Activities[0].userId, user1.userId);
            assert.strictEqual(task2Activities[0].userId, user2.userId);
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
    console.log('Running UserActivity Model Tests...');
    
    // Run cleanup after all tests
    process.on('exit', () => {
        cleanupTestDB().catch(console.error);
    });
    
    process.on('SIGINT', () => {
        cleanupTestDB().then(() => process.exit(0)).catch(console.error);
    });
}