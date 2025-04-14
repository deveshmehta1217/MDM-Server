// routes/users.js
import express from 'express';
import multer from 'multer';
import { 
  getAllTeachers, 
  createTeacher, 
  updateTeacher, 
  deleteTeacher,
  bulkAddTeachers
} from '../controllers/userController.js';
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

// @route   GET /api/users/teachers
// @desc    Get all teachers
// @access  Private/Principal
router.get('/teachers', authenticate, getAllTeachers);

// @route   POST /api/users/teachers
// @desc    Create a new teacher
// @access  Private/Principal
router.post('/teachers', authenticate, createTeacher);

// @route   PUT /api/users/teachers/:id
// @desc    Update a teacher
// @access  Private/Principal
router.put('/teachers/:id', authenticate, updateTeacher);

// @route   DELETE /api/users/teachers/:id
// @desc    Delete a teacher
// @access  Private/Principal
router.delete('/teachers/:id', authenticate, deleteTeacher);

// @route   POST /api/users/teachers/bulk
// @desc    Bulk upload teachers from Excel
// @access  Private/Principal
router.post(
  '/teachers/bulk',
  authenticate,
  upload.single('file'),
  bulkAddTeachers
);

export default router;