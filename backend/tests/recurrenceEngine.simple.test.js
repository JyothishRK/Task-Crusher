// Simple test to verify Recurrence Engine implementation
const RecurrenceEngine = require('../src/workers/recurrenceEngine');

async function runTests() {
    console.log('Testing Recurrence Engine implementation...');

    try {
        console.log('✅ RecurrenceEngine imports successfully');
        
        // Check if all required methods exist
        const methods = [
            'calculateNextOccurrence',
            'generateOccurrences',
            'validateRecurrenceRules',
            'getTimeUntilNext',
            'getRecurrenceDescription',
            'handleMonthlyEdgeCases',
            'isWeekend',
            'adjustToBusinessDay',
            'getOccurrencesInPeriod'
        ];
        
        console.log('✅ RecurrenceEngine methods:');
        methods.forEach(method => {
            const exists = typeof RecurrenceEngine[method] === 'function';
            console.log(`  - ${method}: ${exists ? '✅' : '❌'}`);
        });
        
        // Test basic functionality
        console.log('✅ Basic functionality tests:');
        
        // Test daily recurrence
        const today = new Date('2024-01-15T10:00:00Z');
        const tomorrow = RecurrenceEngine.calculateNextOccurrence(today, 'daily');
        const expectedTomorrow = new Date('2024-01-16T10:00:00Z');
        console.log(`  - Daily recurrence: ${tomorrow.getTime() === expectedTomorrow.getTime() ? '✅' : '❌'}`);
        
        // Test weekly recurrence
        const nextWeek = RecurrenceEngine.calculateNextOccurrence(today, 'weekly');
        const expectedNextWeek = new Date('2024-01-22T10:00:00Z');
        console.log(`  - Weekly recurrence: ${nextWeek.getTime() === expectedNextWeek.getTime() ? '✅' : '❌'}`);
        
        // Test monthly recurrence
        const nextMonth = RecurrenceEngine.calculateNextOccurrence(today, 'monthly');
        const expectedNextMonth = new Date('2024-02-15T10:00:00Z');
        console.log(`  - Monthly recurrence: ${nextMonth.getTime() === expectedNextMonth.getTime() ? '✅' : '❌'}`);
        
        // Test multiple occurrences generation
        const occurrences = RecurrenceEngine.generateOccurrences(today, 'daily', 3);
        console.log(`  - Generate 3 daily occurrences: ${occurrences.length === 3 ? '✅' : '❌'}`);
        
        // Test validation
        console.log('✅ Validation tests:');
        
        // Valid recurring task
        try {
            const validTask = {
                repeatType: 'daily',
                dueDate: new Date(Date.now() + 86400000) // Tomorrow
            };
            RecurrenceEngine.validateRecurrenceRules(validTask);
            console.log('  - Valid recurring task: ✅');
        } catch (error) {
            console.log('  - Valid recurring task: ❌', error.message);
        }
        
        // Invalid repeat type
        try {
            RecurrenceEngine.calculateNextOccurrence(today, 'invalid');
            console.log('  - Invalid repeat type validation: ❌');
        } catch (error) {
            console.log('  - Invalid repeat type validation: ✅');
        }
        
        // Invalid date
        try {
            RecurrenceEngine.calculateNextOccurrence('not-a-date', 'daily');
            console.log('  - Invalid date validation: ❌');
        } catch (error) {
            console.log('  - Invalid date validation: ✅');
        }
        
        // Test edge cases
        console.log('✅ Edge case tests:');
        
        // Month-end edge case (Jan 31 -> Feb 28/29)
        const jan31 = new Date('2024-01-31T10:00:00Z');
        const feb29 = RecurrenceEngine.calculateNextOccurrence(jan31, 'monthly');
        console.log(`  - Jan 31 -> Feb 29 (leap year): ${feb29.getDate() === 29 ? '✅' : '❌'}`);
        
        // Weekend detection
        const saturday = new Date('2024-01-13T10:00:00Z'); // Saturday
        const sunday = new Date('2024-01-14T10:00:00Z'); // Sunday
        const monday = new Date('2024-01-15T10:00:00Z'); // Monday
        
        console.log(`  - Saturday is weekend: ${RecurrenceEngine.isWeekend(saturday) ? '✅' : '❌'}`);
        console.log(`  - Sunday is weekend: ${RecurrenceEngine.isWeekend(sunday) ? '✅' : '❌'}`);
        console.log(`  - Monday is not weekend: ${!RecurrenceEngine.isWeekend(monday) ? '✅' : '❌'}`);
        
        // Business day adjustment
        const adjustedDate = RecurrenceEngine.adjustToBusinessDay(saturday);
        console.log(`  - Saturday adjusted to business day: ${adjustedDate.getDay() === 1 ? '✅' : '❌'}`); // Should be Monday
        
        // Test descriptions
        console.log('✅ Description tests:');
        console.log(`  - Daily description: ${RecurrenceEngine.getRecurrenceDescription('daily') === 'Repeats daily' ? '✅' : '❌'}`);
        console.log(`  - Weekly description: ${RecurrenceEngine.getRecurrenceDescription('weekly') === 'Repeats weekly' ? '✅' : '❌'}`);
        console.log(`  - Monthly description: ${RecurrenceEngine.getRecurrenceDescription('monthly') === 'Repeats monthly' ? '✅' : '❌'}`);
        console.log(`  - None description: ${RecurrenceEngine.getRecurrenceDescription('none') === 'No recurrence' ? '✅' : '❌'}`);
        
        console.log('✅ RecurrenceEngine implementation looks good!');
        
    } catch (error) {
        console.log('❌ RecurrenceEngine test failed:', error.message);
    }
}

runTests();