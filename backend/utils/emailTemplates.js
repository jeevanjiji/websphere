// backend/utils/emailTemplates.js

/**
 * Professional email templates for WebSphere
 * All templates are responsive and follow modern email design practices
 */

/**
 * Base email template with consistent styling
 * @param {string} title - Email title
 * @param {string} content - Email content HTML
 * @returns {string} - Complete HTML email template
 */
function getBaseTemplate(title, content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f4f4f4; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 30px; 
          text-align: center; 
          border-radius: 10px 10px 0 0; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 600; 
        }
        .content { 
          background: white; 
          padding: 40px 30px; 
          border-radius: 0 0 10px 10px; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          margin: 20px 0; 
          transition: transform 0.2s; 
        }
        .button:hover { 
          transform: translateY(-2px); 
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #666; 
          font-size: 14px; 
        }
        .highlight { 
          background-color: #f8f9ff; 
          padding: 20px; 
          border-left: 4px solid #667eea; 
          margin: 20px 0; 
          border-radius: 0 8px 8px 0; 
        }
        ul { 
          padding-left: 20px; 
        }
        li { 
          margin: 8px 0; 
        }
        .warning { 
          background-color: #fff3cd; 
          border: 1px solid #ffeaa7; 
          color: #856404; 
          padding: 15px; 
          border-radius: 8px; 
          margin: 20px 0; 
        }
        @media only screen and (max-width: 600px) {
          .container { padding: 10px; }
          .content { padding: 20px 15px; }
          .header { padding: 20px 15px; }
          .header h1 { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WebSphere</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© 2024 WebSphere. All rights reserved.</p>
          <p>This email was sent from an automated system. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate verification email HTML
 * @param {Object} user - User object
 * @param {string} verificationUrl - Verification URL
 * @returns {string} - HTML email content
 */
function generateVerificationEmailHTML(user, verificationUrl) {
  const content = `
    <h2>Welcome to WebSphere!</h2>
    <p>Hi <strong>${user.fullName}</strong>,</p>
    
    <p>Thank you for joining our ${user.role === 'freelancer' ? 'freelancer' : 'client'} community! To complete your registration and start using WebSphere, please verify your email address.</p>
    
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
    </div>
    
    <div class="highlight">
      <p><strong>What's next after verification?</strong></p>
      ${user.role === 'freelancer' ? `
        <ul>
          <li>✅ Complete your freelancer profile with skills and experience</li>
          <li>📸 Upload a professional profile picture</li>
          <li>💰 Set your hourly rate and availability</li>
          <li>🚀 Start browsing and bidding on projects</li>
        </ul>
      ` : `
        <ul>
          <li>✅ Complete your client profile</li>
          <li>📝 Post your first project</li>
          <li>👥 Browse and hire talented freelancers</li>
          <li>🎯 Manage your projects efficiently</li>
        </ul>
      `}
    </div>
    
    <p>If you can't click the button above, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
    
    <div class="warning">
      <p><strong>Security Note:</strong> This verification link will expire in 24 hours. If you didn't create this account, please ignore this email.</p>
    </div>
    
    <p>Need help? Contact our support team at support@websphere.com</p>
    
    <p>Best regards,<br>The WebSphere Team</p>
  `;
  
  return getBaseTemplate('Verify Your WebSphere Account', content);
}

/**
 * Generate verification email text version
 * @param {Object} user - User object
 * @param {string} verificationUrl - Verification URL
 * @returns {string} - Plain text email content
 */
function generateVerificationEmailText(user, verificationUrl) {
  return `
Welcome to WebSphere!

Hi ${user.fullName},

Thank you for joining our ${user.role === 'freelancer' ? 'freelancer' : 'client'} community! To complete your registration and start using WebSphere, please verify your email address by visiting:

${verificationUrl}

What's next after verification?
${user.role === 'freelancer' ? `
- Complete your freelancer profile with skills and experience
- Upload a professional profile picture
- Set your hourly rate and availability
- Start browsing and bidding on projects
` : `
- Complete your client profile
- Post your first project
- Browse and hire talented freelancers
- Manage your projects efficiently
`}

Security Note: This verification link will expire in 24 hours. If you didn't create this account, please ignore this email.

Need help? Contact our support team at support@websphere.com

Best regards,
The WebSphere Team

© 2024 WebSphere. All rights reserved.
  `.trim();
}

/**
 * Generate welcome email HTML
 * @param {Object} user - User object
 * @returns {string} - HTML email content
 */
function generateWelcomeEmailHTML(user) {
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/${user.role === 'freelancer' ? 'freelancer-profile-setup' : 'dashboard'}`;
  
  const content = `
    <h2>🎉 Welcome to WebSphere!</h2>
    <p>Hi <strong>${user.fullName}</strong>,</p>
    
    <p>Congratulations! Your WebSphere ${user.role} account is now active and ready to use.</p>
    
    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button">${user.role === 'freelancer' ? 'Complete Your Profile' : 'Go to Dashboard'}</a>
    </div>
    
    <div class="highlight">
      <p><strong>Your Account Status:</strong></p>
      <ul>
        <li>✅ Email verified</li>
        <li>✅ Account activated</li>
        ${user.role === 'freelancer' ? `
          <li>📝 Next: Complete your professional bio</li>
          <li>🎯 Next: Add your skills and expertise</li>
          <li>💰 Next: Set your hourly rate</li>
          <li>📸 Next: Upload a profile picture</li>
        ` : `
          <li>📝 Next: Complete your profile</li>
          <li>🚀 Next: Post your first project</li>
        `}
      </ul>
    </div>
    
    ${user.role === 'freelancer' ? `
      <p><strong>Ready to start freelancing?</strong> Complete your profile to start receiving project invitations and build your reputation on WebSphere.</p>
    ` : `
      <p><strong>Ready to hire talent?</strong> Post your first project and connect with skilled freelancers who can help bring your ideas to life.</p>
    `}
    
    <p>Need help getting started? Check out our <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/help" style="color: #667eea;">help center</a> or contact our support team.</p>
    
    <p>Welcome to the WebSphere community!</p>
    
    <p>Best regards,<br>The WebSphere Team</p>
  `;
  
  return getBaseTemplate('Welcome to WebSphere!', content);
}

/**
 * Generate welcome email text version
 * @param {Object} user - User object
 * @returns {string} - Plain text email content
 */
function generateWelcomeEmailText(user) {
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/${user.role === 'freelancer' ? 'freelancer-profile-setup' : 'dashboard'}`;

  return `
Welcome to WebSphere!

Hi ${user.fullName},

Congratulations! Your WebSphere ${user.role} account is now active and ready to use.

Visit your dashboard: ${dashboardUrl}

Your Account Status:
- ✅ Email verified
- ✅ Account activated
${user.role === 'freelancer' ? `
- 📝 Next: Complete your professional bio
- 🎯 Next: Add your skills and expertise
- 💰 Next: Set your hourly rate
- 📸 Next: Upload a profile picture
` : `
- 📝 Next: Complete your profile
- 🚀 Next: Post your first project
`}

${user.role === 'freelancer' ?
  'Ready to start freelancing? Complete your profile to start receiving project invitations and build your reputation on WebSphere.' :
  'Ready to hire talent? Post your first project and connect with skilled freelancers who can help bring your ideas to life.'
}

Need help getting started? Visit our help center or contact our support team.

Welcome to the WebSphere community!

Best regards,
The WebSphere Team

© 2024 WebSphere. All rights reserved.
  `.trim();
}

/**
 * Generate password reset email HTML
 * @param {Object} user - User object
 * @param {string} resetUrl - Password reset URL
 * @returns {string} - HTML email content
 */
function generatePasswordResetEmailHTML(user, resetUrl) {
  const content = `
    <h2>🔐 Reset Your Password</h2>
    <p>Hi <strong>${user.fullName}</strong>,</p>

    <p>We received a request to reset your WebSphere account password. If you made this request, click the button below to reset your password:</p>

    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>

    <div class="highlight">
      <p><strong>Important Security Information:</strong></p>
      <ul>
        <li>🕐 This reset link will expire in 1 hour</li>
        <li>🔒 The link can only be used once</li>
        <li>🛡️ Your account remains secure until you create a new password</li>
      </ul>
    </div>

    <p>If you can't click the button above, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>

    <div class="warning">
      <p><strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged, and your account is still secure.</p>
    </div>

    <p>For security reasons, we recommend:</p>
    <ul>
      <li>Using a strong, unique password</li>
      <li>Not sharing your password with anyone</li>
      <li>Logging out of shared devices</li>
    </ul>

    <p>Need help? Contact our support team at support@websphere.com</p>

    <p>Best regards,<br>The WebSphere Security Team</p>
  `;

  return getBaseTemplate('Reset Your WebSphere Password', content);
}

/**
 * Generate password reset email text version
 * @param {Object} user - User object
 * @param {string} resetUrl - Password reset URL
 * @returns {string} - Plain text email content
 */
function generatePasswordResetEmailText(user, resetUrl) {
  return `
Reset Your WebSphere Password

Hi ${user.fullName},

We received a request to reset your WebSphere account password. If you made this request, visit the following link to reset your password:

${resetUrl}

Important Security Information:
- This reset link will expire in 1 hour
- The link can only be used once
- Your account remains secure until you create a new password

Didn't request this? If you didn't request a password reset, please ignore this email. Your password will remain unchanged, and your account is still secure.

For security reasons, we recommend:
- Using a strong, unique password
- Not sharing your password with anyone
- Logging out of shared devices

Need help? Contact our support team at support@websphere.com

Best regards,
The WebSphere Security Team

© 2024 WebSphere. All rights reserved.
  `.trim();
}

/**
 * Generate deactivation email HTML template
 * @param {Object} user - User object
 * @param {string} reason - Deactivation reason
 * @param {Object} ratingInfo - Optional rating and project info
 * @returns {string} - HTML email template
 */
function getDeactivationEmailTemplate(user, reason, ratingInfo = null) {
  // Generate rating-specific content if provided
  let ratingContent = '';
  if (ratingInfo) {
    ratingContent = `
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="color: #856404; margin: 0 0 8px 0;">⭐ Performance Review</h3>
      <p style="margin: 0; color: #856404;">
        <strong>Current Rating:</strong> ${ratingInfo.currentRating.toFixed(1)}/5.0 stars (${ratingInfo.ratingCount} reviews)<br>
        <strong>Completed Projects:</strong> ${ratingInfo.completedProjects}<br>
        <strong>Minimum Required:</strong> 2.5/5.0 stars to maintain account
      </p>
    </div>`;
  }

  const content = `
    <h2>🚫 Freelancer Account Deactivated</h2>
    <p>Hi <strong>${user.fullName}</strong>,</p>

    <p>We're writing to inform you that your WebSphere freelancer account has been deactivated by our administration team.</p>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="color: #dc2626; margin: 0 0 8px 0;">Account Status: Deactivated</h3>
      <p style="margin: 0; color: #7f1d1d;">
        <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
        <strong>Reason:</strong> ${reason || 'Administrative decision'}
      </p>
    </div>

    ${ratingContent}

    <p><strong>What this means:</strong></p>
    <ul>
      <li>You can no longer log into your WebSphere account</li>
      <li>Your profile is no longer visible to clients</li>
      <li>You cannot bid on new projects or receive project invitations</li>
      <li>Any ongoing projects may be affected</li>
    </ul>

    ${ratingInfo ? `
    <p><strong>About our Quality Standards:</strong></p>
    <p>WebSphere maintains high-quality standards to ensure the best experience for our clients. Freelancers are expected to maintain a minimum rating of 2.5 stars across their completed projects. This helps us provide reliable and professional services to our client base.</p>
    ` : ''}

    <p><strong>If you believe this is a mistake:</strong></p>
    <p>Please contact our support team at <a href="mailto:support@websphere.com" style="color: #667eea;">support@websphere.com</a> with your account details and any relevant information. Include details about your recent projects and client feedback if you believe your rating should be higher.</p>

    <p>We appreciate your understanding and apologize for any inconvenience this may cause.</p>

    <p>Best regards,<br>The WebSphere Administration Team</p>
  `;

  return getBaseTemplate('Freelancer Account Deactivated - WebSphere', content);
}

/**
 * Generate deactivation email text template
 * @param {Object} user - User object
 * @param {string} reason - Deactivation reason
 * @param {Object} ratingInfo - Optional rating and project info
 * @returns {string} - Plain text email template
 */
function getDeactivationEmailTextTemplate(user, reason, ratingInfo = null) {
  let ratingContent = '';
  if (ratingInfo) {
    ratingContent = `
PERFORMANCE REVIEW:
- Current Rating: ${ratingInfo.currentRating.toFixed(1)}/5.0 stars (${ratingInfo.ratingCount} reviews)
- Completed Projects: ${ratingInfo.completedProjects}
- Minimum Required: 2.5/5.0 stars to maintain account

ABOUT OUR QUALITY STANDARDS:
WebSphere maintains high-quality standards to ensure the best experience for our clients. Freelancers are expected to maintain a minimum rating of 2.5 stars across their completed projects. This helps us provide reliable and professional services to our client base.
`;
  }

  return `
🚫 FREELANCER ACCOUNT DEACTIVATED - WEBSPHERE

Hi ${user.fullName},

We're writing to inform you that your WebSphere freelancer account has been deactivated by our administration team.

ACCOUNT STATUS: DEACTIVATED
Date: ${new Date().toLocaleDateString()}
Reason: ${reason || 'Administrative decision'}
${ratingContent}
WHAT THIS MEANS:
- You can no longer log into your WebSphere account
- Your profile is no longer visible to clients
- You cannot bid on new projects or receive project invitations
- Any ongoing projects may be affected

IF YOU BELIEVE THIS IS A MISTAKE:
Please contact our support team at support@websphere.com with your account details and any relevant information.${ratingInfo ? ' Include details about your recent projects and client feedback if you believe your rating should be higher.' : ''}

We appreciate your understanding and apologize for any inconvenience this may cause.

Best regards,
The WebSphere Administration Team

---
This is an automated message from WebSphere.
If you have questions, contact us at support@websphere.com
  `.trim();
}

module.exports = {
  generateVerificationEmailHTML,
  generateVerificationEmailText,
  generateWelcomeEmailHTML,
  generateWelcomeEmailText,
  generatePasswordResetEmailHTML,
  generatePasswordResetEmailText,
  getDeactivationEmailTemplate,
  getDeactivationEmailTextTemplate
};
