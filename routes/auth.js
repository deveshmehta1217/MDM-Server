// routes/auth.js
import express from 'express';
import { 
  register, 
  getProfile, 
  updateProfile, 
  changePassword, 
  forgotPassword, 
  resetPassword,
  verifyUser,
  unverifyUser,
  getVerificationStatus,
  getAllUsers,
  deletePaymentScreenshot,
  getPaymentScreenshot,
  enhancedLogin
} from '../controllers/authController.js';
import { loginTeacher } from '../controllers/teacherController.js';
import { authenticateWithSchool, requireAdmin } from '../middleware/auth.js';
import { checkVerificationStatus, requireVerification } from '../middleware/verification.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/principal/login
// @desc    Enhanced principal login with role information
// @access  Public
router.post('/principal/login', enhancedLogin);

// @route   POST /api/auth/teacher/login
// @desc    Teacher login
// @access  Public
router.post('/teacher/login', loginTeacher);

// @route   GET /api/auth/profile
// @desc    Get current user profile (allowed without verification)
// @access  Private
router.get('/profile', authenticateWithSchool, checkVerificationStatus, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile (allowed without verification)
// @access  Private
router.put('/profile', authenticateWithSchool, requireVerification, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password (allowed without verification)
// @access  Private
router.put('/change-password', authenticateWithSchool, requireVerification, changePassword);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', resetPassword);

// @route   GET /api/auth/verification-status
// @desc    Get user verification status
// @access  Private
router.get('/verification-status', authenticateWithSchool, getVerificationStatus);

// @route   POST /api/auth/verify/:userId
// @desc    Verify a user (Admin only)
// @access  Private
router.post('/verify/:userId', authenticateWithSchool, requireAdmin, verifyUser);

// @route   POST /api/auth/unverify/:userId
// @desc    Unverify a user (Admin only)
// @access  Private
router.post('/unverify/:userId', authenticateWithSchool, requireAdmin, unverifyUser);

// @route   GET /api/auth/users
// @desc    Get all users with pagination and filtering (Admin only)
// @access  Private
router.get('/users', authenticateWithSchool, requireAdmin, getAllUsers);

// @route   GET /api/auth/payment-screenshot/:userId
// @desc    Get payment screenshot for a user (Admin only)
// @access  Private
router.get('/payment-screenshot/:userId', authenticateWithSchool, requireAdmin, getPaymentScreenshot);

// @route   DELETE /api/auth/payment-screenshot/:userId
// @desc    Delete payment screenshot for a user after verification (Admin only)
// @access  Private
router.delete('/payment-screenshot/:userId', authenticateWithSchool, requireAdmin, deletePaymentScreenshot);

export default router;
