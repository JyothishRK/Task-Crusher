/**
 * Unit tests for User Model with Numeric ID
 */

const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../../src/models/user');
const Counter = require('../../src/models/counter');

// Test database setup
let isConnected = false;

async function setupTestDB() {
    if (!isConnected) {
        const testDbUri = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/task-app-test';
        await mongoose.connect(testDbUri);
        isConnected = true;
    }
    // Clean up before each test
    await User.deleteMany({});
    await Counter.deleteMany({});
}

async function cleanupTestDB() {
    if (isConnected) {
        await User.deleteMany({});
        await Counter.deleteMany({});
        await mongoose.disconnect();
        isConnected = false;
    }
}

describe('User Model with Numeric ID', () => {
    
    describe('userId generation', () => {
        
        it('should generate userId automatically for new users', async () => {
            await setupTestDB();
            
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123',
                age: 25
            };
            
            const user = new User(userData);
            await user.save();
            
            assert.strictEqual(user.userId, 1);
            assert.strictEqual(typeof user.userId, 'number');
        });

        it('should generate sequential userIds for multiple users', async () => {
            await setupTestDB();
            
            const user1 = new User({
                name: 'User One',
                email: 'user1@example.com',
                password: 'testpass123'
            });
            await user1.save();
            
            const user2 = new User({
                name: 'User Two',
                email: 'user2@example.com',
                password: 'testpass123'
            });
            await user2.save();
            
            const user3 = new User({
                name: 'User Three',
                email: 'user3@example.com',
                password: 'testpass123'
            });
            await user3.save();
            
            assert.strictEqual(user1.userId, 1);
            assert.strictEqual(user2.userId, 2);
            assert.strictEqual(user3.userId, 3);
        });

        it('should not generate userId if already provided', async () => {
            await setupTestDB();
            
            const user = new User({
                userId: 100,
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            assert.strictEqual(user.userId, 100);
        });

        it('should enforce unique userId constraint', async () => {
            await setupTestDB();
            
            const user1 = new User({
                userId: 50,
                name: 'User One',
                email: 'user1@example.com',
                password: 'testpass123'
            });
            await user1.save();
            
            const user2 = new User({
                userId: 50,
                name: 'User Two',
                email: 'user2@example.com',
                password: 'testpass123'
            });
            
            try {
                await user2.save();
                assert.fail('Should have thrown duplicate key error');
            } catch (error) {
                assert(error.message.includes('duplicate key') || error.code === 11000);
            }
        });
    });

    describe('existing functionality', () => {
        
        it('should hash password on save', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'plainpassword',
                age: 25
            });
            await user.save();
            
            assert.notStrictEqual(user.password, 'plainpassword');
            assert(user.password.length > 20); // bcrypt hash is longer
        });

        it('should validate email format', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'invalid-email',
                password: 'testpass123'
            });
            
            try {
                await user.save();
                assert.fail('Should have thrown validation error');
            } catch (error) {
                assert(error.message.includes('Invalid Email'));
            }
        });

        it('should validate password does not contain "password"', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'mypassword123'
            });
            
            try {
                await user.save();
                assert.fail('Should have thrown validation error');
            } catch (error) {
                assert(error.message.includes('Password cannot Contain'));
            }
        });

        it('should validate notification time format', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123',
                notificationTime: '25:00' // Invalid time
            });
            
            try {
                await user.save();
                assert.fail('Should have thrown validation error');
            } catch (error) {
                assert(error.message.includes('Time must be in HH:MM format'));
            }
        });
    });

    describe('authentication methods', () => {
        
        it('should generate auth token with userId', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const token = await user.generateAuthToken();
            
            assert(typeof token === 'string');
            assert(token.length > 0);
            assert.strictEqual(user.tokens.length, 1);
            assert.strictEqual(user.tokens[0].token, token);
        });

        it('should find user by credentials', async () => {
            await setupTestDB();
            
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            };
            
            const user = new User(userData);
            await user.save();
            
            const foundUser = await User.findByCredentials('test@example.com', 'testpass123');
            
            assert.strictEqual(foundUser.userId, user.userId);
            assert.strictEqual(foundUser.email, 'test@example.com');
        });

        it('should throw error for invalid credentials', async () => {
            await setupTestDB();
            
            try {
                await User.findByCredentials('nonexistent@example.com', 'wrongpass');
                assert.fail('Should have thrown login error');
            } catch (error) {
                assert.strictEqual(error.message, 'Unable to Login');
            }
        });

        it('should find user by numeric userId', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            });
            await user.save();
            
            const foundUser = await User.findByUserId(user.userId);
            
            assert.strictEqual(foundUser.userId, user.userId);
            assert.strictEqual(foundUser.email, 'test@example.com');
        });

        it('should throw error for non-existent userId', async () => {
            await setupTestDB();
            
            try {
                await User.findByUserId(999);
                assert.fail('Should have thrown user not found error');
            } catch (error) {
                assert.strictEqual(error.message, 'User not found');
            }
        });
    });

    describe('JSON serialization', () => {
        
        it('should exclude sensitive fields from JSON', async () => {
            await setupTestDB();
            
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123',
                age: 25
            });
            await user.save();
            await user.generateAuthToken();
            
            const userJSON = user.toJSON();
            
            assert(userJSON.userId);
            assert(userJSON.name);
            assert(userJSON.email);
            assert(userJSON.age);
            assert(!userJSON.password);
            assert(!userJSON.tokens);
            assert(!userJSON.avatar);
        });
    });
});

// Simple test runner
function describe(name, fn) {
    console.log(`\n${name}`);
    fn();
}

function it(name, fn) {
    const testPromise = (async () => {
        try {
            await fn();
            console.log(`  ✓ ${name}`);
        } catch (error) {
            console.log(`  ✗ ${name}`);
            console.error(`    ${error.message}`);
            process.exit(1);
        }
    })();
    
    return testPromise;
}

// Run the tests if this file is executed directly
if (require.main === module) {
    console.log('Running User Model Tests...');
    
    // Run cleanup after all tests
    process.on('exit', () => {
        cleanupTestDB().catch(console.error);
    });
    
    process.on('SIGINT', () => {
        cleanupTestDB().then(() => process.exit(0)).catch(console.error);
    });
}