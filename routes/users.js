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
import { isPrincipal } from '../middleware/roleCheck.js';

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
router.get('/teachers', authenticate, isPrincipal, getAllTeachers);

// @route   POST /api/users/teachers
// @desc    Create a new teacher
// @access  Private/Principal
router.post('/teachers', authenticate, isPrincipal, createTeacher);

// @route   PUT /api/users/teachers/:id
// @desc    Update a teacher
// @access  Private/Principal
router.put('/teachers/:id', authenticate, isPrincipal, updateTeacher);

// @route   DELETE /api/users/teachers/:id
// @desc    Delete a teacher
// @access  Private/Principal
router.delete('/teachers/:id', authenticate, isPrincipal, deleteTeacher);

// @route   POST /api/users/teachers/bulk
// @desc    Bulk upload teachers from Excel
// @access  Private/Principal
router.post(
  '/teachers/bulk',
  authenticate,
  isPrincipal,
  upload.single('file'),
  bulkAddTeachers
);

export default router;