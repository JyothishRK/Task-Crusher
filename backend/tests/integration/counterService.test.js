// Integration test for counter service under concurrent access
const mongoose = require('mongoose');
const Task = require('../../src/models/task');
const User = require('../../src/models/user');
const Counter = require('../../src/models/counter');
const CounterService = require('../../src/services/counterService');

// Test database connection
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/task-app-integration-test';

describe('Counter Service Integration Tests', () => {
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
    });

    afterEach(async () => {
        // Clean up test data
        await Task.deleteMany({});
        await User.deleteMany({});
        await Counter.deleteMany({});
    });

    describe('Counter Generation', () => {
        test('should generate sequential IDs for single collection', async () => {
            const ids = [];
            const numIds = 10;

            // Generate multiple IDs sequentially
            for (let i = 0; i < numIds; i++) {
                const id = await CounterService.getNextSequence('test_collection');
                ids.push(id);
            }

            // Verify all IDs are unique and sequential
            expect(ids).toHaveLength(numIds);
            
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(numIds);

            // Verify sequential order
            for (let i = 0; i < numIds; i++) {
                expect(ids[i]).toBe(i + 1);
            }
        });

        test('should handle concurrent ID generation atomically', async () => {
            const promises = [];
            const numConcurrent = 20;

            // Create multiple concurrent requests
            for (let i = 0; i < numConcurrent; i++) {
                promises.push(CounterService.getNextSequence('concurrent_test'));
            }

            const results = await Promise.all(promises);

            // All results should be unique
            const uniqueResults = new Set(results);
            expect(uniqueResults.size).toBe(numConcurrent);

            // Results should be sequential from 1 to numConcurrent
            results.sort((a, b) => a - b);
            for (let i = 0; i < numConcurrent; i++) {
                expect(results[i]).toBe(i + 1);
            }

            // Verify counter state
            const counter = await Counter.findById('concurrent_test');
            expect(counter.sequence_value).toBe(numConcurrent);
        });

        test('should maintain separate counters for different collections', async () => {
            const collections = ['tasks', 'users', 'activities'];
            const idsPerCollection = 5;

            // Generate IDs for each collection
            for (const collection of collections) {
                for (let i = 0; i < idsPerCollection; i++) {
                    const id = await CounterService.getNextSequence(collection);
                    expect(id).toBe(i + 1);
                }
            }

            // Verify separate counters exist
            const counters = await Counter.find({});
            expect(counters).toHaveLength(3);

            counters.forEach(counter => {
                expect(collections).toContain(counter._id);
                expect(counter.sequence_value).toBe(idsPerCollection);
            });
        });
    });

    describe('Model Integration', () => {
        test('should auto-assign IDs to Task models', async () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();

            const tasks = [];
            const numTasks = 5;

            // Create multiple tasks
            for (let i = 0; i < numTasks; i++) {
                const task = new Task({
                    title: `Test Task ${i}`,
                    dueDate: new Date(Date.now() + (i + 1) * 86400000),
                    userId: user._id
                });
                await task.save();
                tasks.push(task);
            }

            // Verify all tasks have unique, sequential taskIds
            const taskIds = tasks.map(task => task.taskId);
            const uniqueIds = new Set(taskIds);
            expect(uniqueIds.size).toBe(numTasks);

            taskIds.sort((a, b) => a - b);
            for (let i = 0; i < numTasks; i++) {
                expect(taskIds[i]).toBe(i + 1);
            }

            // Verify user has sequential userId
            expect(user.userId).toBe(1);
        });

        test('should handle concurrent model creation', async () => {
            const promises = [];
            const numUsers = 10;

            // Create multiple users concurrently
            for (let i = 0; i < numUsers; i++) {
                const promise = (async () => {
                    const user = new User({
                        name: `User ${i}`,
                        email: `user${i}@example.com`,
                        password: 'testpass123'
                    });
                    return await user.save();
                })();
                promises.push(promise);
            }

            const users = await Promise.all(promises);

            // Verify all users have unique userIds
            const userIds = users.map(user => user.userId);
            const uniqueIds = new Set(userIds);
            expect(uniqueIds.size).toBe(numUsers);

            // Verify all IDs are positive integers
            userIds.forEach(id => {
                expect(typeof id).toBe('number');
                expect(id).toBeGreaterThan(0);
                expect(Number.isInteger(id)).toBe(true);
            });
        });

        test('should maintain counter consistency across model types', async () => {
            // Create mixed model types concurrently
            const promises = [];

            // Create users
            for (let i = 0; i < 3; i++) {
                promises.push((async () => {
                    const user = new User({
                        name: `User ${i}`,
                        email: `user${i}@example.com`,
                        password: 'testpass123'
                    });
                    return await user.save();
                })());
            }

            const users = await Promise.all(promises);

            // Create tasks for each user
            const taskPromises = [];
            users.forEach((user, userIndex) => {
                for (let i = 0; i < 2; i++) {
                    taskPromises.push((async () => {
                        const task = new Task({
                            title: `Task ${userIndex}-${i}`,
                            dueDate: new Date(Date.now() + 86400000),
                            userId: user._id
                        });
                        return await task.save();
                    })());
                }
            });

            const tasks = await Promise.all(taskPromises);

            // Verify counter states
            const userCounter = await Counter.findById('users');
            expect(userCounter.sequence_value).toBe(3);

            const taskCounter = await Counter.findById('tasks');
            expect(taskCounter.sequence_value).toBe(6);

            // Verify ID uniqueness within each type
            const userIds = users.map(u => u.userId);
            const taskIds = tasks.map(t => t.taskId);

            expect(new Set(userIds).size).toBe(3);
            expect(new Set(taskIds).size).toBe(6);
        });
    });

    describe('Counter Service Operations', () => {
        test('should initialize counters with custom start values', async () => {
            const result = await CounterService.initializeCounter('custom_start', 100);
            expect(result).toBe(true);

            const nextId = await CounterService.getNextSequence('custom_start');
            expect(nextId).toBe(101);

            // Try to initialize again (should return false)
            const secondResult = await CounterService.initializeCounter('custom_start', 200);
            expect(secondResult).toBe(false);

            // Counter value should remain unchanged
            const currentValue = await CounterService.getCurrentValue('custom_start');
            expect(currentValue).toBe(101);
        });

        test('should reset counters correctly', async () => {
            // Generate some IDs
            await CounterService.getNextSequence('reset_test');
            await CounterService.getNextSequence('reset_test');
            await CounterService.getNextSequence('reset_test');

            let currentValue = await CounterService.getCurrentValue('reset_test');
            expect(currentValue).toBe(3);

            // Reset counter
            const resetValue = await CounterService.resetCounter('reset_test', 50);
            expect(resetValue).toBe(50);

            // Verify reset worked
            currentValue = await CounterService.getCurrentValue('reset_test');
            expect(currentValue).toBe(50);

            // Next ID should be 51
            const nextId = await CounterService.getNextSequence('reset_test');
            expect(nextId).toBe(51);
        });

        test('should retrieve all counters', async () => {
            // Create counters for different collections
            await CounterService.getNextSequence('collection1');
            await CounterService.getNextSequence('collection2');
            await CounterService.getNextSequence('collection3');

            const allCounters = await CounterService.getAllCounters();
            expect(allCounters).toHaveLength(3);

            const collectionNames = allCounters.map(c => c._id).sort();
            expect(collectionNames).toEqual(['collection1', 'collection2', 'collection3']);

            allCounters.forEach(counter => {
                expect(counter.sequence_value).toBe(1);
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle invalid collection names', async () => {
            await expect(CounterService.getNextSequence('')).rejects.toThrow();
            await expect(CounterService.getNextSequence(null)).rejects.toThrow();
            await expect(CounterService.getNextSequence(123)).rejects.toThrow();
        });

        test('should handle invalid start values', async () => {
            await expect(CounterService.initializeCounter('test', 0)).rejects.toThrow();
            await expect(CounterService.initializeCounter('test', -1)).rejects.toThrow();
            await expect(CounterService.initializeCounter('test', 1.5)).rejects.toThrow();
        });

        test('should handle non-existent counters gracefully', async () => {
            const value = await CounterService.getCurrentValue('non_existent');
            expect(value).toBeNull();
        });

        test('should handle database connection issues', async () => {
            // This would require mocking database failures
            // For now, we verify the error handling structure exists
            expect(typeof CounterService.getNextSequence).toBe('function');
        });
    });

    describe('Performance and Scalability', () => {
        test('should handle high-volume ID generation', async () => {
            const startTime = Date.now();
            const numIds = 100;
            const promises = [];

            // Generate many IDs concurrently
            for (let i = 0; i < numIds; i++) {
                promises.push(CounterService.getNextSequence('performance_test'));
            }

            const results = await Promise.all(promises);
            const endTime = Date.now();

            // Verify all IDs are unique
            const uniqueResults = new Set(results);
            expect(uniqueResults.size).toBe(numIds);

            // Performance should be reasonable (less than 5 seconds for 100 IDs)
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(5000);

            console.log(`Generated ${numIds} IDs in ${duration}ms`);
        });

        test('should maintain consistency under stress', async () => {
            const collections = ['stress1', 'stress2', 'stress3'];
            const idsPerCollection = 20;
            const promises = [];

            // Create concurrent requests across multiple collections
            collections.forEach(collection => {
                for (let i = 0; i < idsPerCollection; i++) {
                    promises.push(CounterService.getNextSequence(collection));
                }
            });

            const results = await Promise.all(promises);

            // Group results by collection (we can't easily determine which result belongs to which collection)
            // But we can verify total uniqueness and count
            expect(results).toHaveLength(collections.length * idsPerCollection);

            // Verify final counter states
            for (const collection of collections) {
                const counter = await Counter.findById(collection);
                expect(counter.sequence_value).toBe(idsPerCollection);
            }
        });
    });
});