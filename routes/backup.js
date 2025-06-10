import express from 'express';
import { 
    exportUsers, 
    exportAttendance, 
    exportStudents, 
    fullBackup, 
    backupHealth, 
    getBackupStats 
} from '../controllers/backupController.js';
import { 
    listBackupFiles, 
    downloadBackupFile, 
    cleanupOldBackups, 
    checkDriveQuota, 
    testDriveConnection 
} from '../utils/googleDrive.js';
import { authenticateWithSchool, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all backup routes
router.use(authenticateWithSchool);

// Health check endpoint (no admin required)
router.get('/health', backupHealth);

// Backup statistics (no admin required)
router.get('/stats', getBackupStats);

// Admin-only middleware (already imported)
const adminOnly = requireAdmin;

// Export endpoints
router.get('/export/users', adminOnly, exportUsers);
router.get('/export/attendance', adminOnly, exportAttendance);
router.get('/export/students', adminOnly, exportStudents);

// Full backup endpoint
router.post('/full', adminOnly, fullBackup);

// Google Drive management endpoints
router.get('/drive/test', adminOnly, async (req, res) => {
    try {
        const result = await testDriveConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to test Google Drive connection',
            error: error.message
        });
    }
});

router.get('/drive/quota', adminOnly, async (req, res) => {
    try {
        const result = await checkDriveQuota();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to check Google Drive quota',
            error: error.message
        });
    }
});

router.get('/drive/files', adminOnly, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const result = await listBackupFiles(limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to list backup files',
            error: error.message
        });
    }
});

router.get('/drive/download/:fileId', adminOnly, async (req, res) => {
    try {
        const { fileId } = req.params;
        const result = await downloadBackupFile(fileId);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="backup-${fileId}.json"`);
        res.json(result.data);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to download backup file',
            error: error.message
        });
    }
});

router.delete('/drive/cleanup', adminOnly, async (req, res) => {
    try {
        const retentionDays = parseInt(req.query.days) || 30;
        const result = await cleanupOldBackups(retentionDays);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup old backups',
            error: error.message
        });
    }
});

// Manual backup trigger endpoint
router.post('/trigger', adminOnly, async (req, res) => {
    try {
        const { type = 'full', compress = true } = req.body;
        
        let result;
        switch (type) {
            case 'users':
                result = await exportUsers({ query: { compress } }, res);
                break;
            case 'attendance':
                result = await exportAttendance({ query: { compress } }, res);
                break;
            case 'students':
                result = await exportStudents({ query: { compress } }, res);
                break;
            case 'full':
            default:
                result = await fullBackup(req, res);
                break;
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to trigger backup',
            error: error.message
        });
    }
});

// Backup configuration endpoint
router.get('/config', adminOnly, (req, res) => {
    const config = {
        googleDrive: {
            enabled: process.env.GOOGLE_DRIVE_ENABLED === 'true',
            configured: !!process.env.GOOGLE_DRIVE_CREDENTIALS,
            folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || 'root'
        },
        compression: {
            enabled: true,
            threshold: 1024 // bytes
        },
        retention: {
            defaultDays: 30,
            maxBackups: 100
        },
        limits: {
            maxRecordsPerPage: 1000,
            maxFileSize: '50MB'
        }
    };
    
    res.json({
        success: true,
        data: config
    });
});

// Backup schedule information
router.get('/schedule', adminOnly, (req, res) => {
    const schedule = {
        automated: {
            enabled: process.env.BACKUP_SCHEDULE_ENABLED === 'true',
            frequency: process.env.BACKUP_FREQUENCY || 'daily',
            time: process.env.BACKUP_TIME || '02:00',
            timezone: process.env.BACKUP_TIMEZONE || 'UTC'
        },
        lastBackup: {
            // This would be stored in database in a real implementation
            timestamp: null,
            status: 'unknown',
            type: null
        },
        nextBackup: {
            // This would be calculated based on schedule
            timestamp: null,
            type: 'full'
        }
    };
    
    res.json({
        success: true,
        data: schedule
    });
});

export default router;
