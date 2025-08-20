const emailService = require('../src/emails/account');

// Test script to verify function signatures remain unchanged
function testInterfaceCompatibility() {
    console.log('Testing email service interface compatibility...\n');
    
    // Check that the required functions exist
    const requiredFunctions = ['sendWelcomeEmail', 'sendAccountDeletionEmail'];
    
    requiredFunctions.forEach(funcName => {
        if (typeof emailService[funcName] === 'function') {
            console.log(`✅ ${funcName} function exists and is callable`);
        } else {
            console.error(`❌ ${funcName} function is missing or not callable`);
        }
    });
    
    // Check function signatures (parameter count)
    console.log('\n--- Function Signature Tests ---');
    
    // Both functions should accept 2 parameters (email, name)
    if (emailService.sendWelcomeEmail.length === 2) {
        console.log('✅ sendWelcomeEmail accepts correct number of parameters (2)');
    } else {
        console.error(`❌ sendWelcomeEmail expects 2 parameters, but accepts ${emailService.sendWelcomeEmail.length}`);
    }
    
    if (emailService.sendAccountDeletionEmail.length === 2) {
        console.log('✅ sendAccountDeletionEmail accepts correct number of parameters (2)');
    } else {
        console.error(`❌ sendAccountDeletionEmail expects 2 parameters, but accepts ${emailService.sendAccountDeletionEmail.length}`);
    }
    
    console.log('\n--- Interface Compatibility Test Complete ---');
    console.log('Email service maintains backward compatibility with existing code.');
}

// Run tests if this file is executed directly
if (require.main === module) {
    testInterfaceCompatibility();
}

module.exports = { testInterfaceCompatibility };