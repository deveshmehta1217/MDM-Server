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
