import User from '../models/User.js';
import Attendance from '../models/Attendace.js';
import RegisteredStudent from '../models/RegisteredStudents.js';
import { uploadToGoogleDrive } from '../utils/googleDrive.js';
import { compressData } from '../utils/compression.js';

// Export all users data
export const exportUsers = async (req, res) => {
    try {
        const users = await User.find({}, {
            password: 0, // Exclude password field
            resetPasswordToken: 0,
            resetPasswordExpires: 0
        }).lean();

        const exportData = {
            exportType: 'users',
            exportDate: new Date().toISOString(),
            totalRecords: users.length,
            data: users
        };

        // Compress data if requested
        const compressed = req.query.compress === 'true';
        const finalData = compressed ? await compressData(exportData) : exportData;

        res.json({
            success: true,
            message: `Exported ${users.length} users`,
            compressed,
            data: finalData
        });

    } catch (error) {
        console.error('Export users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export users',
            error: error.message
        });
    }
};

// Export attendance data with optional date range and school filtering
export const exportAttendance = async (req, res) => {
    try {
        const { startDate, endDate, schoolId, page = 1, limit = 1000 } = req.query;
        
        // Build query
        let query = {};
        
        if (schoolId) {
            query.schoolId = schoolId;
        }
        
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Pagination for large datasets
        const skip = (page - 1) * limit;
        const attendance = await Attendance.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const totalRecords = await Attendance.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);

        const exportData = {
            exportType: 'attendance',
            exportDate: new Date().toISOString(),
            filters: { startDate, endDate, schoolId },
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRecords,
                recordsInThisPage: attendance.length
            },
            data: attendance
        };

        // Compress data if requested
        const compressed = req.query.compress === 'true';
        const finalData = compressed ? await compressData(exportData) : exportData;

        res.json({
            success: true,
            message: `Exported ${attendance.length} attendance records (Page ${page}/${totalPages})`,
            compressed,
            data: finalData
        });

    } catch (error) {
        console.error('Export attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export attendance',
            error: error.message
        });
    }
};

// Export registered students data
export const exportStudents = async (req, res) => {
    try {
        const { schoolId, academicYear } = req.query;
        
        let query = {};
        if (schoolId) query.schoolId = schoolId;
        if (academicYear) query.academicYear = academicYear;

        const students = await RegisteredStudent.find(query).lean();

        const exportData = {
            exportType: 'registeredStudents',
            exportDate: new Date().toISOString(),
            filters: { schoolId, academicYear },
            totalRecords: students.length,
            data: students
        };

        // Compress data if requested
        const compressed = req.query.compress === 'true';
        const finalData = compressed ? await compressData(exportData) : exportData;

        res.json({
            success: true,
            message: `Exported ${students.length} registered student records`,
            compressed,
            data: finalData
        });

    } catch (error) {
        console.error('Export students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export students',
            error: error.message
        });
    }
};

// Full database backup
export const fullBackup = async (req, res) => {
    try {
        const backupData = {
            backupType: 'full',
            backupDate: new Date().toISOString(),
            version: '1.0.0'
        };

        // Export all collections
        const [users, attendance, students] = await Promise.all([
            User.find({}, { password: 0, resetPasswordToken: 0, resetPasswordExpires: 0 }).lean(),
            Attendance.find({}).lean(),
            RegisteredStudent.find({}).lean()
        ]);

        backupData.collections = {
            users: {
                count: users.length,
                data: users
            },
            attendance: {
                count: attendance.length,
                data: attendance
            },
            registeredStudents: {
                count: students.length,
                data: students
            }
        };

        backupData.summary = {
            totalUsers: users.length,
            totalAttendanceRecords: attendance.length,
            totalStudentRecords: students.length,
            totalSize: JSON.stringify(backupData).length
        };

        // Auto-upload to Google Drive if configured
        if (process.env.GOOGLE_DRIVE_ENABLED === 'true') {
            try {
                const fileName = `mdm-backup-${new Date().toISOString().split('T')[0]}.json`;
                const uploadResult = await uploadToGoogleDrive(backupData, fileName);
                backupData.cloudBackup = {
                    uploaded: true,
                    fileId: uploadResult.fileId,
                    fileName: uploadResult.fileName,
                    uploadDate: new Date().toISOString()
                };
            } catch (uploadError) {
                console.error('Cloud upload failed:', uploadError);
                backupData.cloudBackup = {
                    uploaded: false,
                    error: uploadError.message
                };
            }
        }

        res.json({
            success: true,
            message: 'Full backup completed successfully',
            data: backupData
        });

    } catch (error) {
        console.error('Full backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create full backup',
            error: error.message
        });
    }
};

// Backup health check
export const backupHealth = async (req, res) => {
    try {
        const [userCount, attendanceCount, studentCount] = await Promise.all([
            User.countDocuments(),
            Attendance.countDocuments(),
            RegisteredStudent.countDocuments()
        ]);

        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                collections: {
                    users: userCount,
                    attendance: attendanceCount,
                    registeredStudents: studentCount
                }
            },
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                memoryUsage: process.memoryUsage()
            },
            backup: {
                googleDriveEnabled: process.env.GOOGLE_DRIVE_ENABLED === 'true',
                compressionEnabled: true,
                maxRecordsPerPage: 1000
            }
        };

        res.json({
            success: true,
            data: healthData
        });

    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: error.message,
            database: {
                connected: false
            }
        });
    }
};

// Get backup statistics
export const getBackupStats = async (req, res) => {
    try {
        const stats = await Promise.all([
            User.aggregate([
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } },
                        adminUsers: { $sum: { $cond: ['$isAdmin', 1, 0] } }
                    }
                }
            ]),
            Attendance.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRecords: { $sum: 1 },
                        oldestRecord: { $min: '$date' },
                        newestRecord: { $max: '$date' }
                    }
                }
            ]),
            RegisteredStudent.aggregate([
                {
                    $group: {
                        _id: '$academicYear',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const backupStats = {
            users: stats[0][0] || { totalUsers: 0, verifiedUsers: 0, adminUsers: 0 },
            attendance: stats[1][0] || { totalRecords: 0, oldestRecord: null, newestRecord: null },
            studentsByYear: stats[2] || [],
            lastUpdated: new Date().toISOString()
        };

        res.json({
            success: true,
            data: backupStats
        });

    } catch (error) {
        console.error('Backup stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get backup statistics',
            error: error.message
        });
    }
};
