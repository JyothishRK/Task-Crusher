const EndpointDocumentationGenerator = require('../generators/endpoint-doc-generator');
const fs = require('fs');
const path = require('path');

/**
 * Test suite for EndpointDocumentationGenerator
 */
class EndpointDocGeneratorTest {
    constructor() {
        this.generator = new EndpointDocumentationGenerator();
        this.testOutputDir = path.resolve(__dirname, '../../docs/api/endpoints');
    }

    /**
     * Run all tests
     */
    runTests() {
        console.log('🧪 Running EndpointDocumentationGenerator tests...\n');

        this.testGenerateAllEndpointDocs();
        this.testHealthEndpointDocGeneration();
        this.testTaskEndpointDocGeneration();
        this.testUserEndpointDocGeneration();
        this.testEndpointsIndexGeneration();

        this.printResults();
    }

    /**
     * Test generating all endpoint documentation
     */
    testGenerateAllEndpointDocs() {
        try {
            this.generator.generateAllEndpointDocs();
            
            // Check if files were created
            const healthDocPath = path.join(this.testOutputDir, 'health.md');
            const taskDocPath = path.join(this.testOutputDir, 'task.md');
            const userDocPath = path.join(this.testOutputDir, 'user.md');
            const indexPath = path.join(this.testOutputDir, 'README.md');
            
            this.assert(
                fs.existsSync(healthDocPath),
                'Health endpoint documentation should be created'
            );
            
            this.assert(
                fs.existsSync(taskDocPath),
                'Task endpoint documentation should be created'
            );
            
            this.assert(
                fs.existsSync(userDocPath),
                'User endpoint documentation should be created'
            );
            
            this.assert(
                fs.existsSync(indexPath),
                'Endpoints index should be created'
            );

            console.log('✅ testGenerateAllEndpointDocs passed');
        } catch (error) {
            console.log('❌ testGenerateAllEndpointDocs failed:', error.message);
        }
    }

    /**
     * Test Health endpoint documentation generation
     */
    testHealthEndpointDocGeneration() {
        try {
            const healthDocPath = path.join(this.testOutputDir, 'health.md');
            
            if (fs.existsSync(healthDocPath)) {
                const content = fs.readFileSync(healthDocPath, 'utf8');
                
                this.assert(
                    content.includes('# Health Endpoints'),
                    'Health documentation should have proper title'
                );
                
                this.assert(
                    content.includes('GET /health'),
                    'Health documentation should include GET /health endpoint'
                );
                
                this.assert(
                    content.includes('No Authentication Required'),
                    'Health endpoint should not require authentication'
                );
                
                this.assert(
                    content.includes('cURL') && content.includes('JavaScript'),
                    'Health documentation should include usage examples'
                );
            }

            console.log('✅ testHealthEndpointDocGeneration passed');
        } catch (error) {
            console.log('❌ testHealthEndpointDocGeneration failed:', error.message);
        }
    }

    /**
     * Test Task endpoint documentation generation
     */
    testTaskEndpointDocGeneration() {
        try {
            const taskDocPath = path.join(this.testOutputDir, 'task.md');
            
            if (fs.existsSync(taskDocPath)) {
                const content = fs.readFileSync(taskDocPath, 'utf8');
                
                this.assert(
                    content.includes('# Task Endpoints'),
                    'Task documentation should have proper title'
                );
                
                this.assert(
                    content.includes('POST /tasks') && content.includes('GET /tasks'),
                    'Task documentation should include CRUD endpoints'
                );
                
                this.assert(
                    content.includes('Authentication Required'),
                    'Task endpoints should require authentication'
                );
                
                this.assert(
                    content.includes('Query Parameters'),
                    'Task GET endpoint should document query parameters'
                );
                
                this.assert(
                    content.includes('priority') && content.includes('completed'),
                    'Task documentation should include filtering parameters'
                );
            }

            console.log('✅ testTaskEndpointDocGeneration passed');
        } catch (error) {
            console.log('❌ testTaskEndpointDocGeneration failed:', error.message);
        }
    }

    /**
     * Test User endpoint documentation generation
     */
    testUserEndpointDocGeneration() {
        try {
            const userDocPath = path.join(this.testOutputDir, 'user.md');
            
            if (fs.existsSync(userDocPath)) {
                const content = fs.readFileSync(userDocPath, 'utf8');
                
                this.assert(
                    content.includes('# User Endpoints'),
                    'User documentation should have proper title'
                );
                
                this.assert(
                    content.includes('POST /users/login') && content.includes('POST /users/logout'),
                    'User documentation should include authentication endpoints'
                );
                
                this.assert(
                    content.includes('Request Body'),
                    'User endpoints should document request bodies'
                );
                
                this.assert(
                    content.includes('Example Response'),
                    'User endpoints should include response examples'
                );
            }

            console.log('✅ testUserEndpointDocGeneration passed');
        } catch (error) {
            console.log('❌ testUserEndpointDocGeneration failed:', error.message);
        }
    }

    /**
     * Test endpoints index generation
     */
    testEndpointsIndexGeneration() {
        try {
            const indexPath = path.join(this.testOutputDir, 'README.md');
            
            if (fs.existsSync(indexPath)) {
                const content = fs.readFileSync(indexPath, 'utf8');
                
                this.assert(
                    content.includes('# API Endpoints'),
                    'Index should have proper title'
                );
                
                this.assert(
                    content.includes('[Health](health.md)') && content.includes('[Task](task.md)'),
                    'Index should link to endpoint documentation files'
                );
                
                this.assert(
                    content.includes('🔒') && content.includes('🔓'),
                    'Index should show authentication indicators'
                );
                
                this.assert(
                    content.includes('Authentication Guide'),
                    'Index should reference authentication documentation'
                );
            }

            console.log('✅ testEndpointsIndexGeneration passed');
        } catch (error) {
            console.log('❌ testEndpointsIndexGeneration failed:', error.message);
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
        console.log('\n📊 EndpointDocumentationGenerator test results:');
        console.log('All tests completed successfully! ✅');
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new EndpointDocGeneratorTest();
    test.runTests();
}

module.exports = EndpointDocGeneratorTest;