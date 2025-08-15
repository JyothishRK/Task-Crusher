/**
 * Unit tests for Authentication Middleware
 */

const assert = require('assert');

// Set up environment for testing
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.COOKIE_NAME = 'auth_token';

// Mock dependencies
const mockJwt = {
    verify: (token, secret) => {
        if (token === 'valid.jwt.token' && secret === 'test-secret') {
            return { _id: 'user123' };
        }
        throw new Error('Invalid token');
    }
};

const mockUser = {
    findOne: async (query) => {
        if (query._id === 'user123' && query['tokens.token'] === 'valid.jwt.token') {
            return {
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com'
            };
        }
        return null;
    }
};

// Clear require cache to ensure fresh module loading
delete require.cache[require.resolve('../../src/middleware/auth')];
delete require.cache[require.resolve('jsonwebtoken')];
delete require.cache[require.resolve('../../src/models/user')];
delete require.cache[require.resolve('../../src/utils/tokenUtils')];

// Mock require to return our mocks
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
    if (id === 'jsonwebtoken') {
        return mockJwt;
    }
    if (id === '../models/user') {
        return mockUser;
    }
    if (id === '../utils/tokenUtils') {
        return {
            extractTokenFromRequest: (req) => {
                return req.cookies && req.cookies.auth_token ? req.cookies.auth_token : null;
            },
            isValidToken: (token) => {
                return !!(token && typeof token === 'string' && token.trim().length > 0);
            }
        };
    }
    return originalRequire.apply(this, arguments);
};

const auth = require('../../src/middleware/auth');

// Restore original require
Module.prototype.require = originalRequire;

describe('Authentication Middleware', () => {
    
    describe('successful authentication', () => {
        
        it('should authenticate user with valid cookie token', async () => {
            const mockReq = {
                cookies: {
                    auth_token: 'valid.jwt.token'
                }
            };
            
            const mockRes = {
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                send: function(data) {
                    this.responseData = data;
                }
            };
            
            let nextCalled = false;
            const mockNext = () => {
                nextCalled = true;
            };
            
            await auth(mockReq, mockRes, mockNext);
            

            
            assert.strictEqual(nextCalled, true);
            assert.strictEqual(mockReq.token, 'valid.jwt.token');
            assert.strictEqual(mockReq.user._id, 'user123');
            assert.strictEqual(mockReq.user.name, 'Test User');
        });
    });

    describe('authentication failures', () => {
        
        it('should reject request with no cookie', async () => {
            const mockReq = {
                cookies: {}
            };
            
            const mockRes = {
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                send: function(data) {
                    this.responseData = data;
                }
            };
            
            let nextCalled = false;
            const mockNext = () => {
                nextCalled = true;
            };
            
            // Capture console.error
            const originalError = console.error;
            let errorMessage = '';
            console.error = (message) => { errorMessage = message; };
            
            await auth(mockReq, mockRes, mockNext);
            
            console.error = originalError;
            
            assert.strictEqual(nextCalled, false);
            assert.strictEqual(mockRes.statusCode, 401);
            assert.strictEqual(mockRes.responseData.error, "Error! Please Authenticate");
            assert(errorMessage.includes('Authentication failed'));
        });

        it('should reject request with empty cookie', async () => {
            const mockReq = {
                cookies: {
                    auth_token: ''
                }
            };
            
            const mockRes = {
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                send: function(data) {
                    this.responseData = data;
                }
            };
            
            let nextCalled = false;
            const mockNext = () => {
                nextCalled = true;
            };
            
            // Capture console.error
            const originalError = console.error;
            let errorMessage = '';
            console.error = (message) => { errorMessage = message; };
            
            await auth(mockReq, mockRes, mockNext);
            
            console.error = originalError;
            
            assert.strictEqual(nextCalled, false);
            assert.strictEqual(mockRes.statusCode, 401);
            assert.strictEqual(mockRes.responseData.error, "Error! Please Authenticate");
        });

        it('should reject request with invalid JWT token', async () => {
            const mockReq = {
                cookies: {
                    auth_token: 'invalid.jwt.token'
                }
            };
            
            const mockRes = {
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                send: function(data) {
                    this.responseData = data;
                }
            };
            
            let nextCalled = false;
            const mockNext = () => {
                nextCalled = true;
            };
            
            // Capture console.error
            const originalError = console.error;
            let errorMessage = '';
            console.error = (message) => { errorMessage = message; };
            
            await auth(mockReq, mockRes, mockNext);
            
            console.error = originalError;
            
            assert.strictEqual(nextCalled, false);
            assert.strictEqual(mockRes.statusCode, 401);
            assert.strictEqual(mockRes.responseData.error, "Error! Please Authenticate");
        });

        it('should reject request when user not found', async () => {
            // Mock a scenario where JWT is valid but user doesn't exist
            const mockReq = {
                cookies: {
                    auth_token: 'valid.jwt.token'
                }
            };
            
            const mockRes = {
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                send: function(data) {
                    this.responseData = data;
                }
            };
            
            let nextCalled = false;
            const mockNext = () => {
                nextCalled = true;
            };
            
            // Temporarily override the mock to return null user
            const originalFindOne = mockUser.findOne;
            mockUser.findOne = async () => null;
            
            // Capture console.error
            const originalError = console.error;
            let errorMessage = '';
            console.error = (message) => { errorMessage = message; };
            
            await auth(mockReq, mockRes, mockNext);
            
            console.error = originalError;
            mockUser.findOne = originalFindOne;
            
            assert.strictEqual(nextCalled, false);
            assert.strictEqual(mockRes.statusCode, 401);
            assert.strictEqual(mockRes.responseData.error, "Error! Please Authenticate");
        });

        it('should handle missing cookies object gracefully', async () => {
            const mockReq = {}; // No cookies property
            
            const mockRes = {
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                send: function(data) {
                    this.responseData = data;
                }
            };
            
            let nextCalled = false;
            const mockNext = () => {
                nextCalled = true;
            };
            
            // Capture console.error
            const originalError = console.error;
            let errorMessage = '';
            console.error = (message) => { errorMessage = message; };
            
            await auth(mockReq, mockRes, mockNext);
            
            console.error = originalError;
            
            assert.strictEqual(nextCalled, false);
            assert.strictEqual(mockRes.statusCode, 401);
            assert.strictEqual(mockRes.responseData.error, "Error! Please Authenticate");
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
    console.log('Running Authentication Middleware Tests...');
    // The describe blocks will execute when the file is loaded
}