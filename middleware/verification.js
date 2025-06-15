import User from '../models/User.js';

// Middleware to check if user is verified and verification is still valid
export const requireVerification = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'Authentication required. Please log in.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    const user = await User.findOne({schoolId: req.schoolId});
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.isVerificationValid()) {
      return res.status(403).json({ 
        message: 'Account verification required or expired. Please contact administrator.',
        code: 'VERIFICATION_REQUIRED'
      });
    }
    
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Middleware to check verification status but allow access (for informational purposes)
export const checkVerificationStatus = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user || !req.user.id) {
      // Don't block the request, just continue without verification status
      return next();
    }
    
    const user = await User.findById(req.user.id);
    
    if (user) {
      req.user.isVerificationValid = user.isVerificationValid();
      req.user.verificationStatus = {
        isVerified: user.isVerified,
        verifiedAt: user.verifiedAt,
        isValid: user.isVerificationValid()
      };
    }
    
    next();
  } catch (error) {
    // Don't block the request, just continue without verification status
    next();
  }
};
