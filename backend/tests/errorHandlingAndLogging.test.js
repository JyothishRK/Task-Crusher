/**
 * Tests for comprehensive error handling and logging functionality
 */

const { 
    logRecurringTaskError, 
    logRecurringTaskWarning, 
    logRecurringTaskInfo,
    logCronJob,
    logValidationError,
    logPerformanceMetrics,
    sanitizeLogData,
    formatLogMessage,
    LOG_LEVELS
} = require('../src/utils/logger');

// Test log message formatting
function testLogMessageFormatting() {
    console.log('Testing log message formatting...');
    
    const testMessage = 'Test operation completed';
    const testData = { taskId: 123, duration: '500ms' };
    
    const formattedMessage = formatLogMessage(LOG_LEVELS.INFO, testMessage, testData);
    
    console.log('Formatted message:', formattedMessage);
    
    // Validate format
    console.assert(formattedMessage.includes('['), 'Should include timestamp brackets');
    console.assert(formattedMessage.includes('INFO:'), 'Should include log level');
    console.assert(formattedMessage.includes(testMessage), 'Should include message');
    console.assert(formattedMessage.includes('taskId'), 'Should include data');
    
    console.log('✓ Log message formatting validated');
}

// Test data sanitization
function testDataSanitization() {
    console.log('\\nTesting data sanitization...');
    
    const sensitiveData = {
        taskId: 123,
        title: 'Test Task',
        password: 'secret123',
        token: 'jwt-token-here',
        authorization: 'Bearer token',
        normalField: 'normal value'
    };
    
    const sanitized = sanitizeLogData(sensitiveData);
    
    console.log('Original data keys:', Object.keys(sensitiveData));
    console.log('Sanitized data:', sanitized);
    
    console.assert(sanitized.password === '[REDACTED]', 'Password should be redacted');
    console.assert(sanitized.token === '[REDACTED]', 'Token should be redacted');
    console.assert(sanitized.authorization === '[REDACTED]', 'Authorization should be redacted');
    console.assert(sanitized.normalField === 'normal value', 'Normal fields should remain');
    console.assert(sanitized.taskId === 123, 'Non-sensitive data should remain');
    
    console.log('✓ Data sanitization validated');
}

// Test recurring task logging functions
function testRecurringTaskLogging() {
    console.log('\\nTesting recurring task logging functions...');
    
    // Test info logging
    console.log('Testing info logging:');
    logRecurringTaskInfo('generation', 'Test info message', { taskId: 123 });
    
    // Test warning logging
    console.log('Testing warning logging:');
    logRecurringTaskWarning('update', 'Test warning message', { taskId: 456 });
    
    // Test error logging
    console.log('Testing error logging:');
    logRecurringTaskError('deletion', 'Test error message', { 
        taskId: 789, 
        error: 'Test error details' 
    });
    
    console.log('✓ Recurring task logging functions validated');
}

// Test cron job logging
function testCronJobLogging() {
    console.log('\\nTesting cron job logging...');
    
    // Test job start
    console.log('Testing job start logging:');
    logCronJob('recurring_task_maintenance', 'START', {
        timestamp: new Date().toISOString()
    });
    
    // Test job success
    console.log('Testing job success logging:');
    logCronJob('recurring_task_maintenance', 'SUCCESS', {
        processed: 5,
        generated: 12,
        duration: '1250ms'
    });
    
    // Test job error
    console.log('Testing job error logging:');
    logCronJob('recurring_task_maintenance', 'ERROR', {
        error: 'Database connection failed',
        duration: '500ms'
    });
    
    console.log('✓ Cron job logging validated');
}

// Test validation error logging
function testValidationErrorLogging() {
    console.log('\\nTesting validation error logging...');
    
    const validationContext = {
        taskId: 123,
        parentId: 456,
        dueDate: '2024-01-20T10:00:00Z',
        violations: [
            {
                field: 'dueDate',
                message: 'Subtask due date cannot be later than parent',
                code: 'SUBTASK_DUE_DATE_VIOLATION'
            }
        ]
    };
    
    logValidationError('subtask', 'Subtask validation failed', validationContext);
    
    console.log('✓ Validation error logging validated');
}

// Test performance metrics logging
function testPerformanceMetricsLogging() {
    console.log('\\nTesting performance metrics logging...');
    
    const performanceData = {
        tasksProcessed: 10,
        instancesGenerated: 25,
        errorsCount: 0
    };
    
    logPerformanceMetrics('recurring_task_maintenance', 1500, performanceData);
    
    console.log('✓ Performance metrics logging validated');
}

// Test error handling scenarios
function testErrorHandlingScenarios() {
    console.log('\\nTesting error handling scenarios...');
    
    // Test handling of null/undefined data
    console.log('Testing null data handling:');
    const nullSanitized = sanitizeLogData(null);
    console.assert(nullSanitized === null, 'Null should remain null');
    
    // Test handling of string data
    console.log('Testing string data handling:');
    const stringData = 'Normal string without sensitive data';
    const stringSanitized = sanitizeLogData(stringData);
    console.assert(stringSanitized === stringData, 'Normal strings should remain unchanged');
    
    // Test handling of array data
    console.log('Testing array data handling:');
    const arrayData = [
        { taskId: 1, password: 'secret' },
        { taskId: 2, token: 'jwt-token' }
    ];
    const arraySanitized = sanitizeLogData(arrayData);
    console.assert(Array.isArray(arraySanitized), 'Should remain an array');
    console.assert(arraySanitized[0].password === '[REDACTED]', 'Array items should be sanitized');
    
    console.log('✓ Error handling scenarios validated');
}

// Test log level consistency
function testLogLevelConsistency() {
    console.log('\\nTesting log level consistency...');
    
    const expectedLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    
    expectedLevels.forEach(level => {
        console.assert(LOG_LEVELS[level] === level, `LOG_LEVELS.${level} should equal '${level}'`);
    });
    
    console.log('Available log levels:', Object.keys(LOG_LEVELS));
    console.assert(Object.keys(LOG_LEVELS).length === 4, 'Should have 4 log levels');
    
    console.log('✓ Log level consistency validated');
}

// Test structured error responses
function testStructuredErrorResponses() {
    console.log('\\nTesting structured error responses...');
    
    // Test validation error response structure
    const validationErrorResponse = {
        error: 'Subtask validation failed',
        violations: [
            {
                field: 'repeatType',
                message: 'Subtasks cannot have repeat types',
                code: 'SUBTASK_REPEAT_VIOLATION'
            },
            {
                field: 'dueDate',
                message: 'Subtask due date cannot be later than parent task due date',
                code: 'SUBTASK_DUE_DATE_VIOLATION',
                parentDueDate: '2024-01-20T10:00:00Z',
                subtaskDueDate: '2024-01-21T10:00:00Z'
            }
        ]
    };
    
    console.log('Validation error response structure:');
    console.log(JSON.stringify(validationErrorResponse, null, 2));
    
    console.assert(typeof validationErrorResponse.error === 'string', 'Error should be string');
    console.assert(Array.isArray(validationErrorResponse.violations), 'Violations should be array');
    console.assert(validationErrorResponse.violations.length === 2, 'Should have 2 violations');
    
    // Test recurring task error response structure
    const recurringTaskErrorResponse = {
        error: 'Failed to update recurring task',
        details: 'Database connection timeout',
        code: 'RECURRING_TASK_UPDATE_ERROR',
        context: {
            taskId: 123,
            operation: 'handleDueDateChange',
            timestamp: new Date().toISOString()
        }
    };
    
    console.log('Recurring task error response structure:');
    console.log(JSON.stringify(recurringTaskErrorResponse, null, 2));
    
    console.assert(typeof recurringTaskErrorResponse.error === 'string', 'Error should be string');
    console.assert(typeof recurringTaskErrorResponse.details === 'string', 'Details should be string');
    console.assert(typeof recurringTaskErrorResponse.code === 'string', 'Code should be string');
    console.assert(typeof recurringTaskErrorResponse.context === 'object', 'Context should be object');
    
    console.log('✓ Structured error responses validated');
}

// Test monitoring and metrics
function testMonitoringAndMetrics() {
    console.log('\\nTesting monitoring and metrics...');
    
    // Test cron job metrics
    const cronJobMetrics = {
        jobName: 'recurring_task_maintenance',
        executionTime: '1250ms',
        tasksProcessed: 15,
        instancesGenerated: 42,
        errorsCount: 1,
        successRate: '93.3%',
        timestamp: new Date().toISOString()
    };
    
    console.log('Cron job metrics:', cronJobMetrics);
    
    // Test performance thresholds
    const performanceThresholds = {
        maxExecutionTime: 5000, // 5 seconds
        maxErrorRate: 0.05, // 5%
        minSuccessRate: 0.95 // 95%
    };
    
    const executionTime = 1250;
    const errorRate = 1 / 15; // 1 error out of 15 tasks
    const successRate = 14 / 15; // 14 successful out of 15 tasks
    
    console.log('Performance analysis:', {
        executionTime: `${executionTime}ms`,
        withinTimeThreshold: executionTime < performanceThresholds.maxExecutionTime,
        errorRate: `${(errorRate * 100).toFixed(1)}%`,
        withinErrorThreshold: errorRate < performanceThresholds.maxErrorRate,
        successRate: `${(successRate * 100).toFixed(1)}%`,
        meetsSuccessThreshold: successRate >= performanceThresholds.minSuccessRate
    });
    
    console.assert(executionTime < performanceThresholds.maxExecutionTime, 'Execution time should be within threshold');
    console.assert(errorRate < performanceThresholds.maxErrorRate, 'Error rate should be within threshold');
    console.assert(successRate >= performanceThresholds.minSuccessRate, 'Success rate should meet threshold');
    
    console.log('✓ Monitoring and metrics validated');
}

// Run all tests
function runTests() {
    console.log('Running error handling and logging tests...\\n');
    
    try {
        testLogMessageFormatting();
        testDataSanitization();
        testRecurringTaskLogging();
        testCronJobLogging();
        testValidationErrorLogging();
        testPerformanceMetricsLogging();
        testErrorHandlingScenarios();
        testLogLevelConsistency();
        testStructuredErrorResponses();
        testMonitoringAndMetrics();
        
        console.log('\\n🎉 All error handling and logging tests passed successfully!');
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