import mongoose from 'mongoose';

const SchoolCodeSchema = new mongoose.Schema({
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
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^[A-Z0-9]{6}$/.test(v);
      },
      message: 'School code must be 6 characters (letters and numbers only)'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    default: () => {
      // Default expiry: 1 year from creation
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      return expiry;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries by school
SchoolCodeSchema.index({ schoolId: 1 });

// Index for code lookup
SchoolCodeSchema.index({ code: 1 });

// Method to check if code is expired
SchoolCodeSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Method to check if code is valid (active and not expired)
SchoolCodeSchema.methods.isValid = function() {
  return this.isActive && !this.isExpired();
};

// Static method to generate unique code
SchoolCodeSchema.statics.generateUniqueCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if code already exists
    const existingCode = await this.findOne({ code });
    if (!existingCode) {
      isUnique = true;
    }
  }
  
  return code;
};

const SchoolCode = mongoose.model('SchoolCode', SchoolCodeSchema);
export default SchoolCode;
