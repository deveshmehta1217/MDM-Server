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
router.get('/', authenticate, getAllStudents);

// @route   GET /api/students/class/:classId
// @desc    Get students by class
// @access  Private
router.get('/class/:classId', authenticate, getStudentsByClass);

// @route   POST /api/students
// @desc    Create a new student
// @access  Private
router.post('/', authenticate, createStudent);

// @route   PUT /api/students/:id
// @desc    Update a student
// @access  Private
router.put('/:id', authenticate, updateStudent);

// @route   DELETE /api/students/:id
// @desc    Delete (deactivate) a student
// @access  Private
router.delete('/:id', authenticate, deleteStudent);

// @route   POST /api/students/bulk/:classId
// @desc    Bulk upload students for specific class from Excel
// @access  Private
router.post(
  '/bulk/:classId',
  authenticate,
  upload.single('file'),
  bulkAddStudents
);

export default router;