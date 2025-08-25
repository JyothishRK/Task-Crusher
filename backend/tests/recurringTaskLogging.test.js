const RecurringTaskService = require('../src/services/recurringTaskService');

/**
 * Test the enhanced logging and error handling for the timestamp comparison fix
 */

// Test the date comparison validation method
function testDateComparisonValidation() {
    console.log('Testing date comparison validation...');
    
    // Test valid dates
    const validNext = new Date('2025-01-28T06:30:00.000Z');
    const validTarget = new Date('2025-01-28T02:00:00.000Z');
    const isValid = RecurringTaskService.validateDateComparison(validNext, validTarget, 123);
    
    if (!isValid) {
        throw new Error('Valid dates should pass validation');
    }
    console.log('✓ Valid dates pass validation');
    
    // Test invalid dates
    const invalidNext = new Date('invalid');
    const isInvalid = RecurringTaskService.validateDateComparison(invalidNext, validTarget, 123);
    
    if (isInvalid) {
        throw new Error('Invalid dates should fail validation');
    }
    console.log('✓ Invalid dates fail validation');
    
    // Test null dates
    const isNull = RecurringTaskService.validateDateComparison(null, validTarget, 123);
    
    if (isNull) {
        throw new Error('Null dates should fail validation');
    }
    console.log('✓ Null dates fail validation');
    
    console.log('✓ Date comparison validation test passed');
}

// Test the date comparison testing method
function testDateComparisonTesting() {
    console.log('\nTesting date comparison testing method...');
    
    // Test the problematic scenario from the bug report
    const cronTime = new Date('2025-01-25T02:00:00.123Z');
    const taskTime = new Date('2025-01-28T06:30:00.000Z');
    
    const result = RecurringTaskService.testDateComparison(cronTime, taskTime, 456);
    
    if (!result) {
        throw new Error('Date comparison test should return results');
    }
    
    if (result.oldComparison.result === true) {
        throw new Error('Old comparison should be false for this scenario');
    }
    
    if (result.newComparison.result === false) {
        throw new Error('New comparison should be true for this scenario');
    }
    
    if (!result.fixEffective) {
        throw new Error('Fix should be effective for this scenario');
    }
    
    if (!result.wouldBeGenerated) {
        throw new Error('Task should be generated with the fix');
    }
    
    console.log('✓ Date comparison testing method works correctly');
    console.log(`  Old comparison: ${result.oldComparison.result}`);
    console.log(`  New comparison: ${result.newComparison.result}`);
    console.log(`  Fix effective: ${result.fixEffective}`);
    console.log(`  Would be generated: ${result.wouldBeGenerated}`);
}

// Test error handling in date calculations
function testDateCalculationErrorHandling() {
    console.log('\nTesting date calculation error handling...');
    
    // Test with valid inputs first
    const validDate = new Date('2025-01-15T10:00:00.000Z');
    
    try {
        const nextDaily = RecurringTaskService.calculateNextDate(validDate, 'daily');
        if (!nextDaily || !(nextDaily instanceof Date) || isNaN(nextDaily.getTime())) {
            throw new Error('Valid daily calculation should work');
        }
        console.log('✓ Valid daily calculation works');
    } catch (error) {
        throw new Error(`Valid daily calculation failed: ${error.message}`);
    }
    
    try {
        const nextWeekly = RecurringTaskService.calculateNextDate(validDate, 'weekly');
        if (!nextWeekly || !(nextWeekly instanceof Date) || isNaN(nextWeekly.getTime())) {
            throw new Error('Valid weekly calculation should work');
        }
        console.log('✓ Valid weekly calculation works');
    } catch (error) {
        throw new Error(`Valid weekly calculation failed: ${error.message}`);
    }
    
    try {
        const nextMonthly = RecurringTaskService.calculateNextDate(validDate, 'monthly');
        if (!nextMonthly || !(nextMonthly instanceof Date) || isNaN(nextMonthly.getTime())) {
            throw new Error('Valid monthly calculation should work');
        }
        console.log('✓ Valid monthly calculation works');
    } catch (error) {
        throw new Error(`Valid monthly calculation failed: ${error.message}`);
    }
    
    // Test error handling for invalid inputs
    try {
        RecurringTaskService.calculateNextDate(null, 'daily');
        throw new Error('Should throw error for null date');
    } catch (error) {
        if (error.message.includes('Should throw error')) {
            throw error;
        }
        console.log('✓ Null date error handling works');
    }
    
    try {
        RecurringTaskService.calculateNextDate(validDate, 'invalid');
        throw new Error('Should throw error for invalid repeat type');
    } catch (error) {
        if (error.message.includes('Should throw error')) {
            throw error;
        }
        console.log('✓ Invalid repeat type error handling works');
    }
    
    console.log('✓ Date calculation error handling test passed');
}

// Test logging scenarios
function testLoggingScenarios() {
    console.log('\nTesting various logging scenarios...');
    
    // Test scenario where old and new comparison differ
    const scenarios = [
        {
            name: 'Task time after CRON time (fix needed)',
            cronTime: new Date('2025-01-25T02:00:00.000Z'),
            taskTime: new Date('2025-01-28T06:30:00.000Z'),
            expectedOld: false,
            expectedNew: true
        },
        {
            name: 'Task time before CRON time (both should work)',
            cronTime: new Date('2025-01-25T02:00:00.000Z'),
            taskTime: new Date('2025-01-28T01:00:00.000Z'),
            expectedOld: true,
            expectedNew: true
        },
        {
            name: 'Task time same as CRON time (both should work)',
            cronTime: new Date('2025-01-25T02:00:00.000Z'),
            taskTime: new Date('2025-01-28T02:00:00.000Z'),
            expectedOld: true,
            expectedNew: true
        },
        {
            name: 'Task outside window (both should reject)',
            cronTime: new Date('2025-01-25T02:00:00.000Z'),
            taskTime: new Date('2025-01-30T10:00:00.000Z'),
            expectedOld: false,
            expectedNew: false
        }
    ];
    
    scenarios.forEach(scenario => {
        console.log(`  Testing: ${scenario.name}`);
        const result = RecurringTaskService.testDateComparison(scenario.cronTime, scenario.taskTime, 789);
        
        if (result.oldComparison.result !== scenario.expectedOld) {
            throw new Error(`Old comparison mismatch for ${scenario.name}. Expected: ${scenario.expectedOld}, Got: ${result.oldComparison.result}`);
        }
        
        if (result.newComparison.result !== scenario.expectedNew) {
            throw new Error(`New comparison mismatch for ${scenario.name}. Expected: ${scenario.expectedNew}, Got: ${result.newComparison.result}`);
        }
        
        console.log(`    ✓ Old: ${result.oldComparison.result}, New: ${result.newComparison.result}, Fix effective: ${result.fixEffective}`);
    });
    
    console.log('✓ Logging scenarios test passed');
}

// Run all logging tests
function runLoggingTests() {
    console.log('Running Enhanced Logging and Error Handling Tests...\n');
    
    try {
        testDateComparisonValidation();
        testDateComparisonTesting();
        testDateCalculationErrorHandling();
        testLoggingScenarios();
        
        console.log('\n✅ All logging and error handling tests passed successfully!');
        console.log('✅ Enhanced observability for the timestamp comparison fix is working correctly');
    } catch (error) {
        console.error('\n❌ Logging test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runLoggingTests();
}

module.exports = {
    runLoggingTests
};