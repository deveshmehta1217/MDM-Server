// config/database.js
import mongoose from 'mongoose';

// Global connection state
let isConnected = false;

// MongoDB connection options for serverless deployment
const mongoOptions = {
  // Connection pool settings for serverless
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  
  // Heartbeat settings
  heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
  
  // Retry settings
  retryWrites: true,
  retryReads: true,
  
  // Connection timeout
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  
  // Additional serverless optimizations
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  minPoolSize: 0, // Minimum number of connections in the pool
};

// Connect to MongoDB with proper error handling for serverless
export const connectToDatabase = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Using existing MongoDB connection');
    return mongoose.connection;
  }

  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    console.log('Establishing new MongoDB connection...');
    await mongoose.connect(mongoURI, mongoOptions);
    isConnected = true;
    console.log('MongoDB connected successfully');
    
    // Create database indexes for multi-tenant optimization
    await createIndexes();
    
    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    isConnected = false;
    throw error;
  }
};

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

// Middleware to ensure database connection for each request
export const ensureDbConnection = async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection middleware error:', error);
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
};
