// controllers/authController.js
import User from '../models/User.js';

export const register = async (req, res) => {
  try {
    const { name, password, mobileNo, email, schoolName, schoolId, isAdmin } = req.body;
    
    // Validate required fields
    if (!name || !password || !mobileNo || !email || !schoolName || !schoolId) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user already exists (by email or mobile)
    let existingUser = await User.findOne({ 
      $or: [{ email }, { mobileNo }] 
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or mobile number already exists' });
    }
    
    // Create new user
    let user = new User({
      name,
      password,
      mobileNo,
      email,
      schoolName,
      schoolId,
      isAdmin: isAdmin || false
    });
    
    await user.save();
    
    // Generate auth token
    const token = user.generateAuthToken();
    
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        mobileNo: user.mobileNo,
        email: user.email,
        schoolName: user.schoolName,
        schoolId: user.schoolId,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { schoolId, password } = req.body;
    
    // Find user by email or mobile number
    const user = await User.findOne({ schoolId });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate auth token
    const token = user.generateAuthToken();
    
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        mobileNo: user.mobileNo,
        email: user.email,
        schoolName: user.schoolName,
        schoolId: user.schoolId,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
