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
  authenticatePrincipal,
  authenticateSchool,
  authenticateRole
} from '../middleware/auth.js';

const router = express.Router();

// Principal only routes
router.post('/assign-bulk', authenticatePrincipal, bulkAssignClasses);
router.delete('/assign-bulk', authenticatePrincipal, bulkRemoveClassAssignments);
router.post('/lock-bulk', authenticatePrincipal, bulkLockUnlockClasses);
router.get('/overview', authenticatePrincipal, getClassAssignmentsOverview);
router.delete('/assignment/:assignmentId', authenticatePrincipal, removeClassAssignment);

// Routes accessible by both principal and teachers
router.get('/teacher/:teacherId/assignments', authenticateSchool, getTeacherClassAssignments);
router.get('/lock-status', authenticateSchool, getClassLockStatus);
router.get('/:standard/:division/teachers', authenticateSchool, getClassTeachers);

export default router;
