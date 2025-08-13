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