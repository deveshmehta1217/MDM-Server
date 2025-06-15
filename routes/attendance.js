import express from 'express';
import {
    getAttendance,
    getAttendanceByClass,
    createAttendance,
    updateAttendance,
    saveAttendance,
    getDailyReport,
    getSemiMonthlyReport,
    downloadDailyReportExcel,
    downloadDailyAlpaharReportExcel,
    downloadSemiMonthlyReportExcel,
    downloadSemiMonthlyAlpaharReportExcel,
    getSemiMonthlyReportData,
    getDailyReportData,
    getAttendanceStatus,
    getDailyAttendanceStatus,
} from '../controllers/attendanceController.js';
import {
    takeAttendance,
    getEnhancedDailyAttendanceStatus,
    getAttendanceByTypeAndClass,
    getEnhancedAttendance,
    saveEnhancedAttendance
} from '../controllers/attendanceRBACController.js';
import {
    authenticateSchool,
    authenticateAdmin,
    requireClassAccess,
    requireUnlockedClass,
    authenticateRole
} from '../middleware/auth.js';
import { requireVerification } from '../middleware/verification.js';

const router = express.Router();

// @route   GET /api/attendance/report/daily/:date
// @desc    Get daily attendance report
// @access  Private (Requires Verification)
router.get('/report/daily/:date', authenticateSchool, requireVerification, getDailyReport);
router.get('/report/excel/daily/mdm/:date', authenticateSchool, requireVerification, downloadDailyReportExcel);
router.get('/report/excel/daily/alpahar/:date', authenticateSchool, requireVerification, downloadDailyAlpaharReportExcel);
router.get('/report/data/daily/:date', authenticateSchool, requireVerification, getDailyReportData);

// @route   GET /api/attendance/report/semi-monthly/:year/:month/:half
// @desc    Get semi-monthly attendance report (half: 1 or 2)
// @access  Private (Requires Verification)
router.get('/report/semi-monthly/:year/:month/:half', authenticateSchool, requireVerification, getSemiMonthlyReport);
router.get('/report/excel/semi-monthly/mdm/:year/:month/:half', authenticateSchool, requireVerification, downloadSemiMonthlyReportExcel);
router.get('/report/excel/semi-monthly/alpahar/:year/:month/:half', authenticateSchool, requireVerification, downloadSemiMonthlyAlpaharReportExcel);
router.get('/report/data/semi-monthly/:year/:month/:half', authenticateSchool, requireVerification, getSemiMonthlyReportData);

// Enhanced RBAC routes for dual attendance system

// @route   POST /api/attendance/take
// @desc    Take attendance (ALPAHAR or MDM) with RBAC
// @access  Private (Principal or assigned Teacher)
router.post('/take', 
    authenticateSchool, 
    requireVerification,
    authenticateRole(['PRINCIPAL', 'TEACHER']),
    requireClassAccess,
    requireUnlockedClass,
    takeAttendance
);

// @route   GET /api/attendance/daily-status/:date
// @desc    Get enhanced daily attendance status with role-based filtering
// @access  Private (Principal or Teacher - filtered by assigned classes)
router.get('/daily-status/:date',
    authenticateSchool,
    requireVerification,
    authenticateRole(['PRINCIPAL', 'TEACHER']),
    getEnhancedDailyAttendanceStatus
);

// @route   GET /api/attendance/:date/:attendanceType/:standard/:division
// @desc    Get attendance by type and class (ALPAHAR or MDM)
// @access  Private (Principal or assigned Teacher)
router.get('/:date/:attendanceType/:standard/:division',
    authenticateSchool,
    requireVerification,
    authenticateRole(['PRINCIPAL', 'TEACHER']),
    requireClassAccess,
    getAttendanceByTypeAndClass
);

// @route   GET /api/attendance/:date
// @desc    Get all attendance for a specific date with role-based filtering
// @access  Private (Principal sees all, Teacher sees assigned classes)
router.get('/:date', 
    authenticateSchool, 
    requireVerification,
    authenticateRole(['PRINCIPAL', 'TEACHER']),
    getEnhancedAttendance
);

// @route   POST /api/attendance/save-enhanced
// @desc    Enhanced save attendance with RBAC support
// @access  Private (Principal or assigned Teacher)
router.post('/save-enhanced',
    authenticateSchool,
    requireVerification,
    authenticateRole(['PRINCIPAL', 'TEACHER']),
    requireClassAccess,
    requireUnlockedClass,
    saveEnhancedAttendance
);

// Legacy routes (backward compatibility)
// @route   GET /api/attendance/:date/:standard/:division
// @desc    Get attendance by class for a specific date (legacy)
// @access  Private (Requires Verification)
router.get('/:date/:standard/:division', authenticateSchool, requireVerification, getAttendanceByClass);

// @route   GET /api/attendance/status/:date
// @desc    Get daily attendance status (legacy)
// @access  Private (Requires Verification)
router.get('/status/:date', authenticateSchool, requireVerification, getDailyAttendanceStatus);

// @route   GET /api/attendance/status/:year/:month/:half
// @desc    Get attendance status for semi-monthly period
// @access  Private (Requires Verification)
router.get('/status/:year/:month/:half', authenticateSchool, requireVerification, getAttendanceStatus);

// @route   POST /api/attendance
// @desc    Create a new attendance record
// @access  Private (Requires Verification)
router.post('/', authenticateSchool, requireVerification, createAttendance);

// @route   PUT /api/attendance/:id
// @desc    Update an attendance record
// @access  Private (Requires Verification)
router.put('/:id', authenticateSchool, requireVerification, updateAttendance);

// @route   POST /api/attendance/save
// @desc    Create or update attendance record
// @access  Private (Requires Verification)
router.post('/save', authenticateSchool, requireVerification, saveAttendance);

export default router;
