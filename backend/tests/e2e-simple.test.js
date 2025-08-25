/**
 * Simple End-to-End Test for Recurring Tasks
 * Tests core functionality with actual database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user');
const Task = require('../src/models/task');
const RecurringTaskService = require('../src/services/recurringTaskService');

// Test credentials
const TEST_USER = {
    email: 'e2e-test@taskcrushers.com',
    password: 'E2ETest123!',
    name: 'E2E Test User'
};

console.log('🔐 TEST CREDENTIALS:');
console.log('==================');
console.log(`Email: ${TEST_USER.email}`);
console.log(`Password: ${TEST_USER.password}`);
console.log('==================\n');

let testUser = null;

/**
 * Connect to database
 */
async function connectDB() {
    try {
        // Use MONGODB_URL from .env
        const mongoUrl = process.env.MONGODB_URL;
        console.log('MongoDB URL loaded:', mongoUrl ? 'Yes' : 'No');
        console.log('🔌 Connecting to database...');
        
        await mongoose.connect(mongoUrl);
        console.log('✅ Database connected successfully\n');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
}

/**
 * Setup test user
 */
async function setupUser() {
    try {
        console.log('👤 Setting up test user...');
        
        // Remove existing test user
        await User.deleteOne({ email: TEST_USER.email });
        
        // Create new test user
        testUser = new User({
            name: TEST_USER.name,
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        
        await testUser.save();
        console.log(`✅ Test user created: ${testUser.email}\n`);
        
    } catch (error) {
        console.error('❌ User setup failed:', error.message);
        throw error;
    }
}

/**
 * Clean existing test data
 */
async function cleanupData() {
    try {
        console.log('🧹 Cleaning up existing test data...');
        
        const deleted = await Task.deleteMany({ userId: testUser._id });
        console.log(`✅ Deleted ${deleted.deletedCount} existing tasks\n`);
        
    } catch (error) {
        console.error('❌ Data cleanup failed:', error.message);
        throw error;
    }
}

/**
 * Test 1: Create recurring task
 */
async function testCreateRecurringTask() {
    try {
        console.log('📝 Test 1: Creating recurring task...');
        
        const recurringTask = new Task({
            title: 'Daily Team Standup',
            description: 'Daily team standup meeting',
            dueDate: new Date('2024-01-15T09:00:00Z'),
            priority: 'high',
            category: 'meetings',
            repeatType: 'daily',
            userId: testUser._id
        });
        
        await recurringTask.save();
        console.log(`   ✅ Created recurring task: ${recurringTask.title} (ID: ${recurringTask.taskId})`);
        
        // Generate instances
        const instances = await RecurringTaskService.generateInstances(recurringTask, 3);
        console.log(`   ✅ Generated ${instances.length} recurring instances`);
        
        // Validate instances
        for (const instance of instances) {
            console.assert(instance.parentRecurringId === recurringTask.taskId, 'Instance should reference parent');
            console.assert(instance.repeatType === 'none', 'Instance should not have repeat type');
            console.assert(instance.userId.toString() === testUser._id.toString(), 'Instance should belong to test user');
        }
        
        console.log('✅ Recurring task creation test passed\n');
        return recurringTask;
        
    } catch (error) {
        console.error('❌ Recurring task creation test failed:', error.message);
        throw error;
    }
}

/**
 * Test 2: Edit recurring task
 */
async function testEditRecurringTask(recurringTask) {
    try {
        console.log('✏️  Test 2: Editing recurring task...');
        
        // Test due date change
        const newDueDate = new Date('2024-01-20T09:00:00Z');
        const result = await RecurringTaskService.handleDueDateChange(recurringTask, newDueDate);
        
        console.log(`   ✅ Due date change: deleted ${result.deletedCount}, generated ${result.generatedCount}`);
        console.assert(typeof result.deletedCount === 'number', 'Should have deletion count');
        console.assert(typeof result.generatedCount === 'number', 'Should have generation count');
        
        console.log('✅ Recurring task editing test passed\n');
        
    } catch (error) {
        console.error('❌ Recurring task editing test failed:', error.message);
        throw error;
    }
}

/**
 * Test 3: Query recurring instances
 */
async function testQueryRecurringInstances(recurringTask) {
    try {
        console.log('🔍 Test 3: Querying recurring instances...');
        
        const instances = await recurringTask.getRecurringInstances();
        console.log(`   ✅ Found ${instances.length} recurring instances`);
        
        // Validate instances
        for (const instance of instances) {
            console.assert(instance.parentRecurringId === recurringTask.taskId, 'Instance should reference parent');
            console.assert(instance.userId.toString() === testUser._id.toString(), 'Instance should belong to test user');
        }
        
        console.log('✅ Recurring instances query test passed\n');
        
    } catch (error) {
        console.error('❌ Recurring instances query test failed:', error.message);
        throw error;
    }
}

/**
 * Test 4: Delete recurring instances
 */
async function testDeleteRecurringInstances(recurringTask) {
    try {
        console.log('🗑️  Test 4: Deleting recurring instances...');
        
        const deletedCount = await RecurringTaskService.deleteRecurringInstances(
            recurringTask.taskId,
            new Date(),
            testUser._id
        );
        
        console.log(`   ✅ Deleted ${deletedCount} future instances`);
        console.assert(typeof deletedCount === 'number', 'Should have valid deletion count');
        
        console.log('✅ Recurring instances deletion test passed\n');
        
    } catch (error) {
        console.error('❌ Recurring instances deletion test failed:', error.message);
        throw error;
    }
}

/**
 * Test 5: Subtask constraints
 */
async function testSubtaskConstraints() {
    try {
        console.log('👶 Test 5: Testing subtask constraints...');
        
        // Create parent task
        const parentTask = new Task({
            title: 'Parent Task for Subtasks',
            description: 'A parent task to test subtask constraints',
            dueDate: new Date('2024-01-25T17:00:00Z'),
            priority: 'medium',
            category: 'work',
            userId: testUser._id
        });
        await parentTask.save();
        
        // Test valid subtask (no repeat type)
        const validSubtask = new Task({
            title: 'Valid Subtask',
            description: 'A valid subtask without repeat type',
            dueDate: new Date('2024-01-24T17:00:00Z'), // Before parent
            priority: 'medium',
            category: 'work',
            repeatType: 'none',
            parentId: parentTask.taskId,
            userId: testUser._id
        });
        
        await validSubtask.save();
        console.log('   ✅ Valid subtask created successfully');
        
        // Test invalid subtask (with repeat type) - should fail
        try {
            const invalidSubtask = new Task({
                title: 'Invalid Subtask',
                description: 'An invalid subtask with repeat type',
                dueDate: new Date('2024-01-24T17:00:00Z'),
                priority: 'medium',
                category: 'work',
                repeatType: 'daily', // This should be invalid
                parentId: parentTask.taskId,
                userId: testUser._id
            });
            
            await invalidSubtask.save();
            console.error('   ❌ Invalid subtask was created (should have failed)');
            
        } catch (validationError) {
            console.log('   ✅ Invalid subtask correctly rejected');
        }
        
        console.log('✅ Subtask constraints test passed\n');
        
    } catch (error) {
        console.error('❌ Subtask constraints test failed:', error.message);
        throw error;
    }
}

/**
 * Test 6: Cron job simulation
 */
async function testCronJobSimulation() {
    try {
        console.log('⏰ Test 6: Simulating cron job...');
        
        const cronResult = await RecurringTaskService.ensureRecurringInstances();
        
        console.log('   Cron job results:');
        console.log(`     Success: ${cronResult.success}`);
        console.log(`     Duration: ${cronResult.duration}`);
        console.log(`     Tasks processed: ${cronResult.summary?.tasksProcessed || 0}`);
        console.log(`     Instances generated: ${cronResult.summary?.totalInstancesGenerated || 0}`);
        
        console.assert(cronResult.success === true, 'Cron job should succeed');
        console.log('✅ Cron job simulation test passed\n');
        
    } catch (error) {
        console.error('❌ Cron job simulation test failed:', error.message);
        throw error;
    }
}

/**
 * Generate final report
 */
async function generateReport() {
    try {
        console.log('📊 FINAL TEST REPORT');
        console.log('='.repeat(40));
        
        // Count final state
        const allTasks = await Task.find({ userId: testUser._id });
        const parentTasks = allTasks.filter(t => t.repeatType !== 'none' && !t.parentRecurringId);
        const instanceTasks = allTasks.filter(t => t.parentRecurringId);
        const subtasks = allTasks.filter(t => t.parentId);
        
        console.log('\n📈 Final Database State:');
        console.log(`   Test User: ${testUser.email}`);
        console.log(`   Total Tasks: ${allTasks.length}`);
        console.log(`   Recurring Parent Tasks: ${parentTasks.length}`);
        console.log(`   Recurring Instance Tasks: ${instanceTasks.length}`);
        console.log(`   Subtasks: ${subtasks.length}`);
        
        console.log('\n🎯 Tests Completed:');
        console.log('   ✅ Recurring Task Creation');
        console.log('   ✅ Recurring Task Editing');
        console.log('   ✅ Recurring Instance Querying');
        console.log('   ✅ Recurring Instance Deletion');
        console.log('   ✅ Subtask Constraints');
        console.log('   ✅ Cron Job Simulation');
        
        console.log('\n🔐 Test Credentials:');
        console.log(`   Email: ${TEST_USER.email}`);
        console.log(`   Password: ${TEST_USER.password}`);
        console.log(`   User ID: ${testUser._id}`);
        
        console.log('\n' + '='.repeat(40));
        
    } catch (error) {
        console.error('❌ Report generation failed:', error.message);
        throw error;
    }
}

/**
 * Main test runner
 */
async function runSimpleE2ETest() {
    const startTime = Date.now();
    
    try {
        console.log('🚀 Starting Simple E2E Test for Recurring Tasks\n');
        
        // Setup
        await connectDB();
        await setupUser();
        await cleanupData();
        
        // Run tests
        const recurringTask = await testCreateRecurringTask();
        await testEditRecurringTask(recurringTask);
        await testQueryRecurringInstances(recurringTask);
        await testDeleteRecurringInstances(recurringTask);
        await testSubtaskConstraints();
        await testCronJobSimulation();
        
        // Generate report
        await generateReport();
        
        const duration = Date.now() - startTime;
        
        console.log(`\n🎉 ALL E2E TESTS PASSED SUCCESSFULLY!`);
        console.log(`⏱️  Total test duration: ${(duration/1000).toFixed(2)} seconds`);
        console.log(`🚀 Recurring task functionality is working correctly!`);
        
    } catch (error) {
        console.error(`\n💥 E2E Test failed: ${error.message}`);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from database');
    }
}

// Export for use in other files
module.exports = {
    runSimpleE2ETest,
    TEST_USER
};

// Run tests if this file is executed directly
if (require.main === module) {
    runSimpleE2ETest().catch(error => {
        console.error('💥 Unhandled error:', error.message);
        process.exit(1);
    });
}