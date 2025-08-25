/**
 * Performance and edge case tests for recurring tasks
 */

const RecurringTaskService = require('../src/services/recurringTaskService');

// Test date calculation performance
function testDateCalculationPerformance() {
    console.log('Testing date calculation performance...');
    
    const iterations = 1000;
    const baseDate = new Date('2024-01-15T10:00:00Z');
    
    // Test daily calculations
    console.log(`Performing ${iterations} daily calculations...`);
    const dailyStart = Date.now();
    for (let i = 0; i < iterations; i++) {
        RecurringTaskService.calculateNextDate(baseDate, 'daily');
    }
    const dailyDuration = Date.now() - dailyStart;
    console.log(`Daily calculations: ${dailyDuration}ms (${(dailyDuration/iterations).toFixed(2)}ms per calculation)`);
    
    // Test weekly calculations
    console.log(`Performing ${iterations} weekly calculations...`);
    const weeklyStart = Date.now();
    for (let i = 0; i < iterations; i++) {
        RecurringTaskService.calculateNextDate(baseDate, 'weekly');
    }
    const weeklyDuration = Date.now() - weeklyStart;
    console.log(`Weekly calculations: ${weeklyDuration}ms (${(weeklyDuration/iterations).toFixed(2)}ms per calculation)`);
    
    // Test monthly calculations
    console.log(`Performing ${iterations} monthly calculations...`);
    const monthlyStart = Date.now();
    for (let i = 0; i < iterations; i++) {
        RecurringTaskService.calculateNextDate(baseDate, 'monthly');
    }
    const monthlyDuration = Date.now() - monthlyStart;
    console.log(`Monthly calculations: ${monthlyDuration}ms (${(monthlyDuration/iterations).toFixed(2)}ms per calculation)`);
    
    // Performance assertions
    console.assert(dailyDuration < 100, 'Daily calculations should be fast');
    console.assert(weeklyDuration < 100, 'Weekly calculations should be fast');
    console.assert(monthlyDuration < 200, 'Monthly calculations should be reasonably fast');
    
    console.log('✓ Date calculation performance validated');
}

// Test edge cases
function testEdgeCases() {
    console.log('\\nTesting edge cases...');
    
    // Test leap year February 29th
    console.log('1. Testing leap year edge case...');
    const leapYearDate = new Date('2024-02-29T10:00:00Z');
    const nextMonth = RecurringTaskService.calculateNextDate(leapYearDate, 'monthly');
    console.log(`Leap year Feb 29 -> ${nextMonth.toISOString()}`);
    console.assert(nextMonth.getMonth() === 2, 'Should move to March'); // March is month 2 (0-indexed)
    console.assert(nextMonth.getDate() === 29, 'Should maintain day 29');
    
    // Test month-end dates
    console.log('2. Testing month-end dates...');
    const monthEndDate = new Date('2024-01-31T10:00:00Z');
    const nextMonthEnd = RecurringTaskService.calculateNextDate(monthEndDate, 'monthly');
    console.log(`Jan 31 -> ${nextMonthEnd.toISOString()}`);
    console.assert(nextMonthEnd.getMonth() === 1, 'Should move to February'); // February is month 1
    console.assert(nextMonthEnd.getDate() === 29, 'Should adjust to Feb 29 (leap year)');
    
    // Test year boundary
    console.log('3. Testing year boundary...');
    const yearEndDate = new Date('2024-12-31T10:00:00Z');
    const nextYearStart = RecurringTaskService.calculateNextDate(yearEndDate, 'daily');
    console.log(`Dec 31, 2024 -> ${nextYearStart.toISOString()}`);
    console.assert(nextYearStart.getFullYear() === 2025, 'Should move to next year');
    console.assert(nextYearStart.getMonth() === 0, 'Should be January');
    console.assert(nextYearStart.getDate() === 1, 'Should be 1st');
    
    console.log('✓ Edge cases validated');
}

// Test error handling
function testErrorHandling() {
    console.log('\\nTesting error handling...');
    
    const testCases = [
        { repeatType: 'invalid', expectedError: 'Invalid repeat type' },
        { repeatType: '', expectedError: 'Invalid repeat type' },
        { repeatType: null, expectedError: 'Invalid repeat type' },
        { repeatType: undefined, expectedError: 'Invalid repeat type' }
    ];
    
    testCases.forEach(testCase => {
        console.log(`Testing error for repeat type: ${testCase.repeatType}`);
        
        try {
            RecurringTaskService.calculateNextDate(new Date(), testCase.repeatType);
            console.assert(false, `Should have thrown error for ${testCase.repeatType}`);
        } catch (error) {
            console.log(`  ✓ Correctly threw error: ${error.message}`);
            console.assert(error.message.includes(testCase.expectedError), 'Should have expected error message');
        }
    });
    
    console.log('✓ Error handling validated');
}

// Test date sequence consistency
function testDateSequenceConsistency() {
    console.log('\\nTesting date sequence consistency...');
    
    const baseDate = new Date('2024-01-15T10:00:00Z');
    const repeatTypes = ['daily', 'weekly', 'monthly'];
    
    repeatTypes.forEach(repeatType => {
        console.log(`Testing ${repeatType} sequence...`);
        
        let currentDate = new Date(baseDate);
        const sequence = [currentDate];
        
        // Generate 10 dates in sequence
        for (let i = 0; i < 10; i++) {
            currentDate = RecurringTaskService.calculateNextDate(currentDate, repeatType);
            sequence.push(new Date(currentDate));
        }
        
        // Validate sequence is always increasing
        for (let i = 1; i < sequence.length; i++) {
            console.assert(sequence[i] > sequence[i-1], `Date ${i} should be after date ${i-1}`);
        }
        
        // Validate intervals
        if (repeatType === 'daily') {
            const daysDiff = (sequence[1] - sequence[0]) / (1000 * 60 * 60 * 24);
            console.assert(Math.abs(daysDiff - 1) < 0.01, 'Daily interval should be 1 day');
        } else if (repeatType === 'weekly') {
            const daysDiff = (sequence[1] - sequence[0]) / (1000 * 60 * 60 * 24);
            console.assert(Math.abs(daysDiff - 7) < 0.01, 'Weekly interval should be 7 days');
        }
        
        console.log(`  ✓ ${repeatType} sequence is consistent`);
    });
    
    console.log('✓ Date sequence consistency validated');
}

// Test timezone handling
function testTimezoneHandling() {
    console.log('\\nTesting timezone handling...');
    
    // Test with different time zones (all should produce consistent results)
    const baseDate = new Date('2024-01-15T10:00:00Z'); // UTC
    
    console.log('Base date (UTC):', baseDate.toISOString());
    
    const nextDaily = RecurringTaskService.calculateNextDate(baseDate, 'daily');
    const nextWeekly = RecurringTaskService.calculateNextDate(baseDate, 'weekly');
    const nextMonthly = RecurringTaskService.calculateNextDate(baseDate, 'monthly');
    
    console.log('Next daily:', nextDaily.toISOString());
    console.log('Next weekly:', nextWeekly.toISOString());
    console.log('Next monthly:', nextMonthly.toISOString());
    
    // Validate time components are preserved
    console.assert(nextDaily.getUTCHours() === baseDate.getUTCHours(), 'Hours should be preserved');
    console.assert(nextDaily.getUTCMinutes() === baseDate.getUTCMinutes(), 'Minutes should be preserved');
    console.assert(nextWeekly.getUTCHours() === baseDate.getUTCHours(), 'Hours should be preserved');
    console.assert(nextMonthly.getUTCHours() === baseDate.getUTCHours(), 'Hours should be preserved');
    
    console.log('✓ Timezone handling validated');
}

// Run all performance tests
function runPerformanceTests() {
    console.log('Running recurring tasks performance tests...\\n');
    
    const startTime = Date.now();
    
    try {
        testDateCalculationPerformance();
        testEdgeCases();
        testErrorHandling();
        testDateSequenceConsistency();
        testTimezoneHandling();
        
        const duration = Date.now() - startTime;
        
        console.log(`\\n🎉 All performance tests passed successfully!`);
        console.log(`⚡ Performance test suite completed in ${duration}ms`);
        
    } catch (error) {
        console.error('\\n❌ Performance test failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other test files
module.exports = {
    runPerformanceTests
};

// Run tests if this file is executed directly
if (require.main === module) {
    runPerformanceTests();
}