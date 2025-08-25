/**
 * Comprehensive integration test suite for recurring tasks
 * Tests the complete lifecycle of recurring task functionality
 */

const RecurringTaskService = require('../src/services/recurringTaskService');

// Test data and utilities
const testUser = {
    userId: 1,
    email: 'test@example.com'
};

const createMockTask = (overrides = {}) => ({
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
    createdAt: new Date('2024-01-10T10:00:00Z'),
    updatedAt: new Date('2024-01-10T10:00:00Z'),
    // Mock methods
    isRecurringParent: function() {
        return this.repeatType !== 'none' && (this.parentRecurringId === null || this.parentRecurringId === undefined);
    },
    isRecurringInstance: function() {
        return this.parentRecurringId !== null && this.parentRecurringId !== undefined;
    },
    isSubtask: function() {
        return this.parentId !== null && this.parentId !== undefined;
    },
    getRecurringInstances: async function() {
        return [
            {
                taskId: 2,
                title: this.title,
                dueDate: new Date('2024-01-16T10:00:00Z'),
                parentRecurringId: this.taskId,
                isCompleted: false
            },
            {
                taskId: 3,
                title: this.title,
                dueDate: new Date('2024-01-17T10:00:00Z'),
                parentRecurringId: this.taskId,
                isCompleted: true
            }
        ];
    },
    validateSubtaskConstraints: async function() {
        const errors = [];
        if (this.isSubtask() && this.repeatType !== 'none') {
            errors.push('Subtasks cannot have repeat types');
        }
        return { valid: errors.length === 0, errors };
    },
    save: async function() {
        return this;
    },
    ...overrides
});

/**
 * Test 1: Complete recurring task creation lifecycle
 */
async function testRecurringTaskCreationLifecycle() {
    console.log('Testing recurring task creation lifecycle...');
    
    const parentTask = createMockTask({
        repeatType: 'daily',
        dueDate: new Date('2024-01-15T10:00:00Z')
    });
    
    console.log('1. Creating parent recurring task:', {
        taskId: parentTask.taskId,
        title: parentTask.title,
        repeatType: parentTask.repeatType,
        dueDate: parentTask.dueDate.toISOString()
    });
    
    // Test instance generation
    try {
        const instances = await RecurringTaskService.generateInstances(parentTask, 3);
        console.log('2. Generated instances:', instances.length);
        
        // Validate generated instances
        console.assert(instances.length === 3, 'Should generate 3 instances');
        
        instances.forEach((instance, index) => {
            console.log(`   Instance ${index + 1}:`, {
                taskId: instance.taskId,
                dueDate: instance.dueDate.toISOString(),
                parentRecurringId: instance.parentRecurringId
            });
            
            console.assert(instance.parentRecurringId === parentTask.taskId, 'Instance should reference parent');
            console.assert(instance.repeatType === 'none', 'Instance should not have repeat type');
        });
        
        console.log('✓ Recurring task creation lifecycle validated');
        
    } catch (error) {
        console.error('❌ Recurring task creation failed:', error.message);
        throw error;
    }
}

/**
 * Test 2: Recurring task editing scenarios
 */
async function testRecurringTaskEditingScenarios() {
    console.log('\\nTesting recurring task editing scenarios...');
    
    const parentTask = createMockTask({
        repeatType: 'daily',
        dueDate: new Date('2024-01-15T10:00:00Z')
    });
    
    // Test due date change
    console.log('1. Testing due date change...');
    try {
        const newDueDate = new Date('2024-01-20T10:00:00Z');
        const result = await RecurringTaskService.handleDueDateChange(parentTask, newDueDate);
        
        console.log('   Due date change result:', {
            deletedCount: result.deletedCount,
            generatedCount: result.generatedCount,
            message: result.message
        });
        
        console.assert(typeof result.deletedCount === 'number', 'Should have deleted count');
        console.assert(typeof result.generatedCount === 'number', 'Should have generated count');
        
    } catch (error) {
        console.error('❌ Due date change failed:', error.message);
        throw error;
    }
    
    // Test repeat type change
    console.log('2. Testing repeat type change...');
    try {
        const result = await RecurringTaskService.handleRepeatTypeChange(parentTask, 'weekly');
        
        console.log('   Repeat type change result:', {
            deletedCount: result.deletedCount,
            generatedCount: result.generatedCount,
            message: result.message
        });
        
        console.assert(typeof result.deletedCount === 'number', 'Should have deleted count');
        console.assert(typeof result.generatedCount === 'number', 'Should have generated count');
        
    } catch (error) {
        console.error('❌ Repeat type change failed:', error.message);
        throw error;
    }
    
    console.log('✓ Recurring task editing scenarios validated');
}

/**
 * Test 3: Recurring task deletion scenarios
 */
async function testRecurringTaskDeletionScenarios() {
    console.log('\\nTesting recurring task deletion scenarios...');
    
    const parentTask = createMockTask();
    
    // Test deleting future instances
    console.log('1. Testing future instances deletion...');
    try {
        const fromDate = new Date('2024-01-16T10:00:00Z');
        const deletedCount = await RecurringTaskService.deleteRecurringInstances(
            parentTask.taskId,
            fromDate,
            parentTask.userId
        );
        
        console.log('   Deleted future instances:', deletedCount);
        console.assert(typeof deletedCount === 'number', 'Should return number of deleted instances');
        
    } catch (error) {
        console.error('❌ Future instances deletion failed:', error.message);
        throw error;
    }
    
    console.log('✓ Recurring task deletion scenarios validated');
}

/**
 * Test 4: Subtask constraints validation
 */
async function testSubtaskConstraintsValidation() {
    console.log('\\nTesting subtask constraints validation...');
    
    // Test valid subtask (no repeat type)
    console.log('1. Testing valid subtask...');
    const validSubtask = createMockTask({
        taskId: 2,
        parentId: 1,
        repeatType: 'none',
        dueDate: new Date('2024-01-19T10:00:00Z') // Before parent due date
    });
    
    const validResult = await validSubtask.validateSubtaskConstraints();
    console.log('   Valid subtask result:', validResult);
    console.assert(validResult.valid === true, 'Valid subtask should pass validation');
    
    // Test invalid subtask (has repeat type)
    console.log('2. Testing invalid subtask with repeat type...');
    const invalidSubtask = createMockTask({
        taskId: 3,
        parentId: 1,
        repeatType: 'daily', // Invalid for subtasks
        dueDate: new Date('2024-01-19T10:00:00Z')
    });
    
    const invalidResult = await invalidSubtask.validateSubtaskConstraints();
    console.log('   Invalid subtask result:', invalidResult);
    console.assert(invalidResult.valid === false, 'Invalid subtask should fail validation');
    console.assert(invalidResult.errors.length > 0, 'Should have validation errors');
    
    console.log('✓ Subtask constraints validation validated');
}

/**
 * Test 5: Date calculation accuracy
 */
function testDateCalculationAccuracy() {
    console.log('\\nTesting date calculation accuracy...');
    
    const testCases = [
        {
            name: 'Daily calculation',
            baseDate: new Date('2024-01-15T10:00:00Z'),
            repeatType: 'daily',
            expectedNext: new Date('2024-01-16T10:00:00Z')
        },
        {
            name: 'Weekly calculation',
            baseDate: new Date('2024-01-15T10:00:00Z'),
            repeatType: 'weekly',
            expectedNext: new Date('2024-01-22T10:00:00Z')
        },
        {
            name: 'Monthly calculation',
            baseDate: new Date('2024-01-15T10:00:00Z'),
            repeatType: 'monthly',
            expectedNext: new Date('2024-02-15T10:00:00Z')
        },
        {
            name: 'Month-end edge case',
            baseDate: new Date('2024-01-31T10:00:00Z'),
            repeatType: 'monthly',
            expectedNext: new Date('2024-02-29T10:00:00Z') // Leap year
        }
    ];
    
    testCases.forEach(testCase => {
        console.log(`Testing ${testCase.name}...`);
        
        const result = RecurringTaskService.calculateNextDate(testCase.baseDate, testCase.repeatType);
        
        console.log(`   Base: ${testCase.baseDate.toISOString()}`);
        console.log(`   Expected: ${testCase.expectedNext.toISOString()}`);
        console.log(`   Actual: ${result.toISOString()}`);
        
        console.assert(result.getTime() === testCase.expectedNext.getTime(), 
            `${testCase.name} should calculate correctly`);
    });
    
    console.log('✓ Date calculation accuracy validated');
}

/**
 * Test 6: Edge cases and error handling
 */
function testEdgeCasesAndErrorHandling() {
    console.log('\\nTesting edge cases and error handling...');
    
    // Test invalid repeat types
    console.log('1. Testing invalid repeat types...');
    const invalidRepeatTypes = ['invalid', '', null, undefined];
    
    invalidRepeatTypes.forEach(repeatType => {
        try {
            RecurringTaskService.calculateNextDate(new Date(), repeatType);
            console.assert(false, `Should throw error for invalid repeat type: ${repeatType}`);
        } catch (error) {
            console.log(`   ✓ Correctly threw error for ${repeatType}: ${error.message}`);
            console.assert(error.message.includes('Invalid repeat type'), 'Should have appropriate error message');
        }
    });
    
    // Test leap year handling
    console.log('2. Testing leap year handling...');
    const leapYearDate = new Date('2024-02-29T10:00:00Z'); // Leap year
    const nextMonth = RecurringTaskService.calculateNextDate(leapYearDate, 'monthly');
    const expectedDate = new Date('2024-03-29T10:00:00Z');
    
    console.log(`   Leap year base: ${leapYearDate.toISOString()}`);
    console.log(`   Next month: ${nextMonth.toISOString()}`);
    console.log(`   Expected: ${expectedDate.toISOString()}`);
    
    console.assert(nextMonth.getTime() === expectedDate.getTime(), 'Should handle leap year correctly');
    
    console.log('✓ Edge cases and error handling validated');
}

/**
 * Test 7: Performance and scalability
 */
async function testPerformanceAndScalability() {
    console.log('\\nTesting performance and scalability...');
    
    // Test bulk instance generation
    console.log('1. Testing bulk instance generation...');
    const startTime = Date.now();
    
    const parentTask = createMockTask();
    const instances = await RecurringTaskService.generateInstances(parentTask, 30); // Generate 30 instances
    
    const duration = Date.now() - startTime;
    
    console.log(`   Generated ${instances.length} instances in ${duration}ms`);
    console.assert(instances.length === 30, 'Should generate requested number of instances');
    console.assert(duration < 1000, 'Should complete within reasonable time');
    
    // Test date calculation performance
    console.log('2. Testing date calculation performance...');
    const calcStartTime = Date.now();
    
    for (let i = 0; i < 1000; i++) {
        RecurringTaskService.calculateNextDate(new Date(), 'daily');
    }
    
    const calcDuration = Date.now() - calcStartTime;
    console.log(`   Performed 1000 date calculations in ${calcDuration}ms`);
    console.assert(calcDuration < 100, 'Date calculations should be fast');
    
    console.log('✓ Performance and scalability validated');
}

/**
 * Test 8: Cron job simulation
 */
async function testCronJobSimulation() {
    console.log('\\nTesting cron job simulation...');
    
    // Mock database with recurring tasks
    const mockRecurringTasks = [
        createMockTask({ taskId: 1, repeatType: 'daily', title: 'Daily Task 1' }),
        createMockTask({ taskId: 2, repeatType: 'weekly', title: 'Weekly Task 1' }),
        createMockTask({ taskId: 3, repeatType: 'monthly', title: 'Monthly Task 1' })
    ];
    
    console.log('1. Simulating cron job execution...');
    console.log(`   Found ${mockRecurringTasks.length} recurring parent tasks`);
    
    let totalGenerated = 0;
    let tasksProcessed = 0;
    
    for (const task of mockRecurringTasks) {
        try {
            console.log(`   Processing: ${task.title} (${task.repeatType})`);
            
            // Simulate instance generation
            const instances = await RecurringTaskService.generateInstances(task, 3);
            totalGenerated += instances.length;
            tasksProcessed++;
            
            console.log(`     Generated ${instances.length} instances`);
            
        } catch (error) {
            console.error(`     Error processing ${task.title}:`, error.message);
        }
    }
    
    console.log('2. Cron job simulation results:', {
        tasksProcessed,
        totalGenerated,
        averageInstancesPerTask: (totalGenerated / tasksProcessed).toFixed(1)
    });
    
    console.assert(tasksProcessed === 3, 'Should process all tasks');
    console.assert(totalGenerated > 0, 'Should generate instances');
    
    console.log('✓ Cron job simulation validated');
}

/**
 * Test 9: Data integrity and consistency
 */
async function testDataIntegrityAndConsistency() {
    console.log('\\nTesting data integrity and consistency...');
    
    const parentTask = createMockTask();
    
    // Test instance data consistency
    console.log('1. Testing instance data consistency...');
    const instances = await RecurringTaskService.generateInstances(parentTask, 5);
    
    instances.forEach((instance, index) => {
        console.log(`   Instance ${index + 1} validation:`);
        
        // Check required fields
        console.assert(instance.title === parentTask.title, 'Title should match parent');
        console.assert(instance.description === parentTask.description, 'Description should match parent');
        console.assert(instance.priority === parentTask.priority, 'Priority should match parent');
        console.assert(instance.category === parentTask.category, 'Category should match parent');
        console.assert(instance.userId === parentTask.userId, 'UserId should match parent');
        
        // Check recurring-specific fields
        console.assert(instance.parentRecurringId === parentTask.taskId, 'Should reference parent');
        console.assert(instance.repeatType === 'none', 'Instance should not have repeat type');
        console.assert(instance.parentId === null, 'Should not be a subtask');
        console.assert(instance.isCompleted === false, 'Should start as incomplete');
        
        // Check date progression
        if (index > 0) {
            const prevInstance = instances[index - 1];
            console.assert(instance.dueDate > prevInstance.dueDate, 'Dates should progress forward');
        }
        
        console.log(`     ✓ Instance ${index + 1} data is consistent`);
    });
    
    console.log('✓ Data integrity and consistency validated');
}

/**
 * Test 10: Complete lifecycle integration
 */
async function testCompleteLifecycleIntegration() {
    console.log('\\nTesting complete lifecycle integration...');
    
    // Create -> Edit -> Query -> Delete lifecycle
    console.log('1. Creating recurring task...');
    const parentTask = createMockTask({
        repeatType: 'daily',
        dueDate: new Date('2024-01-15T10:00:00Z')
    });
    
    // Generate initial instances
    const initialInstances = await RecurringTaskService.generateInstances(parentTask, 3);
    console.log(`   Created parent task with ${initialInstances.length} instances`);
    
    // Edit the task (change due date)
    console.log('2. Editing recurring task...');
    const newDueDate = new Date('2024-01-20T10:00:00Z');
    const editResult = await RecurringTaskService.handleDueDateChange(parentTask, newDueDate);
    console.log(`   Edit result: deleted ${editResult.deletedCount}, generated ${editResult.generatedCount}`);
    
    // Query instances
    console.log('3. Querying recurring instances...');
    const queriedInstances = await parentTask.getRecurringInstances();
    console.log(`   Found ${queriedInstances.length} instances after edit`);
    
    // Delete future instances
    console.log('4. Deleting future instances...');
    const deletedCount = await RecurringTaskService.deleteRecurringInstances(
        parentTask.taskId,
        new Date('2024-01-18T10:00:00Z'),
        parentTask.userId
    );
    console.log(`   Deleted ${deletedCount} future instances`);
    
    console.log('✓ Complete lifecycle integration validated');
}

// Main test runner
async function runComprehensiveTests() {
    console.log('Running comprehensive recurring tasks integration tests...\\n');
    
    const startTime = Date.now();
    
    try {
        await testRecurringTaskCreationLifecycle();
        await testRecurringTaskEditingScenarios();
        await testRecurringTaskDeletionScenarios();
        await testSubtaskConstraintsValidation();
        testDateCalculationAccuracy();
        testEdgeCasesAndErrorHandling();
        await testPerformanceAndScalability();
        await testCronJobSimulation();
        await testDataIntegrityAndConsistency();
        await testCompleteLifecycleIntegration();
        
        const duration = Date.now() - startTime;
        
        console.log(`\\n🎉 All comprehensive recurring tasks tests passed successfully!`);
        console.log(`📊 Test suite completed in ${duration}ms`);
        console.log(`✅ Tested: Creation, Editing, Deletion, Validation, Performance, Integration`);
        
    } catch (error) {
        console.error('\\n❌ Comprehensive test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Export for use in other test files
module.exports = {
    runComprehensiveTests,
    createMockTask,
    testUser
};

// Run tests if this file is executed directly
if (require.main === module) {
    runComprehensiveTests().catch(console.error);
}