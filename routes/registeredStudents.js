// routes/registeredStudents.js
import express from 'express';
import {
    getRegisteredStudents,
    getRegisteredStudentsByClass,
    createRegisteredStudent,
    updateRegisteredStudent,
    saveRegisteredStudent
} from '../controllers/registeredStudentsController.js';
import { authenticateSchool } from '../middleware/auth.js';
import { requireVerification } from '../middleware/verification.js';

const router = express.Router();

// @route   GET /api/registered-students/:academicYear
// @desc    Get all registered students for given academic year
// @access  Private
router.get('/:academicYear', authenticateSchool, requireVerification, getRegisteredStudents);

// @route   GET /api/registered-students/:academicYear/:standard/:division
// @desc    Get registered students by class for given academic year
// @access  Private
router.get('/:academicYear/:standard/:division', authenticateSchool, requireVerification, getRegisteredStudentsByClass);

// @route   POST /api/registered-students
// @desc    Create a new registered student
// @access  Private
router.post('/', authenticateSchool, requireVerification, createRegisteredStudent);

// @route   PUT /api/registered-students/:id
// @desc    Update a registered student
// @access  Private
router.put('/:id', authenticateSchool, requireVerification, updateRegisteredStudent);

// @route   POST /api/registered-students/save
// @desc    Create or update registered student
// @access  Private
router.post('/save', authenticateSchool, requireVerification, saveRegisteredStudent);

export default router;
