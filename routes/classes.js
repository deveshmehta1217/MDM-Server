import express from 'express';
import {
  bulkAssignClasses,
  bulkRemoveClassAssignments,
  getTeacherClassAssignments,
  bulkLockUnlockClasses,
  getClassLockStatus,
  getClassAssignmentsOverview,
  removeClassAssignment,
  getClassTeachers
} from '../controllers/classController.js';
import {
  authenticateAdmin,
  authenticateSchool,
  authenticateRole
} from '../middleware/auth.js';

const router = express.Router();

// Principal only routes
router.post('/assign-bulk', authenticateAdmin, bulkAssignClasses);
router.delete('/assign-bulk', authenticateAdmin, bulkRemoveClassAssignments);
router.post('/lock-bulk', authenticateAdmin, bulkLockUnlockClasses);
router.get('/overview', authenticateAdmin, getClassAssignmentsOverview);
router.delete('/assignment/:assignmentId', authenticateAdmin, removeClassAssignment);

// Routes accessible by both principal and teachers
router.get('/teacher/:teacherId/assignments', authenticateSchool, getTeacherClassAssignments);
router.get('/lock-status', authenticateSchool, getClassLockStatus);
router.get('/:standard/:division/teachers', authenticateSchool, getClassTeachers);

export default router;
