/**
 * Unit tests for Token Management Utilities
 */

const assert = require('assert');

// Set up environment for consistent testing
process.env.NODE_ENV = 'production';
process.env.COOKIE_SECURE = 'true';
process.env.COOKIE_SAME_SITE = 'Lax';
process.env.COOKIE_MAX_AGE = '86400000';
process.env.COOKIE_NAME = 'auth_token';

const { setAuthCookie, clearAuthCookie, extractTokenFromRequest, isValidToken } = require('../../src/utils/tokenUtils');

describe('Token Management Utilities', () => {
    
    describe('setAuthCookie', () => {
        
        it('should set cookie with correct name and options', () => {
            const mockRes = {
                cookie: function(name, value, options) {
                    this.cookieName = name;
                    this.cookieValue = value;
                    this.cookieOptions = options;
                }
            };
            
            const token = 'test.jwt.token';
            setAuthCookie(mockRes, token);
            

            
            assert.strictEqual(mockRes.cookieName, 'auth_token');
            assert.strictEqual(mockRes.cookieValue, token);
            assert.strictEqual(mockRes.cookieOptions.httpOnly, true);
            assert.strictEqual(mockRes.cookieOptions.secure, true);
            assert.strictEqual(mockRes.cookieOptions.sameSite, 'Lax');
            assert.strictEqual(mockRes.cookieOptions.maxAge, 86400000);
            assert.strictEqual(mockRes.cookieOptions.path, '/');
        });

        it('should throw error for invalid response object', () => {
            assert.throws(() => {
                setAuthCookie(null, 'token');
            }, /Invalid response object/);
            
            assert.throws(() => {
                setAuthCookie({}, 'token');
            }, /Invalid response object/);
        });

        it('should throw error for invalid token', () => {
            const mockRes = { cookie: () => {} };
            
            assert.throws(() => {
                setAuthCookie(mockRes, null);
            }, /Invalid token/);
            
            assert.throws(() => {
                setAuthCookie(mockRes, '');
            }, /Invalid token/);
            
            assert.throws(() => {
                setAuthCookie(mockRes, 123);
            }, /Invalid token/);
        });
    });

    describe('clearAuthCookie', () => {
        
        it('should clear cookie with correct name and options', () => {
            const mockRes = {
                clearCookie: function(name, options) {
                    this.clearedCookieName = name;
                    this.clearOptions = options;
                }
            };
            
            clearAuthCookie(mockRes);
            
            assert.strictEqual(mockRes.clearedCookieName, 'auth_token');
            assert.strictEqual(mockRes.clearOptions.httpOnly, true);
            assert.strictEqual(mockRes.clearOptions.secure, true);
            assert.strictEqual(mockRes.clearOptions.sameSite, 'Lax');
            assert.strictEqual(mockRes.clearOptions.path, '/');
        });

        it('should throw error for invalid response object', () => {
            assert.throws(() => {
                clearAuthCookie(null);
            }, /Invalid response object/);
            
            assert.throws(() => {
                clearAuthCookie({});
            }, /Invalid response object/);
        });
    });

    describe('extractTokenFromRequest', () => {
        
        it('should extract token from request cookies', () => {
            const mockReq = {
                cookies: {
                    'auth_token': 'test.jwt.token',
                    'other_cookie': 'other_value'
                }
            };
            
            const token = extractTokenFromRequest(mockReq);
            
            assert.strictEqual(token, 'test.jwt.token');
        });

        it('should return null when token cookie is not present', () => {
            const mockReq = {
                cookies: {
                    'other_cookie': 'other_value'
                }
            };
            
            const token = extractTokenFromRequest(mockReq);
            
            assert.strictEqual(token, null);
        });

        it('should return null when cookies object is not present', () => {
            const mockReq = {};
            
            const token = extractTokenFromRequest(mockReq);
            
            assert.strictEqual(token, null);
        });

        it('should return null when request is null or undefined', () => {
            assert.strictEqual(extractTokenFromRequest(null), null);
            assert.strictEqual(extractTokenFromRequest(undefined), null);
        });

        it('should return null when token cookie is empty string', () => {
            const mockReq = {
                cookies: {
                    'auth_token': ''
                }
            };
            
            const token = extractTokenFromRequest(mockReq);
            
            assert.strictEqual(token, null);
        });
    });

    describe('isValidToken', () => {
        
        it('should return true for valid token strings', () => {
            assert.strictEqual(isValidToken('valid.jwt.token'), true);
            assert.strictEqual(isValidToken('another-token'), true);
            assert.strictEqual(isValidToken('a'), true);
        });

        it('should return false for invalid tokens', () => {

            assert.strictEqual(isValidToken(null), false);
            assert.strictEqual(isValidToken(undefined), false);
            assert.strictEqual(isValidToken(''), false);
            assert.strictEqual(isValidToken('   '), false);
            assert.strictEqual(isValidToken(123), false);
            assert.strictEqual(isValidToken({}), false);
            assert.strictEqual(isValidToken([]), false);
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

// Run the tests if this file is executed directly
if (require.main === module) {
    console.log('Running Token Management Utilities Tests...');
    // The describe blocks will execute when the file is loaded
}