import Teacher from '../models/Teacher.js';
import RegisteredStudent from '../models/RegisteredStudents.js';
import TeacherClassAssignment from '../models/TeacherClassAssignment.js';

// Bulk assign classes to teachers (Principal only)
export const bulkAssignClasses = async (req, res) => {
  try {
    const { assignments } = req.body;
    
    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ 
        message: 'Assignments array is required' 
      });
    }
    
    let assignedCount = 0;
    const errors = [];
    
    for (const assignment of assignments) {
      const { teacherId, classes } = assignment;
      
      if (!teacherId || !classes || !Array.isArray(classes)) {
        errors.push({ teacherId, error: 'Invalid assignment format' });
        continue;
      }
      
      // Verify teacher exists and belongs to this school
      const teacher = await Teacher.findOne({
        _id: teacherId,
        schoolId: req.schoolId,
        isApproved: true
      });
      
      if (!teacher) {
        errors.push({ teacherId, error: 'Teacher not found or not approved' });
        continue;
      }
      
      // Process each class assignment
      for (const classInfo of classes) {
        const { standard, division } = classInfo;
        
        if (standard === undefined || !division) {
          errors.push({ 
            teacherId, 
            class: `${standard}-${division}`, 
            error: 'Invalid class format' 
          });
          continue;
        }
        
        try {
          // Check if class exists in registered students
          const classExists = await RegisteredStudent.findOne({
            schoolId: req.schoolId,
            standard: parseInt(standard),
            division
          });
          
          if (!classExists) {
            errors.push({ 
              teacherId, 
              class: `${standard}-${division}`, 
              error: 'Class not found in registered students' 
            });
            continue;
          }
          
          // Create or update teacher class assignment
          const existingAssignment = await TeacherClassAssignment.findOne({
            teacherId,
            schoolId: req.schoolId,
            standard: parseInt(standard),
            division
          });
          
          if (!existingAssignment) {
            await TeacherClassAssignment.create({
              teacherId,
              schoolId: req.schoolId,
              standard: parseInt(standard),
              division,
              assignedBy: req.user.id
            });
            assignedCount++;
          }
          // If assignment already exists, we don't count it as new but don't error either
          
        } catch (error) {
          if (error.code === 11000) {
            // Duplicate key error - assignment already exists
            continue;
          }
          errors.push({ 
            teacherId, 
            class: `${standard}-${division}`, 
            error: error.message 
          });
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Bulk class assignment completed',
      assignedCount,
      errors
    });
  } catch (error) {
    console.error('Bulk assign classes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Bulk remove class assignments (Principal only)
export const bulkRemoveClassAssignments = async (req, res) => {
  try {
    const { assignments } = req.body;
    
    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ 
        message: 'Assignments array is required' 
      });
    }
    
    let removedCount = 0;
    const errors = [];
    
    for (const assignment of assignments) {
      const { teacherId, classes } = assignment;
      
      if (!teacherId || !classes || !Array.isArray(classes)) {
        errors.push({ teacherId, error: 'Invalid assignment format' });
        continue;
      }
      
      // Process each class removal
      for (const classInfo of classes) {
        const { standard, division } = classInfo;
        
        if (standard === undefined || !division) {
          errors.push({ 
            teacherId, 
            class: `${standard}-${division}`, 
            error: 'Invalid class format' 
          });
          continue;
        }
        
        try {
          // Remove teacher class assignment
          const result = await TeacherClassAssignment.findOneAndDelete({
            teacherId,
            schoolId: req.schoolId,
            standard: parseInt(standard),
            division
          });
          
          if (result) {
            removedCount++;
          }
        } catch (error) {
          errors.push({ 
            teacherId, 
            class: `${standard}-${division}`, 
            error: error.message 
          });
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Bulk class assignment removal completed',
      removedCount,
      errors
    });
  } catch (error) {
    console.error('Bulk remove class assignments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get class assignments for a teacher
export const getTeacherClassAssignments = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Verify teacher belongs to this school
    const teacher = await Teacher.findOne({
      _id: teacherId,
      schoolId: req.schoolId
    });
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Find all classes assigned to this teacher
    const assignments = await TeacherClassAssignment.find({
      teacherId,
      schoolId: req.schoolId
    }).select('standard division assignedAt')
      .sort({ standard: 1, division: 1 });
    
    // Get current academic year
    const currYear = new Date().getFullYear();
    const currMonth = new Date().getMonth();
    const academicYear = currMonth < 5 ? `${currYear - 1}-${currYear}` : `${currYear}-${currYear + 1}`;
    
    // Get lock status for each assigned class
    const assignmentsWithLockStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const registeredClass = await RegisteredStudent.findOne({
          schoolId: req.schoolId,
          standard: assignment.standard,
          division: assignment.division,
          academicYear
        }).select('isLocked lastLockedStatusUpdatedAt lockedBy')
          .populate('lockedBy', 'schoolName email');
        
        return {
          _id: assignment._id,
          standard: assignment.standard,
          division: assignment.division,
          assignedAt: assignment.assignedAt,
          isLocked: registeredClass?.isLocked || false,
          lastLockedStatusUpdatedAt: registeredClass?.lastLockedStatusUpdatedAt || null,
          lockedBy: registeredClass?.lockedBy ? {
            _id: registeredClass.lockedBy._id,
            schoolName: registeredClass.lockedBy.schoolName,
            email: registeredClass.lockedBy.email
          } : null
        };
      })
    );
    
    res.json({
      success: true,
      assignments: assignmentsWithLockStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Bulk lock/unlock classes (Principal only)
export const bulkLockUnlockClasses = async (req, res) => {
  try {
    const { action, classes } = req.body;
    
    if (!action || !['lock', 'unlock'].includes(action)) {
      return res.status(400).json({ 
        message: 'Invalid action. Use "lock" or "unlock"' 
      });
    }
    
    if (!classes || !Array.isArray(classes)) {
      return res.status(400).json({ 
        message: 'Classes array is required' 
      });
    }
    
    let affectedCount = 0;
    const errors = [];
    const isLocking = action === 'lock';
    
    // Get current academic year
    const currYear = new Date().getFullYear();
    const currMonth = new Date().getMonth();
    const academicYear = currMonth < 5 ? `${currYear - 1}-${currYear}` : `${currYear}-${currYear + 1}`;
    
    for (const classInfo of classes) {
      const { standard, division } = classInfo;
      
      if (standard === undefined || !division) {
        errors.push({ 
          class: `${standard}-${division}`, 
          error: 'Invalid class format' 
        });
        continue;
      }
      
      try {
        const updateData = {
          isLocked: isLocking,
          lastLockedStatusUpdatedAt: new Date()
        };
        
        if (isLocking) {
          updateData.lockedBy = req.user.id;
        } else {
          updateData.lockedBy = null;
        }
        
        const result = await RegisteredStudent.findOneAndUpdate(
          {
            schoolId: req.schoolId,
            standard: parseInt(standard),
            division,
            academicYear
          },
          updateData,
          { new: true }
        );
        
        if (result) {
          affectedCount++;
        } else {
          errors.push({ 
            class: `${standard}-${division}`, 
            error: 'Class not found in registered students' 
          });
        }
      } catch (error) {
        errors.push({ 
          class: `${standard}-${division}`, 
          error: error.message 
        });
      }
    }
    
    res.json({
      success: true,
      message: `Classes ${action}ed successfully`,
      affectedCount,
      errors
    });
  } catch (error) {
    console.error('Bulk lock/unlock classes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get class lock status
export const getClassLockStatus = async (req, res) => {
  try {
    const { academicYear } = req.query;
    
    // Use current academic year if not provided
    const currYear = new Date().getFullYear();
    const currMonth = new Date().getMonth();
    const currentAcademicYear = currMonth < 5 ? `${currYear - 1}-${currYear}` : `${currYear}-${currYear + 1}`;
    const queryAcademicYear = academicYear || currentAcademicYear;
    
    // Get all registered classes for this school and academic year with lock status
    const registeredClasses = await RegisteredStudent.find({
      schoolId: req.schoolId,
      academicYear: queryAcademicYear
    }).select('standard division isLocked lastLockedStatusUpdatedAt lockedBy')
      .populate('lockedBy', 'schoolName email');
    
    // Build response with all classes and their lock status
    const classes = registeredClasses.map(regClass => ({
      standard: regClass.standard,
      division: regClass.division,
      isLocked: regClass.isLocked || false,
      lastLockedStatusUpdatedAt: regClass.lastLockedStatusUpdatedAt || null,
      lockedBy: regClass.lockedBy ? {
        _id: regClass.lockedBy._id,
        schoolName: regClass.lockedBy.schoolName,
        email: regClass.lockedBy.email
      } : null
    }));
    
    res.json({
      success: true,
      academicYear: queryAcademicYear,
      classes
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all class assignments overview (Principal only)
export const getClassAssignmentsOverview = async (req, res) => {
  try {
    // Get all registered classes
    const registeredClasses = await RegisteredStudent.find({
      schoolId: req.schoolId
    }).select('standard division academicYear isLocked lastLockedStatusUpdatedAt lockedBy')
      .populate('lockedBy', 'schoolName email');
    
    // Get all teacher assignments for this school
    const teacherAssignments = await TeacherClassAssignment.find({
      schoolId: req.schoolId
    }).populate('teacherId', 'name email')
      .populate('assignedBy', 'schoolName email');
    
    // Build comprehensive overview
    const overview = registeredClasses.map(regClass => {
      // Find all teachers assigned to this class
      const assignedTeachers = teacherAssignments.filter(assignment => 
        assignment.standard === regClass.standard && 
        assignment.division === regClass.division
      ).map(assignment => ({
        teacherId: assignment.teacherId._id,
        teacherName: assignment.teacherId.name,
        teacherEmail: assignment.teacherId.email,
        assignedAt: assignment.assignedAt,
        assignedBy: assignment.assignedBy ? {
          _id: assignment.assignedBy._id,
          schoolName: assignment.assignedBy.schoolName,
          email: assignment.assignedBy.email
        } : null
      }));
      
      return {
        standard: regClass.standard,
        division: regClass.division,
        academicYear: regClass.academicYear,
        assignedTeachers, // Now returns array of teachers
        isLocked: regClass.isLocked || false,
        lastLockedStatusUpdatedAt: regClass.lastLockedStatusUpdatedAt || null,
        lockedBy: regClass.lockedBy ? {
          _id: regClass.lockedBy._id,
          schoolName: regClass.lockedBy.schoolName,
          email: regClass.lockedBy.email
        } : null,
        hasTeacher: assignedTeachers.length > 0,
        teacherCount: assignedTeachers.length
      };
    });
    
    res.json({
      success: true,
      overview
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove specific class assignment
export const removeClassAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Find and remove the teacher class assignment
    const assignment = await TeacherClassAssignment.findOneAndDelete({
      _id: assignmentId,
      schoolId: req.schoolId
    });
    
    if (!assignment) {
      return res.status(404).json({ message: 'Class assignment not found' });
    }
    
    res.json({
      success: true,
      message: 'Class assignment removed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get teachers assigned to a specific class
export const getClassTeachers = async (req, res) => {
  try {
    const { standard, division } = req.params;
    
    // Find all teachers assigned to this class
    const assignments = await TeacherClassAssignment.find({
      schoolId: req.schoolId,
      standard: parseInt(standard),
      division
    }).populate('teacherId', 'name email mobileNo')
      .populate('assignedBy', 'schoolName email')
      .sort({ assignedAt: -1 });
    
    const teachers = assignments.map(assignment => ({
      assignmentId: assignment._id,
      teacher: {
        _id: assignment.teacherId._id,
        name: assignment.teacherId.name,
        email: assignment.teacherId.email,
        mobileNo: assignment.teacherId.mobileNo
      },
      assignedAt: assignment.assignedAt,
      assignedBy: assignment.assignedBy ? {
        _id: assignment.assignedBy._id,
        schoolName: assignment.assignedBy.schoolName,
        email: assignment.assignedBy.email
      } : null
    }));
    
    res.json({
      success: true,
      class: { standard: parseInt(standard), division },
      teachers,
      teacherCount: teachers.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
