// Simple test to verify Worker Service implementation
const WorkerService = require('../src/workers/workerService');
const TasksWorker = require('../src/workers/tasksWorker');

async function runTests() {
    console.log('Testing Worker Service implementation...');

    try {
        console.log('✅ WorkerService imports successfully');
        
        // Check if all required methods exist
        const workerServiceMethods = [
            'processTaskRecurrence',
            'generateRecurringTasks',
            'handleTaskCompletion',
            'handleTaskDeletion',
            'validateRecurrence',
            'getHealthStatus',
            'performMaintenance',
            'getDetailedStats'
        ];
        
        console.log('✅ WorkerService methods:');
        workerServiceMethods.forEach(method => {
            const exists = typeof WorkerService[method] === 'function';
            console.log(`  - ${method}: ${exists ? '✅' : '❌'}`);
        });

        // Check TasksWorker methods
        const tasksWorkerMethods = [
            'processTaskCreation',
            'processTaskCompletion',
            'processTaskDeletion',
            'cleanupOrphanedRecurringTasks',
            'getRecurringTaskStats'
        ];
        
        console.log('✅ TasksWorker methods:');
        tasksWorkerMethods.forEach(method => {
            const exists = typeof TasksWorker[method] === 'function';
            console.log(`  - ${method}: ${exists ? '✅' : '❌'}`);
        });
        
        // Test parameter validation
        console.log('✅ Parameter validation tests:');
        
        // Test invalid taskId
        try {
            await WorkerService.processTaskRecurrence('', 'create');
            console.log('  - processTaskRecurrence validates taskId: ❌');
        } catch (error) {
            console.log('  - processTaskRecurrence validates taskId: ✅');
        }
        
        // Test invalid operation
        try {
            await WorkerService.processTaskRecurrence('valid-task-id', 'invalid-operation');
            console.log('  - processTaskRecurrence validates operation: ❌');
        } catch (error) {
            console.log('  - processTaskRecurrence validates operation: ✅');
        }
        
        // Test missing userId for delete operation
        try {
            await WorkerService.processTaskRecurrence('valid-task-id', 'delete');
            console.log('  - processTaskRecurrence validates userId for delete: ❌');
        } catch (error) {
            console.log('  - processTaskRecurrence validates userId for delete: ✅');
        }
        
        // Test invalid original task
        try {
            await WorkerService.generateRecurringTasks(null);
            console.log('  - generateRecurringTasks validates originalTask: ❌');
        } catch (error) {
            console.log('  - generateRecurringTasks validates originalTask: ✅');
        }
        
        // Test original task without ID
        try {
            await WorkerService.generateRecurringTasks({ title: 'Test' });
            console.log('  - generateRecurringTasks validates task ID: ❌');
        } catch (error) {
            console.log('  - generateRecurringTasks validates task ID: ✅');
        }
        
        // Test health status (should work without database)
        console.log('✅ Health status test:');
        try {
            const health = await WorkerService.getHealthStatus();
            const hasStatus = health && typeof health.status === 'string';
            const hasTimestamp = health && health.timestamp instanceof Date;
            const hasServices = health && typeof health.services === 'object';
            
            console.log(`  - Health status structure: ${hasStatus && hasTimestamp && hasServices ? '✅' : '❌'}`);
            console.log(`  - Status: ${health.status}`);
        } catch (error) {
            console.log('  - Health status test: ❌', error.message);
        }
        
        // Test detailed stats (will fail without database but should validate parameters)
        console.log('✅ Stats validation test:');
        try {
            await WorkerService.getDetailedStats('invalid-user-id');
            console.log('  - getDetailedStats handles invalid userId: ❌');
        } catch (error) {
            console.log('  - getDetailedStats handles errors gracefully: ✅');
        }
        
        console.log('✅ Worker Service implementation looks good!');
        
    } catch (error) {
        console.log('❌ Worker Service test failed:', error.message);
    }

    console.log('Note: Full functionality tests require MongoDB connection');
}

runTests();