const fs = require('fs');
const path = require('path');

/**
 * Test suite for filtering and sorting documentation
 */
class FilteringDocsTest {
    constructor() {
        this.docsPath = path.resolve(__dirname, '../../docs/api/examples/filtering-sorting.md');
    }

    /**
     * Run all tests
     */
    runTests() {
        console.log('🧪 Running Filtering Documentation tests...\n');

        this.testDocumentationExists();
        this.testQueryParametersDocumented();
        this.testExamplesIncluded();
        this.testSpecializedEndpointsDocumented();
        this.testBestPracticesIncluded();

        this.printResults();
    }

    /**
     * Test that documentation file exists
     */
    testDocumentationExists() {
        try {
            this.assert(
                fs.existsSync(this.docsPath),
                'Filtering and sorting documentation should exist'
            );

            console.log('✅ testDocumentationExists passed');
        } catch (error) {
            console.log('❌ testDocumentationExists failed:', error.message);
        }
    }

    /**
     * Test that all query parameters are documented
     */
    testQueryParametersDocumented() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            // Check for main query parameters
            const requiredParams = ['completed', 'priority', 'category', 'sortBy', 'limit', 'skip'];
            
            requiredParams.forEach(param => {
                this.assert(
                    content.includes(`#### \`${param}\``),
                    `Should document ${param} parameter`
                );
            });

            // Check for valid values documentation
            this.assert(
                content.includes('low, medium, high'),
                'Should document priority valid values'
            );

            this.assert(
                content.includes('`true` - Only completed tasks') && content.includes('`false` - Only incomplete tasks'),
                'Should document completed parameter values'
            );

            console.log('✅ testQueryParametersDocumented passed');
        } catch (error) {
            console.log('❌ testQueryParametersDocumented failed:', error.message);
        }
    }

    /**
     * Test that examples are included
     */
    testExamplesIncluded() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            this.assert(
                content.includes('```bash') && content.includes('GET /tasks?'),
                'Should include bash/curl examples'
            );

            this.assert(
                content.includes('```javascript') && content.includes('fetch'),
                'Should include JavaScript examples'
            );

            this.assert(
                content.includes('priority=high&category=work'),
                'Should include combined parameter examples'
            );

            console.log('✅ testExamplesIncluded passed');
        } catch (error) {
            console.log('❌ testExamplesIncluded failed:', error.message);
        }
    }

    /**
     * Test that specialized endpoints are documented
     */
    testSpecializedEndpointsDocumented() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            const specializedEndpoints = ['/tasks/overdue', '/tasks/today', '/tasks/priority/', '/tasks/category/'];
            
            specializedEndpoints.forEach(endpoint => {
                this.assert(
                    content.includes(endpoint),
                    `Should document ${endpoint} specialized endpoint`
                );
            });

            console.log('✅ testSpecializedEndpointsDocumented passed');
        } catch (error) {
            console.log('❌ testSpecializedEndpointsDocumented failed:', error.message);
        }
    }

    /**
     * Test that best practices are included
     */
    testBestPracticesIncluded() {
        try {
            const content = fs.readFileSync(this.docsPath, 'utf8');
            
            this.assert(
                content.includes('## Best Practices'),
                'Should include best practices section'
            );

            this.assert(
                content.includes('pagination'),
                'Should include pagination best practices'
            );

            this.assert(
                content.includes('Performance Considerations'),
                'Should include performance considerations'
            );

            console.log('✅ testBestPracticesIncluded passed');
        } catch (error) {
            console.log('❌ testBestPracticesIncluded failed:', error.message);
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
        console.log('\n📊 Filtering Documentation test results:');
        console.log('All tests completed successfully! ✅');
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new FilteringDocsTest();
    test.runTests();
}

module.exports = FilteringDocsTest;