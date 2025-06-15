import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import SchoolCode from '../models/SchoolCode.js';
import TeacherClassAssignment from '../models/TeacherClassAssignment.js';
import RegisteredStudent from '../models/RegisteredStudents.js';
import nodemailer from 'nodemailer';

// Teacher self-registration
export const registerTeacher = async (req, res) => {
  try {
    const { name, email, mobileNo, password, schoolCode } = req.body;
    
    // Validate required fields
    if (!name || !email || !mobileNo || !password || !schoolCode) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Find and validate school code
    const validSchoolCode = await SchoolCode.findOne({ 
      code: schoolCode.toUpperCase(),
      isActive: true 
    });
    
    if (!validSchoolCode || !validSchoolCode.isValid()) {
      return res.status(400).json({ message: 'Invalid or expired school code' });
    }
    
    // Get principal details
    const principal = await User.findOne({ schoolId: validSchoolCode.schoolId });
    if (!principal) {
      return res.status(400).json({ message: 'School not found' });
    }
    
    // Check if teacher already exists with same mobile/email in this school
    const existingTeacher = await Teacher.findOne({
      schoolId: validSchoolCode.schoolId,
      $or: [{ email }, { mobileNo }]
    });
    
    if (existingTeacher) {
      return res.status(400).json({ 
        message: 'Teacher with this email or mobile number already exists in this school' 
      });
    }
    
    // Create new teacher
    const teacher = new Teacher({
      schoolId: validSchoolCode.schoolId,
      principalId: principal._id,
      name,
      email,
      mobileNo,
      password,
      schoolCode: schoolCode.toUpperCase()
    });
    
    await teacher.save();
    
    // Update teacher count
    await User.findByIdAndUpdate(principal._id, {
      $inc: { teacherCount: 1 }
    });
    
    // Send notification email to principal
    try {
      await sendTeacherRegistrationNotification(principal, teacher);
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Registration successful. Awaiting principal approval.',
      teacherId: teacher._id
    });
  } catch (error) {
    console.error('Teacher registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Teacher login
export const loginTeacher = async (req, res) => {
  try {
    const { mobileNo, password } = req.body;
    
    if (!mobileNo || !password) {
      return res.status(400).json({ message: 'Mobile number and password are required' });
    }
    
    // Find teacher by mobile number only (mobile numbers are unique across the system)
    const teacher = await Teacher.findOne({ 
      mobileNo 
    }).populate('principalId', 'schoolName');
    
    if (!teacher) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await teacher.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check if approved
    if (!teacher.isApproved) {
      return res.status(403).json({ message: 'Your account is pending approval from the principal' });
    }
    
    // Check if active
    if (!teacher.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }
    
    // Get assigned classes
    const assignments = await TeacherClassAssignment.find({ teacherId: teacher._id });
    const assignedClasses = assignments.map(a => ({ standard: a.standard, division: a.division }));
    
    // Generate token with assigned classes
    const token = teacher.generateAuthToken();
    
    res.json({
      success: true,
      token,
      user: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        mobileNo: teacher.mobileNo,
        schoolId: teacher.schoolId,
        schoolName: teacher.principalId.schoolName,
        role: 'TEACHER',
        isApproved: teacher.isApproved,
        isActive: teacher.isActive,
        assignedClasses
      }
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get pending teachers (Principal only)
export const getPendingTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({
      schoolId: req.schoolId,
      isApproved: false
    }).select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      teachers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all teachers (Principal only)
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({
      schoolId: req.schoolId
    }).select('-password').sort({ createdAt: -1 });
    
    // Get class assignments for each teacher
    const teachersWithClasses = await Promise.all(
      teachers.map(async (teacher) => {
        const assignments = await TeacherClassAssignment.find({ teacherId: teacher._id });
        const assignedClasses = assignments.map(a => ({ standard: a.standard, division: a.division }));
        
        return {
          ...teacher.toObject(),
          assignedClasses
        };
      })
    );
    
    res.json({
      success: true,
      teachers: teachersWithClasses
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve/Reject teacher (Principal only)
export const approveTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use "approve" or "reject"' });
    }
    
    const teacher = await Teacher.findOne({
      _id: teacherId,
      schoolId: req.schoolId
    });
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    if (action === 'approve') {
      teacher.isApproved = true;
      teacher.approvedAt = new Date();
      teacher.approvedBy = req.user.id;
      await teacher.save();
      
      // Send approval email
      try {
        await sendTeacherApprovalEmail(teacher, true);
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }
      
      res.json({
        success: true,
        message: 'Teacher approved successfully'
      });
    } else {
      // Reject - delete the teacher record
      await Teacher.findByIdAndDelete(teacherId);
      
      // Update teacher count
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { teacherCount: -1 }
      });
      
      // Send rejection email
      try {
        await sendTeacherApprovalEmail(teacher, false);
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }
      
      res.json({
        success: true,
        message: 'Teacher registration rejected'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Deactivate/Activate teacher (Principal only)
export const toggleTeacherStatus = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const teacher = await Teacher.findOne({
      _id: teacherId,
      schoolId: req.schoolId
    });
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    teacher.isActive = !teacher.isActive;
    await teacher.save();
    
    res.json({
      success: true,
      message: `Teacher ${teacher.isActive ? 'activated' : 'deactivated'} successfully`,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        isActive: teacher.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get teacher profile (Teacher only)
export const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id)
      .select('-password')
      .populate('principalId', 'schoolName');
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Get assigned classes with lock status
    const assignments = await TeacherClassAssignment.find({ teacherId: teacher._id });
    
    // Get current academic year
    const currYear = new Date().getFullYear();
    const currMonth = new Date().getMonth();
    const academicYear = currMonth < 5 ? `${currYear - 1}-${currYear}` : `${currYear}-${currYear + 1}`;
    
    // Get lock status for each assigned class
    const assignedClassesWithLockStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const registeredClass = await RegisteredStudent.findOne({
          schoolId: teacher.schoolId,
          standard: assignment.standard,
          division: assignment.division,
          academicYear
        }).select('isLocked lastLockedStatusUpdatedAt lockedBy')
          .populate('lockedBy', 'schoolName email');
        
        return {
          standard: assignment.standard,
          division: assignment.division,
          assignedAt: assignment.assignedAt,
          isLocked: registeredClass?.isLocked || false,
          lastLockedStatusUpdatedAt: registeredClass?.lastLockedStatusUpdatedAt || null,
          lockedBy: registeredClass?.lockedBy ? {
            _id: registeredClass.lockedBy._id,
            schoolName: registeredClass.lockedBy.schoolName,
            email: registeredClass.lockedBy.email
          } : null
        };
      })
    );
    
    res.json({
      success: true,
      teacher: {
        ...teacher.toObject(),
        assignedClasses: assignedClassesWithLockStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Email helper functions
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'yahoo',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@yahoo.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

const sendTeacherRegistrationNotification = async (principal, teacher) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@yahoo.com',
    to: principal.email,
    subject: 'New Teacher Registration - MDM Attendance App',
    html: `
      <h2>New Teacher Registration</h2>
      <p>A new teacher has registered for your school:</p>
      <ul>
        <li><strong>Name:</strong> ${teacher.name}</li>
        <li><strong>Email:</strong> ${teacher.email}</li>
        <li><strong>Mobile:</strong> ${teacher.mobileNo}</li>
        <li><strong>Registration Date:</strong> ${teacher.createdAt.toLocaleDateString()}</li>
      </ul>
      <p>Please log in to your MDM Attendance App to approve or reject this registration.</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

const sendTeacherApprovalEmail = async (teacher, isApproved) => {
  const transporter = createTransporter();
  const subject = isApproved 
    ? 'Registration Approved - MDM Attendance App'
    : 'Registration Rejected - MDM Attendance App';
    
  const message = isApproved
    ? 'Your teacher registration has been approved! You can now log in to the MDM Attendance App.'
    : 'Your teacher registration has been rejected. Please contact your school principal for more information.';
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@yahoo.com',
    to: teacher.email,
    subject,
    html: `
      <h2>${isApproved ? 'Registration Approved!' : 'Registration Rejected'}</h2>
      <p>Dear ${teacher.name},</p>
      <p>${message}</p>
      ${isApproved ? '<p>You can now use your mobile number and password to log in.</p>' : ''}
    `
  };
  
  await transporter.sendMail(mailOptions);
};

// Teacher forgot password
export const teacherForgotPassword = async (req, res) => {
  try {
    const { email, schoolId } = req.body;
    
    if (!email || !schoolId) {
      return res.status(400).json({ message: 'Email and school ID are required' });
    }
    
    // Find teacher by email and school
    const teacher = await Teacher.findOne({ 
      email, 
      schoolId,
      isApproved: true 
    }).populate('principalId', 'schoolName');
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found or not approved' });
    }
    
    // Generate reset token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set reset token and expiry (1 hour)
    teacher.resetPasswordToken = resetToken;
    teacher.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await teacher.save();
    
    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/reset-password/${resetToken}`;
    
    // Send email
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@yahoo.com',
      to: teacher.email,
      subject: 'Password Reset Request - MDM Attendance App (Teacher)',
      html: `
        <h2>Password Reset Request</h2>
        <p>Dear ${teacher.name},</p>
        <p>You have requested to reset your password for your teacher account at ${teacher.principalId.schoolName}.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p><strong>Login Details:</strong></p>
        <ul>
          <li>Mobile Number: ${teacher.mobileNo}</li>
          <li>School ID: ${teacher.schoolId}</li>
        </ul>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true,
      message: 'Password reset email sent successfully' 
    });
  } catch (error) {
    console.error('Teacher forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Teacher reset password
export const teacherResetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Find teacher with valid reset token
    const teacher = await Teacher.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!teacher) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Update password and clear reset token
    teacher.password = newPassword;
    teacher.resetPasswordToken = undefined;
    teacher.resetPasswordExpires = undefined;
    
    await teacher.save();
    
    res.json({ 
      success: true,
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Teacher reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Teacher change password
export const teacherChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    // Find teacher
    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Check current password
    const isMatch = await teacher.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    teacher.password = newPassword;
    await teacher.save();
    
    res.json({ 
      success: true,
      message: 'Password changed successfully' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
