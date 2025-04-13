// controllers/userController.js
import User from '../models/User.js';
import Class from '../models/Class.js';
import { parseExcelFile } from '../utils/excelParser.js';

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .populate('assignedClass');
    
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createTeacher = async (req, res) => {
  try {
    const { name, email, password, assignedClassId } = req.body;
    
    // Check if teacher already exists
    let teacher = await User.findOne({ email });
    if (teacher) {
      return res.status(400).json({ message: 'Teacher already exists' });
    }
    
    // Verify the class exists if assignedClassId is provided
    if (assignedClassId) {
      const classExists = await Class.findById(assignedClassId);
      if (!classExists) {
        return res.status(400).json({ message: 'Class not found' });
      }
    }
    
    // Create new teacher
    teacher = new User({
      name,
      email,
      password,
      role: 'teacher',
      assignedClass: assignedClassId
    });
    
    await teacher.save();
    
    // If class is assigned, update the class with the teacher
    if (assignedClassId) {
      await Class.findByIdAndUpdate(assignedClassId, { teacher: teacher._id });
    }
    
    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        assignedClass: teacher.assignedClass
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const { name, email, assignedClassId } = req.body;
    const teacherId = req.params.id;
    
    // Find teacher
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // If changing class assignment, verify the class exists
    if (assignedClassId && assignedClassId !== teacher.assignedClass?.toString()) {
      const classExists = await Class.findById(assignedClassId);
      if (!classExists) {
        return res.status(400).json({ message: 'Class not found' });
      }
      
      // Remove teacher from previous class if there was one
      if (teacher.assignedClass) {
        await Class.findByIdAndUpdate(teacher.assignedClass, { $unset: { teacher: 1 } });
      }
      
      // Update the class with the new teacher
      await Class.findByIdAndUpdate(assignedClassId, { teacher: teacherId });
    }
    
    // Update teacher
    const updatedTeacher = await User.findByIdAndUpdate(
      teacherId,
      { 
        name: name || teacher.name,
        email: email || teacher.email,
        assignedClass: assignedClassId || teacher.assignedClass
      },
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Teacher updated successfully',
      teacher: updatedTeacher
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    // Find teacher
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Remove teacher from assigned class if there is one
    if (teacher.assignedClass) {
      await Class.findByIdAndUpdate(teacher.assignedClass, { $unset: { teacher: 1 } });
    }
    
    // Delete teacher
    await User.findByIdAndDelete(teacherId);
    
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const bulkAddTeachers = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }
    
    // Parse Excel file
    const teachers = await parseExcelFile(file.path, 'teachers');
    
    // Validate and prepare teacher data
    const teacherPromises = teachers.map(async teacher => {
      try {
        // Check if teacher already exists
        const existingTeacher = await User.findOne({ email: teacher.email });
        if (existingTeacher) {
          return { 
            status: 'skipped', 
            email: teacher.email, 
            reason: 'Teacher already exists' 
          };
        }
        
        // Find the class if class info is provided
        let classId = null;
        if (teacher.standard && teacher.division) {
          const classObj = await Class.findOne({ 
            standard: teacher.standard, 
            division: teacher.division 
          });
          
          if (classObj) {
            classId = classObj._id;
          }
        }
        
        // Create new teacher
        const newTeacher = new User({
          name: teacher.name,
          email: teacher.email,
          password: teacher.password || 'defaultPassword123', // default password or from Excel
          role: 'teacher',
          assignedClass: classId
        });
        
        await newTeacher.save();
        
        // Update class with teacher reference if class exists
        if (classId) {
          await Class.findByIdAndUpdate(classId, { teacher: newTeacher._id });
        }
        
        return { status: 'success', email: teacher.email };
      } catch (error) {
        return { 
          status: 'failed', 
          email: teacher.email, 
          reason: error.message 
        };
      }
    });
    
    const results = await Promise.all(teacherPromises);
    
    res.json({
      message: 'Bulk teacher import completed',
      results
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
