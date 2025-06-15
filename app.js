// app.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import passport from 'passport';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';


// Import routes
import authRoutes from './routes/auth.js';
import attendanceRoutes from './routes/attendance.js';
import registeredStudentsRoutes from './routes/registeredStudents.js';
import backupRoutes from './routes/backup.js';
import teacherRoutes from './routes/teachers.js';
import schoolCodeRoutes from './routes/schoolCode.js';
import classRoutes from './routes/classes.js';

// Import passport config
import configurePassport from './config/passport.js';
// Import database middleware
import { ensureDbConnection } from './config/database.js';

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' })); // Increased limit for base64 images
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));

// Database connection middleware - ensures connection for each request
app.use(ensureDbConnection);

// Passport middleware
app.use(passport.initialize());
configurePassport(passport);

// Routes
app.get('/test',(req, res) => {
  res.send('API is working');
} );

// Health check endpoint for database connection
app.get('/api/health/db', async (req, res) => {
  try {
    await ensureDbConnection(req, res, () => {});
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      status: 'success',
      connectionState: states[state],
      readyState: state,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/registered', registeredStudentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/school-code', schoolCodeRoutes);
app.use('/api/classes', classRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

export default app;
