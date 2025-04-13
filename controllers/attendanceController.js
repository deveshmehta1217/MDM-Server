// controllers/attendanceController.js
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import mongoose from 'mongoose';

export const getTodayAttendance = async (req, res) => {
  try {
    const classId = req.params.classId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if attendance already exists for today
    let attendance = await Attendance.findOne({
      class: classId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('students.student');
    
    if (!attendance) {
      // Create new attendance record with all students from the class
      const students = await Student.find({ class: classId, isActive: true });
      
      const studentAttendance = students.map(student => ({
        student: student._id,
        present: false,
        mealTaken: false
      }));
      
      attendance = new Attendance({
        date: today,
        class: classId,
        students: studentAttendance,
        menuType: 'regularMenu',
        createdBy: req.user.id
      });
      
      await attendance.save();
      
      // Populate student data
      attendance = await Attendance.findById(attendance._id).populate('students.student');
    }
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAttendanceByDate = async (req, res) => {
  try {
    const { classId, date } = req.params;
    
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    
    // Find attendance for the specified date
    const attendance = await Attendance.findOne({
      class: classId,
      date: {
        $gte: queryDate,
        $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('students.student');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found for this date' });
    }
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { students, menuType } = req.body;
    
    // Find attendance record
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Update student attendance
    if (students && students.length > 0) {
      students.forEach(studentUpdate => {
        const studentIndex = attendance.students.findIndex(
          s => s.student.toString() === studentUpdate.studentId
        );
        
        if (studentIndex !== -1) {
          if (studentUpdate.present !== undefined) {
            attendance.students[studentIndex].present = studentUpdate.present;
          }
          
          if (studentUpdate.mealTaken !== undefined) {
            attendance.students[studentIndex].mealTaken = studentUpdate.mealTaken;
          }
        }
      });
    }
    
    // Update menu type if provided
    if (menuType) {
      attendance.menuType = menuType;
    }
    
    // Update metadata
    attendance.updatedBy = req.user.id;
    attendance.updatedAt = new Date();
    
    await attendance.save();
    
    // Return updated record with populated student data
    const updatedAttendance = await Attendance.findById(attendanceId).populate('students.student');
    
    res.json({
      message: 'Attendance updated successfully',
      attendance: updatedAttendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const bulkUpdateAttendance = async (req, res) => {
  try {
    const { classId, date, allPresent, allMealTaken, menuType } = req.body;
    
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    
    // Find attendance record
    let attendance = await Attendance.findOne({
      class: classId,
      date: {
        $gte: queryDate,
        $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (!attendance) {
      // Create new attendance record with all students from the class
      const students = await Student.find({ class: classId, isActive: true });
      
      const studentAttendance = students.map(student => ({
        student: student._id,
        present: allPresent || false,
        mealTaken: allMealTaken || false
      }));
      
      attendance = new Attendance({
        date: queryDate,
        class: classId,
        students: studentAttendance,
        menuType: menuType || 'regularMenu',
        createdBy: req.user.id
      });
    } else {
      // Update existing attendance record
      if (allPresent !== undefined) {
        attendance.students.forEach(student => {
          student.present = allPresent;
        });
      }
      
      if (allMealTaken !== undefined) {
        attendance.students.forEach(student => {
          student.mealTaken = allMealTaken;
        });
      }
      
      if (menuType) {
        attendance.menuType = menuType;
      }
      
      // Update metadata
      attendance.updatedBy = req.user.id;
      attendance.updatedAt = new Date();
    }
    
    await attendance.save();
    
    // Return updated record with populated student data
    const updatedAttendance = await Attendance.findById(attendance._id).populate('students.student');
    
    res.json({
      message: 'Attendance updated successfully',
      attendance: updatedAttendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};