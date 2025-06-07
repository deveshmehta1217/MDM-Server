// server.js
import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createIndexes } from './config/database.js';

dotenv.config();
// MongoDB connection
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(async () => {
    console.log('MongoDB connected');
    // Create database indexes for multi-tenant optimization
    await createIndexes();
  })
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
