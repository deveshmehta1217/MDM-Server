// routes/attendance.js
import express from 'express';
import {
  getTodayAttendance,
  getAttendanceByDate,
  updateAttendance,
  bulkUpdateAttendance
} from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';
import { isAssignedTeacher } from '../middleware/roleCheck.js';

const router = express.Router();

// @route   GET /api/attendance/today/:classId
// @desc    Get today's attendance for a class
// @access  Private
router.get('/today/:classId', authenticate, isAssignedTeacher, getTodayAttendance);

// @route   GET /api/attendance/:classId/:date
// @desc    Get attendance for a specific date
// @access  Private
router.get('/:classId/:date', authenticate, isAssignedTeacher, getAttendanceByDate);

// @route   PUT /api/attendance/:attendanceId
// @desc    Update attendance record
// @access  Private
router.put('/:attendanceId', authenticate, isAssignedTeacher, updateAttendance);

// @route   PUT /api/attendance/bulk
// @desc    Bulk update attendance records
// @access  Private
router.put('/bulk', authenticate, isAssignedTeacher, bulkUpdateAttendance);

export default router;