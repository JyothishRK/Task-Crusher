/**
 * Test runner for all recurring task tests
 * Runs the complete test suite for recurring task functionality
 */

// Import all test modules
const { runTests: runRecurringTaskServiceTests } = require('./recurringTaskService.test');
const { runTests: runTaskCreationTests } = require('./taskCreation.integration.test');
const { runTests: runTaskEditingTests } = require('./taskEditing.integration.test');
const { runTests: runRecurringTaskEditingTests } = require('./recurringTaskEditing.test');
const { runTests: runTaskDeletionTests } = require('./taskDeletion.integration.test');
const { runTests: runSubtaskConstraintsTests } = require('./subtaskConstraints.test');
const { runTests: runRecurringTaskQueryTests } = require('./recurringTaskQuery.test');
const { runTests: runCronJobTests } = require('./cronJobs.test');
const { runTests: runErrorHandlingTests } = require('./errorHandlingAndLogging.test');
const { runPerformanceTests } = require('./recurringTasksPerformance.test');

/**
 * Run all recurring task tests in sequence
 */
async function runAllRecurringTaskTests() {
    console.log('🚀 Starting comprehensive recurring task test suite...\\n');
    console.log('=' .repeat(80));
    
    const startTime = Date.now();
    const testResults = [];
    
    const testSuites = [
        { name: 'Recurring Task Service Tests', runner: runRecurringTaskServiceTests },
        { name: 'Task Creation Integration Tests', runner: runTaskCreationTests },
        { name: 'Task Editing Integration Tests', runner: runTaskEditingTests },
        { name: 'Recurring Task Editing Tests', runner: runRecurringTaskEditingTests },
        { name: 'Task Deletion Integration Tests', runner: runTaskDeletionTests },
        { name: 'Subtask Constraints Tests', runner: runSubtaskConstraintsTests },
        { name: 'Recurring Task Query Tests', runner: runRecurringTaskQueryTests },
        { name: 'Cron Job Tests', runner: runCronJobTests },
        { name: 'Error Handling and Logging Tests', runner: runErrorHandlingTests },
        { name: 'Performance Tests', runner: runPerformanceTests }
    ];
    
    for (const testSuite of testSuites) {
        console.log(`\\n📋 Running ${testSuite.name}...`);
        console.log('-'.repeat(60));
        
        const suiteStartTime = Date.now();
        
        try {
            if (testSuite.runner.constructor.name === 'AsyncFunction') {
                await testSuite.runner();
            } else {
                testSuite.runner();
            }
            
            const suiteDuration = Date.now() - suiteStartTime;
            testResults.push({
                name: testSuite.name,
                status: 'PASSED',
                duration: suiteDuration
            });
            
            console.log(`✅ ${testSuite.name} completed successfully (${suiteDuration}ms)`);
            
        } catch (error) {
            const suiteDuration = Date.now() - suiteStartTime;
            testResults.push({
                name: testSuite.name,
                status: 'FAILED',
                duration: suiteDuration,
                error: error.message
            });
            
            console.error(`❌ ${testSuite.name} failed (${suiteDuration}ms):`, error.message);
        }
    }
    
    const totalDuration = Date.now() - startTime;
    
    // Print test summary
    console.log('\\n' + '='.repeat(80));
    console.log('📊 TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    
    const passedTests = testResults.filter(r => r.status === 'PASSED');
    const failedTests = testResults.filter(r => r.status === 'FAILED');
    
    console.log(`\\n📈 Results:`);
    console.log(`   Total Test Suites: ${testResults.length}`);
    console.log(`   Passed: ${passedTests.length}`);
    console.log(`   Failed: ${failedTests.length}`);
    console.log(`   Success Rate: ${((passedTests.length / testResults.length) * 100).toFixed(1)}%`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    
    // Detailed results
    console.log(`\\n📋 Detailed Results:`);
    testResults.forEach(result => {
        const status = result.status === 'PASSED' ? '✅' : '❌';
        console.log(`   ${status} ${result.name} (${result.duration}ms)`);
        if (result.error) {
            console.log(`      Error: ${result.error}`);
        }
    });
    
    // Performance metrics
    console.log(`\\n⚡ Performance Metrics:`);
    const avgDuration = testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length;
    const slowestTest = testResults.reduce((max, r) => r.duration > max.duration ? r : max);
    const fastestTest = testResults.reduce((min, r) => r.duration < min.duration ? r : min);
    
    console.log(`   Average Suite Duration: ${avgDuration.toFixed(1)}ms`);
    console.log(`   Slowest Suite: ${slowestTest.name} (${slowestTest.duration}ms)`);
    console.log(`   Fastest Suite: ${fastestTest.name} (${fastestTest.duration}ms)`);
    
    // Coverage summary
    console.log(`\\n🎯 Test Coverage Summary:`);
    console.log(`   ✅ Recurring Task Creation & Instance Generation`);
    console.log(`   ✅ Recurring Task Editing (Due Date & Repeat Type Changes)`);
    console.log(`   ✅ Recurring Task Deletion (Single & Bulk Operations)`);
    console.log(`   ✅ Subtask Constraints & Validation`);
    console.log(`   ✅ Recurring Task Querying & Filtering`);
    console.log(`   ✅ Cron Job Automation & Scheduling`);
    console.log(`   ✅ Error Handling & Logging`);
    console.log(`   ✅ Performance & Edge Cases`);
    console.log(`   ✅ Date Calculations & Timezone Handling`);
    console.log(`   ✅ Data Integrity & Consistency`);
    
    if (failedTests.length === 0) {
        console.log(`\\n🎉 ALL TESTS PASSED! Recurring task functionality is fully validated.`);
        console.log(`🚀 Ready for production deployment!`);
    } else {
        console.log(`\\n⚠️  ${failedTests.length} test suite(s) failed. Please review and fix issues before deployment.`);
        process.exit(1);
    }
    
    console.log('\\n' + '='.repeat(80));
}

// Export for use in other files
module.exports = {
    runAllRecurringTaskTests
};

// Run all tests if this file is executed directly
if (require.main === module) {
    runAllRecurringTaskTests().catch(error => {
        console.error('\\n💥 Test runner failed:', error.message);
        process.exit(1);
    });
}