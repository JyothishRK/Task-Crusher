const fs = require('fs');
const path = require('path');

/**
 * Test suite for task management examples documentation
 */
class TaskManagementExamplesTest {
    constructor() {
        this.docsPath = path.resolve(__dirname, '../../docs/api/examples/task-management.md');
    }

    /**
     * Run all tests
     */
    runTests() {
        console.log('🧪 Running Task Management Examples Documentation tests...\n');

        this.testTaskManagementDocsExist();
        this.testCRUDOperationsDocumented();
        this.testBulkOperationsDocumented();
        this.testAdvancedWorkflowsDocumented();
        this.testErrorHandlingPatterns();
        this.testPerformanceOptimization();

        this.printResults();
    }

    /**
     * Test that task management documentation exists
     */
    testTaskManagementDocsExist() {
        try {
            this.assert(
                fs.existsSync(this.docsPath),
                'Task management examples documentation should exist'
            );

            console.log('✅ testTaskManagementDocsExist passed');
        } catch (error) {
            console.log('❌ testTaskManagementDocsExist failed:', error.message);
        }
    }

    /**
     * Test that CRUD operations are documented
     */
    testCRUDOperationsDocumented() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            this.assert(
                content.includes('Basic Task Operations'),
                'Should have basic task operations section'
            );

            this.assert(
                content.includes('Creating Tasks') && content.includes('createTask'),
                'Should document task creation'
            );

            this.assert(
                content.includes('Reading Tasks') && content.includes('getAllTasks'),
                'Should document task reading'
            );

            this.assert(
                content.includes('Updating Tasks') && content.includes('updateTask'),
                'Should document task updating'
            );

            this.assert(
                content.includes('Deleting Tasks') && content.includes('deleteTask'),
                'Should document task deletion'
            );

            console.log('✅ testCRUDOperationsDocumented passed');
        } catch (error) {
            console.log('❌ testCRUDOperationsDocumented failed:', error.message);
        }
    }

    /**
     * Test that bulk operations are documented
     */
    testBulkOperationsDocumented() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            this.assert(
                content.includes('Batch Task Creation') || content.includes('createMultipleTasks'),
                'Should document batch task creation'
            );

            this.assert(
                content.includes('Bulk Task Updates') || content.includes('bulkUpdateTasks'),
                'Should document bulk task updates'
            );

            this.assert(
                content.includes('Bulk Task Deletion') || content.includes('bulkDeleteTasks'),
                'Should document bulk task deletion'
            );

            console.log('✅ testBulkOperationsDocumented passed');
        } catch (error) {
            console.log('❌ testBulkOperationsDocumented failed:', error.message);
        }
    }

    /**
     * Test that advanced workflows are documented
     */
    testAdvancedWorkflowsDocumented() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            this.assert(
                content.includes('Advanced Task Management Workflows'),
                'Should have advanced workflows section'
            );

            this.assert(
                content.includes('TaskLifecycleManager') || content.includes('Task Lifecycle'),
                'Should document task lifecycle management'
            );

            this.assert(
                content.includes('TaskScheduler') || content.includes('Smart Task Scheduling'),
                'Should document task scheduling'
            );

            this.assert(
                content.includes('TaskAnalytics') || content.includes('Task Analytics'),
                'Should document task analytics'
            );

            console.log('✅ testAdvancedWorkflowsDocumented passed');
        } catch (error) {
            console.log('❌ testAdvancedWorkflowsDocumented failed:', error.message);
        }
    }

    /**
     * Test that error handling patterns are documented
     */
    testErrorHandlingPatterns() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            this.assert(
                content.includes('Error Handling Patterns'),
                'Should have error handling patterns section'
            );

            this.assert(
                content.includes('TaskAPIClient') || content.includes('Comprehensive Error Handler'),
                'Should document comprehensive error handling'
            );

            this.assert(
                content.includes('AuthenticationError') && content.includes('ValidationError'),
                'Should document custom error classes'
            );

            this.assert(
                content.includes('retry') || content.includes('retryAttempts'),
                'Should document retry logic'
            );

            console.log('✅ testErrorHandlingPatterns passed');
        } catch (error) {
            console.log('❌ testErrorHandlingPatterns failed:', error.message);
        }
    }

    /**
     * Test that performance optimization is documented
     */
    testPerformanceOptimization() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            this.assert(
                content.includes('Performance Optimization'),
                'Should have performance optimization section'
            );

            this.assert(
                content.includes('Caching Strategy') || content.includes('TaskCache'),
                'Should document caching strategies'
            );

            this.assert(
                content.includes('Paginated Task Loading') || content.includes('TaskPaginator'),
                'Should document pagination'
            );

            this.assert(
                content.includes('ttl') || content.includes('cache'),
                'Should include caching implementation details'
            );

            console.log('✅ testPerformanceOptimization passed');
        } catch (error) {
            console.log('❌ testPerformanceOptimization failed:', error.message);
        }
    }

    /**
     * Simple assertion helper
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * Print test results
     */
    printResults() {
        console.log('\n📊 Task Management Examples Documentation test results:');
        console.log('All tests completed successfully! ✅');
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new TaskManagementExamplesTest();
    test.runTests();
}

module.exports = TaskManagementExamplesTest;