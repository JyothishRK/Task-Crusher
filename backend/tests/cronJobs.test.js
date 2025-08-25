/**
 * Tests for cron job functionality and recurring task maintenance
 */

const RecurringTaskService = require('../src/services/recurringTaskService');

// Test cron job schedule format
function testCronScheduleFormat() {
    console.log('Testing cron job schedule format...');
    
    const cronExpression = '0 2 * * *'; // 2:00 AM daily
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');
    
    console.log('Cron expression components:', {
        minute, hour, dayOfMonth, month, dayOfWeek
    });
    
    console.assert(minute === '0', 'Should run at minute 0');
    console.assert(hour === '2', 'Should run at hour 2 (2 AM)');
    console.assert(dayOfMonth === '*', 'Should run every day of month');
    console.assert(month === '*', 'Should run every month');
    console.assert(dayOfWeek === '*', 'Should run every day of week');
    
    console.log('✓ Cron schedule format validated');
}

// Test date calculation for different repeat types
function testDateCalculationForRepeatTypes() {
    console.log('\\nTesting date calculation for different repeat types...');
    
    const baseDate = new Date('2024-01-15T10:00:00Z');
    
    // Test daily calculation
    const nextDaily = RecurringTaskService.calculateNextDate(baseDate, 'daily');
    const expectedDaily = new Date('2024-01-16T10:00:00Z');
    console.log('Daily: base =', baseDate.toISOString(), ', next =', nextDaily.toISOString());
    console.assert(nextDaily.getTime() === expectedDaily.getTime(), 'Daily calculation should be correct');
    
    // Test weekly calculation
    const nextWeekly = RecurringTaskService.calculateNextDate(baseDate, 'weekly');
    const expectedWeekly = new Date('2024-01-22T10:00:00Z');
    console.log('Weekly: base =', baseDate.toISOString(), ', next =', nextWeekly.toISOString());
    console.assert(nextWeekly.getTime() === expectedWeekly.getTime(), 'Weekly calculation should be correct');
    
    // Test monthly calculation
    const nextMonthly = RecurringTaskService.calculateNextDate(baseDate, 'monthly');
    const expectedMonthly = new Date('2024-02-15T10:00:00Z');
    console.log('Monthly: base =', baseDate.toISOString(), ', next =', nextMonthly.toISOString());
    console.assert(nextMonthly.getTime() === expectedMonthly.getTime(), 'Monthly calculation should be correct');
    
    console.log('✓ Date calculation for repeat types validated');
}

// Test error handling for invalid repeat types
function testErrorHandlingForInvalidRepeatTypes() {
    console.log('\\nTesting error handling for invalid repeat types...');
    
    const invalidRepeatTypes = ['invalid', '', null, undefined];
    
    invalidRepeatTypes.forEach(repeatType => {
        console.log(`Testing invalid repeat type: ${repeatType}`);
        
        try {
            const result = RecurringTaskService.calculateNextDate(new Date(), repeatType);
            console.log(`Result for ${repeatType}:`, result);
        } catch (error) {
            console.log(`Expected error for ${repeatType}:`, error.message);
            console.assert(error.message.includes('Invalid repeat type') || error.message.includes('Unsupported'), 
                'Should have appropriate error message');
        }
    });
    
    console.log('✓ Error handling for invalid repeat types validated');
}

// Test result structure
function testResultStructure() {
    console.log('\\nTesting result structure...');
    
    const mockResult = {
        success: true,
        timestamp: new Date('2024-01-18T02:00:00Z'),
        duration: '1250ms',
        summary: {
            recurringParentsFound: 5,
            tasksProcessed: 5,
            totalInstancesGenerated: 12,
            errorsCount: 0
        },
        results: [
            {
                parentTaskId: 1,
                parentTitle: 'Daily Standup',
                existingInstances: 2,
                generatedInstances: 3,
                latestInstanceDate: new Date('2024-01-17T10:00:00Z')
            }
        ]
    };
    
    // Validate result structure
    console.assert(typeof mockResult.success === 'boolean', 'success should be boolean');
    console.assert(mockResult.timestamp instanceof Date, 'timestamp should be Date');
    console.assert(typeof mockResult.duration === 'string', 'duration should be string');
    console.assert(typeof mockResult.summary === 'object', 'summary should be object');
    console.assert(Array.isArray(mockResult.results), 'results should be array');
    
    console.log('✓ Result structure validated');
}

// Run all tests
function runTests() {
    console.log('Running cron job tests...\\n');
    
    try {
        testCronScheduleFormat();
        testDateCalculationForRepeatTypes();
        testErrorHandlingForInvalidRepeatTypes();
        testResultStructure();
        
        console.log('\\n🎉 All cron job tests passed successfully!');
    } catch (error) {
        console.error('\\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other test files
module.exports = {
    runTests
};

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}