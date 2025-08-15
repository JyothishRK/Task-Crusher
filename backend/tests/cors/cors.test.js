/**
 * Tests for CORS Configuration with Cookie Support
 */

const assert = require('assert');

// Set up environment for testing
process.env.NODE_ENV = 'test';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,https://myapp.com';

describe('CORS Configuration for Cookie Authentication', () => {
    
    // Mock CORS options function
    const createCorsOptions = () => {
        return {
            origin: function (origin, callback) {
                // Allow requests with no origin (like mobile apps or curl requests)
                if (!origin) return callback(null, true);
                
                // In development, allow all origins
                if (process.env.NODE_ENV === 'development') {
                    return callback(null, true);
                }
                
                // In production, you should specify allowed origins
                const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
                    process.env.ALLOWED_ORIGINS.split(',') : 
                    ['http://localhost:3000', 'http://localhost:3001']; // Default dev origins
                
                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true, // Essential for cookie-based authentication
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'X-Requested-With', 'Accept', 'Origin'],
            maxAge: 86400 // 24 hours cache for preflight requests
        };
    };

    describe('CORS Origin Handling', () => {
        
        it('should allow requests with no origin', () => {
            const corsOptions = createCorsOptions();
            
            let callbackResult = null;
            corsOptions.origin(undefined, (err, allowed) => {
                callbackResult = { err, allowed };
            });
            
            assert.strictEqual(callbackResult.err, null);
            assert.strictEqual(callbackResult.allowed, true);
        });

        it('should allow all origins in development environment', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            
            const corsOptions = createCorsOptions();
            
            let callbackResult = null;
            corsOptions.origin('http://any-origin.com', (err, allowed) => {
                callbackResult = { err, allowed };
            });
            
            assert.strictEqual(callbackResult.err, null);
            assert.strictEqual(callbackResult.allowed, true);
            
            process.env.NODE_ENV = originalEnv;
        });

        it('should allow configured origins in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            
            const corsOptions = createCorsOptions();
            
            let callbackResult = null;
            corsOptions.origin('http://localhost:3000', (err, allowed) => {
                callbackResult = { err, allowed };
            });
            
            assert.strictEqual(callbackResult.err, null);
            assert.strictEqual(callbackResult.allowed, true);
            
            process.env.NODE_ENV = originalEnv;
        });

        it('should reject non-configured origins in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            
            const corsOptions = createCorsOptions();
            
            let callbackResult = null;
            corsOptions.origin('http://malicious-site.com', (err, allowed) => {
                callbackResult = { err, allowed };
            });
            
            assert(callbackResult.err instanceof Error);
            assert.strictEqual(callbackResult.err.message, 'Not allowed by CORS');
            assert.strictEqual(callbackResult.allowed, undefined);
            
            process.env.NODE_ENV = originalEnv;
        });

        it('should use default origins when ALLOWED_ORIGINS is not set', () => {
            const originalEnv = process.env.NODE_ENV;
            const originalOrigins = process.env.ALLOWED_ORIGINS;
            
            process.env.NODE_ENV = 'production';
            delete process.env.ALLOWED_ORIGINS;
            
            const corsOptions = createCorsOptions();
            
            let callbackResult = null;
            corsOptions.origin('http://localhost:3001', (err, allowed) => {
                callbackResult = { err, allowed };
            });
            
            assert.strictEqual(callbackResult.err, null);
            assert.strictEqual(callbackResult.allowed, true);
            
            process.env.NODE_ENV = originalEnv;
            process.env.ALLOWED_ORIGINS = originalOrigins;
        });
    });

    describe('CORS Configuration Options', () => {
        
        it('should have credentials enabled for cookie support', () => {
            const corsOptions = createCorsOptions();
            
            assert.strictEqual(corsOptions.credentials, true);
        });

        it('should include all necessary HTTP methods', () => {
            const corsOptions = createCorsOptions();
            const expectedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
            
            assert.deepStrictEqual(corsOptions.methods, expectedMethods);
        });

        it('should include necessary headers for cookie authentication', () => {
            const corsOptions = createCorsOptions();
            const expectedHeaders = ['Content-Type', 'X-Requested-With', 'Accept', 'Origin'];
            
            assert.deepStrictEqual(corsOptions.allowedHeaders, expectedHeaders);
        });

        it('should have appropriate cache time for preflight requests', () => {
            const corsOptions = createCorsOptions();
            
            assert.strictEqual(corsOptions.maxAge, 86400); // 24 hours
        });

        it('should not include Authorization header in allowed headers', () => {
            const corsOptions = createCorsOptions();
            
            // Authorization header should not be needed since we're using cookies
            assert.strictEqual(corsOptions.allowedHeaders.includes('Authorization'), false);
        });
    });

    describe('Environment-based Configuration', () => {
        
        it('should parse ALLOWED_ORIGINS environment variable correctly', () => {
            const originalOrigins = process.env.ALLOWED_ORIGINS;
            const originalEnv = process.env.NODE_ENV;
            
            process.env.ALLOWED_ORIGINS = 'http://site1.com,http://site2.com,https://site3.com';
            process.env.NODE_ENV = 'production';
            
            const corsOptions = createCorsOptions();
            
            // Test each origin
            let result1 = null;
            corsOptions.origin('http://site1.com', (err, allowed) => {
                result1 = { err, allowed };
            });
            assert.strictEqual(result1.err, null);
            assert.strictEqual(result1.allowed, true);
            
            let result2 = null;
            corsOptions.origin('http://site2.com', (err, allowed) => {
                result2 = { err, allowed };
            });
            assert.strictEqual(result2.err, null);
            assert.strictEqual(result2.allowed, true);
            
            let result3 = null;
            corsOptions.origin('https://site3.com', (err, allowed) => {
                result3 = { err, allowed };
            });
            assert.strictEqual(result3.err, null);
            assert.strictEqual(result3.allowed, true);
            
            let result4 = null;
            corsOptions.origin('http://unauthorized.com', (err, allowed) => {
                result4 = { err, allowed };
            });
            assert(result4.err instanceof Error);
            
            process.env.ALLOWED_ORIGINS = originalOrigins;
            process.env.NODE_ENV = originalEnv;
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
    console.log('Running CORS Configuration Tests...');
    // The describe blocks will execute when the file is loaded
}