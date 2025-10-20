// backend/utils/emailVerification.js
const crypto = require('crypto');
const nodemailer = require('nodemailer');

/**
 * Email verification utility for freelancer registration
 */

// Create email transporter using Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'webspherecompany@gmail.com',
      pass: 'Websphere@123'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Generate a verification token
 * @returns {string} - Verification token
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate verification URL
 * @param {string} token - Verification token
 * @returns {string} - Verification URL
 */
function generateVerificationUrl(token) {
  const baseUrl = process.env.FRONTEND_URL || 'https://websphere-w8k6.onrender.com';
  return `${baseUrl}/verify-email?token=${token}`;
}

/**
 * Send verification email to freelancer
 * @param {Object} user - User object
 * @param {string} token - Verification token
 * @returns {Promise} - Email sending result
 */
async function sendVerificationEmail(user, token) {
  try {
    const transporter = createTransporter();
    const verificationUrl = generateVerificationUrl(token);

    const mailOptions = {
      from: 'WebSphere <webspherecompany@gmail.com>',
      to: user.email,
      subject: `Verify Your WebSphere ${user.role === 'freelancer' ? 'Freelancer' : 'Client'} Account`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">WebSphere</div>
              <h1>Welcome to WebSphere!</h1>
              <p>Thank you for joining our ${user.role === 'freelancer' ? 'freelancer' : 'client'} community</p>
            </div>
            <div class="content">
              <h2>Hi ${user.fullName},</h2>
              <p>Welcome to WebSphere! We're excited to have you join our community${user.role === 'freelancer' ? ' of talented freelancers' : ' of innovative clients'}.</p>

              <p>To complete your registration and start ${user.role === 'freelancer' ? 'building your freelancer profile' : 'posting projects and finding freelancers'}, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
              
              <p><strong>What's next?</strong></p>
              <ul>
                <li>Complete your freelancer profile with skills and experience</li>
                <li>Upload a professional profile picture</li>
                <li>Set your hourly rate and availability</li>
                <li>Start browsing and bidding on projects</li>
              </ul>
              
              <p>If you didn't create this account, please ignore this email.</p>
              
              <p>Best regards,<br>The WebSphere Team</p>
            </div>
            <div class="footer">
              <p>This email was sent to ${user.email}</p>
              <p>© 2024 WebSphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to WebSphere!
        
        Hi ${user.fullName},
        
        Thank you for joining our freelancer community. To complete your registration, please verify your email address by visiting:
        
        ${verificationUrl}
        
        What's next?
        - Complete your freelancer profile with skills and experience
        - Upload a professional profile picture
        - Set your hourly rate and availability
        - Start browsing and bidding on projects
        
        If you didn't create this account, please ignore this email.
        
        Best regards,
        The WebSphere Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', result.messageId);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
    }
    
    return {
      success: true,
      messageId: result.messageId,
      previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(result) : null
    };
    
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
    const transporter = createTransporter();

    const mailOptions = {
      from: 'WebSphere <webspherecompany@gmail.com>',
      to: user.email,
      subject: 'Welcome to WebSphere - Your Account is Verified!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Verified</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">WebSphere</div>
              <h1>🎉 Account Verified!</h1>
            </div>
            <div class="content">
              <div class="success">
                <strong>Congratulations!</strong> Your email has been successfully verified.
              </div>
              
              <h2>Hi ${user.fullName},</h2>
              <p>Your WebSphere freelancer account is now active and ready to use!</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'https://websphere-w8k6.onrender.com'}/freelancer-profile-setup" class="button">Complete Your Profile</a>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>✅ Email verified</li>
                <li>📝 Complete your professional bio</li>
                <li>🎯 Add your skills and expertise</li>
                <li>💰 Set your hourly rate</li>
                <li>📸 Upload a profile picture</li>
                <li>🚀 Start applying to projects</li>
              </ul>
              
              <p>Need help getting started? Check out our freelancer guide or contact our support team.</p>
              
              <p>Welcome to the WebSphere community!</p>
              
              <p>Best regards,<br>The WebSphere Team</p>
            </div>
            <div class="footer">
              <p>© 2024 WebSphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    // Don't throw error for welcome email failure
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateVerificationToken,
  generateVerificationUrl,
  sendVerificationEmail,
  sendWelcomeEmail
};
