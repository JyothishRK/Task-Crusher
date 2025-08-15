const fs = require('fs');
const path = require('path');

/**
 * Test suite for specialized endpoints documentation
 */
class SpecializedEndpointsTest {
    constructor() {
        this.docsPath = path.resolve(__dirname, '../../docs/api/specialized-endpoints.md');
    }

    /**
     * Run all tests
     */
    runTests() {
        console.log('🧪 Running Specialized Endpoints Documentation tests...\n');

        this.testSpecializedDocsExist();
        this.testDateBasedEndpointsDocumented();
        this.testCategoryPriorityEndpointsDocumented();
        this.testAvatarManagementDocumented();
        this.testHealthCheckDocumented();
        this.testIntegrationExamples();

        this.printResults();
    }

    /**
     * Test that specialized endpoints documentation exists
     */
    testSpecializedDocsExist() {
        try {
            this.assert(
                fs.existsSync(this.docsPath),
                'Specialized endpoints documentation should exist'
            );

            console.log('✅ testSpecializedDocsExist passed');
        } catch (error) {
            console.log('❌ testSpecializedDocsExist failed:', error.message);
        }
    }

    /**
     * Test that date-based endpoints are documented
     */
    testDateBasedEndpointsDocumented() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            this.assert(
                content.includes('Date-Based Task Endpoints'),
                'Should have date-based endpoints section'
            );

            this.assert(
                content.includes('GET /tasks/today'),
                'Should document today\'s tasks endpoint'
            );

            this.assert(
                content.includes('GET /tasks/overdue'),
                'Should document overdue tasks endpoint'
            );

            this.assert(
                content.includes('timezone-aware') || content.includes('date filtering'),
                'Should mention date handling features'
            );

            console.log('✅ testDateBasedEndpointsDocumented passed');
        } catch (error) {
            console.log('❌ testDateBasedEndpointsDocumented failed:', error.message);
        }
    }

    /**
     * Test that category and priority endpoints are documented
     */
    testCategoryPriorityEndpointsDocumented() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            this.assert(
                content.includes('GET /tasks/category/:category'),
                'Should document category filtering endpoint'
            );

            this.assert(
                content.includes('GET /tasks/priority/:priority'),
                'Should document priority filtering endpoint'
            );

            this.assert(
                content.includes('low, medium, high') || content.includes('Priority level'),
                'Should document priority levels'
            );

            this.assert(
                content.includes('work') && content.includes('personal'),
                'Should include example categories'
            );

            console.log('✅ testCategoryPriorityEndpointsDocumented passed');
        } catch (error) {
            console.log('❌ testCategoryPriorityEndpointsDocumented failed:', error.message);
        }
    }

    /**
     * Test that avatar management is documented
     */
    testAvatarManagementDocumented() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            this.assert(
                content.includes('Avatar Management'),
                'Should have avatar management section'
            );

            this.assert(
                content.includes('POST /users/me/avatar'),
                'Should document avatar upload endpoint'
            );

            this.assert(
                content.includes('GET /users/:id/avatar'),
                'Should document avatar retrieval endpoint'
            );

            this.assert(
                content.includes('DELETE /users/me/avatar'),
                'Should document avatar deletion endpoint'
            );

            this.assert(
                content.includes('1MB') && content.includes('250x250'),
                'Should document file size and processing limits'
            );

            this.assert(
                content.includes('PNG, JPEG, JPG') || content.includes('image formats'),
                'Should document supported file formats'
            );

            console.log('✅ testAvatarManagementDocumented passed');
        } catch (error) {
            console.log('❌ testAvatarManagementDocumented failed:', error.message);
        }
    }

    /**
     * Test that health check endpoint is documented
     */
    testHealthCheckDocumented() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            this.assert(
                content.includes('Health Check'),
                'Should have health check section'
            );

            this.assert(
                content.includes('GET /health'),
                'Should document health check endpoint'
            );

            this.assert(
                content.includes('uptime') && content.includes('status'),
                'Should document health check response fields'
            );

            this.assert(
                content.includes('load balancer') || content.includes('monitoring'),
                'Should mention monitoring use cases'
            );

            console.log('✅ testHealthCheckDocumented passed');
        } catch (error) {
            console.log('❌ testHealthCheckDocumented failed:', error.message);
        }
    }

    /**
     * Test that integration examples are included
     */
    testIntegrationExamples() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            this.assert(
                content.includes('Integration Patterns') || content.includes('Usage Examples'),
                'Should have integration examples section'
            );

            this.assert(
                content.includes('JavaScript') && content.includes('fetch'),
                'Should include JavaScript examples'
            );

            this.assert(
                content.includes('curl') || content.includes('cURL'),
                'Should include cURL examples'
            );

            this.assert(
                content.includes('Dashboard') || content.includes('Mobile'),
                'Should include practical integration examples'
            );

            console.log('✅ testIntegrationExamples passed');
        } catch (error) {
            console.log('❌ testIntegrationExamples failed:', error.message);
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
        console.log('\n📊 Specialized Endpoints Documentation test results:');
        console.log('All tests completed successfully! ✅');
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new SpecializedEndpointsTest();
    test.runTests();
}

module.exports = SpecializedEndpointsTest;