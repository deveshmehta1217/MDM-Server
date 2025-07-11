import express from 'express';
import {
  registerTeacher,
  loginTeacher,
  getPendingTeachers,
  getAllTeachers,
  approveTeacher,
  toggleTeacherStatus,
  getTeacherProfile,
  teacherForgotPassword,
  teacherResetPassword,
  teacherChangePassword
} from '../controllers/teacherController.js';
import {
  authenticatePrincipal,
  authenticateApprovedTeacher,
  authenticateRole
} from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', registerTeacher);
router.post('/login', loginTeacher);
router.post('/forgot-password', teacherForgotPassword);
router.post('/reset-password', teacherResetPassword);

// Principal only routes
router.get('/pending', authenticatePrincipal, getPendingTeachers);
router.get('/', authenticatePrincipal, getAllTeachers);
router.post('/:teacherId/approve', authenticatePrincipal, approveTeacher);
router.patch('/:teacherId/toggle-status', authenticatePrincipal, toggleTeacherStatus);

// Teacher only routes
router.get('/profile', authenticateApprovedTeacher, getTeacherProfile);
router.put('/change-password', authenticateApprovedTeacher, teacherChangePassword);

export default router;
