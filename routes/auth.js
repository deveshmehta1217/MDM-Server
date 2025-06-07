// routes/auth.js
import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticateWithSchool } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateWithSchool, getProfile);

export default router;
