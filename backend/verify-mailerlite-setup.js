require('dotenv').config();
const { sendWelcomeEmail, sendAccountDeletionEmail } = require('./src/emails/account');

// Verification script for MailerLite dashboard setup
async function verifyMailerLiteSetup() {
    console.log('🔍 MailerLite Dashboard Setup Verification');
    console.log('=========================================\n');
    
    const testEmail = 'rkjyothish@gmail.com';
    const testName = 'R K Jyothish';
    
    console.log(`📧 Test email: ${testEmail}`);
    console.log(`👤 Test name: ${testName}\n`);
    
    // Test welcome email
    console.log('🔄 Testing Welcome Email Automation...');
    try {
        await sendWelcomeEmail(testEmail, testName);
        console.log('✅ Welcome email automation triggered successfully!\n');
    } catch (error) {
        console.error('❌ Welcome email failed:', error.message);
    }
    
    // Wait a moment before testing deletion email
    console.log('⏳ Waiting 2 seconds before testing account deletion...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test account deletion email
    console.log('🔄 Testing Account Deletion Email Automation...');
    try {
        await sendAccountDeletionEmail(testEmail, testName);
        console.log('✅ Account deletion email automation triggered successfully!\n');
    } catch (error) {
        console.error('❌ Account deletion email failed:', error.message);
    }
    
    console.log('📋 Verification Complete!');
    console.log('========================\n');
    
    console.log('📧 Check your email inbox for:');
    console.log('1. Welcome to Task Crusher! 🚀');
    console.log('2. Your Task Crusher Account Has Been Deleted\n');
    
    console.log('🔧 If emails are not received, verify in MailerLite dashboard:');
    console.log('1. ✅ Account Activation template exists');
    console.log('2. ✅ Account Deletion Confirmation template exists');
    console.log('3. ✅ Welcome Email Automation is active');
    console.log('4. ✅ Account Deletion Automation is active');
    console.log('5. ✅ Custom fields are created');
    console.log('6. ✅ Sender email is verified\n');
    
    console.log('📊 Check automation logs in MailerLite dashboard for debugging');
}

// Run verification
verifyMailerLiteSetup().catch(console.error);
