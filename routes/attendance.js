import express from 'express';
import {
    getAttendanceByClass,
    saveAttendance,
    getAttendanceStatus,
    getDailyAttendanceStatus,
} from '../controllers/attendanceController.js';
import {
    authenticateSchool,
    requireClassAccess,
    requireUnlockedClass,
    authenticateRole
} from '../middleware/auth.js';
import { requireVerification } from '../middleware/verification.js';
import reportRoutes from './reports.js';

const router = express.Router();

router.use('/report', reportRoutes);

// Legacy routes (backward compatibility)
// @route   GET /api/attendance/:date/:standard/:division
// @desc    Get attendance by class for a specific date (legacy)
// @access  Private (Requires Verification)
router.get('/:date/:standard/:division', authenticateSchool, requireVerification, getAttendanceByClass);


// @route   POST /api/attendance/save
// @desc    Create or update attendance record
// @access  Private (Requires Verification)
router.post('/save', authenticateSchool,
    requireVerification,
    authenticateRole(['PRINCIPAL', 'TEACHER']),
    requireClassAccess,
    requireUnlockedClass,
    saveAttendance
);

// @route   GET /api/attendance/status/:date
// @desc    Get daily attendance status (legacy)
// @access  Private (Requires Verification)
router.get('/status/:date', authenticateSchool, requireVerification, getDailyAttendanceStatus);

// @route   GET /api/attendance/status/:year/:month/:half
// @desc    Get attendance status for semi-monthly period
// @access  Private (Requires Verification)
router.get('/status/:year/:month/:half', authenticateSchool, requireVerification, getAttendanceStatus);


export default router;
