// controllers/authController.js
import User from '../models/User.js';

export const register = async (req, res) => {
  try {
    const { name, id, password } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ id });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      name,
      id,
      password,
    });
    
    await user.save();
    
    // Generate auth token
    const token = user.generateAuthToken();
    
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        id: user.id,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { id, password } = req.body;
    console.log(id, password)
    
    // Find user
    const user = await User.findOne({ id });
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
        id: user.id,
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
