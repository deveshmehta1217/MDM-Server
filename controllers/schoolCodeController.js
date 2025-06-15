import SchoolCode from '../models/SchoolCode.js';
import User from '../models/User.js';

// Generate new school code (Principal only)
export const generateSchoolCode = async (req, res) => {
  try {
    // Deactivate existing codes for this school
    await SchoolCode.updateMany(
      { schoolId: req.schoolId },
      { isActive: false }
    );
    
    // Generate unique code
    const code = await SchoolCode.generateUniqueCode();
    
    // Create new school code
    const schoolCode = new SchoolCode({
      schoolId: req.schoolId,
      code,
      createdBy: req.user.id
    });
    
    await schoolCode.save();
    
    // Update user's school code field
    await User.findByIdAndUpdate(req.user.id, {
      schoolCode: code
    });
    
    res.status(201).json({
      success: true,
      schoolCode: code,
      expiresAt: schoolCode.expiresAt,
      message: 'School code generated successfully'
    });
  } catch (error) {
    console.error('Generate school code error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get active school code (Principal only)
export const getActiveSchoolCode = async (req, res) => {
  try {
    const schoolCode = await SchoolCode.findOne({
      schoolId: req.schoolId,
      isActive: true
    }).sort({ createdAt: -1 });
    
    if (!schoolCode) {
      return res.status(200).json({ 
        success: false,
        message: 'No active school code found. Please generate a new one.' 
      });
    }
    
    res.json({
      success: true,
      schoolCode: schoolCode.code,
      isActive: schoolCode.isActive,
      isExpired: schoolCode.isExpired(),
      isValid: schoolCode.isValid(),
      createdAt: schoolCode.createdAt,
      expiresAt: schoolCode.expiresAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Deactivate school code (Principal only)
export const deactivateSchoolCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const schoolCode = await SchoolCode.findOne({
      code: code.toUpperCase(),
      schoolId: req.schoolId
    });
    
    if (!schoolCode) {
      return res.status(404).json({ message: 'School code not found' });
    }
    
    schoolCode.isActive = false;
    await schoolCode.save();
    
    // Clear school code from user
    await User.findByIdAndUpdate(req.user.id, {
      schoolCode: null
    });
    
    res.json({
      success: true,
      message: 'School code deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all school codes history (Principal only)
export const getSchoolCodeHistory = async (req, res) => {
  try {
    const schoolCodes = await SchoolCode.find({
      schoolId: req.schoolId
    }).sort({ createdAt: -1 });
    
    const codesWithStatus = schoolCodes.map(code => ({
      _id: code._id,
      code: code.code,
      isActive: code.isActive,
      isExpired: code.isExpired(),
      isValid: code.isValid(),
      createdAt: code.createdAt,
      expiresAt: code.expiresAt
    }));
    
    res.json({
      success: true,
      schoolCodes: codesWithStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Validate school code (Public endpoint for teacher registration)
export const validateSchoolCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const schoolCode = await SchoolCode.findOne({
      code: code.toUpperCase()
    }).populate('createdBy', 'schoolName schoolSubName');
    
    if (!schoolCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid school code'
      });
    }
    
    const isValid = schoolCode.isValid();
    
    res.json({
      success: true,
      isValid,
      isActive: schoolCode.isActive,
      isExpired: schoolCode.isExpired(),
      schoolInfo: isValid ? {
        schoolName: schoolCode.createdBy.schoolName,
        schoolSubName: schoolCode.createdBy.schoolSubName
      } : null,
      message: isValid ? 'Valid school code' : 'School code is inactive or expired'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Extend school code expiry (Principal only)
export const extendSchoolCodeExpiry = async (req, res) => {
  try {
    const { code } = req.params;
    const { months = 12 } = req.body; // Default extend by 12 months
    
    const schoolCode = await SchoolCode.findOne({
      code: code.toUpperCase(),
      schoolId: req.schoolId
    });
    
    if (!schoolCode) {
      return res.status(404).json({ message: 'School code not found' });
    }
    
    // Extend expiry date
    const newExpiryDate = new Date(schoolCode.expiresAt);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + parseInt(months));
    
    schoolCode.expiresAt = newExpiryDate;
    await schoolCode.save();
    
    res.json({
      success: true,
      message: `School code expiry extended by ${months} months`,
      newExpiryDate: newExpiryDate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
