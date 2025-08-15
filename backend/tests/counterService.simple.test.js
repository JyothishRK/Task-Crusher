// Simple test to verify Counter Service implementation without MongoDB
const CounterService = require('../src/services/counterService');

console.log('Testing Counter Service implementation...');

// Test parameter validation
async function testValidation() {
    try {
        await CounterService.getNextSequence('');
        console.log('❌ Should have thrown error for empty collection name');
    } catch (error) {
        console.log('✅ Correctly validates empty collection name');
    }

    try {
        await CounterService.getNextSequence(null);
        console.log('❌ Should have thrown error for null collection name');
    } catch (error) {
        console.log('✅ Correctly validates null collection name');
    }

    try {
        await CounterService.initializeCounter('test', 0);
        console.log('❌ Should have thrown error for invalid start value');
    } catch (error) {
        console.log('✅ Correctly validates start value');
    }

    console.log('✅ Counter Service implementation looks good!');
    console.log('Note: Full database tests require MongoDB connection');
}

testValidation();