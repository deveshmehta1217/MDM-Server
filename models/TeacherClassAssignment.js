import mongoose from 'mongoose';

const TeacherClassAssignmentSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  schoolId: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{11}$/.test(v);
      },
      message: 'School ID must be exactly 11 digits'
    },
    index: true
  },
  standard: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4, 5, 6, 7, 8]
  },
  division: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D']
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Compound index to prevent duplicate assignments
TeacherClassAssignmentSchema.index({ 
  teacherId: 1, 
  schoolId: 1, 
  standard: 1, 
  division: 1 
}, { unique: true });

// Index for efficient queries by school and class
TeacherClassAssignmentSchema.index({ schoolId: 1, standard: 1, division: 1 });

// Index for efficient queries by teacher
TeacherClassAssignmentSchema.index({ teacherId: 1 });

const TeacherClassAssignment = mongoose.model('TeacherClassAssignment', TeacherClassAssignmentSchema);
export default TeacherClassAssignment;
