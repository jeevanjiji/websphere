// backend/utils/brevoEmailService.js
const nodemailer = require('nodemailer');
const crypto = require('crypto');

/**
 * Brevo Email Service for WebSphere
 * Handles all email communications including verification, welcome, and password reset emails
 */

// Initialize Brevo SMTP transporter
const initializeBrevo = () => {
  const apiKey = process.env.BREVO_API_KEY;
  const smtpUser = process.env.BREVO_SMTP_USER;

  if (!apiKey || apiKey === 'your_brevo_api_key_here') {
    console.warn('⚠️ BREVO_API_KEY not properly configured - using development mode');
    console.log('💡 To use real emails:');
    console.log('   1. Sign up at https://brevo.com');
    console.log('   2. Go to https://app.brevo.com/settings/keys/smtp');
    console.log('   3. Create an SMTP API key');
    console.log('   4. Update BREVO_API_KEY and BREVO_SMTP_USER in .env');
    return null;
  }

  if (!smtpUser || smtpUser.includes('your-brevo-account@email.com')) {
    console.warn('⚠️ BREVO_SMTP_USER not properly configured - using development mode');
    console.log('💡 BREVO_SMTP_USER should be your SMTP login from Brevo dashboard');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: apiKey
    }
  });

  console.log('✅ Brevo SMTP initialized successfully');
  console.log('📧 SMTP User:', smtpUser);
  return transporter;
};

// Initialize on module load
const transporter = initializeBrevo();
const isInitialized = transporter !== null;

/**
 * Generate a verification token
 * @returns {string} - Verification token
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a password reset token
 * @returns {string} - Password reset token
 */
function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate verification URL
 * @param {string} token - Verification token
 * @returns {string} - Verification URL
 */
function generateVerificationUrl(token) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  return `${baseUrl}/verify-email?token=${token}`;
}

/**
 * Generate password reset URL
 * @param {string} token - Password reset token
 * @returns {string} - Password reset URL
 */
function generatePasswordResetUrl(token) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  return `${baseUrl}/reset-password?token=${token}`;
}

/**
 * Send email using Brevo SMTP
 * @param {Object} emailData - Email configuration
 * @returns {Promise} - Brevo response
 */
async function sendEmail(emailData) {
  if (!isInitialized) {
    throw new Error('Brevo SMTP is not properly initialized. Please check your BREVO_API_KEY.');
  }

  try {
    const mailOptions = {
      from: {
        name: 'WebSphere',
        address: process.env.BREVO_FROM_EMAIL || 'noreply@websphere.com'
      },
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    };

    const response = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully via Brevo SMTP:', response.messageId);

    return {
      success: true,
      messageId: response.messageId,
      response: response.response
    };

  } catch (error) {
    console.error('❌ Brevo SMTP email error:', error);

    if (error.response) {
      console.error('Brevo error details:', error.response);
    }

    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send verification email to user
 * @param {Object} user - User object
 * @param {string} token - Verification token
 * @returns {Promise} - Email sending result
 */
async function sendVerificationEmail(user, token) {
  try {
    if (!isInitialized) {
      // Development mode - log email instead of sending
      const verificationUrl = generateVerificationUrl(token);
      console.log('📧 [DEV MODE] Verification email would be sent via Brevo to:', user.email);
      console.log('🔗 [DEV MODE] Verification URL:', verificationUrl);

      return {
        success: true,
        messageId: 'dev-mode-brevo-' + Date.now(),
        devMode: true,
        verificationUrl
      };
    }

    const verificationUrl = generateVerificationUrl(token);
    console.log('🔗 Generated verification URL:', verificationUrl);

    const emailData = {
      to: user.email,
      subject: `Verify Your WebSphere ${user.role === 'freelancer' ? 'Freelancer' : 'Client'} Account`,
      html: generateVerificationEmailHTML(user, verificationUrl),
      text: generateVerificationEmailText(user, verificationUrl)
    };

    const result = await sendEmail(emailData);
    console.log('✅ Verification email sent to:', user.email);

    return result;

  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send welcome email after successful verification
 * @param {Object} user - User object
 * @returns {Promise} - Email sending result
 */
async function sendWelcomeEmail(user) {
  try {
    if (!isInitialized) {
      // Development mode - log email instead of sending
      console.log('📧 [DEV MODE] Welcome email would be sent via Brevo to:', user.email);

      return {
        success: true,
        messageId: 'dev-mode-brevo-welcome-' + Date.now(),
        devMode: true
      };
    }

    const emailData = {
      to: user.email,
      subject: 'Welcome to WebSphere - Your Account is Verified!',
      html: generateWelcomeEmailHTML(user),
      text: generateWelcomeEmailText(user)
    };

    const result = await sendEmail(emailData);
    console.log('✅ Welcome email sent to:', user.email);

    return result;

  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    // Don't throw error for welcome email failure
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} token - Password reset token
 * @returns {Promise} - Email sending result
 */
async function sendPasswordResetEmail(user, token) {
  try {
    const resetUrl = generatePasswordResetUrl(token);
    
    const emailData = {
      to: user.email,
      subject: 'Reset Your WebSphere Password',
      html: generatePasswordResetEmailHTML(user, resetUrl),
      text: generatePasswordResetEmailText(user, resetUrl)
    };

    const result = await sendEmail(emailData);
    console.log('✅ Password reset email sent to:', user.email);
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

// Import email templates
const {
  generateVerificationEmailHTML,
  generateVerificationEmailText,
  generateWelcomeEmailHTML,
  generateWelcomeEmailText,
  generatePasswordResetEmailHTML,
  generatePasswordResetEmailText
} = require('./emailTemplates');

module.exports = {
  generateVerificationToken,
  generatePasswordResetToken,
  generateVerificationUrl,
  generatePasswordResetUrl,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmail
};
