// app.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import passport from 'passport';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory name in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/registeredStudents.js';

// Import passport config
import configurePassport from './config/passport.js';

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploads directory statically
app.use('/uploads', express.static(uploadDir));

// Passport middleware
app.use(passport.initialize());
configurePassport(passport);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/registered', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

export default app;