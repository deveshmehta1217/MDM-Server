// controllers/authController.js
import User from '../models/User.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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
      isAdmin 
    } = req.body;
    
    // Validate required fields
    if (!schoolSubName || !password || !mobileNo || !email || !schoolName || !schoolId || 
        !kendraNo || !contactPersonName || !contactPersonMobile || !contactPersonEmail) {
      return res.status(400).json({ message: 'All fields are required' });
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
      isAdmin: isAdmin || false
    });
    
    await user.save();
    
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

export const login = async (req, res) => {
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
    
    // Generate auth token
    const token = user.generateAuthToken();
    
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
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
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
    service: 'gmail', // or your email service
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
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
      subject: 'Password Reset Request - MDM System',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.schoolName},</p>
        <p>You have requested to reset your password for the MDM System.</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <br>
        <p>Best regards,<br>MDM System Team</p>
      `
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
    const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires');
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
