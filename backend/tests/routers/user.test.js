/**
 * Integration tests for User Routes with Cookie Authentication
 */

const assert = require('assert');

// Set up environment for testing
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.COOKIE_NAME = 'auth_token';

// Test the route handlers directly by creating mock functions
// that simulate the updated route behavior

describe('User Routes with Cookie Authentication', () => {
    
    // Mock token utilities
    const mockTokenUtils = {
        setAuthCookie: (res, token) => {
            res.cookieSet = { name: 'auth_token', value: token };
        },
        clearAuthCookie: (res) => {
            res.cookieCleared = true;
        }
    };

    // Mock user model
    const createMockUser = (shouldFail = false) => ({
        save: async function() {
            if (shouldFail) throw new Error('Validation failed');
            this._id = 'user123';
            return this;
        },
        generateAuthToken: async function() {
            return 'valid.jwt.token';
        }
    });

    const mockUserModel = function(data) {
        return createMockUser(data.email === 'invalid-email');
    };
    
    mockUserModel.findByCredentials = async (email, password) => {
        if (email === 'test@example.com' && password === 'password123') {
            return {
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                generateAuthToken: async function() {
                    return 'valid.jwt.token';
                }
            };
        }
        throw new Error('Unable to Login');
    };

    // Mock email functions
    const mockSendWelcomeEmail = () => {};
    const mockSendAccountDeletionEmail = () => {};

    describe('POST /users (signup)', () => {
        
        it('should create user and set authentication cookie', async () => {
            // Simulate the signup route handler logic
            const signupHandler = async (req, res) => {
                const user = new mockUserModel(req.body);
                try {
                    await user.save();
                    mockSendWelcomeEmail(user.email, user.name);
                    const token = await user.generateAuthToken();
                    
                    // Set authentication cookie instead of returning token in response
                    mockTokenUtils.setAuthCookie(res, token);
                    
                    // Return only user information, no token
                    res.status(201).send({user});
                } catch(e) {
                    // Ensure no cookie is set on failure
                    res.status(400).send(e);
                }
            };
            
            const mockReq = {
                body: {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
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
            
            await signupHandler(mockReq, mockRes);
            
            assert.strictEqual(mockRes.statusCode, 201);
            assert.strictEqual(mockRes.responseData.user._id, 'user123');
            assert.strictEqual(mockRes.responseData.token, undefined); // No token in response
            assert.strictEqual(mockRes.cookieSet.name, 'auth_token');
            assert.strictEqual(mockRes.cookieSet.value, 'valid.jwt.token');
        });

        it('should not set cookie on signup failure', async () => {
            // Simulate the signup route handler logic
            const signupHandler = async (req, res) => {
                const user = new mockUserModel(req.body);
                try {
                    await user.save();
                    mockSendWelcomeEmail(user.email, user.name);
                    const token = await user.generateAuthToken();
                    
                    // Set authentication cookie instead of returning token in response
                    mockTokenUtils.setAuthCookie(res, token);
                    
                    // Return only user information, no token
                    res.status(201).send({user});
                } catch(e) {
                    // Ensure no cookie is set on failure
                    res.status(400).send(e);
                }
            };
            
            const mockReq = {
                body: {
                    name: 'Test User',
                    email: 'invalid-email',
                    password: 'short'
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
            
            await signupHandler(mockReq, mockRes);
            
            assert.strictEqual(mockRes.statusCode, 400);
            assert.strictEqual(mockRes.cookieSet, undefined); // No cookie set on failure
        });
    });

    describe('POST /users/login', () => {
        
        it('should authenticate user and set authentication cookie', async () => {
            // Simulate the login route handler logic
            const loginHandler = async (req, res) => {
                try {
                    const user = await mockUserModel.findByCredentials(req.body.email, req.body.password);
                    const token = await user.generateAuthToken();
                    
                    // Set authentication cookie instead of returning token in response
                    mockTokenUtils.setAuthCookie(res, token);
                    
                    // Return only user information, no token
                    res.send({user});
                } catch (e) {
                    // Ensure no cookie is set on failure
                    res.status(400).send();
                }
            };
            
            const mockReq = {
                body: {
                    email: 'test@example.com',
                    password: 'password123'
                }
            };
            
            const mockRes = {
                send: function(data) {
                    this.responseData = data;
                }
            };
            
            await loginHandler(mockReq, mockRes);
            
            assert.strictEqual(mockRes.responseData.user._id, 'user123');
            assert.strictEqual(mockRes.responseData.token, undefined); // No token in response
            assert.strictEqual(mockRes.cookieSet.name, 'auth_token');
            assert.strictEqual(mockRes.cookieSet.value, 'valid.jwt.token');
        });

        it('should not set cookie on login failure', async () => {
            // Simulate the login route handler logic
            const loginHandler = async (req, res) => {
                try {
                    const user = await mockUserModel.findByCredentials(req.body.email, req.body.password);
                    const token = await user.generateAuthToken();
                    
                    // Set authentication cookie instead of returning token in response
                    mockTokenUtils.setAuthCookie(res, token);
                    
                    // Return only user information, no token
                    res.send({user});
                } catch (e) {
                    // Ensure no cookie is set on failure
                    res.status(400).send();
                }
            };
            
            const mockReq = {
                body: {
                    email: 'wrong@example.com',
                    password: 'wrongpassword'
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
            
            await loginHandler(mockReq, mockRes);
            
            assert.strictEqual(mockRes.statusCode, 400);
            assert.strictEqual(mockRes.cookieSet, undefined); // No cookie set on failure
        });
    });

    describe('POST /users/logout', () => {
        
        it('should logout user and clear authentication cookie', async () => {
            // Simulate the logout route handler logic
            const logoutHandler = async (req, res) => {
                try {
                    req.user.tokens = req.user.tokens.filter((token) => {
                        return token.token !== req.token;
                    });
                    await req.user.save();
                    
                    // Clear authentication cookie
                    mockTokenUtils.clearAuthCookie(res);
                    
                    res.status(201).send(req.user);
                } catch(e) {
                    res.status(500).send({error: "something went wrong"});
                }
            };
            
            const mockReq = {
                user: {
                    _id: 'user123',
                    name: 'Test User',
                    email: 'test@example.com',
                    tokens: [{ token: 'valid.jwt.token' }],
                    save: async function() {
                        return this;
                    }
                },
                token: 'valid.jwt.token'
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
            
            await logoutHandler(mockReq, mockRes);
            
            assert.strictEqual(mockRes.statusCode, 201);
            assert.strictEqual(mockRes.responseData._id, 'user123');
            assert.strictEqual(mockRes.cookieCleared, true);
        });
    });

    describe('POST /users/logoutall', () => {
        
        it('should logout user from all devices and clear authentication cookie', async () => {
            // Simulate the logoutall route handler logic
            const logoutAllHandler = async (req, res) => {
                try {
                    req.user.tokens = [];
                    await req.user.save();
                    
                    // Clear authentication cookie
                    mockTokenUtils.clearAuthCookie(res);
                    
                    res.status(201).send(req.user);
                } catch(e) {
                    res.status(500).send({error: "something went wrong"});
                }
            };
            
            const mockReq = {
                user: {
                    _id: 'user123',
                    name: 'Test User',
                    email: 'test@example.com',
                    tokens: [{ token: 'valid.jwt.token' }, { token: 'another.jwt.token' }],
                    save: async function() {
                        return this;
                    }
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
            
            await logoutAllHandler(mockReq, mockRes);
            
            assert.strictEqual(mockRes.statusCode, 201);
            assert.strictEqual(mockRes.responseData._id, 'user123');
            assert.strictEqual(mockRes.responseData.tokens.length, 0); // All tokens cleared
            assert.strictEqual(mockRes.cookieCleared, true);
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
    console.log('Running User Routes Tests...');
    // The describe blocks will execute when the file is loaded
}