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
    getAttendanceStatus,
    getDailyAttendanceStatus,
} from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/attendance/report/daily/:date
// @desc    Get daily attendance report
// @access  Private
router.get('/report/daily/:date', authenticate, getDailyReport);
router.get('/report/excel/daily/:date', authenticate, downloadDailyReportExcel);

// @route   GET /api/attendance/report/semi-monthly/:year/:month/:half
// @desc    Get semi-monthly attendance report (half: 1 or 2)
// @access  Private
router.get('/report/semi-monthly/:year/:month/:half', authenticate, getSemiMonthlyReport);
router.get('/report/excel/semi-monthly/:year/:month/:half', authenticate, downloadSemiMonthlyReportExcel);

// @route   GET /api/attendance/:date
// @desc    Get all attendance for a specific date
// @access  Private
router.get('/:date', authenticate, getAttendance);

// @route   GET /api/attendance/:date/:standard/:division
// @desc    Get attendance by class for a specific date
// @access  Private
router.get('/:date/:standard/:division', authenticate, getAttendanceByClass);

// @route   GET /api/attendance/:date/:standard/:division
// @desc    Get attendance by class for a specific date
// @access  Private
router.get('/status/:date', authenticate, getDailyAttendanceStatus);

// @route   GET /api/attendance/:date/:standard/:division
// @desc    Get attendance by class for a specific date
// @access  Private
router.get('/status/:year/:month/:half', authenticate, getAttendanceStatus);

// @route   POST /api/attendance
// @desc    Create a new attendance record
// @access  Private
router.post('/', authenticate, createAttendance);

// @route   PUT /api/attendance/:id
// @desc    Update an attendance record
// @access  Private
router.put('/:id', authenticate, updateAttendance);

// @route   POST /api/attendance/save
// @desc    Create or update attendance record
// @access  Private
router.post('/save', authenticate, saveAttendance);

export default router;
