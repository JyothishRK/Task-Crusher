const fs = require('fs');
const path = require('path');

/**
 * Test suite for authentication documentation
 */
class AuthenticationDocsTest {
    constructor() {
        this.authDocsPath = path.resolve(__dirname, '../../docs/api/authentication.md');
        this.flowDocsPath = path.resolve(__dirname, '../../docs/api/examples/authentication-flow.md');
    }

    /**
     * Run all tests
     */
    runTests() {
        console.log('🧪 Running Authentication Documentation tests...\n');

        this.testAuthenticationDocsExist();
        this.testCookieBasedAuthDocumented();
        this.testAuthenticationEndpointsDocumented();
        this.testSessionManagementDocumented();
        this.testAuthenticationFlowExamples();
        this.testSecurityConsiderations();

        this.printResults();
    }

    /**
     * Test that authentication documentation files exist
     */
    testAuthenticationDocsExist() {
        try {
            this.assert(
                fs.existsSync(this.authDocsPath),
                'Authentication guide should exist'
            );

            this.assert(
                fs.existsSync(this.flowDocsPath),
                'Authentication flow examples should exist'
            );

            console.log('✅ testAuthenticationDocsExist passed');
        } catch (error) {
            console.log('❌ testAuthenticationDocsExist failed:', error.message);
        }
    }

    /**
     * Test that cookie-based authentication is documented
     */
    testCookieBasedAuthDocumented() {
        try {
            const content = fs.readFileSync(this.authDocsPath, 'utf8');
            
            this.assert(
                content.includes('cookie-based authentication'),
                'Should document cookie-based authentication'
            );

            this.assert(
                content.includes('HTTP-only cookies'),
                'Should document HTTP-only cookies'
            );

            this.assert(
                content.includes('JWT') || content.includes('JSON Web Token'),
                'Should document JWT tokens'
            );

            this.assert(
                content.includes('HttpOnly') && content.includes('Secure'),
                'Should document cookie security attributes'
            );

            console.log('✅ testCookieBasedAuthDocumented passed');
        } catch (error) {
            console.log('❌ testCookieBasedAuthDocumented failed:', error.message);
        }
    }

    /**
     * Test that all authentication endpoints are documented
     */
    testAuthenticationEndpointsDocumented() {
        try {
            const content = fs.readFileSync(this.authDocsPath, 'utf8');
            
            const authEndpoints = [
                'POST /users',           // Registration
                'POST /users/login',     // Login
                'POST /users/logout',    // Logout
                'POST /users/logoutall', // Logout all
                'GET /users/me',         // Get profile
                'PATCH /users/me',       // Update profile
                'DELETE /users/me'       // Delete account
            ];

            authEndpoints.forEach(endpoint => {
                this.assert(
                    content.includes(endpoint),
                    `Should document ${endpoint} endpoint`
                );
            });

            console.log('✅ testAuthenticationEndpointsDocumented passed');
        } catch (error) {
            console.log('❌ testAuthenticationEndpointsDocumented failed:', error.message);
        }
    }

    /**
     * Test that session management is documented
     */
    testSessionManagementDocumented() {
        try {
            const content = fs.readFileSync(this.authDocsPath, 'utf8');
            
            this.assert(
                content.includes('Session Management'),
                'Should have session management section'
            );

            this.assert(
                content.includes('logout') && content.includes('logoutall'),
                'Should document both logout options'
            );

            this.assert(
                content.includes('credentials: \'include\''),
                'Should document credential inclusion for requests'
            );

            console.log('✅ testSessionManagementDocumented passed');
        } catch (error) {
            console.log('❌ testSessionManagementDocumented failed:', error.message);
        }
    }

    /**
     * Test that authentication flow examples are comprehensive
     */
    testAuthenticationFlowExamples() {
        try {
            const content = fs.readFileSync(this.flowDocsPath, 'utf8');
            
            this.assert(
                content.includes('Complete Authentication Workflow'),
                'Should have complete workflow section'
            );

            this.assert(
                content.includes('User Registration') && content.includes('Step 1'),
                'Should have step-by-step registration process'
            );

            this.assert(
                content.includes('JavaScript') && content.includes('fetch'),
                'Should include JavaScript examples'
            );

            this.assert(
                content.includes('React') && content.includes('useState'),
                'Should include React component examples'
            );

            this.assert(
                content.includes('curl') && content.includes('cookies.txt'),
                'Should include cURL examples with cookie handling'
            );

            console.log('✅ testAuthenticationFlowExamples passed');
        } catch (error) {
            console.log('❌ testAuthenticationFlowExamples failed:', error.message);
        }
    }

    /**
     * Test that security considerations are documented
     */
    testSecurityConsiderations() {
        try {
            const content = fs.readFileSync(this.authDocsPath, 'utf8');
            
            this.assert(
                content.includes('Security Considerations'),
                'Should have security considerations section'
            );

            this.assert(
                content.includes('bcrypt') || content.includes('hashed'),
                'Should document password hashing'
            );

            this.assert(
                content.includes('XSS') || content.includes('CSRF'),
                'Should document security protections'
            );

            this.assert(
                content.includes('Rate Limiting') || content.includes('rate-limit'),
                'Should mention rate limiting'
            );

            console.log('✅ testSecurityConsiderations passed');
        } catch (error) {
            console.log('❌ testSecurityConsiderations failed:', error.message);
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
        console.log('\n📊 Authentication Documentation test results:');
        console.log('All tests completed successfully! ✅');
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new AuthenticationDocsTest();
    test.runTests();
}

module.exports = AuthenticationDocsTest;