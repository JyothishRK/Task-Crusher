const RecurringTaskService = require('../src/services/recurringTaskService');

/**
 * Regression tests to ensure existing recurring task functionality remains intact
 * after the timestamp comparison fix
 */

// Test that monthly recurring tasks still handle month-end dates correctly
function testMonthlyRecurringMonthEndHandling() {
    console.log('Testing monthly recurring tasks month-end handling...');
    
    // Test January 31st -> February 28th (non-leap year)
    const jan31_2023 = new Date('2023-01-31T10:00:00.000Z');
    const feb28_2023 = RecurringTaskService.calculateNextDate(jan31_2023, 'monthly');
    const expectedFeb28 = new Date('2023-02-28T10:00:00.000Z');
    
    if (feb28_2023.getTime() !== expectedFeb28.getTime()) {
        throw new Error(`Jan 31 -> Feb 28 failed. Expected: ${expectedFeb28.toISOString()}, Got: ${feb28_2023.toISOString()}`);
    }
    console.log('✓ Jan 31 -> Feb 28 (non-leap year) works correctly');
    
    // Test January 31st -> February 29th (leap year)
    const jan31_2024 = new Date('2024-01-31T10:00:00.000Z');
    const feb29_2024 = RecurringTaskService.calculateNextDate(jan31_2024, 'monthly');
    const expectedFeb29 = new Date('2024-02-29T10:00:00.000Z');
    
    if (feb29_2024.getTime() !== expectedFeb29.getTime()) {
        throw new Error(`Jan 31 -> Feb 29 failed. Expected: ${expectedFeb29.toISOString()}, Got: ${feb29_2024.toISOString()}`);
    }
    console.log('✓ Jan 31 -> Feb 29 (leap year) works correctly');
    
    // Test March 31st -> April 30th
    const mar31 = new Date('2024-03-31T15:30:00.000Z');
    const apr30 = RecurringTaskService.calculateNextDate(mar31, 'monthly');
    const expectedApr30 = new Date('2024-04-30T15:30:00.000Z');
    
    if (apr30.getTime() !== expectedApr30.getTime()) {
        throw new Error(`Mar 31 -> Apr 30 failed. Expected: ${expectedApr30.toISOString()}, Got: ${apr30.toISOString()}`);
    }
    console.log('✓ Mar 31 -> Apr 30 works correctly');
    
    // Test May 31st -> June 30th
    const may31 = new Date('2024-05-31T09:15:30.500Z');
    const jun30 = RecurringTaskService.calculateNextDate(may31, 'monthly');
    const expectedJun30 = new Date('2024-06-30T09:15:30.500Z');
    
    if (jun30.getTime() !== expectedJun30.getTime()) {
        throw new Error(`May 31 -> Jun 30 failed. Expected: ${expectedJun30.toISOString()}, Got: ${jun30.toISOString()}`);
    }
    console.log('✓ May 31 -> Jun 30 works correctly');
    
    console.log('✓ Monthly recurring month-end handling regression test passed');
}

// Test that weekly recurring tasks continue to work as expected
function testWeeklyRecurringTasks() {
    console.log('\nTesting weekly recurring tasks...');
    
    // Test various days of the week
    const testCases = [
        { day: 'Monday', date: new Date('2025-01-20T08:00:00.000Z'), expected: new Date('2025-01-27T08:00:00.000Z') },
        { day: 'Tuesday', date: new Date('2025-01-21T14:30:00.000Z'), expected: new Date('2025-01-28T14:30:00.000Z') },
        { day: 'Wednesday', date: new Date('2025-01-22T16:45:15.123Z'), expected: new Date('2025-01-29T16:45:15.123Z') },
        { day: 'Thursday', date: new Date('2025-01-23T23:59:59.999Z'), expected: new Date('2025-01-30T23:59:59.999Z') },
        { day: 'Friday', date: new Date('2025-01-24T00:00:00.000Z'), expected: new Date('2025-01-31T00:00:00.000Z') },
        { day: 'Saturday', date: new Date('2025-01-25T12:00:00.000Z'), expected: new Date('2025-02-01T12:00:00.000Z') },
        { day: 'Sunday', date: new Date('2025-01-26T18:30:00.000Z'), expected: new Date('2025-02-02T18:30:00.000Z') }
    ];
    
    testCases.forEach(testCase => {
        const result = RecurringTaskService.calculateNextDate(testCase.date, 'weekly');
        if (result.getTime() !== testCase.expected.getTime()) {
            throw new Error(`Weekly ${testCase.day} failed. Expected: ${testCase.expected.toISOString()}, Got: ${result.toISOString()}`);
        }
        console.log(`✓ Weekly ${testCase.day} calculation works correctly`);
    });
    
    // Test multiple weeks
    let currentDate = new Date('2025-01-15T10:00:00.000Z');
    const expectedDates = [
        new Date('2025-01-22T10:00:00.000Z'),
        new Date('2025-01-29T10:00:00.000Z'),
        new Date('2025-02-05T10:00:00.000Z'),
        new Date('2025-02-12T10:00:00.000Z')
    ];
    
    for (let i = 0; i < expectedDates.length; i++) {
        currentDate = RecurringTaskService.calculateNextDate(currentDate, 'weekly');
        if (currentDate.getTime() !== expectedDates[i].getTime()) {
            throw new Error(`Multiple weeks calculation failed at week ${i + 1}. Expected: ${expectedDates[i].toISOString()}, Got: ${currentDate.toISOString()}`);
        }
    }
    console.log('✓ Multiple weeks calculation works correctly');
    
    console.log('✓ Weekly recurring tasks regression test passed');
}

// Test that daily recurring tasks maintain their existing behavior
function testDailyRecurringTasks() {
    console.log('\nTesting daily recurring tasks...');
    
    // Test various times of day
    const testCases = [
        { time: 'midnight', date: new Date('2025-01-15T00:00:00.000Z'), expected: new Date('2025-01-16T00:00:00.000Z') },
        { time: 'early morning', date: new Date('2025-01-15T06:30:00.000Z'), expected: new Date('2025-01-16T06:30:00.000Z') },
        { time: 'noon', date: new Date('2025-01-15T12:00:00.000Z'), expected: new Date('2025-01-16T12:00:00.000Z') },
        { time: 'evening', date: new Date('2025-01-15T18:45:30.500Z'), expected: new Date('2025-01-16T18:45:30.500Z') },
        { time: 'late night', date: new Date('2025-01-15T23:59:59.999Z'), expected: new Date('2025-01-16T23:59:59.999Z') }
    ];
    
    testCases.forEach(testCase => {
        const result = RecurringTaskService.calculateNextDate(testCase.date, 'daily');
        if (result.getTime() !== testCase.expected.getTime()) {
            throw new Error(`Daily ${testCase.time} failed. Expected: ${testCase.expected.toISOString()}, Got: ${result.toISOString()}`);
        }
        console.log(`✓ Daily ${testCase.time} calculation works correctly`);
    });
    
    // Test multiple days including month boundary
    let currentDate = new Date('2025-01-29T14:00:00.000Z');
    const expectedDates = [
        new Date('2025-01-30T14:00:00.000Z'),
        new Date('2025-01-31T14:00:00.000Z'),
        new Date('2025-02-01T14:00:00.000Z'),
        new Date('2025-02-02T14:00:00.000Z')
    ];
    
    for (let i = 0; i < expectedDates.length; i++) {
        currentDate = RecurringTaskService.calculateNextDate(currentDate, 'daily');
        if (currentDate.getTime() !== expectedDates[i].getTime()) {
            throw new Error(`Multiple days calculation failed at day ${i + 1}. Expected: ${expectedDates[i].toISOString()}, Got: ${currentDate.toISOString()}`);
        }
    }
    console.log('✓ Multiple days calculation including month boundary works correctly');
    
    console.log('✓ Daily recurring tasks regression test passed');
}

// Test that calculateNextDate method continues to preserve original time components
function testCalculateNextDateTimePreservation() {
    console.log('\nTesting calculateNextDate time preservation...');
    
    // Test with precise time components
    const originalTime = new Date('2025-01-15T14:23:45.678Z');
    
    // Test daily preservation
    const dailyNext = RecurringTaskService.calculateNextDate(originalTime, 'daily');
    if (dailyNext.getUTCHours() !== 14 || dailyNext.getUTCMinutes() !== 23 || 
        dailyNext.getUTCSeconds() !== 45 || dailyNext.getUTCMilliseconds() !== 678) {
        throw new Error(`Daily time preservation failed. Expected time components: 14:23:45.678, Got: ${dailyNext.getUTCHours()}:${dailyNext.getUTCMinutes()}:${dailyNext.getUTCSeconds()}.${dailyNext.getUTCMilliseconds()}`);
    }
    console.log('✓ Daily time preservation works correctly');
    
    // Test weekly preservation
    const weeklyNext = RecurringTaskService.calculateNextDate(originalTime, 'weekly');
    if (weeklyNext.getUTCHours() !== 14 || weeklyNext.getUTCMinutes() !== 23 || 
        weeklyNext.getUTCSeconds() !== 45 || weeklyNext.getUTCMilliseconds() !== 678) {
        throw new Error(`Weekly time preservation failed. Expected time components: 14:23:45.678, Got: ${weeklyNext.getUTCHours()}:${weeklyNext.getUTCMinutes()}:${weeklyNext.getUTCSeconds()}.${weeklyNext.getUTCMilliseconds()}`);
    }
    console.log('✓ Weekly time preservation works correctly');
    
    // Test monthly preservation
    const monthlyNext = RecurringTaskService.calculateNextDate(originalTime, 'monthly');
    if (monthlyNext.getUTCHours() !== 14 || monthlyNext.getUTCMinutes() !== 23 || 
        monthlyNext.getUTCSeconds() !== 45 || monthlyNext.getUTCMilliseconds() !== 678) {
        throw new Error(`Monthly time preservation failed. Expected time components: 14:23:45.678, Got: ${monthlyNext.getUTCHours()}:${monthlyNext.getUTCMinutes()}:${monthlyNext.getUTCSeconds()}.${monthlyNext.getUTCMilliseconds()}`);
    }
    console.log('✓ Monthly time preservation works correctly');
    
    console.log('✓ calculateNextDate time preservation regression test passed');
}

// Test calculateFutureDates method behavior
function testCalculateFutureDatesRegression() {
    console.log('\nTesting calculateFutureDates regression...');
    
    const baseDate = new Date('2025-01-15T10:30:00.000Z');
    
    // Test daily future dates
    const dailyFutures = RecurringTaskService.calculateFutureDates(baseDate, 'daily', 5);
    const expectedDaily = [
        new Date('2025-01-16T10:30:00.000Z'),
        new Date('2025-01-17T10:30:00.000Z'),
        new Date('2025-01-18T10:30:00.000Z'),
        new Date('2025-01-19T10:30:00.000Z'),
        new Date('2025-01-20T10:30:00.000Z')
    ];
    
    if (dailyFutures.length !== 5) {
        throw new Error(`Daily futures should return 5 dates, got ${dailyFutures.length}`);
    }
    
    for (let i = 0; i < expectedDaily.length; i++) {
        if (dailyFutures[i].getTime() !== expectedDaily[i].getTime()) {
            throw new Error(`Daily future date ${i} failed. Expected: ${expectedDaily[i].toISOString()}, Got: ${dailyFutures[i].toISOString()}`);
        }
    }
    console.log('✓ Daily future dates calculation works correctly');
    
    // Test weekly future dates
    const weeklyFutures = RecurringTaskService.calculateFutureDates(baseDate, 'weekly', 3);
    const expectedWeekly = [
        new Date('2025-01-22T10:30:00.000Z'),
        new Date('2025-01-29T10:30:00.000Z'),
        new Date('2025-02-05T10:30:00.000Z')
    ];
    
    if (weeklyFutures.length !== 3) {
        throw new Error(`Weekly futures should return 3 dates, got ${weeklyFutures.length}`);
    }
    
    for (let i = 0; i < expectedWeekly.length; i++) {
        if (weeklyFutures[i].getTime() !== expectedWeekly[i].getTime()) {
            throw new Error(`Weekly future date ${i} failed. Expected: ${expectedWeekly[i].toISOString()}, Got: ${weeklyFutures[i].toISOString()}`);
        }
    }
    console.log('✓ Weekly future dates calculation works correctly');
    
    // Test monthly future dates
    const monthlyFutures = RecurringTaskService.calculateFutureDates(baseDate, 'monthly', 4);
    const expectedMonthly = [
        new Date('2025-02-15T10:30:00.000Z'),
        new Date('2025-03-15T10:30:00.000Z'),
        new Date('2025-04-15T10:30:00.000Z'),
        new Date('2025-05-15T10:30:00.000Z')
    ];
    
    if (monthlyFutures.length !== 4) {
        throw new Error(`Monthly futures should return 4 dates, got ${monthlyFutures.length}`);
    }
    
    for (let i = 0; i < expectedMonthly.length; i++) {
        if (monthlyFutures[i].getTime() !== expectedMonthly[i].getTime()) {
            throw new Error(`Monthly future date ${i} failed. Expected: ${expectedMonthly[i].toISOString()}, Got: ${monthlyFutures[i].toISOString()}`);
        }
    }
    console.log('✓ Monthly future dates calculation works correctly');
    
    console.log('✓ calculateFutureDates regression test passed');
}

// Test validation methods still work correctly
function testValidationMethodsRegression() {
    console.log('\nTesting validation methods regression...');
    
    // Test isValidDateForRepeatType
    const validDate = new Date('2025-01-15T10:00:00.000Z');
    const invalidDate = new Date('invalid');
    
    if (!RecurringTaskService.isValidDateForRepeatType(validDate, 'daily')) {
        throw new Error('Valid date should pass for daily repeat type');
    }
    if (!RecurringTaskService.isValidDateForRepeatType(validDate, 'weekly')) {
        throw new Error('Valid date should pass for weekly repeat type');
    }
    if (!RecurringTaskService.isValidDateForRepeatType(validDate, 'monthly')) {
        throw new Error('Valid date should pass for monthly repeat type');
    }
    if (RecurringTaskService.isValidDateForRepeatType(invalidDate, 'daily')) {
        throw new Error('Invalid date should fail for daily repeat type');
    }
    if (RecurringTaskService.isValidDateForRepeatType(null, 'daily')) {
        throw new Error('Null date should fail for daily repeat type');
    }
    console.log('✓ isValidDateForRepeatType validation works correctly');
    
    // Test getNextMonthlyDate
    const monthlyBase = new Date('2025-01-15T10:00:00.000Z');
    const nextMonthly = RecurringTaskService.getNextMonthlyDate(monthlyBase);
    const expectedNextMonthly = new Date('2025-02-15T10:00:00.000Z');
    
    if (nextMonthly.getTime() !== expectedNextMonthly.getTime()) {
        throw new Error(`getNextMonthlyDate failed. Expected: ${expectedNextMonthly.toISOString()}, Got: ${nextMonthly.toISOString()}`);
    }
    console.log('✓ getNextMonthlyDate works correctly');
    
    // Test getNextMonthlyDate with multiple months
    const multiMonthly = RecurringTaskService.getNextMonthlyDate(monthlyBase, 3);
    const expectedMultiMonthly = new Date('2025-04-15T10:00:00.000Z');
    
    if (multiMonthly.getTime() !== expectedMultiMonthly.getTime()) {
        throw new Error(`getNextMonthlyDate with multiple months failed. Expected: ${expectedMultiMonthly.toISOString()}, Got: ${multiMonthly.toISOString()}`);
    }
    console.log('✓ getNextMonthlyDate with multiple months works correctly');
    
    console.log('✓ Validation methods regression test passed');
}

// Test edge cases that should continue to work
function testEdgeCasesRegression() {
    console.log('\nTesting edge cases regression...');
    
    // Test leap year handling
    const leapYearDate = new Date('2024-02-29T12:00:00.000Z');
    const nextYearFromLeap = RecurringTaskService.calculateNextDate(leapYearDate, 'monthly');
    const expectedNextFromLeap = new Date('2024-03-29T12:00:00.000Z');
    
    if (nextYearFromLeap.getTime() !== expectedNextFromLeap.getTime()) {
        throw new Error(`Leap year monthly calculation failed. Expected: ${expectedNextFromLeap.toISOString()}, Got: ${nextYearFromLeap.toISOString()}`);
    }
    console.log('✓ Leap year monthly calculation works correctly');
    
    // Test year boundary crossing
    const yearEnd = new Date('2024-12-31T23:59:59.999Z');
    const newYear = RecurringTaskService.calculateNextDate(yearEnd, 'daily');
    const expectedNewYear = new Date('2025-01-01T23:59:59.999Z');
    
    if (newYear.getTime() !== expectedNewYear.getTime()) {
        throw new Error(`Year boundary crossing failed. Expected: ${expectedNewYear.toISOString()}, Got: ${newYear.toISOString()}`);
    }
    console.log('✓ Year boundary crossing works correctly');
    
    // Test DST boundaries (if applicable)
    // Note: This test assumes UTC dates, so DST shouldn't affect it
    const beforeDST = new Date('2025-03-08T10:00:00.000Z'); // Around US DST change
    const afterDST = RecurringTaskService.calculateNextDate(beforeDST, 'daily');
    const expectedAfterDST = new Date('2025-03-09T10:00:00.000Z');
    
    if (afterDST.getTime() !== expectedAfterDST.getTime()) {
        throw new Error(`DST boundary crossing failed. Expected: ${expectedAfterDST.toISOString()}, Got: ${afterDST.toISOString()}`);
    }
    console.log('✓ DST boundary crossing works correctly');
    
    console.log('✓ Edge cases regression test passed');
}

// Run all regression tests
function runRegressionTests() {
    console.log('Running Recurring Task Regression Tests...\n');
    
    try {
        testMonthlyRecurringMonthEndHandling();
        testWeeklyRecurringTasks();
        testDailyRecurringTasks();
        testCalculateNextDateTimePreservation();
        testCalculateFutureDatesRegression();
        testValidationMethodsRegression();
        testEdgeCasesRegression();
        
        console.log('\n✅ All regression tests passed successfully!');
        console.log('✅ Existing functionality remains intact after the timestamp comparison fix');
    } catch (error) {
        console.error('\n❌ Regression test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runRegressionTests();
}

module.exports = {
    runRegressionTests
};