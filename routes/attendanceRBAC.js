import express from 'express';
import {
    getAttendance,
    getAttendanceByClass,
    createAttendance,
    updateAttendance,
    saveAttendance,
    getDailyReport,
    getSemiMonthlyReport,
    downloadDailyReportExcel,
    downloadSemiMonthlyReportExcel,
    getSemiMonthlyReportData,
    getDailyReportData,
    getAttendanceStatus,
    getDailyAttendanceStatus,
} from '../controllers/attendanceController.js';
import {
    authenticateSchool,
    authenticatePrincipal,
    authenticateApprovedTeacher,
    requireClassAccess,
    requireUnlockedClass,
    authenticateRole
} from '../middleware/auth.js';
import { requireVerification } from '../middleware/verification.js';

const router = express.Router();

// Enhanced attendance taking endpoint with RBAC
router.post('/take', 
    authenticateSchool, 
    requireVerification,
    authenticateRole(['PRINCIPAL', 'TEACHER']),
    requireClassAccess,
    requireUnlockedClass,
    async (req, res) => {
        try {
            const { standard, division, date, attendanceType, registeredStudents, presentStudents, mealTakenStudents } = req.body;
            
            // Validate attendance type
            if (!['ALPAHAR', 'MDM'].includes(attendanceType)) {
                return res.status(400).json({ message: 'Invalid attendance type. Use ALPAHAR or MDM' });
            }
            
            // Determine who is taking attendance
            const userRole = req.user?.role;
            const takenBy = req.user.id;
            const takenByRole = userRole;
            
            // Create attendance record with enhanced data
            const attendanceData = {
                schoolId: req.schoolId,
                standard: parseInt(standard),
                division,
                date: new Date(date).toISOString().split('T')[0],
                attendanceType,
                registeredStudents,
                presentStudents,
                mealTakenStudents,
                takenBy,
                takenByRole,
                takenAt: new Date()
            };
            
            // Use existing saveAttendance logic but with enhanced data
            const { default: Attendance } = await import('../models/Attendace.js');
            
            const attendance = await Attendance.findOneAndUpdate(
                {
                    schoolId: req.schoolId,
                    standard: parseInt(standard),
                    division,
                    date: attendanceData.date,
                    attendanceType
                },
                attendanceData,
                {
                    new: true,
                    upsert: true
                }
            );
            
            res.json({
                success: true,
                message: `${attendanceType} attendance recorded successfully`,
                attendanceId: attendance._id,
                attendance
            });
        } catch (error) {
            console.error('Take attendance error:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// Enhanced daily attendance status with role-based filtering
router.get('/daily-status/:date',
    authenticateSchool,
    requireVerification,
    authenticateRole(['PRINCIPAL', 'TEACHER']),
    async (req, res) => {
        try {
            const { date } = req.params;
            const userRole = req.user?.role;
            
            if (!date || isNaN(Date.parse(date))) {
                return res.status(400).json({ message: 'Invalid or missing date parameter' });
            }

            const dateObj = new Date(date);
            const y = dateObj.getFullYear();
            const m = dateObj.getMonth();
            const startOfDay = new Date(y, m, dateObj.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(y, m, dateObj.getDate(), 23, 59, 59, 999);
            const dateStr = startOfDay.toISOString().split('T')[0];

            const academicYear = m < 5 ? `${y - 1}-${y}` : `${y}-${y + 1}`;
            
            // Get registered classes
            const { default: RegisteredStudent } = await import('../models/RegisteredStudents.js');
            let registeredClasses = await RegisteredStudent.find({ 
                academicYear,
                schoolId: req.schoolId 
            });

            // Filter classes based on user role
            if (userRole === 'TEACHER') {
                const { default: TeacherClassAssignment } = await import('../models/TeacherClassAssignment.js');
                const assignments = await TeacherClassAssignment.find({
                    teacherId: req.user.id,
                    schoolId: req.schoolId
                });
                
                const assignedClassKeys = assignments.map(a => `${a.standard}-${a.division}`);
                registeredClasses = registeredClasses.filter(rc => 
                    assignedClassKeys.includes(`${rc.standard}-${rc.division}`)
                );
            }

            // Get attendance records for both types
            const { default: Attendance } = await import('../models/Attendace.js');
            const attendanceDocs = await Attendance.find({
                date: { $gte: startOfDay, $lte: endOfDay },
                schoolId: req.schoolId
            }).select('standard division attendanceType takenBy takenByRole takenAt');

            // Create attendance maps
            const alpaharMap = new Set();
            const mdmMap = new Set();
            const teacherMap = new Map();

            attendanceDocs.forEach(doc => {
                const key = `${doc.standard}-${doc.division}`;
                if (doc.attendanceType === 'ALPAHAR') {
                    alpaharMap.add(key);
                } else if (doc.attendanceType === 'MDM') {
                    mdmMap.add(key);
                }
                
                // Store teacher info
                if (doc.takenByRole === 'TEACHER') {
                    teacherMap.set(`${key}-${doc.attendanceType}`, {
                        takenBy: doc.takenBy,
                        takenAt: doc.takenAt
                    });
                }
            });

            // Get teacher names for display
            const { default: Teacher } = await import('../models/Teacher.js');
            const teacherIds = Array.from(teacherMap.values()).map(t => t.takenBy);
            const teachers = await Teacher.find({ _id: { $in: teacherIds } }).select('name');
            const teacherNameMap = new Map(teachers.map(t => [t._id.toString(), t.name]));

            // Build response
            const attendanceRecords = registeredClasses.map(({ standard, division }) => {
                const key = `${standard}-${division}`;
                const alpaharInfo = teacherMap.get(`${key}-ALPAHAR`);
                const mdmInfo = teacherMap.get(`${key}-MDM`);
                
                return {
                    standard,
                    division,
                    alpaharTaken: alpaharMap.has(key),
                    mdmTaken: mdmMap.has(key),
                    alpaharTakenBy: alpaharInfo ? teacherNameMap.get(alpaharInfo.takenBy.toString()) : null,
                    mdmTakenBy: mdmInfo ? teacherNameMap.get(mdmInfo.takenBy.toString()) : null,
                    alpaharTakenAt: alpaharInfo ? alpaharInfo.takenAt : null,
                    mdmTakenAt: mdmInfo ? mdmInfo.takenAt : null
                };
            });

            const registeredClassesList = registeredClasses.map(({ standard, division }) => ({
                standard,
                division
            }));

            res.json({
                success: true,
                date: dateStr,
                registeredClasses: registeredClassesList,
                status: {
                    date: dateStr,
                    attendance: attendanceRecords
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Get attendance by type and class (role-based access)
router.get('/:date/:attendanceType/:standard/:division',
    authenticateSchool,
    requireVerification,
    authenticateRole(['PRINCIPAL', 'TEACHER']),
    requireClassAccess,
    async (req, res) => {
        try {
            const { date, attendanceType, standard, division } = req.params;
            
            if (!['ALPAHAR', 'MDM'].includes(attendanceType)) {
                return res.status(400).json({ message: 'Invalid attendance type' });
            }
            
            const formattedDate = new Date(date).toISOString().split('T')[0];
            
            const { default: Attendance } = await import('../models/Attendace.js');
            const attendance = await Attendance.findOne({
                standard: parseInt(standard),
                division,
                date: formattedDate,
                attendanceType,
                schoolId: req.schoolId
            }).populate('takenBy', 'name email');
            
            res.json({
                success: true,
                attendance
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// Get all attendance for a date (role-based filtering)
router.get('/:date',
    authenticateSchool,
    requireVerification,
    authenticateRole(['PRINCIPAL', 'TEACHER']),
    async (req, res) => {
        try {
            const { date } = req.params;
            const userRole = req.user?.role;
            const formattedDate = new Date(date).toISOString().split('T')[0];
            
            let query = {
                date: formattedDate,
                schoolId: req.schoolId
            };
            
            // If teacher, filter by assigned classes
            if (userRole === 'TEACHER') {
                const { default: TeacherClassAssignment } = await import('../models/TeacherClassAssignment.js');
                const assignments = await TeacherClassAssignment.find({
                    teacherId: req.user.id,
                    schoolId: req.schoolId
                });
                
                const classFilters = assignments.map(a => ({
                    standard: a.standard,
                    division: a.division
                }));
                
                if (classFilters.length > 0) {
                    query.$or = classFilters;
                } else {
                    // Teacher has no assigned classes
                    return res.json({
                        success: true,
                        attendance: []
                    });
                }
            }
            
            const { default: Attendance } = await import('../models/Attendace.js');
            const attendance = await Attendance.find(query)
                .sort({ standard: 1, division: 1, attendanceType: 1 })
                .populate('takenBy', 'name email');
            
            res.json({
                success: true,
                attendance
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// Legacy routes with RBAC (maintain backward compatibility)
router.get('/report/daily/:date', authenticatePrincipal, requireVerification, getDailyReport);
router.get('/report/excel/daily/:date', authenticatePrincipal, requireVerification, downloadDailyReportExcel);
router.get('/report/data/daily/:date', authenticatePrincipal, requireVerification, getDailyReportData);
router.get('/report/semi-monthly/:year/:month/:half', authenticatePrincipal, requireVerification, getSemiMonthlyReport);
router.get('/report/excel/semi-monthly/:year/:month/:half', authenticatePrincipal, requireVerification, downloadSemiMonthlyReportExcel);
router.get('/report/data/semi-monthly/:year/:month/:half', authenticatePrincipal, requireVerification, getSemiMonthlyReportData);
router.get('/status/:year/:month/:half', authenticatePrincipal, requireVerification, getAttendanceStatus);

// Legacy attendance operations (Principal only for now)
router.post('/', authenticatePrincipal, requireVerification, createAttendance);
router.put('/:id', authenticatePrincipal, requireVerification, updateAttendance);
router.post('/save', authenticatePrincipal, requireVerification, saveAttendance);

export default router;
