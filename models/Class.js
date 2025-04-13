// models/Class.js
import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
  standard: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  division: {
    type: String,
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a unique compound index for standard and division
ClassSchema.index({ standard: 1, division: 1 }, { unique: true });

const Class = mongoose.model('Class', ClassSchema);
export default Class;
