/**
 * Unit tests for Cookie Configuration Service
 */

const assert = require('assert');

// Mock process.env for testing
const originalEnv = process.env;

// Import the module after setting up environment
const resetModule = () => {
    delete require.cache[require.resolve('../../src/utils/cookieConfig')];
    return require('../../src/utils/cookieConfig');
};

describe('Cookie Configuration Service', () => {
    
    beforeEach(() => {
        // Reset environment variables before each test
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe('getCookieOptions', () => {
        
        it('should return secure defaults for production environment', () => {
            process.env.NODE_ENV = 'production';
            const { getCookieOptions } = resetModule();
            
            const options = getCookieOptions();
            
            assert.strictEqual(options.httpOnly, true);
            assert.strictEqual(options.secure, true);
            assert.strictEqual(options.sameSite, 'Lax');
            assert.strictEqual(options.maxAge, 86400000);
            assert.strictEqual(options.path, '/');
        });

        it('should return development-friendly defaults for development environment', () => {
            process.env.NODE_ENV = 'development';
            const { getCookieOptions } = resetModule();
            
            const options = getCookieOptions();
            
            assert.strictEqual(options.httpOnly, true);
            assert.strictEqual(options.secure, false);
            assert.strictEqual(options.sameSite, 'Lax');
            assert.strictEqual(options.maxAge, 86400000);
            assert.strictEqual(options.path, '/');
        });

        it('should use environment variables when provided', () => {
            process.env.NODE_ENV = 'development';
            process.env.COOKIE_SECURE = 'true';
            process.env.COOKIE_SAME_SITE = 'Strict';
            process.env.COOKIE_MAX_AGE = '3600000';
            
            const { getCookieOptions } = resetModule();
            const options = getCookieOptions();
            
            assert.strictEqual(options.secure, true);
            assert.strictEqual(options.sameSite, 'Strict');
            assert.strictEqual(options.maxAge, 3600000);
        });

        it('should handle invalid COOKIE_MAX_AGE gracefully', () => {
            process.env.COOKIE_MAX_AGE = 'invalid';
            const { getCookieOptions } = resetModule();
            
            const options = getCookieOptions();
            
            assert.strictEqual(options.maxAge, 86400000); // Should use default
        });

        it('should auto-detect secure flag based on NODE_ENV when not explicitly set', () => {
            // Test production auto-detection
            process.env.NODE_ENV = 'production';
            delete process.env.COOKIE_SECURE;
            
            let { getCookieOptions } = resetModule();
            let options = getCookieOptions();
            assert.strictEqual(options.secure, true);
            
            // Test development auto-detection
            process.env.NODE_ENV = 'development';
            ({ getCookieOptions } = resetModule());
            options = getCookieOptions();
            assert.strictEqual(options.secure, false);
        });
    });

    describe('getTokenCookieName', () => {
        
        it('should return default cookie name when not configured', () => {
            const { getTokenCookieName } = resetModule();
            
            const cookieName = getTokenCookieName();
            
            assert.strictEqual(cookieName, 'auth_token');
        });

        it('should return custom cookie name when configured', () => {
            process.env.COOKIE_NAME = 'custom_auth_token';
            const { getTokenCookieName } = resetModule();
            
            const cookieName = getTokenCookieName();
            
            assert.strictEqual(cookieName, 'custom_auth_token');
        });
    });

    describe('validateCookieConfig', () => {
        
        it('should not throw errors for valid configuration', () => {
            process.env.COOKIE_SAME_SITE = 'Lax';
            process.env.COOKIE_MAX_AGE = '86400000';
            process.env.NODE_ENV = 'production';
            process.env.COOKIE_SECURE = 'true';
            
            const { validateCookieConfig } = resetModule();
            
            // Should not throw
            assert.doesNotThrow(() => {
                validateCookieConfig();
            });
        });

        it('should warn about invalid SameSite values', () => {
            process.env.COOKIE_SAME_SITE = 'Invalid';
            
            const { validateCookieConfig } = resetModule();
            
            // Capture console.warn
            const originalWarn = console.warn;
            let warnMessage = '';
            console.warn = (message) => { warnMessage = message; };
            
            validateCookieConfig();
            
            console.warn = originalWarn;
            assert(warnMessage.includes('Invalid COOKIE_SAME_SITE value'));
        });

        it('should warn about invalid MaxAge values', () => {
            process.env.COOKIE_MAX_AGE = 'not-a-number';
            
            const { validateCookieConfig } = resetModule();
            
            // Capture console.warn
            const originalWarn = console.warn;
            let warnMessage = '';
            console.warn = (message) => { warnMessage = message; };
            
            validateCookieConfig();
            
            console.warn = originalWarn;
            assert(warnMessage.includes('Invalid COOKIE_MAX_AGE value'));
        });

        it('should warn about insecure production configuration', () => {
            process.env.NODE_ENV = 'production';
            process.env.COOKIE_SECURE = 'false';
            
            const { validateCookieConfig } = resetModule();
            
            // Capture console.warn
            const originalWarn = console.warn;
            let warnMessage = '';
            console.warn = (message) => { warnMessage = message; };
            
            validateCookieConfig();
            
            console.warn = originalWarn;
            assert(warnMessage.includes('COOKIE_SECURE is set to false in production'));
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
    console.log('Running Cookie Configuration Service Tests...');
    // The describe blocks will execute when the file is loaded
}