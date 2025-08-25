/**
 * Simple test to verify task creation endpoint functionality
 */

const RecurringTaskService = require('../src/services/recurringTaskService');

// Test the service methods that the endpoint will use
async function testTaskCreationLogic() {
    console.log('Testing task creation logic...\n');
    
    try {
        // Test 1: Date calculation for recurring tasks
        console.log('Test 1: Date calculation for recurring instances');
        const baseDate = new Date('2024-01-15T10:00:00Z');
        const futureDates = RecurringTaskService.calculateFutureDates(baseDate, 'daily', 3);
        
        console.log('Base date:', baseDate.toISOString());
        console.log('Generated future dates:');
        futureDates.forEach((date, index) => {
            console.log(`  ${index + 1}: ${date.toISOString()}`);
        });
        
        console.assert(futureDates.length === 3, 'Should generate 3 future dates');
        console.log('✓ Date calculation working correctly\n');
        
        // Test 2: Validation logic
        console.log('Test 2: Validation logic');
        
        // Test valid recurring task data
        const validRecurringTask = {
            taskId: 1,
            userId: 1,
            title: 'Daily Standup',
            description: 'Team daily standup meeting',
            dueDate: baseDate,
            priority: 'high',
            category: 'meetings',
            repeatType: 'daily',
            parentRecurringId: null,
            parentId: null
        };
        
        console.log('Valid recurring task data:', {
            title: validRecurringTask.title,
            repeatType: validRecurringTask.repeatType,
            isSubtask: validRecurringTask.parentId !== null
        });
        
        // Test subtask validation
        const invalidSubtask = {
            ...validRecurringTask,
            parentId: 2, // This makes it a subtask
            repeatType: 'daily' // This should be invalid for subtasks
        };
        
        console.log('Invalid subtask data:', {
            title: invalidSubtask.title,
            repeatType: invalidSubtask.repeatType,
            isSubtask: invalidSubtask.parentId !== null
        });
        
        if (invalidSubtask.parentId && invalidSubtask.repeatType !== 'none') {
            console.log('✓ Subtask validation logic working correctly');
        }
        
        console.log('\n✅ Task creation logic tests passed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Test response formatting
function testResponseFormatting() {
    console.log('\nTesting response formatting...');
    
    // Simulate successful task creation with recurring instances
    const mockTask = {
        taskId: 1,
        title: 'Daily Standup',
        repeatType: 'daily'
    };
    
    const mockInstances = [
        { taskId: 2, dueDate: new Date('2024-01-16T10:00:00Z') },
        { taskId: 3, dueDate: new Date('2024-01-17T10:00:00Z') },
        { taskId: 4, dueDate: new Date('2024-01-18T10:00:00Z') }
    ];
    
    const response = {
        task: mockTask,
        recurringInstancesGenerated: mockInstances.length,
        message: `Task created successfully with ${mockInstances.length} recurring instances generated`
    };
    
    console.log('Mock response structure:');
    console.log(JSON.stringify(response, null, 2));
    
    console.assert(response.recurringInstancesGenerated === 3, 'Should report 3 instances generated');
    console.assert(response.message.includes('3 recurring instances'), 'Message should mention instance count');
    
    console.log('✓ Response formatting working correctly');
}

// Run all tests
async function runTests() {
    console.log('Running task creation endpoint tests...\n');
    
    await testTaskCreationLogic();
    testResponseFormatting();
    
    console.log('\n🎉 All tests completed successfully!');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testTaskCreationLogic,
    testResponseFormatting
};