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
import userRoutes from './routes/registeredStudents.js';
import attendanceRoutes from './routes/attendance.js';

// Import passport config
import configurePassport from './config/passport.js';

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Passport middleware
app.use(passport.initialize());
configurePassport(passport);

// Routes
app.get('/test',(req, res) => {
  res.send('API is working');
} );
app.use('/api/auth', authRoutes);
app.use('/api/registered', userRoutes);
app.use('/api/attendance', attendanceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

export default app;