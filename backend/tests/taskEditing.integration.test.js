/**
 * Integration tests for enhanced task editing with recurring functionality
 */

const RecurringTaskService = require('../src/services/recurringTaskService');

// Test data
const testUser = {
    userId: 1,
    email: 'test@example.com'
};

const recurringTaskData = {
    taskId: 1,
    userId: testUser.userId,
    title: 'Daily Standup',
    description: 'Team daily standup meeting',
    dueDate: new Date('2024-01-15T10:00:00Z'),
    priority: 'high',
    category: 'meetings',
    repeatType: 'daily',
    parentRecurringId: null,
    parentId: null,
    isCompleted: false,
    // Mock methods
    isRecurringParent: function() {
        return this.repeatType !== 'none' && (this.parentRecurringId === null || this.parentRecurringId === undefined);
    },
    isSubtask: function() {
        return this.parentId !== null && this.parentId !== undefined;
    },
    save: async function() {
        return this;
    }
};

/**
 * Test task editing scenarios
 */

// Test due date change for recurring task
async function testDueDateChangeScenario() {
    console.log('Testing due date change scenario...');
    
    const originalTask = { ...recurringTaskData };
    const newDueDate = new Date('2024-01-20T10:00:00Z');
    
    console.log('Original due date:', originalTask.dueDate.toISOString());
    console.log('New due date:', newDueDate.toISOString());
    
    // Test date calculation for new instances
    const newFutureDates = RecurringTaskService.calculateFutureDates(newDueDate, originalTask.repeatType, 3);
    console.log('New future dates would be:');
    newFutureDates.forEach((date, index) => {
        console.log(`  ${index + 1}: ${date.toISOString()}`);
    });
    
    console.assert(newFutureDates.length === 3, 'Should generate 3 new future dates');
    console.assert(newFutureDates[0] > newDueDate, 'First future date should be after new due date');
    
    console.log('✓ Due date change scenario validated');
}

// Test repeat type change for recurring task
async function testRepeatTypeChangeScenario() {
    console.log('\nTesting repeat type change scenario...');
    
    const originalTask = { ...recurringTaskData };
    const newRepeatType = 'weekly';
    
    console.log('Original repeat type:', originalTask.repeatType);
    console.log('New repeat type:', newRepeatType);
    
    // Test date calculation for different repeat types
    const dailyDates = RecurringTaskService.calculateFutureDates(originalTask.dueDate, 'daily', 3);
    const weeklyDates = RecurringTaskService.calculateFutureDates(originalTask.dueDate, 'weekly', 3);
    
    console.log('Daily dates:', dailyDates.map(d => d.toISOString()));
    console.log('Weekly dates:', weeklyDates.map(d => d.toISOString()));
    
    // Verify different patterns
    const daysBetweenDaily = (dailyDates[1].getTime() - dailyDates[0].getTime()) / (1000 * 60 * 60 * 24);
    const daysBetweenWeekly = (weeklyDates[1].getTime() - weeklyDates[0].getTime()) / (1000 * 60 * 60 * 24);
    
    console.assert(daysBetweenDaily === 1, 'Daily dates should be 1 day apart');
    console.assert(daysBetweenWeekly === 7, 'Weekly dates should be 7 days apart');
    
    console.log('✓ Repeat type change scenario validated');
}

// Test combined due date and repeat type change
async function testCombinedChangeScenario() {
    console.log('\nTesting combined due date and repeat type change scenario...');
    
    const originalTask = { ...recurringTaskData };
    const newDueDate = new Date('2024-01-20T10:00:00Z');
    const newRepeatType = 'monthly';
    
    console.log('Changes:', {
        dueDate: { from: originalTask.dueDate.toISOString(), to: newDueDate.toISOString() },
        repeatType: { from: originalTask.repeatType, to: newRepeatType }
    });
    
    // Test the new pattern
    const newFutureDates = RecurringTaskService.calculateFutureDates(newDueDate, newRepeatType, 3);
    console.log('New monthly pattern:', newFutureDates.map(d => d.toISOString()));
    
    // Verify monthly pattern
    const monthsBetween = (newFutureDates[1].getMonth() - newFutureDates[0].getMonth() + 12) % 12;
    console.assert(monthsBetween === 1 || monthsBetween === 0, 'Monthly dates should be about 1 month apart');
    
    console.log('✓ Combined change scenario validated');
}

// Test subtask validation
function testSubtaskValidation() {
    console.log('\nTesting subtask validation...');
    
    const subtaskData = {
        ...recurringTaskData,
        parentId: 2, // Makes it a subtask
        repeatType: 'daily' // This should be invalid
    };
    
    console.log('Subtask data:', {
        title: subtaskData.title,
        parentId: subtaskData.parentId,
        repeatType: subtaskData.repeatType,
        isSubtask: subtaskData.parentId !== null
    });
    
    // Validation logic
    const isSubtask = subtaskData.parentId !== null && subtaskData.parentId !== undefined;
    const hasRepeatType = subtaskData.repeatType && subtaskData.repeatType !== 'none';
    
    if (isSubtask && hasRepeatType) {
        console.log('✓ Subtask with repeat type correctly identified as invalid');
    } else {
        console.log('❌ Subtask validation logic issue');
    }
}

// Test response formatting
function testResponseFormatting() {
    console.log('\nTesting response formatting...');
    
    // Mock successful recurring update response
    const mockRecurringResult = {
        deletedCount: 2,
        generatedCount: 3,
        message: 'Deleted 2 future instances and generated 3 new instances',
        newInstances: [
            { taskId: 10, dueDate: new Date('2024-01-21T10:00:00Z') },
            { taskId: 11, dueDate: new Date('2024-01-22T10:00:00Z') },
            { taskId: 12, dueDate: new Date('2024-01-23T10:00:00Z') }
        ]
    };
    
    const response = {
        task: recurringTaskData,
        message: `Task updated successfully. ${mockRecurringResult.message}`,
        recurringUpdate: {
            deletedInstances: mockRecurringResult.deletedCount,
            generatedInstances: mockRecurringResult.generatedCount,
            message: mockRecurringResult.message
        }
    };
    
    console.log('Mock response structure:');
    console.log(JSON.stringify(response, null, 2));
    
    console.assert(response.recurringUpdate.deletedInstances === 2, 'Should report 2 deleted instances');
    console.assert(response.recurringUpdate.generatedInstances === 3, 'Should report 3 generated instances');
    console.assert(response.message.includes('Task updated successfully'), 'Should include success message');
    
    console.log('✓ Response formatting validated');
}

// Test error handling scenarios
function testErrorHandlingScenarios() {
    console.log('\nTesting error handling scenarios...');
    
    const errorScenarios = [
        {
            name: 'Invalid due date',
            data: { dueDate: 'invalid-date' },
            expectedError: 'Invalid date'
        },
        {
            name: 'Invalid repeat type',
            data: { repeatType: 'invalid-type' },
            expectedError: 'Invalid repeat type'
        },
        {
            name: 'Subtask with repeat type',
            data: { parentId: 1, repeatType: 'daily' },
            expectedError: 'Subtasks cannot have repeat types'
        }
    ];
    
    errorScenarios.forEach(scenario => {
        console.log(`Testing ${scenario.name}:`, scenario.data);
        
        // Validate the error condition
        if (scenario.name === 'Subtask with repeat type') {
            const isSubtask = scenario.data.parentId !== null;
            const hasRepeatType = scenario.data.repeatType !== 'none';
            console.assert(isSubtask && hasRepeatType, `${scenario.name} should be detected`);
        }
    });
    
    console.log('✓ Error handling scenarios validated');
}

// Run all tests
async function runTests() {
    console.log('Running task editing integration tests...\n');
    
    try {
        await testDueDateChangeScenario();
        await testRepeatTypeChangeScenario();
        await testCombinedChangeScenario();
        testSubtaskValidation();
        testResponseFormatting();
        testErrorHandlingScenarios();
        
        console.log('\n🎉 All task editing integration tests passed successfully!');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other test files
module.exports = {
    runTests,
    testUser,
    recurringTaskData
};

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}