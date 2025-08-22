// Load environment variables
require('dotenv').config();

const { sendWelcomeEmail, sendAccountDeletionEmail } = require('../src/emails/account');

// Test script for email functionality with MailerLite
async function testEmailFunctionality() {
    console.log('🧪 Testing email functionality with MailerLite...\n');
    
    // Test environment variable
    if (!process.env.MAILERLITE_API_KEY) {
        console.error('❌ MAILERLITE_API_KEY environment variable is not set');
        console.log('Please set MAILERLITE_API_KEY in your environment before running tests');
        return;
    } else {
        console.log('✅ MAILERLITE_API_KEY environment variable is set');
    }
    
    // Test data
    const testEmail = 'rkjyothish@gmail.com';
    const testName = 'R K Jyothish';
    
    console.log(`📬 Testing emails to: ${testEmail}`);
    
    console.log('\n--- Testing Welcome Email ---');
    try {
        await sendWelcomeEmail(testEmail, testName);
        console.log('✅ Welcome email function executed without errors');
    } catch (error) {
        console.error('❌ Welcome email function failed:', error.message);
    }
    
    console.log('\n--- Testing Account Deletion Email ---');
    try {
        await sendAccountDeletionEmail(testEmail, testName);
        console.log('✅ Account deletion email function executed without errors');
    } catch (error) {
        console.error('❌ Account deletion email function failed:', error.message);
    }
    
    console.log('\n--- Testing Error Handling ---');
    // Temporarily remove API key to test error handling
    const originalApiKey = process.env.MAILERLITE_API_KEY;
    delete process.env.MAILERLITE_API_KEY;
    
    try {
        // Re-require the module to test missing API key handling
        delete require.cache[require.resolve('../src/emails/account')];
        const { sendWelcomeEmail: testWelcomeEmail } = require('../src/emails/account');
        await testWelcomeEmail(testEmail, testName);
        console.log('❌ Expected error handling for missing API key did not occur');
    } catch (error) {
        console.log('✅ Error handling for missing API key works correctly');
    }
    
    // Restore API key
    process.env.MAILERLITE_API_KEY = originalApiKey;
    
    console.log('\n--- Test Summary ---');
    console.log('Email migration testing completed.');
    console.log('Note: Actual email delivery depends on valid MAILERLITE_API_KEY and email service configuration.');
    console.log('Make sure the "Account Activation" template exists in your MailerLite account.');
}

// Run tests if this file is executed directly
if (require.main === module) {
    testEmailFunctionality().catch(console.error);
}

module.exports = { testEmailFunctionality };