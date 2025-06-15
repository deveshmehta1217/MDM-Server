import Attendance from '../models/Attendace.js';
import RegisteredStudent from '../models/RegisteredStudents.js';
import TeacherClassAssignment from '../models/TeacherClassAssignment.js';
import Teacher from '../models/Teacher.js';

// Enhanced attendance taking with RBAC support
export const takeAttendance = async (req, res) => {
  try {
    const { standard, division, date, registeredStudents, presentStudents, mealTakenStudents, alpaharTakenStudents } = req.body;
    console.log(req.body)
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
      registeredStudents,
      presentStudents,
      mealTakenStudents,
      alpaharTakenStudents,
      takenBy,
      takenByRole,
      takenAt: new Date()
    };
    
    const attendance = await Attendance.findOneAndUpdate(
      {
        schoolId: req.schoolId,
        standard: parseInt(standard),
        division,
        date: attendanceData.date
      },
      attendanceData,
      {
        new: true,
        upsert: true
      }
    );
    
    res.json({
      success: true,
      message: 'Attendance recorded successfully',
      attendanceId: attendance._id,
      attendance
    });
  } catch (error) {
    console.error('Take attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Enhanced daily attendance status with role-based filtering
export const getEnhancedDailyAttendanceStatus = async (req, res) => {
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
    let registeredClasses = await RegisteredStudent.find({ 
      academicYear,
      schoolId: req.schoolId 
    });

    // Filter classes based on user role
    if (userRole === 'TEACHER') {
      const assignments = await TeacherClassAssignment.find({
        teacherId: req.user.id,
        schoolId: req.schoolId
      });
      
      const assignedClassKeys = assignments.map(a => `${a.standard}-${a.division}`);
      registeredClasses = registeredClasses.filter(rc => 
        assignedClassKeys.includes(`${rc.standard}-${rc.division}`)
      );
    }

    // Get attendance records
    const attendanceDocs = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      schoolId: req.schoolId
    }).select('standard division alpaharTakenStudents mealTakenStudents takenBy takenByRole takenAt');

    // Helper function to check if meal data exists (has non-zero values)
    const hasMealData = (mealData) => {
      if (!mealData) return false;
      return Object.values(mealData).some(category => 
        Object.values(category).some(count => count > 0)
      );
    };

    // Create attendance maps
    const attendanceMap = new Map();
    const teacherMap = new Map();

    attendanceDocs.forEach(doc => {
      const key = `${doc.standard}-${doc.division}`;
      const hasAlpahar = hasMealData(doc.alpaharTakenStudents);
      const hasMdm = hasMealData(doc.mealTakenStudents);
      
      attendanceMap.set(key, {
        alpaharTaken: hasAlpahar,
        mdmTaken: hasMdm,
        takenBy: doc.takenBy,
        takenByRole: doc.takenByRole,
        takenAt: doc.takenAt
      });
    });

    // Get teacher names for display
    const teacherIds = Array.from(attendanceMap.values())
      .filter(info => info.takenByRole === 'TEACHER')
      .map(info => info.takenBy);
    const teachers = await Teacher.find({ _id: { $in: teacherIds } }).select('name');
    const teacherNameMap = new Map(teachers.map(t => [t._id.toString(), t.name]));

    // Build response
    const attendanceRecords = registeredClasses.map(({ standard, division }) => {
      const key = `${standard}-${division}`;
      const attendanceInfo = attendanceMap.get(key);
      
      return {
        standard,
        division,
        alpaharTaken: attendanceInfo?.alpaharTaken || false,
        mdmTaken: attendanceInfo?.mdmTaken || false,
        attendanceTakenBy: attendanceInfo?.takenByRole === 'TEACHER' 
          ? teacherNameMap.get(attendanceInfo.takenBy.toString()) 
          : null,
        attendanceTakenAt: attendanceInfo?.takenAt || null
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
};

// Get attendance by type and class (role-based access) - Legacy support
export const getAttendanceByTypeAndClass = async (req, res) => {
  try {
    const { date, attendanceType, standard, division } = req.params;
    
    // Validate attendance type for backward compatibility
    if (!['ALPAHAR', 'MDM'].includes(attendanceType)) {
      return res.status(400).json({ message: 'Invalid attendance type. Use ALPAHAR or MDM' });
    }
    
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    const attendance = await Attendance.findOne({
      standard: parseInt(standard),
      division,
      date: formattedDate,
      schoolId: req.schoolId
    }).populate('takenBy', 'name email');
    
    if (!attendance) {
      return res.json({
        success: true,
        attendance: null
      });
    }
    
    // Helper function to check if meal data exists
    const hasMealData = (mealData) => {
      if (!mealData) return false;
      return Object.values(mealData).some(category => 
        Object.values(category).some(count => count > 0)
      );
    };
    
    // Check if the requested type has data
    const hasAlpahar = hasMealData(attendance.alpaharTakenStudents);
    const hasMdm = hasMealData(attendance.mealTakenStudents);
    
    let responseData = { ...attendance.toObject() };
    
    // For backward compatibility, filter based on attendance type
    if (attendanceType === 'ALPAHAR' && !hasAlpahar) {
      responseData = null;
    } else if (attendanceType === 'MDM' && !hasMdm) {
      responseData = null;
    }
    
    res.json({
      success: true,
      attendance: responseData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance by class (role-based access)
export const getAttendanceByClass = async (req, res) => {
  try {
    const { date, standard, division } = req.params;
    
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    const attendance = await Attendance.findOne({
      standard: parseInt(standard),
      division,
      date: formattedDate,
      schoolId: req.schoolId
    }).populate('takenBy', 'name email');
    
    res.json({
      success: true,
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all attendance for a date with role-based filtering
export const getEnhancedAttendance = async (req, res) => {
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
    
    const attendance = await Attendance.find(query)
      .sort({ standard: 1, division: 1 })
      .populate('takenBy', 'name email');
    
    res.json({
      success: true,
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Enhanced save attendance with RBAC
export const saveEnhancedAttendance = async (req, res) => {
  try {
    const { standard, division, registeredStudents, presentStudents, mealTakenStudents, alpaharTakenStudents, date } = req.body;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    
    const formattedDate = new Date(date).toISOString().split('T')[0];
    const userRole = req.user?.role;
    
    const data = await Attendance.findOneAndUpdate(
      {
        schoolId: req.schoolId,
        standard: parseInt(standard),
        division,
        date: formattedDate
      },
      {
        schoolId: req.schoolId,
        standard: parseInt(standard),
        division,
        date: formattedDate,
        registeredStudents,
        presentStudents,
        mealTakenStudents,
        alpaharTakenStudents,
        takenBy: req.user.id,
        takenByRole: userRole,
        takenAt: new Date()
      },
      {
        new: true,
        upsert: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Attendance saved successfully',
      data
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
