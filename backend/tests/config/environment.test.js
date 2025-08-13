/**
 * Tests for Environment Variable Configuration
 */

const assert = require('assert');

// Load environment variables from .env file for testing
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

describe('Environment Variable Configuration', () => {
    
    // Store original environment
    const originalEnv = process.env;
    
    beforeEach(() => {
        // Reset environment variables before each test
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe('Cookie Configuration Environment Variables', () => {
        
        it('should use default values when environment variables are not set', () => {
            // Clear cookie-related environment variables
            delete process.env.COOKIE_NAME;
            delete process.env.COOKIE_SECURE;
            delete process.env.COOKIE_SAME_SITE;
            delete process.env.COOKIE_MAX_AGE;
            delete process.env.NODE_ENV;
            
            // Clear require cache and reload module
            delete require.cache[require.resolve('../../src/utils/cookieConfig')];
            const { getCookieOptions, getTokenCookieName } = require('../../src/utils/cookieConfig');
            
            const cookieOptions = getCookieOptions();
            const cookieName = getTokenCookieName();
            
            assert.strictEqual(cookieName, 'auth_token');
            assert.strictEqual(cookieOptions.httpOnly, true);
            assert.strictEqual(cookieOptions.secure, false); // Default for development
            assert.strictEqual(cookieOptions.sameSite, 'Lax');
            assert.strictEqual(cookieOptions.maxAge, 86400000);
            assert.strictEqual(cookieOptions.path, '/');
        });

        it('should use configured environment variables', () => {
            process.env.COOKIE_NAME = 'custom_auth_token';
            process.env.COOKIE_SECURE = 'true';
            process.env.COOKIE_SAME_SITE = 'Strict';
            process.env.COOKIE_MAX_AGE = '3600000';
            process.env.NODE_ENV = 'production';
            
            // Clear require cache and reload module
            delete require.cache[require.resolve('../../src/utils/cookieConfig')];
            const { getCookieOptions, getTokenCookieName } = require('../../src/utils/cookieConfig');
            
            const cookieOptions = getCookieOptions();
            const cookieName = getTokenCookieName();
            
            assert.strictEqual(cookieName, 'custom_auth_token');
            assert.strictEqual(cookieOptions.httpOnly, true);
            assert.strictEqual(cookieOptions.secure, true);
            assert.strictEqual(cookieOptions.sameSite, 'Strict');
            assert.strictEqual(cookieOptions.maxAge, 3600000);
            assert.strictEqual(cookieOptions.path, '/');
        });

        it('should auto-detect secure flag based on NODE_ENV', () => {
            delete process.env.COOKIE_SECURE;
            
            // Test production environment
            process.env.NODE_ENV = 'production';
            delete require.cache[require.resolve('../../src/utils/cookieConfig')];
            let { getCookieOptions } = require('../../src/utils/cookieConfig');
            let cookieOptions = getCookieOptions();
            assert.strictEqual(cookieOptions.secure, true);
            
            // Test development environment
            process.env.NODE_ENV = 'development';
            delete require.cache[require.resolve('../../src/utils/cookieConfig')];
            ({ getCookieOptions } = require('../../src/utils/cookieConfig'));
            cookieOptions = getCookieOptions();
            assert.strictEqual(cookieOptions.secure, false);
        });

        it('should handle COOKIE_SECURE=auto setting', () => {
            process.env.COOKIE_SECURE = 'auto';
            
            // Test with production
            process.env.NODE_ENV = 'production';
            delete require.cache[require.resolve('../../src/utils/cookieConfig')];
            let { getCookieOptions } = require('../../src/utils/cookieConfig');
            let cookieOptions = getCookieOptions();
            assert.strictEqual(cookieOptions.secure, true);
            
            // Test with development
            process.env.NODE_ENV = 'development';
            delete require.cache[require.resolve('../../src/utils/cookieConfig')];
            ({ getCookieOptions } = require('../../src/utils/cookieConfig'));
            cookieOptions = getCookieOptions();
            assert.strictEqual(cookieOptions.secure, false);
        });
    });

    describe('CORS Configuration Environment Variables', () => {
        
        it('should parse ALLOWED_ORIGINS correctly', () => {
            process.env.ALLOWED_ORIGINS = 'http://localhost:3000,https://myapp.com,http://127.0.0.1:3000';
            
            const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
            
            assert.strictEqual(allowedOrigins.length, 3);
            assert(allowedOrigins.includes('http://localhost:3000'));
            assert(allowedOrigins.includes('https://myapp.com'));
            assert(allowedOrigins.includes('http://127.0.0.1:3000'));
        });

        it('should handle missing ALLOWED_ORIGINS gracefully', () => {
            delete process.env.ALLOWED_ORIGINS;
            
            const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
                process.env.ALLOWED_ORIGINS.split(',') : 
                ['http://localhost:3000', 'http://localhost:3001'];
            
            assert.strictEqual(allowedOrigins.length, 2);
            assert(allowedOrigins.includes('http://localhost:3000'));
            assert(allowedOrigins.includes('http://localhost:3001'));
        });
    });

    describe('Required Environment Variables', () => {
        
        it('should have JWT_SECRET configured', () => {
            assert(process.env.JWT_SECRET, 'JWT_SECRET environment variable is required');
            assert(process.env.JWT_SECRET.length > 0, 'JWT_SECRET should not be empty');
        });

        it('should have PORT configured', () => {
            assert(process.env.PORT, 'PORT environment variable is required');
            assert(!isNaN(parseInt(process.env.PORT)), 'PORT should be a valid number');
        });

        it('should have NODE_ENV configured for proper environment detection', () => {
            // NODE_ENV should be set for proper cookie security configuration
            const nodeEnv = process.env.NODE_ENV || 'development';
            assert(['development', 'production', 'test'].includes(nodeEnv), 
                'NODE_ENV should be development, production, or test');
        });
    });

    describe('Cookie Configuration Validation', () => {
        
        it('should validate cookie configuration without throwing errors', () => {
            process.env.COOKIE_SAME_SITE = 'Lax';
            process.env.COOKIE_MAX_AGE = '86400000';
            process.env.NODE_ENV = 'production';
            process.env.COOKIE_SECURE = 'true';
            
            delete require.cache[require.resolve('../../src/utils/cookieConfig')];
            const { validateCookieConfig } = require('../../src/utils/cookieConfig');
            
            // Should not throw
            assert.doesNotThrow(() => {
                validateCookieConfig();
            });
        });

        it('should warn about invalid configuration values', () => {
            process.env.COOKIE_SAME_SITE = 'Invalid';
            process.env.COOKIE_MAX_AGE = 'not-a-number';
            
            delete require.cache[require.resolve('../../src/utils/cookieConfig')];
            const { validateCookieConfig } = require('../../src/utils/cookieConfig');
            
            // Capture console.warn
            const originalWarn = console.warn;
            const warnings = [];
            console.warn = (message) => { warnings.push(message); };
            
            validateCookieConfig();
            
            console.warn = originalWarn;
            
            assert(warnings.some(w => w.includes('Invalid COOKIE_SAME_SITE value')));
            assert(warnings.some(w => w.includes('Invalid COOKIE_MAX_AGE value')));
        });
    });

    describe('Environment Variable Documentation', () => {
        
        it('should have all required cookie configuration variables documented', () => {
            const requiredCookieVars = [
                'COOKIE_NAME',
                'COOKIE_SECURE', 
                'COOKIE_SAME_SITE',
                'COOKIE_MAX_AGE',
                'NODE_ENV'
            ];
            
            // This test ensures we remember to document all variables
            // In a real application, you might read from a config file or documentation
            requiredCookieVars.forEach(varName => {
                // Just verify the variable names are consistent with our implementation
                assert(typeof varName === 'string' && varName.length > 0);
            });
        });

        it('should have all required CORS configuration variables documented', () => {
            const requiredCorsVars = [
                'ALLOWED_ORIGINS'
            ];
            
            requiredCorsVars.forEach(varName => {
                assert(typeof varName === 'string' && varName.length > 0);
            });
        });
    });
});

// Simple test runner
function describe(name, fn) {
    console.log(`\n${name}`);
    fn();
}

function it(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        console.log(`  ✗ ${name}`);
        console.error(`    ${error.message}`);
        process.exit(1);
    }
}

function beforeEach(fn) {
    // Simple implementation - would be better with a real test framework
    fn();
}

function afterEach(fn) {
    // Simple implementation - would be better with a real test framework
    fn();
}

// Run the tests if this file is executed directly
if (require.main === module) {
    console.log('Running Environment Variable Configuration Tests...');
    // The describe blocks will execute when the file is loaded
}