const mongoose = require('mongoose');
const CounterService = require('../src/services/counterService');
const Counter = require('../src/models/counter');

// Test database connection
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/task-app-test';

beforeAll(async () => {
    await mongoose.connect(MONGODB_URL);
});

afterAll(async () => {
    await mongoose.connection.close();
});

beforeEach(async () => {
    // Clean up counters before each test
    await Counter.deleteMany({});
});

describe('CounterService', () => {

    describe('getNextSequence', () => {
        test('should create and return first sequence value for new collection', async () => {
            const result = await CounterService.getNextSequence('test_collection');
            expect(result).toBe(1);

            // Verify counter was created
            const counter = await Counter.findById('test_collection');
            expect(counter.sequence_value).toBe(1);
        });

        test('should increment existing counter', async () => {
            // Create initial counter
            await CounterService.getNextSequence('test_collection');
            
            // Get next sequence
            const result = await CounterService.getNextSequence('test_collection');
            expect(result).toBe(2);

            // Verify counter was incremented
            const counter = await Counter.findById('test_collection');
            expect(counter.sequence_value).toBe(2);
        });

        test('should handle concurrent requests atomically', async () => {
            const promises = [];
            const numRequests = 10;

            // Create multiple concurrent requests
            for (let i = 0; i < numRequests; i++) {
                promises.push(CounterService.getNextSequence('concurrent_test'));
            }

            const results = await Promise.all(promises);
            
            // All results should be unique
            const uniqueResults = new Set(results);
            expect(uniqueResults.size).toBe(numRequests);

            // Results should be sequential from 1 to numRequests
            results.sort((a, b) => a - b);
            for (let i = 0; i < numRequests; i++) {
                expect(results[i]).toBe(i + 1);
            }
        });

        test('should throw error for invalid collection name', async () => {
            await expect(CounterService.getNextSequence('')).rejects.toThrow('Collection name is required');
            await expect(CounterService.getNextSequence(null)).rejects.toThrow('Collection name is required');
            await expect(CounterService.getNextSequence(123)).rejects.toThrow('Collection name is required');
        });
    });

    describe('initializeCounter', () => {
        test('should create new counter with default start value', async () => {
            const result = await CounterService.initializeCounter('new_collection');
            expect(result).toBe(true);

            const counter = await Counter.findById('new_collection');
            expect(counter.sequence_value).toBe(1);
        });

        test('should create new counter with custom start value', async () => {
            const result = await CounterService.initializeCounter('custom_collection', 100);
            expect(result).toBe(true);

            const counter = await Counter.findById('custom_collection');
            expect(counter.sequence_value).toBe(100);
        });

        test('should return false if counter already exists', async () => {
            // Create initial counter
            await CounterService.initializeCounter('existing_collection');
            
            // Try to initialize again
            const result = await CounterService.initializeCounter('existing_collection');
            expect(result).toBe(false);
        });

        test('should throw error for invalid parameters', async () => {
            await expect(CounterService.initializeCounter('')).rejects.toThrow('Collection name is required');
            await expect(CounterService.initializeCounter('test', 0)).rejects.toThrow('Start value must be a positive integer');
            await expect(CounterService.initializeCounter('test', -1)).rejects.toThrow('Start value must be a positive integer');
            await expect(CounterService.initializeCounter('test', 1.5)).rejects.toThrow('Start value must be a positive integer');
        });
    });

    describe('resetCounter', () => {
        test('should reset existing counter', async () => {
            // Create and increment counter
            await CounterService.getNextSequence('reset_test');
            await CounterService.getNextSequence('reset_test');
            
            // Reset counter
            const result = await CounterService.resetCounter('reset_test', 50);
            expect(result).toBe(50);

            const counter = await Counter.findById('reset_test');
            expect(counter.sequence_value).toBe(50);
        });

        test('should create counter if it does not exist', async () => {
            const result = await CounterService.resetCounter('new_reset_test', 25);
            expect(result).toBe(25);

            const counter = await Counter.findById('new_reset_test');
            expect(counter.sequence_value).toBe(25);
        });

        test('should throw error for invalid parameters', async () => {
            await expect(CounterService.resetCounter('')).rejects.toThrow('Collection name is required');
            await expect(CounterService.resetCounter('test', 0)).rejects.toThrow('New value must be a positive integer');
        });
    });

    describe('getCurrentValue', () => {
        test('should return current value for existing counter', async () => {
            await CounterService.getNextSequence('current_test');
            await CounterService.getNextSequence('current_test');
            
            const result = await CounterService.getCurrentValue('current_test');
            expect(result).toBe(2);
        });

        test('should return null for non-existing counter', async () => {
            const result = await CounterService.getCurrentValue('non_existing');
            expect(result).toBeNull();
        });

        test('should throw error for invalid collection name', async () => {
            await expect(CounterService.getCurrentValue('')).rejects.toThrow('Collection name is required');
        });
    });

    describe('getAllCounters', () => {
        test('should return all counters', async () => {
            await CounterService.getNextSequence('counter1');
            await CounterService.getNextSequence('counter2');
            await CounterService.getNextSequence('counter3');
            
            const counters = await CounterService.getAllCounters();
            expect(counters).toHaveLength(3);
            expect(counters.map(c => c._id).sort()).toEqual(['counter1', 'counter2', 'counter3']);
        });

        test('should return empty array when no counters exist', async () => {
            const counters = await CounterService.getAllCounters();
            expect(counters).toHaveLength(0);
        });
    });
});