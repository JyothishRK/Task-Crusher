// Integration test for sub-task validation workflows
const mongoose = require('mongoose');
const Task = require('../../src/models/task');
const User = require('../../src/models/user');
const Counter = require('../../src/models/counter');
const TaskService = require('../../src/services/taskService');

// Test database connection
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/task-app-integration-test';

describe('Sub-task Validation Integration Tests', () => {
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
            name: 'Sub-task Test User',
            email: 'subtask@example.com',
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

    describe('Sub-task Creation Validation', () => {
        test('should create valid sub-task with proper constraints', async () => {
            // Create parent task
            const parentTaskData = {
                title: 'Website Redesign',
                description: 'Complete website redesign project',
                dueDate: new Date(Date.now() + 7 * 86400000), // 7 days from now
                priority: 'high',
                category: 'development'
            };

            const parentTask = await TaskService.createTask(parentTaskData, testUserId);

            // Create sub-task
            const subTaskData = {
                title: 'Design Mockups',
                description: 'Create initial design mockups',
                dueDate: new Date(Date.now() + 3 * 86400000), // 3 days from now
                priority: 'medium',
                category: 'design',
                parentTaskId: parentTask._id
            };

            const subTask = await TaskService.createTask(subTaskData, testUserId);

            expect(subTask.parentTaskId).toEqual(parentTask._id);
            expect(subTask.repeatType).toBe('none');
            expect(subTask.dueDate.getTime()).toBeLessThanOrEqual(parentTask.dueDate.getTime());
            expect(subTask.taskId).toBeDefined();
            expect(subTask.originalDueDate).toEqual(subTask.dueDate);
        });

        test('should reject sub-task with due date after parent', async () => {
            // Create parent task
            const parentTask = await TaskService.createTask({
                title: 'Parent Task',
                dueDate: new Date(Date.now() + 86400000), // 1 day from now
            }, testUserId);

            // Try to create sub-task with later due date
            const subTaskData = {
                title: 'Invalid Sub-task',
                dueDate: new Date(Date.now() + 2 * 86400000), // 2 days from now
                parentTaskId: parentTask._id
            };

            await expect(
                TaskService.createTask(subTaskData, testUserId)
            ).rejects.toThrow();
        });

        test('should reject sub-task with recurring pattern', async () => {
            // Create parent task
            const parentTask = await TaskService.createTask({
                title: 'Parent Task',
                dueDate: new Date(Date.now() + 86400000),
            }, testUserId);

            // Try to create recurring sub-task
            const subTaskData = {
                title: 'Invalid Recurring Sub-task',
                dueDate: new Date(Date.now() + 86400000),
                parentTaskId: parentTask._id,
                repeatType: 'daily'
            };

            await expect(
                TaskService.createTask(subTaskData, testUserId)
            ).rejects.toThrow();
        });

        test('should reject sub-task with non-existent parent', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();

            const subTaskData = {
                title: 'Orphaned Sub-task',
                dueDate: new Date(Date.now() + 86400000),
                parentTaskId: nonExistentId
            };

            await expect(
                TaskService.createTask(subTaskData, testUserId)
            ).rejects.toThrow();
        });

        test('should reject sub-task with parent from different user', async () => {
            // Create another user
            const otherUser = new User({
                name: 'Other User',
                email: 'other@example.com',
                password: 'testpass123'
            });
            await otherUser.save();

            // Create parent task for other user
            const parentTask = await TaskService.createTask({
                title: 'Other User Task',
                dueDate: new Date(Date.now() + 86400000),
            }, otherUser._id.toString());

            // Try to create sub-task for current user with other user's parent
            const subTaskData = {
                title: 'Cross-user Sub-task',
                dueDate: new Date(Date.now() + 86400000),
                parentTaskId: parentTask._id
            };

            await expect(
                TaskService.createTask(subTaskData, testUserId)
            ).rejects.toThrow();
        });
    });

    describe('Sub-task Hierarchy Queries', () => {
        test('should retrieve task with all sub-tasks', async () => {
            // Create parent task
            const parentTask = await TaskService.createTask({
                title: 'Project Management',
                dueDate: new Date(Date.now() + 10 * 86400000),
                category: 'management'
            }, testUserId);

            // Create multiple sub-tasks
            const subTasks = [];
            for (let i = 1; i <= 3; i++) {
                const subTask = await TaskService.createTask({
                    title: `Sub-task ${i}`,
                    dueDate: new Date(Date.now() + i * 86400000),
                    parentTaskId: parentTask._id
                }, testUserId);
                subTasks.push(subTask);
            }

            // Get task with sub-tasks
            const taskWithSubtasks = await TaskService.getTaskWithSubtasks(
                parentTask._id.toString(),
                testUserId
            );

            expect(taskWithSubtasks.title).toBe('Project Management');
            expect(taskWithSubtasks.subTasks).toHaveLength(3);
            
            // Verify sub-tasks are sorted by due date
            const dueDates = taskWithSubtasks.subTasks.map(task => task.dueDate.getTime());
            for (let i = 1; i < dueDates.length; i++) {
                expect(dueDates[i]).toBeGreaterThanOrEqual(dueDates[i-1]);
            }
        });

        test('should handle task with no sub-tasks', async () => {
            const parentTask = await TaskService.createTask({
                title: 'Standalone Task',
                dueDate: new Date(Date.now() + 86400000),
            }, testUserId);

            const taskWithSubtasks = await TaskService.getTaskWithSubtasks(
                parentTask._id.toString(),
                testUserId
            );

            expect(taskWithSubtasks.title).toBe('Standalone Task');
            expect(taskWithSubtasks.subTasks).toHaveLength(0);
        });
    });

    describe('Sub-task Updates and Validation', () => {
        test('should allow valid sub-task updates', async () => {
            // Create parent task
            const parentTask = await TaskService.createTask({
                title: 'Parent Task',
                dueDate: new Date(Date.now() + 5 * 86400000),
            }, testUserId);

            // Create sub-task
            const subTask = await TaskService.createTask({
                title: 'Original Sub-task',
                dueDate: new Date(Date.now() + 2 * 86400000),
                parentTaskId: parentTask._id
            }, testUserId);

            // Update sub-task with valid data
            const updates = {
                title: 'Updated Sub-task',
                description: 'Updated description',
                priority: 'high',
                dueDate: new Date(Date.now() + 3 * 86400000) // Still before parent
            };

            const updatedTask = await TaskService.updateTask(
                subTask._id.toString(),
                updates,
                testUserId
            );

            expect(updatedTask.title).toBe('Updated Sub-task');
            expect(updatedTask.description).toBe('Updated description');
            expect(updatedTask.priority).toBe('high');
            expect(updatedTask.parentTaskId).toEqual(parentTask._id);
            expect(updatedTask.originalDueDate).toEqual(subTask.originalDueDate); // Should remain unchanged
        });

        test('should reject sub-task update with invalid due date', async () => {
            // Create parent task
            const parentTask = await TaskService.createTask({
                title: 'Parent Task',
                dueDate: new Date(Date.now() + 2 * 86400000),
            }, testUserId);

            // Create sub-task
            const subTask = await TaskService.createTask({
                title: 'Sub-task',
                dueDate: new Date(Date.now() + 86400000),
                parentTaskId: parentTask._id
            }, testUserId);

            // Try to update with due date after parent
            const invalidUpdates = {
                dueDate: new Date(Date.now() + 3 * 86400000)
            };

            await expect(
                TaskService.updateTask(subTask._id.toString(), invalidUpdates, testUserId)
            ).rejects.toThrow();
        });
    });

    describe('Complex Sub-task Scenarios', () => {
        test('should handle nested project structure', async () => {
            // Create main project task
            const projectTask = await TaskService.createTask({
                title: 'E-commerce Platform',
                dueDate: new Date(Date.now() + 30 * 86400000),
                category: 'development'
            }, testUserId);

            // Create phase tasks
            const frontendPhase = await TaskService.createTask({
                title: 'Frontend Development',
                dueDate: new Date(Date.now() + 15 * 86400000),
                parentTaskId: projectTask._id
            }, testUserId);

            const backendPhase = await TaskService.createTask({
                title: 'Backend Development',
                dueDate: new Date(Date.now() + 20 * 86400000),
                parentTaskId: projectTask._id
            }, testUserId);

            // Create specific tasks under each phase
            const frontendTasks = [];
            for (let i = 1; i <= 2; i++) {
                const task = await TaskService.createTask({
                    title: `Frontend Task ${i}`,
                    dueDate: new Date(Date.now() + (5 + i) * 86400000),
                    parentTaskId: frontendPhase._id
                }, testUserId);
                frontendTasks.push(task);
            }

            const backendTasks = [];
            for (let i = 1; i <= 2; i++) {
                const task = await TaskService.createTask({
                    title: `Backend Task ${i}`,
                    dueDate: new Date(Date.now() + (10 + i) * 86400000),
                    parentTaskId: backendPhase._id
                }, testUserId);
                backendTasks.push(task);
            }

            // Verify project structure
            const projectWithSubtasks = await TaskService.getTaskWithSubtasks(
                projectTask._id.toString(),
                testUserId
            );

            expect(projectWithSubtasks.subTasks).toHaveLength(2);

            const frontendWithSubtasks = await TaskService.getTaskWithSubtasks(
                frontendPhase._id.toString(),
                testUserId
            );

            expect(frontendWithSubtasks.subTasks).toHaveLength(2);

            const backendWithSubtasks = await TaskService.getTaskWithSubtasks(
                backendPhase._id.toString(),
                testUserId
            );

            expect(backendWithSubtasks.subTasks).toHaveLength(2);

            // Verify all tasks have unique IDs
            const allTasks = await Task.find({ userId: testUser._id });
            const taskIds = allTasks.map(task => task.taskId);
            const uniqueIds = new Set(taskIds);
            expect(uniqueIds.size).toBe(allTasks.length);
        });

        test('should maintain data integrity during complex operations', async () => {
            // Create parent task
            const parentTask = await TaskService.createTask({
                title: 'Data Integrity Test',
                dueDate: new Date(Date.now() + 10 * 86400000),
            }, testUserId);

            // Create multiple sub-tasks
            const subTasks = [];
            for (let i = 1; i <= 5; i++) {
                const subTask = await TaskService.createTask({
                    title: `Sub-task ${i}`,
                    dueDate: new Date(Date.now() + i * 86400000),
                    parentTaskId: parentTask._id,
                    priority: i % 2 === 0 ? 'high' : 'medium',
                    category: `category-${i}`
                }, testUserId);
                subTasks.push(subTask);
            }

            // Perform various operations
            // 1. Complete some sub-tasks
            for (let i = 0; i < 2; i++) {
                await TaskService.updateTask(
                    subTasks[i]._id.toString(),
                    { isCompleted: true },
                    testUserId
                );
            }

            // 2. Update parent task
            await TaskService.updateTask(
                parentTask._id.toString(),
                { 
                    description: 'Updated description',
                    priority: 'high'
                },
                testUserId
            );

            // 3. Delete one sub-task
            await TaskService.deleteTask(subTasks[4]._id.toString(), testUserId);

            // Verify final state
            const finalParent = await Task.findById(parentTask._id);
            expect(finalParent.description).toBe('Updated description');
            expect(finalParent.priority).toBe('high');
            expect(finalParent.originalDueDate).toEqual(parentTask.originalDueDate);

            const remainingSubTasks = await Task.find({ parentTaskId: parentTask._id });
            expect(remainingSubTasks).toHaveLength(4);

            const completedSubTasks = remainingSubTasks.filter(task => task.isCompleted);
            expect(completedSubTasks).toHaveLength(2);
        });
    });
});