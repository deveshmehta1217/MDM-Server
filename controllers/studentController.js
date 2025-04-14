// controllers/studentController.js
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import { parseExcelFile } from '../utils/excelParser.js';

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate({
        path: 'class',
        select: 'standard division',
        populate: {
          path: 'teacher',
          select: 'name email'
        }
      });
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentsByClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    
    // Verify class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Get students for the class
    const students = await Student.find({ class: classId, isActive: true });
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { name, rollNumber, gender, category, classId } = req.body;
    
    // Verify class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if student with same roll number exists in the class
    const existingStudent = await Student.findOne({ rollNumber, class: classId });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this roll number already exists in the class' });
    }
    
    // Create student
    const student = new Student({
      name,
      rollNumber,
      gender,
      category,
      class: classId
    });
    
    await student.save();
    
    res.status(201).json({
      message: 'Student created successfully',
      student
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { name, rollNumber, gender, category, classId, isActive } = req.body;
    const studentId = req.params.id;
    
    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // If changing class, verify the new class exists
    if (classId && classId !== student.class.toString()) {
      const newClass = await Class.findById(classId);
      if (!newClass) {
        return res.status(404).json({ message: 'Class not found' });
      }
      
      // Check if student with same roll number exists in the new class
      if (rollNumber) {
        const existingStudent = await Student.findOne({ 
          rollNumber, 
          class: classId,
          _id: { $ne: studentId }
        });
        
        if (existingStudent) {
          return res.status(400).json({ message: 'Student with this roll number already exists in the class' });
        }
      }
    }
    
    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { 
        name: name || student.name,
        rollNumber: rollNumber || student.rollNumber,
        gender: gender || student.gender,
        category: category || student.category,
        class: classId || student.class,
        isActive: isActive !== undefined ? isActive : student.isActive
      },
      { new: true }
    );
    
    res.json({
      message: 'Student updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Delete student (soft delete by setting isActive to false)
    await Student.findByIdAndUpdate(studentId, { isActive: false });
    
    res.json({ message: 'Student deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const bulkAddStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }
    console.log(file)
    // Verify class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Parse Excel file
    const students = await parseExcelFile(file.path, 'students');
    
    // Validate and prepare student data
    const studentPromises = students.map(async student => {
      try {
        // Check if student with same roll number exists in the class
        const existingStudent = await Student.findOne({ 
          rollNumber: student.rollNumber, 
          class: classId 
        });
        
        if (existingStudent) {
          return { 
            status: 'skipped', 
            name: student.name, 
            rollNumber: student.rollNumber,
            reason: 'Student with this roll number already exists in the class' 
          };
        }
        
        // Create new student
        const newStudent = new Student({
          name: student.name,
          rollNumber: student.rollNumber,
          gender: student.gender,
          category: student.category,
          class: classId
        });
        
        await newStudent.save();
        
        return { 
          status: 'success', 
          name: student.name, 
          rollNumber: student.rollNumber 
        };
      } catch (error) {
        return { 
          status: 'failed', 
          name: student.name, 
          rollNumber: student.rollNumber,
          reason: error.message 
        };
      }
    });
    
    const results = await Promise.all(studentPromises);
    
    res.json({
      message: 'Bulk student import completed',
      class: `${classObj.standard}-${classObj.division}`,
      results
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};