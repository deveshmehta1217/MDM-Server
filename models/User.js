// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  schoolSubName: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  mobileNo: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: 'Mobile number must be 10 digits'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  schoolName: {
    type: String,
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
  kendraNo: {
    type: String,
    required: true,
    trim: true
  },
  contactPersonName: {
    type: String,
    required: true,
    trim: true
  },
  contactPersonMobile: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: 'Contact person mobile number must be 10 digits'
    }
  },
  contactPersonEmail: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid contact person email address'
    }
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  isAdmin: {
    type: Boolean,
    default: false
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

// Update timestamp middleware
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Password hash middleware
UserSchema.pre('save', async function(next) {
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
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method to check if verification is still valid
UserSchema.methods.isVerificationValid = function() {
  if (!this.isVerified || !this.verifiedAt) {
    return false;
  }
  
  // Get verification validity period from environment (default: 1 year)
  const validityPeriod = parseInt(process.env.VERIFICATION_VALIDITY_YEARS || '1');
  const validityMs = validityPeriod * 365 * 24 * 60 * 60 * 1000; // Convert years to milliseconds
  
  const now = new Date();
  const verificationExpiry = new Date(this.verifiedAt.getTime() + validityMs);
  
  return now <= verificationExpiry;
};

// Generate JWT
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign({ 
    id: this._id, 
    schoolId: this.schoolId, 
    isAdmin: this.isAdmin,
    isVerified: this.isVerified,
    isVerificationValid: this.isVerificationValid()
  }, process.env.JWT_SECRET || 'mdm-secret-key', {
    expiresIn: '1d'
  });
};

const User = mongoose.model('User', UserSchema);
export default User;
