/**
 * Run all numeric ID migration tests
 */

const { execSync } = require('child_process');

const tests = [
    'tests/utils/counterUtils.test.js',
    'tests/integration/indexes-relationships.test.js',
    'tests/integration/subtask-validation.test.js',
    'tests/integration/auth-numeric-id.test.js',
    'tests/integration/complete-system.test.js'
];

console.log('🚀 Running all Numeric ID Migration tests...\n');

let passedTests = 0;
let failedTests = 0;

for (const test of tests) {
    try {
        console.log(`📋 Running ${test}...`);
        execSync(`node ${test}`, { stdio: 'inherit', cwd: __dirname + '/..' });
        console.log(`✅ ${test} PASSED\n`);
        passedTests++;
    } catch (error) {
        console.log(`❌ ${test} FAILED\n`);
        failedTests++;
    }
}

console.log('📊 Test Summary:');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Total: ${passedTests + failedTests}`);

if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Numeric ID migration is complete and working correctly.');
    process.exit(0);
} else {
    console.log('\n💥 Some tests failed. Please check the output above.');
    process.exit(1);
}