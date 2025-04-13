// controllers/classController.js
import Class from '../models/Class.js';
import User from '../models/User.js';

export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('teacher', 'name email');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getClassById = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id).populate('teacher', 'name email');
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json(classObj);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createClass = async (req, res) => {
  try {
    const { standard, division, teacherId } = req.body;
    
    // Check if class already exists
    const existingClass = await Class.findOne({ standard, division });
    if (existingClass) {
      return res.status(400).json({ message: 'Class already exists' });
    }
    
    // Create class
    const newClass = new Class({
      standard,
      division,
      teacher: teacherId
    });
    
    await newClass.save();
    
    // Update teacher if teacherId is provided
    if (teacherId) {
      await User.findByIdAndUpdate(teacherId, { assignedClass: newClass._id });
    }
    
    res.status(201).json({
      message: 'Class created successfully',
      class: newClass
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { standard, division, teacherId } = req.body;
    const classId = req.params.id;
    
    // Find class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if changing teacher
    if (teacherId && teacherId !== classObj.teacher?.toString()) {
      // Remove class assignment from previous teacher if there was one
      if (classObj.teacher) {
        await User.findByIdAndUpdate(classObj.teacher, { $unset: { assignedClass: 1 } });
      }
      
      // Assign class to new teacher
      await User.findByIdAndUpdate(teacherId, { assignedClass: classId });
    }
    
    // Update class
    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { 
        standard: standard || classObj.standard,
        division: division || classObj.division,
        teacher: teacherId || classObj.teacher
      },
      { new: true }
    ).populate('teacher', 'name email');
    
    res.json({
      message: 'Class updated successfully',
      class: updatedClass
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    
    // Find class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Remove class assignment from teacher if there is one
    if (classObj.teacher) {
      await User.findByIdAndUpdate(classObj.teacher, { $unset: { assignedClass: 1 } });
    }
    
    // Delete class
    await Class.findByIdAndDelete(classId);
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};