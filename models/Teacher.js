import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const TeacherSchema = new mongoose.Schema({
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
  principalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  mobileNo: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: 'Mobile number must be 10 digits'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  schoolCode: {
    type: String,
    required: true
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for unique mobile number per school
TeacherSchema.index({ schoolId: 1, mobileNo: 1 }, { unique: true });

// Compound index for unique email per school
TeacherSchema.index({ schoolId: 1, email: 1 }, { unique: true });

// Update timestamp middleware
TeacherSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Password hash middleware
TeacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to check password
TeacherSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Generate JWT for teacher
TeacherSchema.methods.generateAuthToken = function() {
  return jwt.sign({ 
    id: this._id,
    teacherId: this._id,
    schoolId: this.schoolId,
    role: 'TEACHER',
    isApproved: this.isApproved,
    isActive: this.isActive
  }, process.env.JWT_SECRET || 'mdm-secret-key', {
    expiresIn: '8h' // Shorter expiry for teachers
  });
};

const Teacher = mongoose.model('Teacher', TeacherSchema);
export default Teacher;
