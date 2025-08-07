// Test script for Brevo email functionality
require('dotenv').config();

const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
} = require('./utils/brevoEmailService');

// Test user object
const testUser = {
  _id: 'test123',
  fullName: 'John Doe',
  email: 'test@example.com', // Replace with your test email
  role: 'freelancer'
};

async function testEmailFunctionality() {
  console.log('🧪 Testing Brevo Email Functionality...\n');

  // Check if Brevo is configured
  if (!process.env.BREVO_API_KEY) {
    console.log('❌ BREVO_API_KEY not found in environment variables');
    console.log('📝 Please add your Brevo SMTP API key to the .env file');
    console.log('🔗 Get your API key from: https://app.brevo.com/settings/keys/smtp\n');
    return;
  }

  if (!process.env.BREVO_SMTP_USER) {
    console.log('❌ BREVO_SMTP_USER not found in environment variables');
    console.log('📝 Please add your Brevo SMTP user email to the .env file\n');
    return;
  }

  if (!process.env.BREVO_FROM_EMAIL) {
    console.log('❌ BREVO_FROM_EMAIL not found in environment variables');
    console.log('📝 Please add your verified sender email to the .env file\n');
    return;
  }

  console.log('✅ Brevo configuration found');
  console.log(`📧 SMTP User: ${process.env.BREVO_SMTP_USER}`);
  console.log(`📧 From Email: ${process.env.BREVO_FROM_EMAIL}`);
  console.log(`🎯 Test Email: ${testUser.email}\n`);

  try {
    // Test 1: Verification Email
    console.log('1️⃣ Testing Verification Email...');
    const verificationResult = await sendVerificationEmail(testUser, 'test-verification-token');
    console.log('✅ Verification email test:', verificationResult.success ? 'PASSED' : 'FAILED');
    
    // Test 2: Welcome Email
    console.log('\n2️⃣ Testing Welcome Email...');
    const welcomeResult = await sendWelcomeEmail(testUser);
    console.log('✅ Welcome email test:', welcomeResult.success ? 'PASSED' : 'FAILED');
    
    // Test 3: Password Reset Email
    console.log('\n3️⃣ Testing Password Reset Email...');
    const resetResult = await sendPasswordResetEmail(testUser, 'test-reset-token');
    console.log('✅ Password reset email test:', resetResult.success ? 'PASSED' : 'FAILED');
    
    console.log('\n🎉 All email tests completed successfully!');
    console.log('📬 Check your email inbox for the test emails');
    
  } catch (error) {
    console.error('\n❌ Email test failed:', error.message);
    
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Verify your BREVO_API_KEY is correct');
      console.log('2. Make sure your BREVO_SMTP_USER email is correct');
      console.log('3. Check that your sender email is verified in Brevo');
      console.log('4. Ensure your Brevo account has SMTP access enabled');
    }
  }
}

// Run the test
testEmailFunctionality();
