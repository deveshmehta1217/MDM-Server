import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize Google Drive API with OAuth2
const initializeDrive = async () => {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_DRIVE_OAUTH_CREDENTIALS);
        const { client_id, client_secret, redirect_uris } = credentials.web;

        const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        // Load tokens from file
        const token = JSON.parse(process.env.GOOGLE_DRIVE_TOKEN);
        auth.setCredentials(token);

        return google.drive({ version: 'v3', auth });
    } catch (error) {
        console.error('Failed to initialize Google Drive:', error);
        throw new Error('Google Drive initialization failed');
    }
};

const getDriveOptions = () => {
    const options = {};
    if (process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID) {
        options.driveId = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID;
        options.supportsAllDrives = true;
        options.includeItemsFromAllDrives = true;
    }
    return options;
};

// Upload data to Google Drive
export const uploadToGoogleDrive = async (data, fileName) => {
    try {
        if (!process.env.GOOGLE_DRIVE_CREDENTIALS) {
            throw new Error('Google Drive credentials not configured');
        }

        const drive = await initializeDrive();
        const jsonData = JSON.stringify(data, null, 2);

        const bufferStream = new Readable();
        bufferStream.push(jsonData);
        bufferStream.push(null);

        const fileMetadata = {
            name: fileName,
            ...(
                process.env.GOOGLE_DRIVE_FOLDER_ID
                    ? { parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] }
                    : {}
            ),
            ...getDriveOptions()
        };

        const media = {
            mimeType: 'application/json',
            body: bufferStream
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id,name,size,createdTime',
            ...getDriveOptions()
        });

        console.log('File uploaded to Google Drive:', response.data);

        return {
            success: true,
            fileId: response.data.id,
            fileName: response.data.name,
            size: response.data.size,
            createdTime: response.data.createdTime,
            webViewLink: `https://drive.google.com/file/d/${response.data.id}/view`
        };

    } catch (error) {
        console.error('Google Drive upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
    }
};

// List backup files from Google Drive
export const listBackupFiles = async (limit = 10) => {
    try {
        const drive = await initializeDrive();

        const response = await drive.files.list({
            q: "name contains 'mdm-backup' and mimeType='application/json'",
            orderBy: 'createdTime desc',
            pageSize: limit,
            fields: 'files(id,name,size,createdTime,modifiedTime)',
            ...getDriveOptions()
        });

        return {
            success: true,
            files: response.data.files || []
        };

    } catch (error) {
        console.error('List backup files error:', error);
        throw new Error(`Failed to list backup files: ${error.message}`);
    }
};

// Download backup file from Google Drive
export const downloadBackupFile = async (fileId) => {
    try {
        const drive = await initializeDrive();

        const response = await drive.files.get({
            fileId: fileId,
            alt: 'media',
            ...getDriveOptions()
        });

        return {
            success: true,
            data: response.data
        };

    } catch (error) {
        console.error('Download backup file error:', error);
        throw new Error(`Failed to download backup file: ${error.message}`);
    }
};

// Delete old backup files (retention policy)
export const cleanupOldBackups = async (retentionDays = 30) => {
    try {
        const drive = await initializeDrive();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const response = await drive.files.list({
            q: `name contains 'mdm-backup' and mimeType='application/json' and createdTime < '${cutoffDate.toISOString()}'`,
            fields: 'files(id,name,createdTime)',
            ...getDriveOptions()
        });

        const filesToDelete = response.data.files || [];
        const deletionResults = [];

        // Delete old files
        for (const file of filesToDelete) {
            try {
                await drive.files.delete({ fileId: file.id });
                deletionResults.push({
                    success: true,
                    fileId: file.id,
                    fileName: file.name,
                    createdTime: file.createdTime
                });
                console.log(`Deleted old backup: ${file.name}`);
            } catch (deleteError) {
                deletionResults.push({
                    success: false,
                    fileId: file.id,
                    fileName: file.name,
                    error: deleteError.message
                });
            }
        }

        return {
            success: true,
            deletedCount: deletionResults.filter(r => r.success).length,
            failedCount: deletionResults.filter(r => !r.success).length,
            results: deletionResults
        };

    } catch (error) {
        console.error('Cleanup old backups error:', error);
        throw new Error(`Failed to cleanup old backups: ${error.message}`);
    }
};

// Check Google Drive quota
export const checkDriveQuota = async () => {
    try {
        const drive = await initializeDrive();
        
        const response = await drive.about.get({
            fields: 'storageQuota'
        });

        const quota = response.data.storageQuota;
        console.log(response.data)
        const usedBytes = parseInt(quota.usage || 0);
        const limitBytes = parseInt(quota.limit || 0);
        const usedPercentage = limitBytes > 0 ? (usedBytes / limitBytes) * 100 : 0;

        return {
            success: true,
            quota: {
                used: usedBytes,
                limit: limitBytes,
                usedFormatted: formatBytes(usedBytes),
                limitFormatted: formatBytes(limitBytes),
                usedPercentage: Math.round(usedPercentage * 100) / 100,
                available: limitBytes - usedBytes,
                availableFormatted: formatBytes(limitBytes - usedBytes)
            }
        };

    } catch (error) {
        console.error('Check drive quota error:', error);
        throw new Error(`Failed to check drive quota: ${error.message}`);
    }
};

// Helper function to format bytes
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Test Google Drive connection
export const testDriveConnection = async () => {
    try {
        const drive = await initializeDrive();
        
        // Try to get user info
        const response = await drive.about.get({
            fields: 'user'
        });

        return {
            success: true,
            connected: true,
            user: response.data.user,
            message: 'Google Drive connection successful'
        };

    } catch (error) {
        console.error('Test drive connection error:', error);
        return {
            success: false,
            connected: false,
            error: error.message,
            message: 'Google Drive connection failed'
        };
    }
};
