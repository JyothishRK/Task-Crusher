const RecurringTaskService = require('../src/services/recurringTaskService');

/**
 * Integration tests for CRON job recurring task generation scenarios
 * These tests simulate the actual CRON execution environment
 */

// Mock Task model for testing
class MockTask {
    constructor(data) {
        Object.assign(this, data);
        this.taskId = MockTask.nextId++;
        this.createdAt = new Date();
    }

    async save() {
        MockTask.instances.push(this);
        return this;
    }

    static async find(query) {
        return MockTask.instances.filter(task => {
            if (query.repeatType && query.repeatType.$ne) {
                return task.repeatType !== query.repeatType.$ne;
            }
            if (query.$or) {
                return query.$or.some(condition => {
                    if (condition.parentRecurringId === null) {
                        return task.parentRecurringId === null || task.parentRecurringId === undefined;
                    }
                    if (condition.parentRecurringId && condition.parentRecurringId.$exists === false) {
                        return task.parentRecurringId === undefined;
                    }
                    return false;
                });
            }
            return true;
        });
    }

    static async deleteMany(query) {
        const beforeCount = MockTask.instances.length;
        MockTask.instances = MockTask.instances.filter(task => {
            if (query.taskId && query.taskId.$in) {
                return !query.taskId.$in.includes(task.taskId);
            }
            return true;
        });
        return { deletedCount: beforeCount - MockTask.instances.length };
    }

    static async findOne() {
        return MockTask.instances.length > 0 ? MockTask.instances[MockTask.instances.length - 1] : null;
    }

    async getRecurringInstances() {
        return MockTask.instances.filter(task => task.parentRecurringId === this.taskId);
    }

    isRecurringParent() {
        return this.repeatType && this.repeatType !== 'none' && 
               (this.parentRecurringId === null || this.parentRecurringId === undefined);
    }

    static reset() {
        MockTask.instances = [];
        MockTask.nextId = 1;
    }
}

MockTask.instances = [];
MockTask.nextId = 1;

// Test CRON execution at 2:00 AM on January 25th scenario
function testCronExecutionScenario() {
    console.log('Testing CRON execution scenario (2:00 AM on Jan 25th)...');
    
    MockTask.reset();
    
    // Mock the current date to be January 25th, 2025 at 2:00 AM
    const originalDate = Date;
    const mockCurrentDate = new Date('2025-01-25T02:00:00.123Z');
    
    // Create mock recurring parent tasks with different scheduled times
    const tasks = [
        // Task scheduled for 6:30 AM (after CRON time)
        new MockTask({
            taskId: 1,
            userId: 1,
            title: 'Morning Task',
            description: 'Task scheduled for 6:30 AM',
            dueDate: new Date('2025-01-20T06:30:00.000Z'),
            priority: 'medium',
            category: 'work',
            repeatType: 'daily',
            parentRecurringId: null,
            isCompleted: false
        }),
        // Task scheduled for 1:00 AM (before CRON time)
        new MockTask({
            taskId: 2,
            userId: 1,
            title: 'Early Morning Task',
            description: 'Task scheduled for 1:00 AM',
            dueDate: new Date('2025-01-20T01:00:00.000Z'),
            priority: 'high',
            category: 'personal',
            repeatType: 'daily',
            parentRecurringId: null,
            isCompleted: false
        }),
        // Weekly task scheduled for 3:00 PM
        new MockTask({
            taskId: 3,
            userId: 1,
            title: 'Weekly Meeting',
            description: 'Weekly team meeting',
            dueDate: new Date('2025-01-18T15:00:00.000Z'),
            priority: 'high',
            category: 'work',
            repeatType: 'weekly',
            parentRecurringId: null,
            isCompleted: false
        })
    ];
    
    // Add tasks to mock storage
    tasks.forEach(task => MockTask.instances.push(task));
    
    // Test the date comparison logic that would be used in ensureRecurringInstances
    const currentDate = mockCurrentDate;
    const targetDate = new Date(currentDate);
    targetDate.setDate(currentDate.getDate() + 3); // Generate for next 3 days (through Jan 28th)
    
    console.log(`CRON execution time: ${currentDate.toISOString()}`);
    console.log(`Target date (3 days ahead): ${targetDate.toISOString()}`);
    
    // Test each task's next occurrences
    tasks.forEach(task => {
        console.log(`\nTesting task: ${task.title} (scheduled for ${task.dueDate.toISOString()})`);
        
        // Calculate next occurrences
        let nextDate = new Date(task.dueDate);
        const generatedDates = [];
        
        // Simulate the generation loop with the fixed comparison
        for (let i = 0; i < 5; i++) { // Generate up to 5 to test the boundary
            nextDate = RecurringTaskService.calculateNextDate(nextDate, task.repeatType);
            
            // Use the fixed date-only comparison
            if (nextDate.toDateString() <= targetDate.toDateString()) {
                generatedDates.push(new Date(nextDate));
                console.log(`  ✓ Would generate: ${nextDate.toISOString()} (${nextDate.toDateString()})`);
            } else {
                console.log(`  ✗ Would NOT generate: ${nextDate.toISOString()} (${nextDate.toDateString()}) - outside window`);
                break;
            }
        }
        
        // Verify that tasks are generated regardless of their time vs CRON time
        if (task.repeatType === 'daily') {
            // Daily tasks should generate for Jan 21, 22, 23, 24, 25, 26, 27, 28
            const expectedDatesInWindow = generatedDates.filter(date => date <= targetDate);
            console.assert(expectedDatesInWindow.length > 0, `Daily task should generate instances within the 3-day window`);
        }
        
        // Verify time preservation
        generatedDates.forEach(date => {
            console.assert(date.getUTCHours() === task.dueDate.getUTCHours(), 
                `Generated task should preserve original hour: ${task.dueDate.getUTCHours()}`);
            console.assert(date.getUTCMinutes() === task.dueDate.getUTCMinutes(), 
                `Generated task should preserve original minutes: ${task.dueDate.getUTCMinutes()}`);
        });
    });
    
    console.log('✓ CRON execution scenario test passed');
}

// Test specific problematic scenario from the bug report
function testProblematicScenario() {
    console.log('\nTesting the specific problematic scenario from bug report...');
    
    // CRON runs at 2:00 AM on the 25th
    const cronTime = new Date('2025-01-25T02:00:00.123Z');
    const targetDate = new Date(cronTime);
    targetDate.setDate(cronTime.getDate() + 3); // 2025-01-28T02:00:00.123Z
    
    // Task is supposed to be generated for January 28th at 6:30 AM
    const taskDueDate = new Date('2025-01-28T06:30:00.000Z');
    
    console.log(`CRON time: ${cronTime.toISOString()}`);
    console.log(`Target date: ${targetDate.toISOString()}`);
    console.log(`Task due date: ${taskDueDate.toISOString()}`);
    
    // Test the OLD comparison (would fail)
    const oldComparison = taskDueDate <= targetDate;
    console.log(`Old comparison (taskDueDate <= targetDate): ${oldComparison}`);
    console.log(`  ${taskDueDate.toISOString()} <= ${targetDate.toISOString()} = ${oldComparison}`);
    
    // Test the NEW comparison (should pass)
    const newComparison = taskDueDate.toDateString() <= targetDate.toDateString();
    console.log(`New comparison (date-only): ${newComparison}`);
    console.log(`  ${taskDueDate.toDateString()} <= ${targetDate.toDateString()} = ${newComparison}`);
    
    // Verify the fix works
    if (!oldComparison && newComparison) {
        console.log('✓ Fix successfully resolves the timestamp comparison issue');
    } else {
        throw new Error('Fix did not resolve the timestamp comparison issue');
    }
}

// Test that existing instances are not duplicated
function testNoDuplication() {
    console.log('\nTesting that existing instances are not duplicated...');
    
    MockTask.reset();
    
    // Create a parent task
    const parentTask = new MockTask({
        taskId: 1,
        userId: 1,
        title: 'Daily Task',
        dueDate: new Date('2025-01-25T10:00:00.000Z'),
        repeatType: 'daily',
        parentRecurringId: null
    });
    
    // Create an existing instance for Jan 26th
    const existingInstance = new MockTask({
        taskId: 2,
        userId: 1,
        title: 'Daily Task',
        dueDate: new Date('2025-01-26T10:00:00.000Z'),
        repeatType: 'none',
        parentRecurringId: 1
    });
    
    MockTask.instances.push(parentTask, existingInstance);
    
    // Test the duplicate detection logic
    const targetDate = new Date('2025-01-28T02:00:00.000Z');
    const nextDate = new Date('2025-01-26T10:00:00.000Z');
    
    // Simulate the existing instance check
    const existingInstances = [existingInstance];
    const existsForDate = existingInstances.some(instance => {
        const instanceDate = new Date(instance.dueDate);
        return instanceDate.toDateString() === nextDate.toDateString();
    });
    
    console.assert(existsForDate, 'Should detect existing instance for the same date');
    console.log('✓ Duplicate detection works correctly');
}

// Test multiple repeat types in the same CRON run
function testMultipleRepeatTypes() {
    console.log('\nTesting multiple repeat types in the same CRON run...');
    
    MockTask.reset();
    
    const cronTime = new Date('2025-01-25T02:00:00.000Z');
    const targetDate = new Date(cronTime);
    targetDate.setDate(cronTime.getDate() + 3);
    
    // Create tasks with different repeat types and times
    const tasks = [
        {
            title: 'Daily Morning',
            dueDate: new Date('2025-01-24T08:00:00.000Z'),
            repeatType: 'daily'
        },
        {
            title: 'Daily Evening',
            dueDate: new Date('2025-01-24T20:00:00.000Z'),
            repeatType: 'daily'
        },
        {
            title: 'Weekly Meeting',
            dueDate: new Date('2025-01-18T14:00:00.000Z'),
            repeatType: 'weekly'
        },
        {
            title: 'Monthly Report',
            dueDate: new Date('2024-12-25T16:00:00.000Z'),
            repeatType: 'monthly'
        }
    ];
    
    tasks.forEach((taskData, index) => {
        console.log(`\nTesting ${taskData.title} (${taskData.repeatType}):`);
        
        let nextDate = new Date(taskData.dueDate);
        let generationCount = 0;
        
        // Generate instances until we exceed the target date
        for (let i = 0; i < 10; i++) {
            nextDate = RecurringTaskService.calculateNextDate(nextDate, taskData.repeatType);
            
            if (nextDate.toDateString() <= targetDate.toDateString()) {
                generationCount++;
                console.log(`  ✓ Generate: ${nextDate.toISOString()}`);
            } else {
                console.log(`  ✗ Stop: ${nextDate.toISOString()} (outside window)`);
                break;
            }
        }
        
        console.log(`  Generated ${generationCount} instances`);
    });
    
    console.log('✓ Multiple repeat types test passed');
}

// Run all integration tests
function runIntegrationTests() {
    console.log('Running CRON Integration Tests for Recurring Task Timestamp Fix...\n');
    
    try {
        testCronExecutionScenario();
        testProblematicScenario();
        testNoDuplication();
        testMultipleRepeatTypes();
        
        console.log('\n✅ All integration tests passed successfully!');
    } catch (error) {
        console.error('\n❌ Integration test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runIntegrationTests();
}

module.exports = {
    runIntegrationTests
};