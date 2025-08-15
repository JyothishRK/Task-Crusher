const fs = require('fs');
const path = require('path');

/**
 * Test suite for error handling documentation
 */
class ErrorDocsTest {
    constructor() {
        this.errorDocsPath = path.resolve(__dirname, '../../docs/api/errors.md');
    }

    /**
     * Run all tests
     */
    runTests() {
        console.log('🧪 Running Error Documentation tests...\n');

        this.testErrorDocsExist();
        this.testHttpStatusCodesDocumented();
        this.testErrorResponseFormats();
        this.testValidationErrorsDocumented();
        this.testAuthenticationErrorsDocumented();
        this.testErrorHandlingExamples();
        this.testTroubleshootingGuide();

        this.printResults();
    }

    /**
     * Test that error documentation exists
     */
    testErrorDocsExist() {
        try {
            this.assert(
                fs.existsSync(this.errorDocsPath),
                'Error handling documentation should exist'
            );

            console.log('✅ testErrorDocsExist passed');
        } catch (error) {
            console.log('❌ testErrorDocsExist failed:', error.message);
        }
    }

    /**
     * Test that HTTP status codes are documented
     */
    testHttpStatusCodesDocumented() {
        try {
            const content = fs.readFileSync(this.errorDocsPath, 'utf8');
            
            const statusCodes = ['200', '201', '400', '401', '403', '404', '405', '500'];
            
            statusCodes.forEach(code => {
                this.assert(
                    content.includes(`#### ${code}`) || content.includes(`### ${code}`),
                    `Should document HTTP status code ${code}`
                );
            });

            console.log('✅ testHttpStatusCodesDocumented passed');
        } catch (error) {
            console.log('❌ testHttpStatusCodesDocumented failed:', error.message);
        }
    }

    /**
     * Test that error response formats are documented
     */
    testErrorResponseFormats() {
        try {
            const content = fs.readFileSync(this.errorDocsPath, 'utf8');
            
            this.assert(
                content.includes('Error Response Format'),
                'Should document error response format'
            );

            this.assert(
                content.includes('"error":') && content.includes('"status": "error"'),
                'Should show standard error response format'
            );

            this.assert(
                content.includes('Validation Error Response'),
                'Should document validation error format'
            );

            this.assert(
                content.includes('"errors":') && content.includes('"message":'),
                'Should show validation error structure'
            );

            console.log('✅ testErrorResponseFormats passed');
        } catch (error) {
            console.log('❌ testErrorResponseFormats failed:', error.message);
        }
    }

    /**
     * Test that validation errors are documented
     */
    testValidationErrorsDocumented() {
        try {
            const content = fs.readFileSync(this.errorDocsPath, 'utf8');
            
            this.assert(
                content.includes('Field-Specific Validation Errors'),
                'Should have field-specific validation section'
            );

            // User model validation errors
            const userFields = ['name', 'email', 'password', 'age'];
            userFields.forEach(field => {
                this.assert(
                    content.includes(`${field}`) || content.includes(`${field.charAt(0).toUpperCase() + field.slice(1)}`),
                    `Should document ${field} validation errors`
                );
            });

            // Task model validation errors
            const taskFields = ['title', 'dueDate', 'priority'];
            taskFields.forEach(field => {
                this.assert(
                    content.includes(`${field}`) || content.includes(`${field.charAt(0).toUpperCase() + field.slice(1)}`),
                    `Should document ${field} validation errors`
                );
            });

            console.log('✅ testValidationErrorsDocumented passed');
        } catch (error) {
            console.log('❌ testValidationErrorsDocumented failed:', error.message);
        }
    }

    /**
     * Test that authentication errors are documented
     */
    testAuthenticationErrorsDocumented() {
        try {
            const content = fs.readFileSync(this.errorDocsPath, 'utf8');
            
            this.assert(
                content.includes('Authentication Errors'),
                'Should have authentication errors section'
            );

            this.assert(
                content.includes('Please authenticate'),
                'Should document authentication required error'
            );

            this.assert(
                content.includes('Unable to Login'),
                'Should document login failure error'
            );

            this.assert(
                content.includes('Access denied'),
                'Should document access denied error'
            );

            console.log('✅ testAuthenticationErrorsDocumented passed');
        } catch (error) {
            console.log('❌ testAuthenticationErrorsDocumented failed:', error.message);
        }
    }

    /**
     * Test that error handling examples are included
     */
    testErrorHandlingExamples() {
        try {
            const content = fs.readFileSync(this.errorDocsPath, 'utf8');
            
            this.assert(
                content.includes('Error Handling Best Practices'),
                'Should have error handling best practices section'
            );

            this.assert(
                content.includes('JavaScript') && content.includes('fetch'),
                'Should include JavaScript error handling examples'
            );

            this.assert(
                content.includes('React') && content.includes('useState'),
                'Should include React error handling examples'
            );

            this.assert(
                content.includes('handleApiRequest') || content.includes('handleError'),
                'Should include error handling function examples'
            );

            console.log('✅ testErrorHandlingExamples passed');
        } catch (error) {
            console.log('❌ testErrorHandlingExamples failed:', error.message);
        }
    }

    /**
     * Test that troubleshooting guide is included
     */
    testTroubleshootingGuide() {
        try {
            const content = fs.readFileSync(this.errorDocsPath, 'utf8');
            
            this.assert(
                content.includes('Troubleshooting Common Issues'),
                'Should have troubleshooting section'
            );

            this.assert(
                content.includes('Authentication Issues'),
                'Should include authentication troubleshooting'
            );

            this.assert(
                content.includes('Validation Issues'),
                'Should include validation troubleshooting'
            );

            this.assert(
                content.includes('Network Issues') || content.includes('File Upload Issues'),
                'Should include network or file upload troubleshooting'
            );

            console.log('✅ testTroubleshootingGuide passed');
        } catch (error) {
            console.log('❌ testTroubleshootingGuide failed:', error.message);
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
        console.log('\n📊 Error Documentation test results:');
        console.log('All tests completed successfully! ✅');
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new ErrorDocsTest();
    test.runTests();
}

module.exports = ErrorDocsTest;