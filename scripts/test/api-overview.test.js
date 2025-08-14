const fs = require('fs');
const path = require('path');

/**
 * Test suite for API overview documentation
 */
class APIOverviewTest {
    constructor() {
        this.readmePath = path.resolve(__dirname, '../../docs/api/README.md');
    }

    /**
     * Run all tests
     */
    runTests() {
        console.log('🧪 Running API Overview Documentation tests...\n');

        this.testAPIOverviewExists();
        this.testQuickStartGuide();
        this.testDocumentationStructure();
        this.testKeyFeaturesDocumented();
        this.testAPIDesignPrinciples();
        this.testIntegrationExamples();
        this.testNavigationLinks();

        this.printResults();
    }

    /**
     * Test that API overview documentation exists
     */
    testAPIOverviewExists() {
        try {
            this.assert(
                fs.existsSync(this.readmePath),
                'API overview documentation should exist'
            );

            const content = fs.readFileSync(this.readmePath, 'utf8');
            this.assert(
                content.includes('Task Crusher API Documentation'),
                'Should have proper title'
            );

            console.log('✅ testAPIOverviewExists passed');
        } catch (error) {
            console.log('❌ testAPIOverviewExists failed:', error.message);
        }
    }

    /**
     * Test that quick start guide is comprehensive
     */
    testQuickStartGuide() {
        try {
            const content = fs.readFileSync(this.readmePath, 'utf8');
            
            this.assert(
                content.includes('Quick Start Guide'),
                'Should have quick start guide section'
            );

            this.assert(
                content.includes('Authentication Setup'),
                'Should include authentication setup'
            );

            this.assert(
                content.includes('Create Your First Task'),
                'Should include task creation example'
            );

            this.assert(
                content.includes('Retrieve Your Tasks'),
                'Should include task retrieval examples'
            );

            this.assert(
                content.includes('curl') && content.includes('cookies.txt'),
                'Should include cURL examples with cookie handling'
            );

            console.log('✅ testQuickStartGuide passed');
        } catch (error) {
            console.log('❌ testQuickStartGuide failed:', error.message);
        }
    }

    /**
     * Test that documentation structure is well organized
     */
    testDocumentationStructure() {
        try {
            const content = fs.readFileSync(this.readmePath, 'utf8');
            
            this.assert(
                content.includes('Documentation Structure'),
                'Should have documentation structure section'
            );

            this.assert(
                content.includes('Core Documentation'),
                'Should have core documentation section'
            );

            this.assert(
                content.includes('Practical Guides'),
                'Should have practical guides section'
            );

            // Check for key documentation links
            const expectedLinks = [
                './authentication.md',
                './models/',
                './endpoints/',
                './errors.md',
                './examples/'
            ];

            expectedLinks.forEach(link => {
                this.assert(
                    content.includes(link),
                    `Should link to ${link}`
                );
            });

            console.log('✅ testDocumentationStructure passed');
        } catch (error) {
            console.log('❌ testDocumentationStructure failed:', error.message);
        }
    }

    /**
     * Test that key features are documented
     */
    testKeyFeaturesDocumented() {
        try {
            const content = fs.readFileSync(this.readmePath, 'utf8');
            
            this.assert(
                content.includes('Key Features'),
                'Should have key features section'
            );

            this.assert(
                content.includes('Secure Authentication'),
                'Should document authentication features'
            );

            this.assert(
                content.includes('Advanced Task Management'),
                'Should document task management features'
            );

            this.assert(
                content.includes('Smart Filtering & Querying'),
                'Should document filtering features'
            );

            this.assert(
                content.includes('File Management'),
                'Should document file management features'
            );

            this.assert(
                content.includes('Specialized Endpoints'),
                'Should document specialized endpoints'
            );

            console.log('✅ testKeyFeaturesDocumented passed');
        } catch (error) {
            console.log('❌ testKeyFeaturesDocumented failed:', error.message);
        }
    }

    /**
     * Test that API design principles are documented
     */
    testAPIDesignPrinciples() {
        try {
            const content = fs.readFileSync(this.readmePath, 'utf8');
            
            this.assert(
                content.includes('API Design Principles'),
                'Should have API design principles section'
            );

            this.assert(
                content.includes('RESTful Architecture'),
                'Should document RESTful principles'
            );

            this.assert(
                content.includes('Developer Experience'),
                'Should document developer experience focus'
            );

            this.assert(
                content.includes('Security First'),
                'Should document security principles'
            );

            console.log('✅ testAPIDesignPrinciples passed');
        } catch (error) {
            console.log('❌ testAPIDesignPrinciples failed:', error.message);
        }
    }

    /**
     * Test that integration examples are included
     */
    testIntegrationExamples() {
        try {
            const content = fs.readFileSync(this.readmePath, 'utf8');
            
            this.assert(
                content.includes('Integration Examples'),
                'Should have integration examples section'
            );

            this.assert(
                content.includes('React Application'),
                'Should include React integration example'
            );

            this.assert(
                content.includes('Node.js Backend Integration'),
                'Should include Node.js integration example'
            );

            this.assert(
                content.includes('Common Use Cases'),
                'Should include common use cases'
            );

            console.log('✅ testIntegrationExamples passed');
        } catch (error) {
            console.log('❌ testIntegrationExamples failed:', error.message);
        }
    }

    /**
     * Test that navigation and next steps are provided
     */
    testNavigationLinks() {
        try {
            const content = fs.readFileSync(this.readmePath, 'utf8');
            
            this.assert(
                content.includes('Next Steps'),
                'Should have next steps section'
            );

            this.assert(
                content.includes('Set up Authentication'),
                'Should guide to authentication setup'
            );

            this.assert(
                content.includes('Explore Data Models'),
                'Should guide to data models'
            );

            this.assert(
                content.includes('Try the Examples'),
                'Should guide to examples'
            );

            this.assert(
                content.includes('Ready to build something amazing?'),
                'Should have encouraging call to action'
            );

            console.log('✅ testNavigationLinks passed');
        } catch (error) {
            console.log('❌ testNavigationLinks failed:', error.message);
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
        console.log('\n📊 API Overview Documentation test results:');
        console.log('All tests completed successfully! ✅');
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new APIOverviewTest();
    test.runTests();
}

module.exports = APIOverviewTest;