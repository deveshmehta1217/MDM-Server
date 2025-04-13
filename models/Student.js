// models/Student.js
import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'sc', 'st', 'obc'],
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a unique compound index for rollNumber and class
StudentSchema.index({ rollNumber: 1, class: 1 }, { unique: true });

const Student = mongoose.model('Student', StudentSchema);
export default Student;
