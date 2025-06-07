// config/database.js
import mongoose from 'mongoose';

// Database indexes for multi-tenant optimization
export const createIndexes = async () => {
  try {
    console.log('Creating database indexes...');
    
    // User model indexes
    const UserModel = mongoose.model('User');
    await UserModel.createIndexes([
      { schoolId: 1 },
      { email: 1 },
      { mobileNo: 1 }
    ]);
    
    // Attendance model indexes
    const AttendanceModel = mongoose.model('Attendance');
    await AttendanceModel.createIndexes([
      { schoolId: 1, date: 1 },
      { schoolId: 1, standard: 1, division: 1, date: 1 },
      { schoolId: 1, date: 1, standard: 1, division: 1 }
    ]);
    
    // RegisteredStudent model indexes
    const RegisteredStudentModel = mongoose.model('RegisteredStudent');
    await RegisteredStudentModel.createIndexes([
      { schoolId: 1, academicYear: 1 },
      { schoolId: 1, standard: 1, division: 1, academicYear: 1 }
    ]);
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating database indexes:', error);
  }
};

// School ID validation utility
export const validateSchoolId = (schoolId) => {
  return /^[0-9]{11}$/.test(schoolId);
};

// Academic year utility
export const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Academic year starts in June (month 5)
  return month < 5 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
};

// School data isolation utility
export const ensureSchoolIsolation = (query, schoolId) => {
  if (!schoolId) {
    throw new Error('School ID is required for data access');
  }
  
  return {
    ...query,
    schoolId
  };
};
