// controllers/reportController.js
import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import { generatePdf } from '../utils/pdfGenerator.js';
import { generateExcel } from '../utils/excelGenerator.js';

export const getMonthlyReport = async (req, res) => {
  try {
    const { year, month, format = 'json' } = req.query;
    
    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month) - 1; // JavaScript months are 0-indexed
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
      return res.status(400).json({ message: 'Invalid year or month' });
    }
    
    // Calculate date range for the given month
    const startDate = new Date(yearNum, monthNum, 1);
    const endDate = new Date(yearNum, monthNum + 1, 0); // Last day of month
    
    // Get all classes
    const classes = await Class.find();
    
    // Gather report data for each class
    const reportData = await Promise.all(classes.map(async classObj => {
      // Get all active students in the class
      const students = await Student.find({ class: classObj._id, isActive: true });
      
      // Get all attendance records for the class in the month
      const attendanceRecords = await Attendance.find({
        class: classObj._id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
      
      // Calculate totals per student
      const studentReports = students.map(student => {
        const studentAttendance = attendanceRecords.map(record => {
          const studentRecord = record.students.find(
            s => s.student.toString() === student._id.toString()
          );
          
          return {
            date: record.date,
            present: studentRecord ? studentRecord.present : false,
            mealTaken: studentRecord ? studentRecord.mealTaken : false,
            menuType: record.menuType
          };
        });
        
        // Calculate totals
        const totalPresent = studentAttendance.filter(a => a.present).length;
        const totalMealTaken = studentAttendance.filter(a => a.mealTaken).length;
        const regularMeals = studentAttendance.filter(a => a.mealTaken && a.menuType === 'regularMenu').length;
        const sukhdiMeals = studentAttendance.filter(a => a.mealTaken && a.menuType === 'sukhdi').length;
        
        return {
          student: {
            id: student._id,
            name: student.name,
            rollNumber: student.rollNumber,
            gender: student.gender,
            category: student.category
          },
          attendance: studentAttendance,
          summary: {
            totalPresent,
            totalMealTaken,
            regularMeals,
            sukhdiMeals
          }
        };
      });
      
      // Calculate class totals by day
      const dailyTotals = attendanceRecords.map(record => {
        const presentCount = record.students.filter(s => s.present).length;
        const mealTakenCount = record.students.filter(s => s.mealTaken).length;
        
        // Count by gender
        const maleStudentIds = students
          .filter(s => s.gender === 'male')
          .map(s => s._id.toString());
        
        const femaleStudentIds = students
          .filter(s => s.gender === 'female')
          .map(s => s._id.toString());
        
        const malePresent = record.students.filter(
          s => s.present && maleStudentIds.includes(s.student.toString())
        ).length;
        
        const femalePresent = record.students.filter(
          s => s.present && femaleStudentIds.includes(s.student.toString())
        ).length;
        
        const maleMealTaken = record.students.filter(
          s => s.mealTaken && maleStudentIds.includes(s.student.toString())
        ).length;
        
        const femaleMealTaken = record.students.filter(
          s => s.mealTaken && femaleStudentIds.includes(s.student.toString())
        ).length;
        
        // Count by category
        const categoryMap = {
          general: { present: 0, mealTaken: 0 },
          sc: { present: 0, mealTaken: 0 },
          st: { present: 0, mealTaken: 0 },
          obc: { present: 0, mealTaken: 0 }
        };
        
        students.forEach(student => {
          const category = student.category;
          const studentRecord = record.students.find(
            s => s.student.toString() === student._id.toString()
          );
          
          if (studentRecord) {
            if (studentRecord.present) {
              categoryMap[category].present++;
            }
            if (studentRecord.mealTaken) {
              categoryMap[category].mealTaken++;
            }
          }
        });
        
        return {
          date: record.date,
          menuType: record.menuType,
          totals: {
            present: presentCount,
            mealTaken: mealTakenCount,
            malePresent,
            femalePresent,
            maleMealTaken,
            femaleMealTaken,
            byCategory: categoryMap
          }
        };
      });
      
      // Calculate class monthly totals
      const monthlyTotal = {
        presentDays: dailyTotals.filter(d => d.totals.present > 0).length,
        totalPresent: dailyTotals.reduce((sum, day) => sum + day.totals.present, 0),
        totalMealTaken: dailyTotals.reduce((sum, day) => sum + day.totals.mealTaken, 0),
        malePresent: dailyTotals.reduce((sum, day) => sum + day.totals.malePresent, 0),
        femalePresent: dailyTotals.reduce((sum, day) => sum + day.totals.femalePresent, 0),
        maleMealTaken: dailyTotals.reduce((sum, day) => sum + day.totals.maleMealTaken, 0),
        femaleMealTaken: dailyTotals.reduce((sum, day) => sum + day.totals.femaleMealTaken, 0),
        regularMenuDays: dailyTotals.filter(d => d.menuType === 'regularMenu').length,
        sukhdiDays: dailyTotals.filter(d => d.menuType === 'sukhdi').length
      };
      
      return {
        class: {
          id: classObj._id,
          standard: classObj.standard,
          division: classObj.division
        },
        students: studentReports,
        dailyTotals,
        monthlyTotal
      };
    }));
    
    // Generate response based on requested format
    if (format === 'pdf') {
      const pdfBuffer = await generatePdf(reportData, { year, month, reportType: 'monthly' });
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=mdm_report_${year}_${month}.pdf`
      });
      
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const excelBuffer = await generateExcel(reportData, { year, month, reportType: 'monthly' });
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=mdm_report_${year}_${month}.xlsx`
      });
      
      return res.send(excelBuffer);
    }
    
    // Default JSON response
    res.json({
      reportType: 'monthly',
      year,
      month: monthNum + 1,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getHalfMonthlyReport = async (req, res) => {
  try {
    const { year, month, half, format = 'json' } = req.query;
    
    // Validate inputs
    const yearNum = parseInt(year);
    const monthNum = parseInt(month) - 1; // JavaScript months are 0-indexed
    const halfNum = parseInt(half);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 0 || monthNum > 11 || ![1, 2].includes(halfNum)) {
      return res.status(400).json({ message: 'Invalid year, month, or half' });
    }
    
    // Calculate date range
    const startDate = new Date(yearNum, monthNum, halfNum === 1 ? 1 : 16);
    let endDate;
    
    if (halfNum === 1) {
      endDate = new Date(yearNum, monthNum, 15);
    } else {
      // Last day of month
      endDate = new Date(yearNum, monthNum + 1, 0);
    }
    
    // Get all classes
    const classes = await Class.find();
    
    // Gather report data for each class
    const reportData = await Promise.all(classes.map(async classObj => {
      // Get all active students in the class
      const students = await Student.find({ class: classObj._id, isActive: true });
      
      // Get all attendance records for the class in the date range
      const attendanceRecords = await Attendance.find({
        class: classObj._id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
      
      // Calculate statistics similar to monthly report
      // (reusing similar code structure as in getMonthlyReport)
      
      // Calculate totals per student
      const studentReports = students.map(student => {
        const studentAttendance = attendanceRecords.map(record => {
          const studentRecord = record.students.find(
            s => s.student.toString() === student._id.toString()
          );
          
          return {
            date: record.date,
            present: studentRecord ? studentRecord.present : false,
            mealTaken: studentRecord ? studentRecord.mealTaken : false,
            menuType: record.menuType
          };
        });
        
        // Calculate totals
        const totalPresent = studentAttendance.filter(a => a.present).length;
        const totalMealTaken = studentAttendance.filter(a => a.mealTaken).length;
        const regularMeals = studentAttendance.filter(a => a.mealTaken && a.menuType === 'regularMenu').length;
        const sukhdiMeals = studentAttendance.filter(a => a.mealTaken && a.menuType === 'sukhdi').length;
        
        return {
          student: {
            id: student._id,
            name: student.name,
            rollNumber: student.rollNumber,
            gender: student.gender,
            category: student.category
          },
          attendance: studentAttendance,
          summary: {
            totalPresent,
            totalMealTaken,
            regularMeals,
            sukhdiMeals
          }
        };
      });
      
      // Calculate class totals by day
      const dailyTotals = attendanceRecords.map(record => {
        const presentCount = record.students.filter(s => s.present).length;
        const mealTakenCount = record.students.filter(s => s.mealTaken).length;
        
        // Count by gender
        const maleStudentIds = students
          .filter(s => s.gender === 'male')
          .map(s => s._id.toString());
        
        const femaleStudentIds = students
          .filter(s => s.gender === 'female')
          .map(s => s._id.toString());
        
        const malePresent = record.students.filter(
          s => s.present && maleStudentIds.includes(s.student.toString())
        ).length;
        
        const femalePresent = record.students.filter(
          s => s.present && femaleStudentIds.includes(s.student.toString())
        ).length;
        
        const maleMealTaken = record.students.filter(
          s => s.mealTaken && maleStudentIds.includes(s.student.toString())
        ).length;
        
        const femaleMealTaken = record.students.filter(
          s => s.mealTaken && femaleStudentIds.includes(s.student.toString())
        ).length;
        
        // Count by category
        const categoryMap = {
          general: { present: 0, mealTaken: 0 },
          sc: { present: 0, mealTaken: 0 },
          st: { present: 0, mealTaken: 0 },
          obc: { present: 0, mealTaken: 0 }
        };
        
        students.forEach(student => {
          const category = student.category;
          const studentRecord = record.students.find(
            s => s.student.toString() === student._id.toString()
          );
          
          if (studentRecord) {
            if (studentRecord.present) {
              categoryMap[category].present++;
            }
            if (studentRecord.mealTaken) {
              categoryMap[category].mealTaken++;
            }
          }
        });
        
        return {
          date: record.date,
          menuType: record.menuType,
          totals: {
            present: presentCount,
            mealTaken: mealTakenCount,
            malePresent,
            femalePresent,
            maleMealTaken,
            femaleMealTaken,
            byCategory: categoryMap
          }
        };
      });
      
      // Calculate half-monthly totals
      const halfMonthlyTotal = {
        presentDays: dailyTotals.filter(d => d.totals.present > 0).length,
        totalPresent: dailyTotals.reduce((sum, day) => sum + day.totals.present, 0),
        totalMealTaken: dailyTotals.reduce((sum, day) => sum + day.totals.mealTaken, 0),
        malePresent: dailyTotals.reduce((sum, day) => sum + day.totals.malePresent, 0),
        femalePresent: dailyTotals.reduce((sum, day) => sum + day.totals.femalePresent, 0),
        maleMealTaken: dailyTotals.reduce((sum, day) => sum + day.totals.maleMealTaken, 0),
        femaleMealTaken: dailyTotals.reduce((sum, day) => sum + day.totals.femaleMealTaken, 0),
        regularMenuDays: dailyTotals.filter(d => d.menuType === 'regularMenu').length,
        sukhdiDays: dailyTotals.filter(d => d.menuType === 'sukhdi').length
      };
      
      return {
        class: {
          id: classObj._id,
          standard: classObj.standard,
          division: classObj.division
        },
        dateRange: {
          start: startDate,
          end: endDate
        },
        students: studentReports,
        dailyTotals,
        halfMonthlyTotal
      };
    }));
    
    // Generate response based on requested format
    if (format === 'pdf') {
      const pdfBuffer = await generatePdf(reportData, { 
        year, 
        month, 
        half, 
        reportType: 'halfMonthly' 
      });
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=mdm_report_${year}_${month}_half${half}.pdf`
      });
      
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const excelBuffer = await generateExcel(reportData, { 
        year, 
        month, 
        half, 
        reportType: 'halfMonthly' 
      });
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=mdm_report_${year}_${month}_half${half}.xlsx`
      });
      
      return res.send(excelBuffer);
    }
    
    // Default JSON response
    res.json({
      reportType: 'halfMonthly',
      year,
      month: monthNum + 1,
      half: halfNum,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Additional report functions (weekly, semi-yearly, etc.) would follow a similar pattern
