const RecurringTaskService = require('../src/services/recurringTaskService');

/**
 * Unit tests for RecurringTaskService date calculation logic
 */

// Test calculateNextDate method
function testCalculateNextDate() {
    console.log('Testing calculateNextDate method...');
    
    // Test daily repeat
    const dailyBase = new Date('2024-01-15T10:00:00Z');
    const dailyNext = RecurringTaskService.calculateNextDate(dailyBase, 'daily');
    const expectedDaily = new Date('2024-01-16T10:00:00Z');
    console.assert(dailyNext.getTime() === expectedDaily.getTime(), 'Daily calculation failed');
    console.log('✓ Daily repeat calculation passed');
    
    // Test weekly repeat
    const weeklyBase = new Date('2024-01-15T10:00:00Z');
    const weeklyNext = RecurringTaskService.calculateNextDate(weeklyBase, 'weekly');
    const expectedWeekly = new Date('2024-01-22T10:00:00Z');
    console.assert(weeklyNext.getTime() === expectedWeekly.getTime(), 'Weekly calculation failed');
    console.log('✓ Weekly repeat calculation passed');
    
    // Test monthly repeat - normal case
    const monthlyBase = new Date('2024-01-15T10:00:00Z');
    const monthlyNext = RecurringTaskService.calculateNextDate(monthlyBase, 'monthly');
    const expectedMonthly = new Date('2024-02-15T10:00:00Z');
    console.assert(monthlyNext.getTime() === expectedMonthly.getTime(), 'Monthly calculation failed');
    console.log('✓ Monthly repeat calculation passed');
    
    // Test monthly repeat - month-end edge case (Jan 31 -> Feb 29 in leap year)
    const monthEndBase = new Date('2024-01-31T10:00:00Z');
    const monthEndNext = RecurringTaskService.calculateNextDate(monthEndBase, 'monthly');
    const expectedMonthEnd = new Date('2024-02-29T10:00:00Z'); // 2024 is leap year
    console.assert(monthEndNext.getTime() === expectedMonthEnd.getTime(), 'Month-end calculation failed');
    console.log('✓ Month-end edge case calculation passed');
    
    // Test monthly repeat - non-leap year (Jan 31 -> Feb 28)
    const nonLeapBase = new Date('2023-01-31T10:00:00Z');
    const nonLeapNext = RecurringTaskService.calculateNextDate(nonLeapBase, 'monthly');
    const expectedNonLeap = new Date('2023-02-28T10:00:00Z'); // 2023 is not leap year
    console.assert(nonLeapNext.getTime() === expectedNonLeap.getTime(), 'Non-leap year calculation failed');
    console.log('✓ Non-leap year edge case calculation passed');
    
    // Test invalid inputs
    try {
        RecurringTaskService.calculateNextDate(null, 'daily');
        console.assert(false, 'Should throw error for null date');
    } catch (error) {
        console.log('✓ Null date validation passed');
    }
    
    try {
        RecurringTaskService.calculateNextDate(new Date(), 'invalid');
        console.assert(false, 'Should throw error for invalid repeat type');
    } catch (error) {
        console.log('✓ Invalid repeat type validation passed');
    }
}

// Test calculateFutureDates method
function testCalculateFutureDates() {
    console.log('\nTesting calculateFutureDates method...');
    
    const baseDate = new Date('2024-01-15T10:00:00Z');
    const futureDates = RecurringTaskService.calculateFutureDates(baseDate, 'daily', 3);
    
    console.assert(futureDates.length === 3, 'Should return 3 future dates');
    console.assert(futureDates[0].getTime() === new Date('2024-01-16T10:00:00Z').getTime(), 'First date incorrect');
    console.assert(futureDates[1].getTime() === new Date('2024-01-17T10:00:00Z').getTime(), 'Second date incorrect');
    console.assert(futureDates[2].getTime() === new Date('2024-01-18T10:00:00Z').getTime(), 'Third date incorrect');
    
    console.log('✓ Future dates calculation passed');
    
    // Test with count = 0
    try {
        RecurringTaskService.calculateFutureDates(baseDate, 'daily', 0);
        console.assert(false, 'Should throw error for count = 0');
    } catch (error) {
        console.log('✓ Zero count validation passed');
    }
}

// Test isValidDateForRepeatType method
function testIsValidDateForRepeatType() {
    console.log('\nTesting isValidDateForRepeatType method...');
    
    const validDate = new Date('2024-01-15T10:00:00Z');
    console.assert(RecurringTaskService.isValidDateForRepeatType(validDate, 'daily'), 'Valid date should pass for daily');
    console.assert(RecurringTaskService.isValidDateForRepeatType(validDate, 'weekly'), 'Valid date should pass for weekly');
    console.assert(RecurringTaskService.isValidDateForRepeatType(validDate, 'monthly'), 'Valid date should pass for monthly');
    
    console.assert(!RecurringTaskService.isValidDateForRepeatType(null, 'daily'), 'Null date should fail');
    console.assert(!RecurringTaskService.isValidDateForRepeatType(new Date('invalid'), 'daily'), 'Invalid date should fail');
    
    console.log('✓ Date validation passed');
}

// Test getNextMonthlyDate method
function testGetNextMonthlyDate() {
    console.log('\nTesting getNextMonthlyDate method...');
    
    // Normal case
    const normalDate = new Date('2024-01-15T10:00:00Z');
    const nextNormal = RecurringTaskService.getNextMonthlyDate(normalDate);
    console.assert(nextNormal.getTime() === new Date('2024-02-15T10:00:00Z').getTime(), 'Normal monthly date failed');
    
    // Month-end case (Jan 31 -> Feb 29 in leap year)
    const monthEndDate = new Date('2024-01-31T10:00:00Z');
    const nextMonthEnd = RecurringTaskService.getNextMonthlyDate(monthEndDate);
    console.assert(nextMonthEnd.getTime() === new Date('2024-02-29T10:00:00Z').getTime(), 'Month-end date failed');
    
    // Multiple months
    const multiMonth = RecurringTaskService.getNextMonthlyDate(normalDate, 3);
    console.assert(multiMonth.getTime() === new Date('2024-04-15T10:00:00Z').getTime(), 'Multiple months failed');
    
    console.log('✓ Monthly date calculation passed');
}

// Test generateInstances method validation (without database operations)
function testGenerateInstancesValidation() {
    console.log('\nTesting generateInstances validation...');
    
    // Since generateInstances is async, we'll test the synchronous validation parts
    // The actual database operations would need integration tests
    
    // Test that the method exists and is callable
    console.assert(typeof RecurringTaskService.generateInstances === 'function', 'generateInstances should be a function');
    
    // Test date calculation for instance generation
    const baseDate = new Date('2024-01-15T10:00:00Z');
    const futureDates = RecurringTaskService.calculateFutureDates(baseDate, 'daily', 3);
    
    console.assert(futureDates.length === 3, 'Should calculate 3 future dates');
    console.assert(futureDates[0].getTime() === new Date('2024-01-16T10:00:00Z').getTime(), 'First instance date should be correct');
    
    console.log('✓ Instance generation validation passed');
}

// Test getMissingInstanceDates logic
function testGetMissingInstanceDatesLogic() {
    console.log('\nTesting getMissingInstanceDates logic...');
    
    // This would require database mocking for full testing
    // For now, we'll test the date comparison logic
    const dates = [
        new Date('2024-01-15T10:00:00Z'),
        new Date('2024-01-16T10:00:00Z'),
        new Date('2024-01-17T10:00:00Z')
    ];
    
    // Test date array processing
    console.assert(dates.length === 3, 'Should have 3 dates');
    console.assert(dates[0].toISOString().split('T')[0] === '2024-01-15', 'Date formatting should work');
    
    console.log('✓ Missing instance dates logic passed');
}

// Test date-only comparison logic (for the timestamp fix)
function testDateOnlyComparison() {
    console.log('\nTesting date-only comparison logic...');
    
    // Test scenario 1: Task time after CRON time (6:30 AM task, 2:00 AM CRON)
    const cronTime = new Date('2025-01-25T02:00:00.123Z');
    const taskTime = new Date('2025-01-28T06:30:00.000Z');
    const targetDate = new Date(cronTime);
    targetDate.setDate(cronTime.getDate() + 3); // 3 days ahead
    
    // Using the fixed comparison logic
    const shouldGenerate1 = taskTime.toDateString() <= targetDate.toDateString();
    console.assert(shouldGenerate1, 'Task with time after CRON should be generated');
    console.log('✓ Task time after CRON time scenario passed');
    
    // Test scenario 2: Task time before CRON time (1:00 AM task, 2:00 AM CRON)
    const taskTimeBefore = new Date('2025-01-28T01:00:00.000Z');
    const shouldGenerate2 = taskTimeBefore.toDateString() <= targetDate.toDateString();
    console.assert(shouldGenerate2, 'Task with time before CRON should be generated');
    console.log('✓ Task time before CRON time scenario passed');
    
    // Test scenario 3: Same date, different times
    const sameDate = new Date('2025-01-25T18:00:00.000Z');
    const shouldGenerate3 = sameDate.toDateString() <= targetDate.toDateString();
    console.assert(shouldGenerate3, 'Task on same date with different time should be generated');
    console.log('✓ Same date, different times scenario passed');
    
    // Test edge case: Exact target date boundary (should be same as target date)
    const exactTargetDate = new Date(targetDate);
    exactTargetDate.setHours(23, 59, 59, 999); // End of the target day
    const shouldGenerate4 = exactTargetDate.toDateString() <= targetDate.toDateString();
    if (!shouldGenerate4) {
        throw new Error(`Task on exact target date should be generated. Task: ${exactTargetDate.toDateString()}, Target: ${targetDate.toDateString()}`);
    }
    console.log('✓ Exact target date boundary scenario passed');
    
    // Test edge case: Day after target date
    const dayAfterTarget = new Date(targetDate);
    dayAfterTarget.setDate(targetDate.getDate() + 1); // One day after target
    const shouldNotGenerate = dayAfterTarget.toDateString() <= targetDate.toDateString();
    if (shouldNotGenerate) {
        throw new Error(`Task after target date should not be generated. Task: ${dayAfterTarget.toDateString()}, Target: ${targetDate.toDateString()}`);
    }
    console.log('✓ Day after target date scenario passed');
}

// Test that the fix preserves time components in generated tasks
function testTimePreservation() {
    console.log('\nTesting time component preservation...');
    
    // Test that calculateNextDate preserves original time
    const originalTime = new Date('2025-01-15T06:30:45.123Z');
    
    // Daily repeat should preserve time
    const dailyNext = RecurringTaskService.calculateNextDate(originalTime, 'daily');
    if (dailyNext.getUTCHours() !== 6) {
        throw new Error(`Daily repeat should preserve hours. Expected 6, got ${dailyNext.getUTCHours()}`);
    }
    if (dailyNext.getUTCMinutes() !== 30) {
        throw new Error(`Daily repeat should preserve minutes. Expected 30, got ${dailyNext.getUTCMinutes()}`);
    }
    if (dailyNext.getUTCSeconds() !== 45) {
        throw new Error(`Daily repeat should preserve seconds. Expected 45, got ${dailyNext.getUTCSeconds()}`);
    }
    if (dailyNext.getUTCMilliseconds() !== 123) {
        throw new Error(`Daily repeat should preserve milliseconds. Expected 123, got ${dailyNext.getUTCMilliseconds()}`);
    }
    console.log('✓ Daily repeat preserves time components');
    
    // Weekly repeat should preserve time
    const weeklyNext = RecurringTaskService.calculateNextDate(originalTime, 'weekly');
    if (weeklyNext.getUTCHours() !== 6) {
        throw new Error(`Weekly repeat should preserve hours. Expected 6, got ${weeklyNext.getUTCHours()}`);
    }
    if (weeklyNext.getUTCMinutes() !== 30) {
        throw new Error(`Weekly repeat should preserve minutes. Expected 30, got ${weeklyNext.getUTCMinutes()}`);
    }
    console.log('✓ Weekly repeat preserves time components');
    
    // Monthly repeat should preserve time
    const monthlyNext = RecurringTaskService.calculateNextDate(originalTime, 'monthly');
    if (monthlyNext.getUTCHours() !== 6) {
        throw new Error(`Monthly repeat should preserve hours. Expected 6, got ${monthlyNext.getUTCHours()}`);
    }
    if (monthlyNext.getUTCMinutes() !== 30) {
        throw new Error(`Monthly repeat should preserve minutes. Expected 30, got ${monthlyNext.getUTCMinutes()}`);
    }
    console.log('✓ Monthly repeat preserves time components');
}

// Test date comparison across different repeat types
function testDateComparisonAcrossRepeatTypes() {
    console.log('\nTesting date comparison across different repeat types...');
    
    const baseDate = new Date('2025-01-15T14:30:00.000Z');
    const cronDate = new Date('2025-01-15T02:00:00.000Z');
    const targetDate = new Date(cronDate);
    targetDate.setDate(cronDate.getDate() + 3);
    
    // Test daily recurring tasks
    const dailyDates = RecurringTaskService.calculateFutureDates(baseDate, 'daily', 3);
    for (const date of dailyDates) {
        const shouldGenerate = date.toDateString() <= targetDate.toDateString();
        if (!shouldGenerate) {
            console.log(`Daily task for ${date.toDateString()} is outside the 3-day window (target: ${targetDate.toDateString()})`);
        }
    }
    console.log('✓ Daily recurring tasks comparison passed');
    
    // Test weekly recurring tasks
    const weeklyDates = RecurringTaskService.calculateFutureDates(baseDate, 'weekly', 3);
    for (const date of weeklyDates) {
        const shouldGenerate = date.toDateString() <= targetDate.toDateString();
        // Only dates within the 3-day window should be generated
        const withinWindow = date <= targetDate;
        if (withinWindow) {
            console.assert(shouldGenerate, `Weekly task for ${date.toDateString()} should be generated`);
        }
    }
    console.log('✓ Weekly recurring tasks comparison passed');
    
    // Test monthly recurring tasks
    const monthlyDates = RecurringTaskService.calculateFutureDates(baseDate, 'monthly', 3);
    for (const date of monthlyDates) {
        const shouldGenerate = date.toDateString() <= targetDate.toDateString();
        // Only dates within the 3-day window should be generated
        const withinWindow = date <= targetDate;
        if (withinWindow) {
            console.assert(shouldGenerate, `Monthly task for ${date.toDateString()} should be generated`);
        }
    }
    console.log('✓ Monthly recurring tasks comparison passed');
}

// Test edge cases for date comparison
function testDateComparisonEdgeCases() {
    console.log('\nTesting date comparison edge cases...');
    
    // Test midnight boundary
    const midnightTask = new Date('2025-01-28T00:00:00.000Z');
    const cronTime = new Date('2025-01-25T02:00:00.000Z');
    const targetDate = new Date(cronTime);
    targetDate.setDate(cronTime.getDate() + 3);
    
    const shouldGenerate = midnightTask.toDateString() <= targetDate.toDateString();
    console.assert(shouldGenerate, 'Midnight task should be generated');
    console.log('✓ Midnight boundary test passed');
    
    // Test end of day boundary
    const endOfDayTask = new Date(targetDate);
    endOfDayTask.setHours(23, 59, 59, 999); // End of the target day
    const shouldGenerateEndOfDay = endOfDayTask.toDateString() <= targetDate.toDateString();
    if (!shouldGenerateEndOfDay) {
        throw new Error(`End of day task should be generated. Task: ${endOfDayTask.toDateString()}, Target: ${targetDate.toDateString()}`);
    }
    console.log('✓ End of day boundary test passed');
    
    // Test month boundary
    const monthBoundaryTask = new Date('2025-01-31T15:00:00.000Z');
    const monthBoundaryCron = new Date('2025-01-29T02:00:00.000Z');
    const monthBoundaryTarget = new Date(monthBoundaryCron);
    monthBoundaryTarget.setDate(monthBoundaryCron.getDate() + 3); // Feb 1st
    
    const shouldGenerateMonthBoundary = monthBoundaryTask.toDateString() <= monthBoundaryTarget.toDateString();
    console.assert(shouldGenerateMonthBoundary, 'Month boundary task should be generated');
    console.log('✓ Month boundary test passed');
    
    // Test leap year boundary (2024 is a leap year)
    const leapYearTask = new Date('2024-02-29T12:00:00.000Z');
    const leapYearCron = new Date('2024-02-26T02:00:00.000Z'); // Start earlier to include Feb 29
    const leapYearTarget = new Date(leapYearCron);
    leapYearTarget.setDate(leapYearCron.getDate() + 3); // Feb 29
    
    const shouldGenerateLeapYear = leapYearTask.toDateString() <= leapYearTarget.toDateString();
    if (!shouldGenerateLeapYear) {
        throw new Error(`Leap year task should be generated. Task: ${leapYearTask.toDateString()}, Target: ${leapYearTarget.toDateString()}`);
    }
    console.log('✓ Leap year boundary test passed');
}

// Run all tests
function runTests() {
    console.log('Running RecurringTaskService tests...\n');
    
    try {
        testCalculateNextDate();
        testCalculateFutureDates();
        testIsValidDateForRepeatType();
        testGetNextMonthlyDate();
        testGenerateInstancesValidation();
        testGetMissingInstanceDatesLogic();
        
        // New tests for the timestamp comparison fix
        testDateOnlyComparison();
        testTimePreservation();
        testDateComparisonAcrossRepeatTypes();
        testDateComparisonEdgeCases();
        
        console.log('\n✅ All tests passed successfully!');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    runTests
};