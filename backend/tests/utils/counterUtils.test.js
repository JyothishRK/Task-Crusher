/**
 * Unit tests for Counter Utilities
 */

// Load environment
require('dotenv').config();

const assert = require('assert');
const mongoose = require('mongoose');
const Counter = require('../../src/models/counter');
const { 
    getNextSequence, 
    initializeCounter, 
    getCurrentSequence, 
    resetCounter 
} = require('../../src/utils/counterUtils');

// Test database setup
let isConnected = false;

async function setupTestDB() {
    if (!isConnected) {
        // Use the main MongoDB URL but with a test database name
        const mainDbUri = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/task-app-test';
        const testDbUri = mainDbUri.replace(/\/[^\/]*$/, '/task-app-test');
        await mongoose.connect(testDbUri);
        isConnected = true;
    }
    // Clean up counters before each test
    await Counter.deleteMany({});
}

async function cleanupTestDB() {
    if (isConnected) {
        await Counter.deleteMany({});
        await mongoose.disconnect();
        isConnected = false;
    }
}

async function runTests() {
    console.log('Running Counter Utilities Tests...');
    
    try {
        // Test 1: getNextSequence - create new counter and return 1 for first call
        await setupTestDB();
        const sequence = await getNextSequence('testCounter');
        assert.strictEqual(sequence, 1);
        const counter = await Counter.findById('testCounter');
        assert.strictEqual(counter.sequence, 1);
        console.log('  ✓ should create new counter and return 1 for first call');

        // Test 2: getNextSequence - increment existing counter
        await setupTestDB();
        await initializeCounter('testCounter', 5);
        const sequence2 = await getNextSequence('testCounter');
        assert.strictEqual(sequence2, 6);
        const counter2 = await Counter.findById('testCounter');
        assert.strictEqual(counter2.sequence, 6);
        console.log('  ✓ should increment existing counter');

        // Test 3: getNextSequence - handle multiple sequential calls
        await setupTestDB();
        const seq1 = await getNextSequence('testCounter');
        const seq2 = await getNextSequence('testCounter');
        const seq3 = await getNextSequence('testCounter');
        assert.strictEqual(seq1, 1);
        assert.strictEqual(seq2, 2);
        assert.strictEqual(seq3, 3);
        console.log('  ✓ should handle multiple sequential calls');

        // Test 4: getNextSequence - handle concurrent calls without duplicates
        await setupTestDB();
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(getNextSequence('concurrentTest'));
        }
        const results = await Promise.all(promises);
        const uniqueResults = [...new Set(results)];
        assert.strictEqual(uniqueResults.length, 5);
        assert.strictEqual(Math.min(...results), 1);
        assert.strictEqual(Math.max(...results), 5);
        console.log('  ✓ should handle concurrent calls without duplicates');

        // Test 5: initializeCounter - create counter with default value 1
        await setupTestDB();
        await initializeCounter('testCounter');
        const counter3 = await Counter.findById('testCounter');
        assert.strictEqual(counter3.sequence, 1);
        console.log('  ✓ should create counter with default value 1');

        // Test 6: initializeCounter - create counter with custom start value
        await setupTestDB();
        await initializeCounter('testCounter', 100);
        const counter4 = await Counter.findById('testCounter');
        assert.strictEqual(counter4.sequence, 100);
        console.log('  ✓ should create counter with custom start value');

        // Test 7: initializeCounter - update existing counter
        await setupTestDB();
        await Counter.create({ _id: 'testCounter', sequence: 50 });
        await initializeCounter('testCounter', 25);
        const counter5 = await Counter.findById('testCounter');
        assert.strictEqual(counter5.sequence, 25);
        console.log('  ✓ should update existing counter');

        // Test 8: getCurrentSequence - return current sequence value
        await setupTestDB();
        await Counter.create({ _id: 'testCounter', sequence: 42 });
        const current = await getCurrentSequence('testCounter');
        assert.strictEqual(current, 42);
        console.log('  ✓ should return current sequence value');

        // Test 9: getCurrentSequence - return 0 for non-existent counter
        await setupTestDB();
        const current2 = await getCurrentSequence('nonExistent');
        assert.strictEqual(current2, 0);
        console.log('  ✓ should return 0 for non-existent counter');

        // Test 10: resetCounter - reset counter to default value 1
        await setupTestDB();
        await Counter.create({ _id: 'testCounter', sequence: 100 });
        await resetCounter('testCounter');
        const counter6 = await Counter.findById('testCounter');
        assert.strictEqual(counter6.sequence, 1);
        console.log('  ✓ should reset counter to default value 1');

        // Test 11: resetCounter - reset counter to custom value
        await setupTestDB();
        await Counter.create({ _id: 'testCounter', sequence: 100 });
        await resetCounter('testCounter', 50);
        const counter7 = await Counter.findById('testCounter');
        assert.strictEqual(counter7.sequence, 50);
        console.log('  ✓ should reset counter to custom value');

        // Test 12: resetCounter - create counter if it does not exist
        await setupTestDB();
        await resetCounter('newCounter', 25);
        const counter8 = await Counter.findById('newCounter');
        assert.strictEqual(counter8.sequence, 25);
        console.log('  ✓ should create counter if it does not exist');

        // Test 13: Integration - work with different counter types
        await setupTestDB();
        const userId1 = await getNextSequence('userId');
        const taskId1 = await getNextSequence('taskId');
        const userId2 = await getNextSequence('userId');
        const taskId2 = await getNextSequence('taskId');
        assert.strictEqual(userId1, 1);
        assert.strictEqual(taskId1, 1);
        assert.strictEqual(userId2, 2);
        assert.strictEqual(taskId2, 2);
        console.log('  ✓ should work with different counter types');

        // Test 14: Integration - maintain separate sequences for different counters
        await setupTestDB();
        await initializeCounter('counter1', 10);
        await initializeCounter('counter2', 20);
        const seq1_int = await getNextSequence('counter1');
        const seq2_int = await getNextSequence('counter2');
        assert.strictEqual(seq1_int, 11);
        assert.strictEqual(seq2_int, 21);
        console.log('  ✓ should maintain separate sequences for different counters');

        console.log('\n✅ All Counter Utility tests passed!');
        
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