// routes/registeredStudents.js
import express from 'express';
import {
    getRegisteredStudents,
    getRegisteredStudentsByClass,
    createRegisteredStudent,
    updateRegisteredStudent,
    saveRegisteredStudent
} from '../controllers/registeredStudentsController.js';
import { 
    authenticateSchool, 
    authenticateRole,
    requireClassAccess,
    requireUnlockedClass,
    authenticatePrincipal
} from '../middleware/auth.js';
import { requireVerification } from '../middleware/verification.js';

const router = express.Router();

// @route   GET /api/registered-students/:academicYear
// @desc    Get all registered students for given academic year (role-based filtering)
// @access  Private (Principal sees all, Teacher sees assigned classes)
router.get('/:academicYear', 
    authenticateSchool, 
    requireVerification, 
    authenticateRole(['PRINCIPAL', 'TEACHER']),
    getRegisteredStudents
);

// @route   GET /api/registered-students/:academicYear/:standard/:division
// @desc    Get registered students by class for given academic year
// @access  Private (Principal or assigned Teacher)
router.get('/:academicYear/:standard/:division', 
    authenticateSchool, 
    requireVerification,
    getRegisteredStudentsByClass
);

// @route   POST /api/registered-students
// @desc    Create a new registered student (Principal only)
// @access  Private (Principal only)
router.post('/', 
    authenticatePrincipal, 
    requireVerification, 
    createRegisteredStudent
);

// @route   PUT /api/registered-students/:id
// @desc    Update a registered student (Principal only)
// @access  Private (Principal only)
router.put('/:id', 
    authenticatePrincipal, 
    requireVerification, 
    updateRegisteredStudent
);

// @route   POST /api/registered-students/save
// @desc    Create or update registered student (Principal only, or Teacher for unlocked classes)
// @access  Private (Principal or Teacher with class access and unlocked class)
router.post('/save', 
    authenticateSchool, 
    requireVerification, 
    authenticateRole(['PRINCIPAL', 'TEACHER']),
    requireClassAccess,
    requireUnlockedClass,
    saveRegisteredStudent
);

export default router;
