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
    downloadSemiMonthlyReportExcel,
    getSemiMonthlyReportData,
    getDailyReportData,
    getAttendanceStatus,
    getDailyAttendanceStatus,
} from '../controllers/attendanceController.js';
import { authenticateSchool } from '../middleware/auth.js';
import { requireVerification } from '../middleware/verification.js';

const router = express.Router();

// @route   GET /api/attendance/report/daily/:date
// @desc    Get daily attendance report
// @access  Private (Requires Verification)
router.get('/report/daily/:date', authenticateSchool, requireVerification, getDailyReport);
router.get('/report/excel/daily/:date', authenticateSchool, requireVerification, downloadDailyReportExcel);
router.get('/report/data/daily/:date', authenticateSchool, requireVerification, getDailyReportData);

// @route   GET /api/attendance/report/semi-monthly/:year/:month/:half
// @desc    Get semi-monthly attendance report (half: 1 or 2)
// @access  Private (Requires Verification)
router.get('/report/semi-monthly/:year/:month/:half', authenticateSchool, requireVerification, getSemiMonthlyReport);
router.get('/report/excel/semi-monthly/:year/:month/:half', authenticateSchool, requireVerification, downloadSemiMonthlyReportExcel);
router.get('/report/data/semi-monthly/:year/:month/:half', authenticateSchool, requireVerification, getSemiMonthlyReportData);

// @route   GET /api/attendance/:date
// @desc    Get all attendance for a specific date
// @access  Private (Requires Verification)
router.get('/:date', authenticateSchool, requireVerification, getAttendance);

// @route   GET /api/attendance/:date/:standard/:division
// @desc    Get attendance by class for a specific date
// @access  Private (Requires Verification)
router.get('/:date/:standard/:division', authenticateSchool, requireVerification, getAttendanceByClass);

// @route   GET /api/attendance/status/:date
// @desc    Get daily attendance status
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
