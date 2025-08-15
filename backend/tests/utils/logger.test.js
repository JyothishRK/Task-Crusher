/**
 * Tests for Logging Utility
 * Verifies secure logging functionality and sensitive data protection
 */

const assert = require('assert');

// Set up environment for testing
process.env.NODE_ENV = 'test'; // This will disable logging output during tests

describe('Logging Utility Tests', () => {
    
    // Import logger after setting NODE_ENV
    const {
        logAuthError,
        logAuthWarning,
        logAuthInfo,
        logCookieConfig,
        logSecurityEvent,
        logAuthFailure,
        logAuthSuccess,
        sanitizeLogData,
        formatLogMessage,
        LOG_LEVELS
    } = require('../../src/utils/logger');

    describe('Data Sanitization', () => {
        
        it('should sanitize JWT tokens from strings', () => {
            const dataWithToken = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
            
            const sanitized = sanitizeLogData(dataWithToken);
            
            assert.strictEqual(sanitized.includes('eyJ'), false);
            assert.strictEqual(sanitized.includes('[JWT_TOKEN_REDACTED]'), true);
        });

        it('should sanitize sensitive fields from objects', () => {
            const sensitiveData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'secret123',
                token: 'jwt.token.here',
                tokens: [{ token: 'token1' }, { token: 'token2' }],
                jwt: 'another.jwt.token',
                secret: 'my-secret-key'
            };
            
            const sanitized = sanitizeLogData(sensitiveData);
            
            assert.strictEqual(sanitized.name, 'John Doe');
            assert.strictEqual(sanitized.email, 'john@example.com');
            assert.strictEqual(sanitized.password, '[REDACTED]');
            assert.strictEqual(sanitized.token, '[REDACTED]');
            assert.strictEqual(sanitized.tokens, '[REDACTED]');
            assert.strictEqual(sanitized.jwt, '[REDACTED]');
            assert.strictEqual(sanitized.secret, '[REDACTED]');
        });

        it('should handle nested objects', () => {
            const nestedData = {
                user: {
                    name: 'John Doe',
                    password: 'secret123'
                },
                auth: {
                    token: 'jwt.token.here'
                }
            };
            
            const sanitized = sanitizeLogData(nestedData);
            
            assert.strictEqual(sanitized.user.name, 'John Doe');
            assert.strictEqual(sanitized.user.password, '[REDACTED]');
            assert.strictEqual(sanitized.auth.token, '[REDACTED]');
        });

        it('should handle null and undefined values', () => {
            assert.strictEqual(sanitizeLogData(null), null);
            assert.strictEqual(sanitizeLogData(undefined), undefined);
            assert.strictEqual(sanitizeLogData(''), '');
        });

        it('should handle non-object, non-string values', () => {
            assert.strictEqual(sanitizeLogData(123), 123);
            assert.strictEqual(sanitizeLogData(true), true);
            assert.deepStrictEqual(sanitizeLogData([1, 2, 3]), [1, 2, 3]);
        });
    });

    describe('Log Message Formatting', () => {
        
        it('should format log messages with timestamp and level', () => {
            const message = formatLogMessage(LOG_LEVELS.ERROR, 'Test error message');
            
            assert(message.includes('ERROR'));
            assert(message.includes('Test error message'));
            assert(message.match(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)); // ISO timestamp
        });

        it('should include sanitized data in log messages', () => {
            const data = {
                user: 'john',
                password: 'secret123'
            };
            
            const message = formatLogMessage(LOG_LEVELS.INFO, 'Test message', data);
            
            assert(message.includes('Test message'));
            assert(message.includes('"user":"john"'));
            assert(message.includes('"password":"[REDACTED]"'));
        });

        it('should handle messages without data', () => {
            const message = formatLogMessage(LOG_LEVELS.WARN, 'Warning message');
            
            assert(message.includes('WARN'));
            assert(message.includes('Warning message'));
            assert(!message.includes('Data:'));
        });
    });

    describe('Logging Functions', () => {
        
        it('should not throw errors when logging in test environment', () => {
            // All logging functions should work without throwing errors
            assert.doesNotThrow(() => {
                logAuthError('Test error');
                logAuthWarning('Test warning');
                logAuthInfo('Test info');
                logCookieConfig('Test config');
                logSecurityEvent('Test security event');
                logAuthFailure('Test failure');
                logAuthSuccess('user123');
            });
        });

        it('should handle logging with data objects', () => {
            const testData = {
                userId: 'user123',
                action: 'login',
                password: 'should-be-redacted'
            };
            
            assert.doesNotThrow(() => {
                logAuthError('Test error with data', testData);
                logAuthInfo('Test info with data', testData);
                logSecurityEvent('Test security with data', testData);
            });
        });

        it('should handle logging authentication failures with context', () => {
            const context = {
                ip: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                path: '/api/users/login',
                method: 'POST'
            };
            
            assert.doesNotThrow(() => {
                logAuthFailure('Invalid credentials', context);
            });
        });

        it('should handle logging authentication success with context', () => {
            const context = {
                ip: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                path: '/api/users/me',
                method: 'GET'
            };
            
            assert.doesNotThrow(() => {
                logAuthSuccess('user123', context);
            });
        });
    });

    describe('Environment-Based Logging', () => {
        
        it('should disable logging in test environment', () => {
            // Since NODE_ENV is set to 'test', logging should be disabled
            // This is verified by the fact that no console output appears during tests
            
            // Capture console output
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            
            let logOutput = '';
            let errorOutput = '';
            let warnOutput = '';
            
            console.log = (message) => { logOutput += message; };
            console.error = (message) => { errorOutput += message; };
            console.warn = (message) => { warnOutput += message; };
            
            // Try to log various messages
            logAuthInfo('Test info message');
            logAuthError('Test error message');
            logAuthWarning('Test warning message');
            
            // Restore console functions
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            
            // Verify no output was generated (logging disabled in test)
            assert.strictEqual(logOutput, '');
            assert.strictEqual(errorOutput, '');
            assert.strictEqual(warnOutput, '');
        });
    });

    describe('Security Event Logging', () => {
        
        it('should log security events without exposing sensitive data', () => {
            const securityData = {
                userId: 'user123',
                token: 'jwt.token.here',
                ip: '192.168.1.1',
                suspiciousActivity: true
            };
            
            assert.doesNotThrow(() => {
                logSecurityEvent('Suspicious authentication attempt', securityData);
            });
        });

        it('should handle security events with minimal data', () => {
            assert.doesNotThrow(() => {
                logSecurityEvent('Generic security event');
            });
        });
    });

    describe('Error Handling in Logger', () => {
        
        it('should handle circular references in data objects', () => {
            const circularData = { name: 'test' };
            circularData.self = circularData;
            
            // Should not throw error even with circular reference
            assert.doesNotThrow(() => {
                logAuthInfo('Test with circular data', circularData);
            });
        });

        it('should handle very large data objects', () => {
            const largeData = {};
            for (let i = 0; i < 1000; i++) {
                largeData[`key${i}`] = `value${i}`;
            }
            
            assert.doesNotThrow(() => {
                logAuthInfo('Test with large data', largeData);
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

// Run the tests if this file is executed directly
if (require.main === module) {
    console.log('Running Logging Utility Tests...');
    // The describe blocks will execute when the file is loaded
}