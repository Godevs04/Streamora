const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS environment variables.');
  }
  
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to other services
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Attractive email template for password reset OTP
const getPasswordResetOTPEmailTemplate = (name, otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Streamora</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f8fafc;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            
            .header {
                background: rgba(255,255,255,0.1);
                padding: 40px 30px;
                text-align: center;
                backdrop-filter: blur(10px);
            }
            
            .logo {
                font-size: 32px;
                font-weight: bold;
                color: white;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .tagline {
                color: rgba(255,255,255,0.9);
                font-size: 16px;
                margin-bottom: 20px;
            }
            
            .content {
                background: white;
                padding: 50px 40px;
                text-align: center;
            }
            
            .welcome-text {
                font-size: 24px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 20px;
            }
            
            .description {
                font-size: 16px;
                color: #718096;
                margin-bottom: 40px;
                line-height: 1.8;
            }
            
            .otp-container {
                background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
                border-radius: 16px;
                padding: 30px;
                margin: 30px 0;
                box-shadow: 0 10px 25px rgba(229, 62, 62, 0.3);
            }
            
            .otp-label {
                color: white;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 15px;
                opacity: 0.9;
            }
            
            .otp-code {
                font-size: 36px;
                font-weight: bold;
                color: white;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .expiry-text {
                color: #e53e3e;
                font-size: 14px;
                font-weight: 500;
                margin-top: 20px;
                padding: 12px;
                background: #fed7d7;
                border-radius: 8px;
                border-left: 4px solid #e53e3e;
            }
            
            .security-note {
                background: #f7fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                margin-top: 30px;
                text-align: left;
            }
            
            .security-title {
                font-size: 16px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
            }
            
            .security-icon {
                width: 20px;
                height: 20px;
                margin-right: 8px;
                color: #e53e3e;
            }
            
            .security-text {
                font-size: 14px;
                color: #718096;
                line-height: 1.6;
            }
            
            .footer {
                background: #2d3748;
                padding: 30px;
                text-align: center;
            }
            
            .footer-text {
                color: #a0aec0;
                font-size: 14px;
                margin-bottom: 15px;
            }
            
            .social-links {
                margin-top: 20px;
            }
            
            .social-link {
                display: inline-block;
                margin: 0 10px;
                color: #e53e3e;
                text-decoration: none;
                font-weight: 500;
            }
            
            .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
                margin: 20px 0;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 20px;
                    border-radius: 16px;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .otp-code {
                    font-size: 28px;
                    letter-spacing: 4px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔐 Streamora</div>
                <div class="tagline">Secure Password Reset</div>
            </div>
            
            <div class="content">
                <div class="welcome-text">Password Reset Request, ${name}</div>
                <div class="description">
                    We received a request to reset your password for your Streamora account. 
                    Use the verification code below to proceed with resetting your password.
                </div>
                
                <div class="otp-container">
                    <div class="otp-label">Your Reset Code</div>
                    <div class="otp-code">${otp}</div>
                </div>
                
                <div class="expiry-text">
                    ⏰ This code will expire in 10 minutes for security reasons
                </div>
                
                <div class="security-note">
                    <div class="security-title">
                        <span class="security-icon">🔒</span>
                        Security Notice
                    </div>
                    <div class="security-text">
                        • Never share this code with anyone<br>
                        • Streamora will never ask for your reset code via phone or email<br>
                        • If you didn't request this password reset, please ignore this email<br>
                        • Your account remains secure and no changes have been made yet
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-text">
                    Need help? Contact our support team<br>
                    We're here to help you secure your account.
                </div>
                
                <div class="divider"></div>
                
                <div class="social-links">
                    <a href="#" class="social-link">Help Center</a>
                    <a href="#" class="social-link">Privacy Policy</a>
                    <a href="#" class="social-link">Terms of Service</a>
                </div>
                
                <div style="margin-top: 20px; color: #718096; font-size: 12px;">
                    © 2025 Streamora. All rights reserved.<br>
                    This is an automated message, please do not reply to this email.
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Attractive email template for OTP verification
const getOTPEmailTemplate = (name, otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Streamora</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f8fafc;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            
            .header {
                background: rgba(255,255,255,0.1);
                padding: 40px 30px;
                text-align: center;
                backdrop-filter: blur(10px);
            }
            
            .logo {
                font-size: 32px;
                font-weight: bold;
                color: white;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .tagline {
                color: rgba(255,255,255,0.9);
                font-size: 16px;
                margin-bottom: 20px;
            }
            
            .content {
                background: white;
                padding: 50px 40px;
                text-align: center;
            }
            
            .welcome-text {
                font-size: 24px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 20px;
            }
            
            .description {
                font-size: 16px;
                color: #718096;
                margin-bottom: 40px;
                line-height: 1.8;
            }
            
            .otp-container {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 16px;
                padding: 30px;
                margin: 30px 0;
                box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
            }
            
            .otp-label {
                color: white;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 15px;
                opacity: 0.9;
            }
            
            .otp-code {
                font-size: 36px;
                font-weight: bold;
                color: white;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .expiry-text {
                color: #e53e3e;
                font-size: 14px;
                font-weight: 500;
                margin-top: 20px;
                padding: 12px;
                background: #fed7d7;
                border-radius: 8px;
                border-left: 4px solid #e53e3e;
            }
            
            .security-note {
                background: #f7fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                margin-top: 30px;
                text-align: left;
            }
            
            .security-title {
                font-size: 16px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
            }
            
            .security-icon {
                width: 20px;
                height: 20px;
                margin-right: 8px;
                color: #667eea;
            }
            
            .security-text {
                font-size: 14px;
                color: #718096;
                line-height: 1.6;
            }
            
            .footer {
                background: #2d3748;
                padding: 30px;
                text-align: center;
            }
            
            .footer-text {
                color: #a0aec0;
                font-size: 14px;
                margin-bottom: 15px;
            }
            
            .social-links {
                margin-top: 20px;
            }
            
            .social-link {
                display: inline-block;
                margin: 0 10px;
                color: #667eea;
                text-decoration: none;
                font-weight: 500;
            }
            
            .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
                margin: 20px 0;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 20px;
                    border-radius: 16px;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .otp-code {
                    font-size: 28px;
                    letter-spacing: 4px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎬 Streamora</div>
                <div class="tagline">Your Ultimate Streaming Experience</div>
            </div>
            
            <div class="content">
                <div class="welcome-text">Welcome to Streamora, ${name}! 🎉</div>
                <div class="description">
                    We're excited to have you join our community of creators and viewers. 
                    To complete your registration and secure your account, please verify your email address using the code below.
                </div>
                
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                </div>
                
                <div class="expiry-text">
                    ⏰ This code will expire in 10 minutes for security reasons
                </div>
                
                <div class="security-note">
                    <div class="security-title">
                        <span class="security-icon">🔒</span>
                        Security Notice
                    </div>
                    <div class="security-text">
                        • Never share this code with anyone<br>
                        • Streamora will never ask for your verification code via phone or email<br>
                        • If you didn't request this code, please ignore this email
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-text">
                    Thank you for choosing Streamora!<br>
                    Start creating and sharing amazing content today.
                </div>
                
                <div class="divider"></div>
                
                <div class="social-links">
                    <a href="#" class="social-link">Help Center</a>
                    <a href="#" class="social-link">Privacy Policy</a>
                    <a href="#" class="social-link">Terms of Service</a>
                </div>
                
                <div style="margin-top: 20px; color: #718096; font-size: 12px;">
                    © 2025 Streamora. All rights reserved.<br>
                    This is an automated message, please do not reply to this email.
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Admin Access Reset OTP Email Template
const getAdminResetOTPEmailTemplate = (name, otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Access Reset - Streamora</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f8fafc;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                padding: 40px 20px;
                text-align: center;
                color: white;
            }
            .logo {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 10px;
            }
            .logo-icon {
                width: 40px;
                height: 40px;
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                font-size: 20px;
            }
            .logo-text {
                font-size: 28px;
                font-weight: bold;
            }
            .tagline {
                font-size: 14px;
                opacity: 0.9;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 24px;
                font-weight: bold;
                color: #1a202c;
                margin-bottom: 20px;
                text-align: center;
            }
            .message {
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 30px;
                text-align: center;
                line-height: 1.6;
            }
            .otp-container {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
            }
            .otp-label {
                color: white;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 15px;
                opacity: 0.9;
            }
            .otp-code {
                font-size: 36px;
                font-weight: bold;
                color: white;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
                margin: 10px 0;
            }
            .expiry-notice {
                background-color: #fed7d7;
                border: 1px solid #feb2b2;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
            }
            .expiry-icon {
                color: #e53e3e;
                margin-right: 8px;
            }
            .expiry-text {
                color: #c53030;
                font-size: 14px;
                font-weight: 500;
            }
            .security-notice {
                background-color: #f7fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .security-icon {
                color: #4a5568;
                margin-right: 8px;
            }
            .security-title {
                color: #2d3748;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 10px;
            }
            .security-list {
                color: #4a5568;
                font-size: 14px;
                line-height: 1.6;
            }
            .security-list li {
                margin-bottom: 5px;
            }
            .footer {
                background-color: #1a202c;
                color: white;
                padding: 30px;
                text-align: center;
            }
            .footer-message {
                font-size: 16px;
                margin-bottom: 20px;
                line-height: 1.5;
            }
            .divider {
                height: 1px;
                background-color: #4a5568;
                margin: 20px 0;
            }
            .social-links {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-bottom: 20px;
            }
            .social-link {
                color: #63b3ed;
                text-decoration: none;
                font-size: 14px;
            }
            .social-link:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">
                    <div class="logo-icon">🎬</div>
                    <div class="logo-text">Streamora</div>
                </div>
                <div class="tagline">Your Ultimate Streaming Experience</div>
            </div>
            
            <div class="content">
                <div class="greeting">Welcome to Streamora, ${name}! 🎉</div>
                
                <div class="message">
                    We received a request to reset your admin access credentials. To complete this process and secure your admin account, please use the verification code below.
                </div>
                
                <div class="otp-container">
                    <div class="otp-label">YOUR ADMIN RESET CODE</div>
                    <div class="otp-code">${otp}</div>
                </div>
                
                <div class="expiry-notice">
                    <span class="expiry-icon">⏰</span>
                    <span class="expiry-text">This code will expire in 10 minutes for security reasons</span>
                </div>
                
                <div class="security-notice">
                    <div class="security-title">
                        <span class="security-icon">🔒</span>
                        Security Notice
                    </div>
                    <ul class="security-list">
                        <li>Never share this code with anyone</li>
                        <li>Streamora will never ask for your verification code via phone or email</li>
                        <li>If you didn't request this admin access reset, please ignore this email</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-message">
                    Thank you for choosing Streamora!<br>
                    Keep your admin account secure and up to date.
                </div>
                
                <div class="divider"></div>
                
                <div class="social-links">
                    <a href="#" class="social-link">Help Center</a>
                    <a href="#" class="social-link">Privacy Policy</a>
                    <a href="#" class="social-link">Terms of Service</a>
                </div>
                
                <div style="margin-top: 20px; color: #718096; font-size: 12px;">
                    © 2025 Streamora. All rights reserved.<br>
                    This is an automated message, please do not reply to this email.
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send OTP email
const sendOTPEmail = async (email, name, otp, type = 'verification') => {
  try {
    console.log('Attempting to send OTP email to:', email, 'Type:', type);
    
    const transporter = createTransporter();
    
    let subject, html, text;
    
    if (type === 'password-reset') {
      subject = '🔐 Reset Your Password - Streamora';
      html = getPasswordResetOTPEmailTemplate(name, otp);
      text = `
        Password Reset Request, ${name}!
        
        Your password reset code is: ${otp}
        
        This code will expire in 10 minutes.
        
        If you didn't request this password reset, please ignore this email.
        
        Your account remains secure.
      `;
    } else if (type === 'Admin Access Reset') {
      subject = '🔐 Admin Access Reset - Streamora';
      html = getAdminResetOTPEmailTemplate(name, otp);
      text = `
        Admin Access Reset Request, ${name}!
        
        Your admin access reset code is: ${otp}
        
        This code will expire in 10 minutes.
        
        If you didn't request this admin access reset, please ignore this email.
        
        Your admin account remains secure.
      `;
    } else {
      subject = '🎬 Verify Your Email - Welcome to Streamora!';
      html = getOTPEmailTemplate(name, otp);
      text = `
        Welcome to Streamora, ${name}!
        
        Your email verification code is: ${otp}
        
        This code will expire in 10 minutes.
        
        If you didn't request this code, please ignore this email.
        
        Thank you for joining Streamora!
      `;
    }
    
    const mailOptions = {
      from: {
        name: 'Streamora Team',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: subject,
      html: html,
      text: text
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email after successful verification
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const welcomeTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white; }
              .content { padding: 40px; text-align: center; }
              .title { font-size: 28px; font-weight: bold; margin-bottom: 20px; color: #2d3748; }
              .message { font-size: 16px; color: #718096; line-height: 1.8; margin-bottom: 30px; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎉 Welcome to Streamora!</h1>
                  <p>Your account has been successfully verified</p>
              </div>
              <div class="content">
                  <div class="title">You're all set, ${name}!</div>
                  <div class="message">
                      Your email has been verified and your Streamora account is now active. 
                      You can start uploading videos, connecting with other creators, and building your audience.
                  </div>
                  <a href="#" class="cta-button">Start Creating Content</a>
                  <div style="margin-top: 30px; color: #718096; font-size: 14px;">
                      Need help getting started? Check out our creator guide and community resources.
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;
    
    const mailOptions = {
      from: {
        name: 'Streamora Team',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🎉 Welcome to Streamora - Account Verified!',
      html: welcomeTemplate
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail
};
