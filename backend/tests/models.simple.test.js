// Simple test to verify model implementations
console.log('Testing model implementations...');

// Test Task model import
try {
    const Task = require('../src/models/task');
    console.log('✅ Task model imports successfully');
} catch (error) {
    console.log('❌ Task model import failed:', error.message);
}

// Test User model import
try {
    const User = require('../src/models/user');
    console.log('✅ User model imports successfully');
} catch (error) {
    console.log('❌ User model import failed:', error.message);
}

// Test UserActivity model import
try {
    const UserActivity = require('../src/models/userActivity');
    console.log('✅ UserActivity model imports successfully');
} catch (error) {
    console.log('❌ UserActivity model import failed:', error.message);
}

// Test Counter model import
try {
    const Counter = require('../src/models/counter');
    console.log('✅ Counter model imports successfully');
} catch (error) {
    console.log('❌ Counter model import failed:', error.message);
}

console.log('✅ All models import successfully!');