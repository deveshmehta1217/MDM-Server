// middleware/auth.js
import passport from 'passport';
import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized access. Please log in.' });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

// Enhanced JWT authentication with school context
export const authenticateWithSchool = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mdm-secret-key');
    req.user = decoded;
    req.schoolId = decoded.schoolId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// School-level authorization middleware
export const authorizeSchool = (req, res, next) => {
  const userSchoolId = req.user?.schoolId;
  
  if (!userSchoolId) {
    return res.status(403).json({ message: 'Access denied. School ID not found in token.' });
  }

  // Add schoolId to request for use in controllers
  req.schoolId = userSchoolId;
  next();
};

// Admin authorization middleware
export const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Combined middleware for school-specific operations
export const authenticateSchool = [authenticateWithSchool, authorizeSchool];

// Combined middleware for admin operations
export const authenticateAdmin = [authenticateWithSchool, authorizeSchool, requireAdmin];

// Combined middleware for admin operations
export const authenticatePrincipal = [authenticateWithSchool, authorizeSchool, authenticateRole(['PRINCIPAL'])];

// Role-based authentication middleware
export const authenticateRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    next();
  };
};

// Check if teacher has access to specific class
export const requireClassAccess = async (req, res, next) => {
  try {
    // Get standard and division from params or body
    let { standard, division } = req.params;
    
    // If not in params, check body (for APIs like /save)
    if (!standard || !division) {
      standard = req.body.standard;
      division = req.body.division;
    }
    
    const userRole = req.user?.role;
    
    // Principals have access to all classes
    if (userRole === 'PRINCIPAL') {
      return next();
    }
    
    // For teachers, check class assignment
    if (userRole === 'TEACHER') {
      // Validate that we have standard and division
      if (standard === undefined || !division) {
        return res.status(400).json({ 
          message: 'Standard and division are required' 
        });
      }
      
      const { default: TeacherClassAssignment } = await import('../models/TeacherClassAssignment.js');
      
      const assignment = await TeacherClassAssignment.findOne({
        teacherId: req.user.id,
        schoolId: req.schoolId,
        standard: parseInt(standard),
        division: division
      });
      
      if (!assignment) {
        return res.status(403).json({ 
          message: 'Access denied. You are not assigned to this class.' 
        });
      }
    }
    
    next();
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check if class is unlocked for modifications
export const requireUnlockedClass = async (req, res, next) => {
  try {
    const { standard, division } = req.body;
    const userRole = req.user?.role;
    
    // Principals can always modify
    if (userRole === 'PRINCIPAL') {
      return next();
    }
    
    // For teachers, check if class is locked
    const { default: RegisteredStudent } = await import('../models/RegisteredStudents.js');
    
    // Get current academic year
    const currYear = new Date().getFullYear();
    const currMonth = new Date().getMonth();
    const academicYear = currMonth < 5 ? `${currYear - 1}-${currYear}` : `${currYear}-${currYear + 1}`;
    
    const registeredClass = await RegisteredStudent.findOne({
      schoolId: req.schoolId,
      standard: parseInt(standard),
      division: division,
      academicYear: academicYear
    });
    
    if (registeredClass && registeredClass.isLocked) {
      return res.status(403).json({ 
        message: 'Access denied. This class is locked for modifications.' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check if teacher is approved and active
export const requireApprovedTeacher = (req, res, next) => {
  const userRole = req.user?.role;
  
  if (userRole === 'TEACHER') {
    if (!req.user.isApproved) {
      return res.status(403).json({ 
        message: 'Access denied. Your account is pending approval.' 
      });
    }
    
    if (!req.user.isActive) {
      return res.status(403).json({ 
        message: 'Access denied. Your account has been deactivated.' 
      });
    }
  }
  
  next();
};

// Enhanced JWT authentication for teachers
export const authenticateTeacher = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mdm-secret-key');
    
    if (decoded.role !== 'TEACHER') {
      return res.status(403).json({ message: 'Access denied. Teacher access required.' });
    }
    
    req.user = decoded;
    req.schoolId = decoded.schoolId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Combined middleware for teacher operations
export const authenticateApprovedTeacher = [authenticateTeacher, requireApprovedTeacher];
