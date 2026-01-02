// controllers/authController.js
import User from '../models/User.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { 
      schoolSubName, 
      password, 
      mobileNo, 
      email, 
      schoolName, 
      schoolId, 
      kendraNo,
      contactPersonName,
      contactPersonMobile,
      contactPersonEmail,
      paymentScreenshot,
      isAdmin 
    } = req.body;
    
    // Validate required fields
    if (!schoolSubName || !password || !mobileNo || !email || !schoolName || !schoolId || 
        !kendraNo || !contactPersonName || !contactPersonMobile || !contactPersonEmail) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate payment screenshot if provided
    if (paymentScreenshot) {
      try {
        // Check if it's a valid base64 string
        const base64Data = paymentScreenshot.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const sizeInMB = buffer.length / (1024 * 1024);
        
        if (sizeInMB > 1) {
          return res.status(400).json({ message: 'Payment screenshot must not exceed 1MB' });
        }
        
        // Validate base64 format
        if (!paymentScreenshot.match(/^data:image\/(jpeg|jpg|png|gif);base64,/)) {
          return res.status(400).json({ message: 'Payment screenshot must be a valid image in base64 format' });
        }
      } catch (error) {
        return res.status(400).json({ message: 'Invalid payment screenshot format' });
      }
    }
    
    // Check if user already exists (by email or mobile)
    let existingUser = await User.findOne({ 
      $or: [{ email }, { mobileNo }] 
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or mobile number already exists' });
    }
    
    // Create new user
    let user = new User({
      schoolSubName,
      password,
      mobileNo,
      email,
      schoolName,
      schoolId,
      kendraNo,
      contactPersonName,
      contactPersonMobile,
      contactPersonEmail,
      paymentScreenshot,
      paymentScreenshotUploadedAt: paymentScreenshot ? new Date() : undefined,
      isAdmin: isAdmin || false
    });
    
    await user.save();
    
    // Send welcome email
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: user.email,
        subject: 'Welcome to EduMeal Tracker App- Registration Successful',
        html: getRegistrationEmailTemplate(user)
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }
    
    // Generate auth token
    const token = user.generateAuthToken();
    
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        schoolSubName: user.schoolSubName,
        mobileNo: user.mobileNo,
        email: user.email,
        schoolName: user.schoolName,
        schoolId: user.schoolId,
        kendraNo: user.kendraNo,
        contactPersonName: user.contactPersonName,
        contactPersonMobile: user.contactPersonMobile,
        contactPersonEmail: user.contactPersonEmail,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { 
      schoolSubName, 
      mobileNo, 
      email, 
      schoolName, 
      kendraNo,
      contactPersonName,
      contactPersonMobile,
      contactPersonEmail
    } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email or mobile is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }
    
    if (mobileNo && mobileNo !== user.mobileNo) {
      const existingUser = await User.findOne({ mobileNo, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Mobile number already exists' });
      }
    }
    
    // Update user fields
    if (schoolSubName) user.schoolSubName = schoolSubName;
    if (mobileNo) user.mobileNo = mobileNo;
    if (email) user.email = email;
    if (schoolName) user.schoolName = schoolName;
    if (kendraNo) user.kendraNo = kendraNo;
    if (contactPersonName) user.contactPersonName = contactPersonName;
    if (contactPersonMobile) user.contactPersonMobile = contactPersonMobile;
    if (contactPersonEmail) user.contactPersonEmail = contactPersonEmail;
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires');
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Configure nodemailer (you'll need to set up your email service)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'yahoo', // Yahoo email service
    auth: {
      user: process.env.EMAIL_USER || 'your-email@yahoo.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Email templates
const getPasswordResetEmailTemplate = (user, resetUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request - EduMeal Tracker App</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #ff6b35;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .reset-icon {
                font-size: 48px;
                color: #ff6b35;
                margin-bottom: 15px;
            }
            .reset-title {
                font-size: 24px;
                font-weight: bold;
                color: #ff6b35;
                margin-bottom: 10px;
            }
            .reset-message {
                font-size: 16px;
                color: #555;
                margin-bottom: 30px;
            }
            .info-box {
                background: #fff3e0;
                border-left: 4px solid #ff6b35;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .info-label {
                font-weight: bold;
                color: #555;
                width: 40%;
            }
            .info-value {
                color: #333;
                width: 60%;
            }
            .reset-button {
                display: inline-block;
                background:#0070e8;
                color: white;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 30px;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
                text-align: center;
                box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
                transition: all 0.3s ease;
            }
            .reset-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
            }
            .security-notice {
                background: #e8f5e8;
                border: 1px solid #4caf50;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
            }
            .security-item {
                margin: 10px 0;
                padding-left: 20px;
                position: relative;
            }
            .security-item::before {
                content: "🔒";
                position: absolute;
                left: 0;
                font-size: 14px;
            }
            .warning-box {
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .contact-info {
                background: #f1f8e9;
                border: 1px solid #8bc34a;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
            }
            .whatsapp-box {
                background: #e8f5e8;
                border: 1px solid #25d366;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                text-align: center;
            }
            .whatsapp-button {
                display: inline-block;
                background: #25d366;
                color: white;
                padding: 12px 25px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 10px;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">EduMeal Tracker</div>
            </div>
            
            <div style="text-align: center;">
                <div class="reset-icon">🔐</div>
                <div class="reset-title">Password Reset Request</div>
                <div class="reset-message">We received a request to reset your password</div>
            </div>
            
            <p>Hello <strong>${user.contactPersonName}</strong>,</p>
            
            <p>You have requested to reset your password for your EduMeal Tracker App account. If you didn't make this request, please ignore this email and your password will remain unchanged.</p>
            
            <div class="info-box">
                <h3 style="margin-top: 0; color: #ff6b35;">📋 Account Details</h3>
                <div class="info-row">
                    <span class="info-label">School Name:</span>
                    <span class="info-value">${user.schoolName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">School ID:</span>
                    <span class="info-value">${user.schoolId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${user.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Request Time:</span>
                    <span class="info-value">${new Date().toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="reset-button">
                    🔑 Reset My Password
                </a>
            </div>
            
            <div class="warning-box">
                <h4 style="margin-top: 0; color: #856404;">⚠️ Important Security Notice</h4>
                <p style="margin-bottom: 0; font-weight: bold;">This link will expire in 1 hour for your security.</p>
            </div>
            
            <div class="security-notice">
                <h4 style="margin-top: 0; color: #2e7d32;">🛡️ Security Tips</h4>
                <div class="security-item">Choose a strong password with at least 8 characters</div>
                <div class="security-item">Include uppercase, lowercase, numbers, and special characters</div>
                <div class="security-item">Don't reuse passwords from other accounts</div>
                <div class="security-item">Keep your password confidential and secure</div>
            </div>
            
            <div class="contact-info">
                <h4 style="margin-top: 0; color: #689f38;">📞 Need Help?</h4>
                <p style="margin-bottom: 0;">If you're having trouble with the password reset or didn't request this change, please contact our support team immediately. We're here to help keep your account secure.</p>
            </div>
            
            <div class="footer">
                <p><strong>EduMeal Tracker App Security Team</strong></p>
                <p style="font-size: 12px; color: #999;">
                    This is an automated security email. Please do not reply to this message.<br>
                    If you didn't request this password reset, please contact support immediately.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

const getRegistrationEmailTemplate = (user) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to EduMeal Tracker App</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .welcome-text {
                font-size: 24px;
                color: #2c3e50;
                margin-bottom: 20px;
            }
            .info-box {
                background: #f8f9fa;
                border-left: 4px solid #007bff;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .info-label {
                font-weight: bold;
                color: #555;
                width: 40%;
            }
            .info-value {
                color: #333;
                width: 60%;
            }
            .status-badge {
                display: inline-block;
                padding: 8px 16px;
                background: #ffc107;
                color: #856404;
                border-radius: 20px;
                font-weight: bold;
                font-size: 14px;
            }
            .next-steps {
                background: #e3f2fd;
                border: 1px solid #2196f3;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
            }
            .step {
                margin: 10px 0;
                padding-left: 20px;
                position: relative;
            }
            .step::before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #4caf50;
                font-weight: bold;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .contact-info {
                background: #f1f8e9;
                border: 1px solid #8bc34a;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">EduMeal Tracker System</div>
            </div>
            
            <h2 class="welcome-text">Welcome to EduMeal Tracker App!</h2>
            
            <p>Dear <strong>${user.contactPersonName}</strong>,</p>
            
            <p>Thank you for registering with the Mid Day Meal Management System. Your account has been successfully created and is currently pending verification.</p>
            
            <div class="info-box">
                <h3 style="margin-top: 0; color: #007bff;">📋 Registration Details</h3>
                <div class="info-row">
                    <span class="info-label">School Name:</span>
                    <span class="info-value">${user.schoolName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">School Sub Name:</span>
                    <span class="info-value">${user.schoolSubName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">School ID:</span>
                    <span class="info-value">${user.schoolId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Kendra Number:</span>
                    <span class="info-value">${user.kendraNo}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Contact Person:</span>
                    <span class="info-value">${user.contactPersonName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${user.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Mobile:</span>
                    <span class="info-value">${user.mobileNo}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Registration Date:</span>
                    <span class="info-value">${new Date(user.createdAt).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Account Status:</span>
                    <span class="info-value"><span class="status-badge">⏳ Pending Verification</span></span>
                </div>
            </div>
            
            <div class="next-steps">
                <h3 style="margin-top: 0; color: #1976d2;">🚀 What's Next?</h3>
                <div class="step">Your registration details are being reviewed by our admin team</div>
                <div class="step">You will receive a verification email once your account is approved</div>
                <div class="step">After verification, you can access all EduMeal Tracker App features</div>
                <div class="step">You can login anytime to check your verification status</div>
            </div>
            
            ${process.env.WHATSAPP_REGISTRATION_GROUP_LINK ? `
            <div class="whatsapp-box">
                <h4 style="margin-top: 0; color: #25d366;">💬 Join Our Community</h4>
                <p style="margin-bottom: 15px;">Connect with other schools and get instant support by joining our WhatsApp group!</p>
                <a href="${process.env.WHATSAPP_REGISTRATION_GROUP_LINK}" class="whatsapp-button">
                    📱 Join WhatsApp Group
                </a>
            </div>
            ` : ''}
            
            <div class="contact-info">
                <h4 style="margin-top: 0; color: #689f38;">📞 Need Help?</h4>
                <p style="margin-bottom: 0;">If you have any questions or need assistance, please contact our support team. We're here to help you get started with the EduMeal Tracker App.</p>
            </div>
            
            <div class="footer">
                <p><strong>EduMeal Tracker App Developer Team</strong></p>
                <p style="font-size: 12px; color: #999;">
                    This is an automated email. Please do not reply to this message.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

const getVerificationEmailTemplate = (user, isVerified = true) => {
  const statusColor = isVerified ? '#4caf50' : '#f44336';
  const statusIcon = isVerified ? '✅' : '❌';
  const statusText = isVerified ? 'VERIFIED' : 'VERIFICATION REVOKED';
  const statusMessage = isVerified 
    ? 'Congratulations! Your account has been successfully verified.' 
    : 'Your account verification has been revoked.';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account ${isVerified ? 'Verified' : 'Verification Revoked'} - EduMeal Tracker App</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid ${statusColor};
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .status-header {
                text-align: center;
                margin-bottom: 30px;
            }
            .status-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            .status-title {
                font-size: 28px;
                font-weight: bold;
                color: ${statusColor};
                margin-bottom: 10px;
            }
            .status-message {
                font-size: 18px;
                color: #555;
            }
            .info-box {
                background: #f8f9fa;
                border-left: 4px solid ${statusColor};
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .info-label {
                font-weight: bold;
                color: #555;
                width: 40%;
            }
            .info-value {
                color: #333;
                width: 60%;
            }
            .status-badge {
                display: inline-block;
                padding: 8px 16px;
                background: ${statusColor};
                color: white;
                border-radius: 20px;
                font-weight: bold;
                font-size: 14px;
            }
            .features-box {
                background: ${isVerified ? '#e8f5e8' : '#ffebee'};
                border: 1px solid ${statusColor};
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
            }
            .feature {
                margin: 10px 0;
                padding-left: 20px;
                position: relative;
            }
            .feature::before {
                content: "${isVerified ? '✓' : '✗'}";
                position: absolute;
                left: 0;
                color: ${statusColor};
                font-weight: bold;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .login-button {
                display: inline-block;
                background: ${statusColor};
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 20px 0;
                text-align: center;
            }
            .whatsapp-box {
                background: #e8f5e8;
                border: 1px solid #25d366;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                text-align: center;
            }
            .whatsapp-button {
                display: inline-block;
                background: #25d366;
                color: white;
                padding: 12px 25px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 10px;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">EduMeal Tracker App</div>
            </div>
            
            <div class="status-header">
                <div class="status-icon">${statusIcon}</div>
                <div class="status-title">${statusText}</div>
                <div class="status-message">${statusMessage}</div>
            </div>
            
            <p>Dear <strong>${user.contactPersonName}</strong>,</p>
            
            <p>${isVerified 
              ? 'We are pleased to inform you that your EduMeal Tracker App account has been verified and approved by our admin team. You now have full access to all system features.'
              : 'We regret to inform you that your EduMeal Tracker App account verification has been revoked. Please contact our admin team for more information.'
            }</p>
            
            <div class="info-box">
                <h3 style="margin-top: 0; color: ${statusColor};">📋 Account Information</h3>
                <div class="info-row">
                    <span class="info-label">School Name:</span>
                    <span class="info-value">${user.schoolName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">School ID:</span>
                    <span class="info-value">${user.schoolId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Contact Person:</span>
                    <span class="info-value">${user.contactPersonName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${user.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Verification Date:</span>
                    <span class="info-value">${user.verifiedAt ? new Date(user.verifiedAt).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Account Status:</span>
                    <span class="info-value"><span class="status-badge">${statusIcon} ${statusText}</span></span>
                </div>
            </div>
            
            ${isVerified ? `
            <div class="features-box">
                <h3 style="margin-top: 0; color: #2e7d32;">🎉 You Can Now Access:</h3>
                <div class="feature">Create and manage daily attendance records</div>
                <div class="feature">Generate attendance reports and Excel files</div>
                <div class="feature">View semi-monthly attendance data</div>
                <div class="feature">Update student registration information</div>
                <div class="feature">Access all EduMeal Tracker App features</div>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="login-button">
                    🚀 Login to EduMeal Tracker App
                </a>
            </div>
            ` : `
            <div class="features-box">
                <h3 style="margin-top: 0; color: #c62828;">⚠️ Access Restrictions:</h3>
                <div class="feature">Cannot create attendance records</div>
                <div class="feature">Cannot generate reports</div>
                <div class="feature">Limited access to system features</div>
                <div class="feature">Contact admin for re-verification</div>
            </div>
            `}
            
            ${isVerified && process.env.WHATSAPP_VERIFICATION_GROUP_LINK ? `
            <div class="whatsapp-box">
                <h4 style="margin-top: 0; color: #25d366;">🎉 Welcome to Our Verified Community!</h4>
                <p style="margin-bottom: 15px;">Join our exclusive WhatsApp group for verified schools to get advanced support, share best practices, and connect with other verified institutions!</p>
                <a href="${process.env.WHATSAPP_VERIFICATION_GROUP_LINK}" class="whatsapp-button">
                    📱 Join Verified Schools Group
                </a>
            </div>
            ` : ''}
            
            <div style="background: #f1f8e9; border: 1px solid #8bc34a; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #689f38;">📞 Need Support?</h4>
                <p style="margin-bottom: 0;">
                    ${isVerified 
                      ? 'If you have any questions about using the EduMeal Tracker App, please don\'t hesitate to contact our support team.'
                      : 'If you believe this is an error or need clarification, please contact our admin team immediately.'
                    }
                </p>
            </div>
            
            <div class="footer">
                <p><strong>EduMeal Tracker App Developer Team</strong></p>
                <p style="font-size: 12px; color: #999;">
                    This is an automated email. Please do not reply to this message.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set reset token and expiry (1 hour)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: user.email,
      subject: 'Password Reset Request - EduMeal Tracker App',
      html: getPasswordResetEmailTemplate(user, resetUrl)
    };
    
    // Send email
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Update password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only admin can verify users
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update verification status
    user.isVerified = true;
    user.verifiedAt = new Date();
    
    await user.save();
    
    // Send verification email
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: user.email,
        subject: '🎉 Account Verified - EduMeal Tracker App',
        html: getVerificationEmailTemplate(user, true)
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the verification if email fails
    }
    
    res.json({ 
      message: 'User verified successfully',
      user: {
        _id: user._id,
        schoolSubName: user.schoolSubName,
        email: user.email,
        schoolName: user.schoolName,
        schoolId: user.schoolId,
        isVerified: user.isVerified,
        verifiedAt: user.verifiedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const unverifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only admin can unverify users
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update verification status
    user.isVerified = false;
    user.verifiedAt = undefined;
    
    await user.save();
    
    // Send unverification email
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: user.email,
        subject: '⚠️ Account Verification Revoked - EduMeal Tracker App',
        html: getVerificationEmailTemplate(user, false)
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Unverification email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('Failed to send unverification email:', emailError);
      // Don't fail the unverification if email fails
    }
    
    res.json({ 
      message: 'User verification revoked successfully',
      user: {
        _id: user._id,
        schoolSubName: user.schoolSubName,
        email: user.email,
        schoolName: user.schoolName,
        schoolId: user.schoolId,
        isVerified: user.isVerified,
        verifiedAt: user.verifiedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findOne({ schoolId: req.schoolId }).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const validityPeriod = parseInt(process.env.VERIFICATION_VALIDITY_YEARS || '1');
    
    res.json({
      isVerified: user.isVerified,
      verifiedAt: user.verifiedAt,
      isVerificationValid: user.isVerificationValid(),
      validityPeriodYears: validityPeriod,
      verificationExpiry: user.verifiedAt ? 
        new Date(user.verifiedAt.getTime() + (validityPeriod * 365 * 24 * 60 * 60 * 1000)) : 
        null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Only admin can get all users
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const { page = 1, limit = 10, verified, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    if (verified !== undefined) {
      query.isVerified = verified === 'true';
    }
    
    if (search) {
      query.$or = [
        { schoolSubName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { schoolName: { $regex: search, $options: 'i' } },
        { schoolId: { $regex: search, $options: 'i' } },
        { kendraNo: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    // Add verification validity to each user
    const usersWithStatus = users.map(user => ({
      ...user.toObject(),
      isVerificationValid: user.isVerificationValid()
    }));
    
    res.json({
      users: usersWithStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deletePaymentScreenshot = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only admin can delete payment screenshots
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.paymentScreenshot) {
      return res.status(400).json({ message: 'No payment screenshot found for this user' });
    }
    
    // Remove payment screenshot and upload timestamp
    user.paymentScreenshot = undefined;
    user.paymentScreenshotUploadedAt = undefined;
    
    await user.save();
    
    res.json({ 
      message: 'Payment screenshot deleted successfully',
      user: {
        _id: user._id,
        schoolSubName: user.schoolSubName,
        email: user.email,
        schoolName: user.schoolName,
        schoolId: user.schoolId,
        paymentScreenshot: user.paymentScreenshot,
        paymentScreenshotUploadedAt: user.paymentScreenshotUploadedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getPaymentScreenshot = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only admin can view payment screenshots
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const user = await User.findById(userId).select('schoolSubName email schoolName schoolId paymentScreenshot paymentScreenshotUploadedAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.paymentScreenshot) {
      return res.status(404).json({ message: 'No payment screenshot found for this user' });
    }
    
    res.json({
      user: {
        _id: user._id,
        schoolSubName: user.schoolSubName,
        email: user.email,
        schoolName: user.schoolName,
        schoolId: user.schoolId,
        paymentScreenshot: user.paymentScreenshot,
        paymentScreenshotUploadedAt: user.paymentScreenshotUploadedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Enhanced login to include role information
export const enhancedLogin = async (req, res) => {
  try {
    const { schoolId, password } = req.body;
    
    // Find user by schoolId
    const user = await User.findOne({ schoolId });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate auth token with role information
    const token = jwt.sign({ 
      id: user._id, 
      schoolId: user.schoolId, 
      role: 'PRINCIPAL',
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      isVerificationValid: user.isVerificationValid()
    }, process.env.JWT_SECRET || 'mdm-secret-key', {
      expiresIn: '1d'
    });
    
    res.json({
      token,
      user: {
        _id: user._id,
        schoolSubName: user.schoolSubName,
        mobileNo: user.mobileNo,
        email: user.email,
        schoolName: user.schoolName,
        schoolId: user.schoolId,
        kendraNo: user.kendraNo,
        contactPersonName: user.contactPersonName,
        contactPersonMobile: user.contactPersonMobile,
        contactPersonEmail: user.contactPersonEmail,
        role: 'PRINCIPAL',
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
