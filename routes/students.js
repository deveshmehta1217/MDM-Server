// routes/students.js
import express from 'express';
import multer from 'multer';
import {
  getAllStudents,
  getStudentsByClass,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkAddStudents
} from '../controllers/studentController.js';
import { authenticate } from '../middleware/auth.js';
import { isPrincipal, isAssignedTeacher } from '../middleware/roleCheck.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// @route   GET /api/students
// @desc    Get all students
// @access  Private/Principal
router.get('/', authenticate, isPrincipal, getAllStudents);

// @route   GET /api/students/class/:classId
// @desc    Get students by class
// @access  Private
router.get('/class/:classId', authenticate, isAssignedTeacher, getStudentsByClass);

// @route   POST /api/students
// @desc    Create a new student
// @access  Private
router.post('/', authenticate, isAssignedTeacher, createStudent);

// @route   PUT /api/students/:id
// @desc    Update a student
// @access  Private
router.put('/:id', authenticate, isAssignedTeacher, updateStudent);

// @route   DELETE /api/students/:id
// @desc    Delete (deactivate) a student
// @access  Private
router.delete('/:id', authenticate, isAssignedTeacher, deleteStudent);

// @route   POST /api/students/bulk
// @desc    Bulk upload students from Excel
// @access  Private
router.post(
  '/bulk',
  authenticate,
  upload.single('file'),
  bulkAddStudents
);

export default router;