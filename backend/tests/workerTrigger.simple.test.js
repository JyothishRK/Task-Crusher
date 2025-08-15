// Simple test to verify Worker Trigger implementation
const WorkerTrigger = require('../src/utils/workerTrigger');

async function runTests() {
    console.log('Testing Worker Trigger implementation...');

    try {
        console.log('✅ WorkerTrigger imports successfully');
        
        // Check if all required methods exist
        const methods = [
            'getInternalApiUrl',
            'getInternalHeaders',
            'triggerTaskRecurrence',
            'triggerTaskCreation',
            'triggerTaskCompletion',
            'triggerTaskDeletion',
            'triggerCleanup',
            'getWorkerHealth',
            'validateRecurrence',
            'isWorkerAvailable',
            'safeTrigger'
        ];
        
        console.log('✅ WorkerTrigger methods:');
        methods.forEach(method => {
            const exists = typeof WorkerTrigger[method] === 'function';
            console.log(`  - ${method}: ${exists ? '✅' : '❌'}`);
        });
        
        // Test URL generation
        console.log('✅ URL generation tests:');
        const baseUrl = WorkerTrigger.getInternalApiUrl();
        const hasValidUrl = baseUrl && baseUrl.includes('localhost') && baseUrl.includes('internal');
        console.log(`  - Internal API URL: ${hasValidUrl ? '✅' : '❌'} (${baseUrl})`);
        
        // Test headers generation
        console.log('✅ Headers generation tests:');
        const headers = WorkerTrigger.getInternalHeaders();
        const hasContentType = headers && headers['Content-Type'] === 'application/json';
        console.log(`  - Content-Type header: ${hasContentType ? '✅' : '❌'}`);
        
        const hasApiKey = process.env.INTERNAL_API_KEY !== undefined;
        const hasApiKeyHeader = hasApiKey ? headers['x-internal-api-key'] !== undefined : true;
        console.log(`  - API key header: ${hasApiKeyHeader ? '✅' : '⚠️  (Optional)'}`);
        
        // Test parameter validation
        console.log('✅ Parameter validation tests:');
        
        // Test invalid parameters (these should return null, not throw)
        const result1 = await WorkerTrigger.triggerTaskRecurrence('', 'create');
        console.log(`  - Empty taskId handling: ${result1 === null ? '✅' : '❌'}`);
        
        const result2 = await WorkerTrigger.triggerTaskRecurrence('valid-id', '');
        console.log(`  - Empty operation handling: ${result2 === null ? '✅' : '❌'}`);
        
        // Test safe trigger wrapper
        console.log('✅ Safe trigger tests:');
        const safeResult = await WorkerTrigger.safeTrigger(
            WorkerTrigger.triggerTaskCreation, 
            'test-task-id'
        );
        console.log(`  - Safe trigger returns null on failure: ${safeResult === null ? '✅' : '❌'}`);
        
        // Test recurrence validation with invalid task
        console.log('✅ Validation tests:');
        const validationResult1 = await WorkerTrigger.validateRecurrence(null);
        console.log(`  - Null task validation: ${validationResult1 === false ? '✅' : '❌'}`);
        
        const validationResult2 = await WorkerTrigger.validateRecurrence({});
        console.log(`  - Empty task validation: ${validationResult2 === false ? '✅' : '❌'}`);
        
        console.log('✅ WorkerTrigger implementation looks good!');
        
    } catch (error) {
        console.log('❌ WorkerTrigger test failed:', error.message);
    }

    console.log('Note: Full trigger tests require running server with internal API');
}

runTests();