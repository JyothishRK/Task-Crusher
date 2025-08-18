/**
 * Complete System Integration Tests with Numeric IDs
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
    console.log('Running Complete System Integration Tests...');
    
    try {
        // Test 1: End-to-end user creation with numeric IDs
        await setupTestDB();
        
        const user1 = new User({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'securepass123',
            age: 30
        });
        await user1.save();
        
        const user2 = new User({
            name: 'Jane Smith',
            email: 'jane@example.com',
            password: 'securepass456',
            age: 25
        });
        await user2.save();
        
        // Verify sequential numeric IDs
        assert.strictEqual(user1.userId, 1);
        assert.strictEqual(user2.userId, 2);
        
        // Verify authentication tokens include numeric IDs
        const token1 = await user1.generateAuthToken();
        const token2 = await user2.generateAuthToken();
        
        assert(token1);
        assert(token2);
        assert.notStrictEqual(token1, token2);
        
        console.log('  ✓ end-to-end user creation with numeric IDs');

        // Test 2: End-to-end task creation with all new fields
        await setupTestDB();
        
        const user = new User({
            name: 'Task Creator',
            email: 'creator@example.com',
            password: 'taskpass123'
        });
        await user.save();
        
        // Create main task with all new fields
        const mainTask = new Task({
            userId: user.userId,
            title: 'Complete Project',
            description: 'Main project task',
            dueDate: new Date('2025-12-31'),
            priority: 'high',
            category: 'work',
            links: ['https://github.com/project', 'https://docs.project.com'],
            additionalDetails: 'This is a complex project requiring multiple subtasks'
        });
        await mainTask.save();
        
        // Create subtasks
        const subtask1 = new Task({
            userId: user.userId,
            title: 'Design Phase',
            description: 'Create project design',
            dueDate: new Date('2025-11-30'),
            priority: 'high',
            category: 'work',
            parentId: mainTask.taskId,
            links: ['https://figma.com/design'],
            additionalDetails: 'Focus on user experience'
        });
        await subtask1.save();
        
        const subtask2 = new Task({
            userId: user.userId,
            title: 'Development Phase',
            description: 'Implement the design',
            dueDate: new Date('2025-12-15'),
            priority: 'medium',
            category: 'work',
            parentId: mainTask.taskId
        });
        await subtask2.save();
        
        // Verify task structure
        assert.strictEqual(mainTask.taskId, 1);
        assert.strictEqual(subtask1.taskId, 2);
        assert.strictEqual(subtask2.taskId, 3);
        
        assert.strictEqual(mainTask.links.length, 2);
        assert.strictEqual(mainTask.additionalDetails, 'This is a complex project requiring multiple subtasks');
        
        assert.strictEqual(subtask1.parentId, mainTask.taskId);
        assert.strictEqual(subtask2.parentId, mainTask.taskId);
        
        // Test parent-child relationships
        const parent = await subtask1.getParent();
        assert.strictEqual(parent.taskId, mainTask.taskId);
        
        const children = await mainTask.getSubtasks();
        assert.strictEqual(children.length, 2);
        assert(children.some(t => t.taskId === subtask1.taskId));
        assert(children.some(t => t.taskId === subtask2.taskId));
        
        console.log('  ✓ end-to-end task creation with all new fields');

        // Test 3: UserActivity logging with numeric references
        await setupTestDB();
        
        const user3 = new User({
            name: 'Activity User',
            email: 'activity@example.com',
            password: 'activitypass123'
        });
        await user3.save();
        
        const task3 = new Task({
            userId: user3.userId,
            title: 'Activity Task',
            dueDate: new Date('2025-12-31')
        });
        await task3.save();
        
        // Log various activities
        await UserActivity.createActivity(user3.userId, 'login', 'User logged in successfully');
        await UserActivity.createActivity(user3.userId, 'task_created', 'Task created', task3.taskId);
        await UserActivity.createActivity(user3.userId, 'task_updated', 'Task priority changed', task3.taskId);
        await UserActivity.createActivity(user3.userId, 'task_completed', 'Task marked as complete', task3.taskId);
        await UserActivity.createActivity(user3.userId, 'logout', 'User logged out');
        
        // Verify activities
        const userActivities = await UserActivity.findByUserId(user3.userId);
        assert.strictEqual(userActivities.length, 5);
        assert(userActivities.every(a => a.userId === user3.userId));
        
        const taskActivities = await UserActivity.findByTaskId(task3.taskId);
        assert.strictEqual(taskActivities.length, 3);
        assert(taskActivities.every(a => a.taskId === task3.taskId));
        
        const loginActivities = await UserActivity.findByAction(user3.userId, 'login');
        assert.strictEqual(loginActivities.length, 1);
        assert.strictEqual(loginActivities[0].message, 'User logged in successfully');
        
        console.log('  ✓ UserActivity logging with numeric references');

        // Test 4: Complex task hierarchy with validation
        await setupTestDB();
        
        const user4 = new User({
            name: 'Hierarchy User',
            email: 'hierarchy@example.com',
            password: 'hierarchypass123'
        });
        await user4.save();
        
        // Create a complex task hierarchy
        const project = new Task({
            userId: user4.userId,
            title: 'Software Project',
            dueDate: new Date('2025-12-31'),
            priority: 'high',
            category: 'work'
        });
        await project.save();
        
        const phase1 = new Task({
            userId: user4.userId,
            title: 'Phase 1: Planning',
            dueDate: new Date('2025-10-31'),
            parentId: project.taskId
        });
        await phase1.save();
        
        const phase2 = new Task({
            userId: user4.userId,
            title: 'Phase 2: Development',
            dueDate: new Date('2025-11-30'),
            parentId: project.taskId
        });
        await phase2.save();
        
        const task1 = new Task({
            userId: user4.userId,
            title: 'Requirements Gathering',
            dueDate: new Date('2025-09-30'),
            parentId: phase1.taskId
        });
        await task1.save();
        
        const task2 = new Task({
            userId: user4.userId,
            title: 'System Design',
            dueDate: new Date('2025-10-15'),
            parentId: phase1.taskId
        });
        await task2.save();
        
        // Verify hierarchy
        const projectSubtasks = await project.getSubtasks();
        assert.strictEqual(projectSubtasks.length, 2);
        
        const phase1Subtasks = await phase1.getSubtasks();
        assert.strictEqual(phase1Subtasks.length, 2);
        
        const phase2Subtasks = await phase2.getSubtasks();
        assert.strictEqual(phase2Subtasks.length, 0);
        
        // Test that we can find tasks by their relationships
        const task1Parent = await task1.getParent();
        assert.strictEqual(task1Parent.taskId, phase1.taskId);
        
        const task2Parent = await task2.getParent();
        assert.strictEqual(task2Parent.taskId, phase1.taskId);
        
        console.log('  ✓ complex task hierarchy with validation');

        // Test 5: Concurrent operations with unique ID generation
        await setupTestDB();
        
        // Create multiple users concurrently
        const userPromises = [];
        for (let i = 0; i < 5; i++) {
            userPromises.push(new User({
                name: `Concurrent User ${i}`,
                email: `concurrent${i}@example.com`,
                password: 'concurrentpass123'
            }).save());
        }
        
        const users = await Promise.all(userPromises);
        const userIds = users.map(u => u.userId);
        const uniqueUserIds = [...new Set(userIds)];
        
        assert.strictEqual(uniqueUserIds.length, 5, 'All user IDs should be unique');
        assert.strictEqual(Math.min(...userIds), 1);
        assert.strictEqual(Math.max(...userIds), 5);
        
        // Create multiple tasks concurrently
        const taskPromises = [];
        for (let i = 0; i < 5; i++) {
            taskPromises.push(new Task({
                userId: users[i].userId,
                title: `Concurrent Task ${i}`,
                dueDate: new Date('2025-12-31')
            }).save());
        }
        
        const tasks = await Promise.all(taskPromises);
        const taskIds = tasks.map(t => t.taskId);
        const uniqueTaskIds = [...new Set(taskIds)];
        
        assert.strictEqual(uniqueTaskIds.length, 5, 'All task IDs should be unique');
        assert.strictEqual(Math.min(...taskIds), 1);
        assert.strictEqual(Math.max(...taskIds), 5);
        
        console.log('  ✓ concurrent operations with unique ID generation');

        // Test 6: User deletion cascade with numeric IDs
        await setupTestDB();
        
        const user6 = new User({
            name: 'Delete User',
            email: 'delete@example.com',
            password: 'deletepass123'
        });
        await user6.save();
        
        // Create tasks and activities for the user
        const task6a = new Task({
            userId: user6.userId,
            title: 'Task A',
            dueDate: new Date('2025-12-31')
        });
        await task6a.save();
        
        const task6b = new Task({
            userId: user6.userId,
            title: 'Task B',
            dueDate: new Date('2025-12-31'),
            parentId: task6a.taskId
        });
        await task6b.save();
        
        await UserActivity.createActivity(user6.userId, 'login', 'User logged in');
        await UserActivity.createActivity(user6.userId, 'task_created', 'Task created', task6a.taskId);
        
        // Verify data exists
        const tasksBefore = await Task.find({ userId: user6.userId });
        const activitiesBefore = await UserActivity.find({ userId: user6.userId });
        assert.strictEqual(tasksBefore.length, 2);
        assert.strictEqual(activitiesBefore.length, 2);
        
        // Delete user
        await user6.deleteOne();
        
        // Verify tasks are deleted (cascade)
        const tasksAfter = await Task.find({ userId: user6.userId });
        assert.strictEqual(tasksAfter.length, 0);
        
        // Activities remain (they're historical records)
        const activitiesAfter = await UserActivity.find({ userId: user6.userId });
        assert.strictEqual(activitiesAfter.length, 2);
        
        console.log('  ✓ user deletion cascade with numeric IDs');

        // Test 7: Cross-user data isolation
        await setupTestDB();
        
        const userA = new User({
            name: 'User A',
            email: 'usera@example.com',
            password: 'userApass123'
        });
        await userA.save();
        
        const userB = new User({
            name: 'User B',
            email: 'userb@example.com',
            password: 'userBpass123'
        });
        await userB.save();
        
        // Create tasks for each user
        const taskA1 = new Task({
            userId: userA.userId,
            title: 'User A Task 1',
            dueDate: new Date('2025-12-31'),
            priority: 'high'
        });
        await taskA1.save();
        
        const taskA2 = new Task({
            userId: userA.userId,
            title: 'User A Task 2',
            dueDate: new Date('2025-12-31'),
            priority: 'low'
        });
        await taskA2.save();
        
        const taskB1 = new Task({
            userId: userB.userId,
            title: 'User B Task 1',
            dueDate: new Date('2025-12-31'),
            priority: 'high'
        });
        await taskB1.save();
        
        // Verify data isolation
        const userATasks = await Task.find({ userId: userA.userId });
        const userBTasks = await Task.find({ userId: userB.userId });
        
        assert.strictEqual(userATasks.length, 2);
        assert.strictEqual(userBTasks.length, 1);
        assert(userATasks.every(t => t.userId === userA.userId));
        assert(userBTasks.every(t => t.userId === userB.userId));
        
        // Test that User B cannot create subtask under User A's task
        try {
            const invalidSubtask = new Task({
                userId: userB.userId,
                title: 'Invalid Subtask',
                dueDate: new Date('2025-12-31'),
                parentId: taskA1.taskId
            });
            await invalidSubtask.save();
            assert.fail('Should have prevented cross-user parent reference');
        } catch (error) {
            assert(error.message.includes('Parent task must belong to the same user'));
        }
        
        console.log('  ✓ cross-user data isolation');

        // Test 8: Performance with indexes
        await setupTestDB();
        
        const perfUser = new User({
            name: 'Performance User',
            email: 'perf@example.com',
            password: 'perfpass123'
        });
        await perfUser.save();
        
        // Create many tasks
        const taskCreationPromises = [];
        for (let i = 0; i < 50; i++) {
            taskCreationPromises.push(new Task({
                userId: perfUser.userId,
                title: `Performance Task ${i}`,
                dueDate: new Date(`2025-${String((i % 12) + 1).padStart(2, '0')}-01`),
                priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
                category: i % 2 === 0 ? 'work' : 'personal',
                isCompleted: i % 5 === 0
            }).save());
        }
        
        await Promise.all(taskCreationPromises);
        
        // Test various queries (these should be fast due to indexes)
        const startTime = Date.now();
        
        const allTasks = await Task.find({ userId: perfUser.userId });
        const highPriorityTasks = await Task.find({ userId: perfUser.userId, priority: 'high' });
        const workTasks = await Task.find({ userId: perfUser.userId, category: 'work' });
        const completedTasks = await Task.find({ userId: perfUser.userId, isCompleted: true });
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        assert.strictEqual(allTasks.length, 50);
        assert(highPriorityTasks.length > 0);
        assert(workTasks.length > 0);
        assert(completedTasks.length > 0);
        
        // Queries should be reasonably fast (less than 1 second for this test)
        assert(queryTime < 1000, `Queries took ${queryTime}ms, should be faster with indexes`);
        
        console.log('  ✓ performance with indexes');

        console.log('\n✅ All Complete System Integration tests passed!');
        
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