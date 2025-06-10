# MDM Server Backup System Setup Guide

This guide will help you set up a comprehensive backup system for your MDM server using Google Drive and GitHub Actions.

## 🎯 Overview

The backup system provides:
- **Automated daily backups** via GitHub Actions
- **Google Drive integration** for cloud storage
- **Data compression** to save storage space
- **Multiple backup types** (full, users, attendance, students)
- **Backup verification** and health monitoring
- **Automatic cleanup** of old backups

## 📋 Prerequisites

1. **Google Cloud Project** with Drive API enabled
2. **GitHub repository** for your MDM server
3. **Vercel deployment** of your MDM server
4. **Admin user account** in your MDM system

## 🔧 Setup Instructions

### Step 1: Install Dependencies

```bash
npm install googleapis
```

### Step 2: Google Drive API Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Drive API

2. **Create Service Account:**
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Name: `mdm-backup-service`
   - Grant role: `Editor` or `Storage Admin`

3. **Generate Service Account Key:**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Download the key file

4. **Create Google Drive Folder (Optional):**
   - Create a dedicated folder in Google Drive for backups
   - Share the folder with your service account email
   - Copy the folder ID from the URL

### Step 3: Environment Variables

Add these environment variables to your Vercel deployment:

```env
# Google Drive Configuration
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
GOOGLE_DRIVE_FOLDER_ID=your-folder-id-here

# Backup Configuration
BACKUP_SCHEDULE_ENABLED=true
BACKUP_FREQUENCY=daily
BACKUP_TIME=02:00
BACKUP_TIMEZONE=UTC
```

**Important:** The `GOOGLE_DRIVE_CREDENTIALS` should be the entire JSON content from your service account key file, minified into a single line.

### Step 4: GitHub Secrets

Add these secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:

```
VERCEL_APP_URL=https://your-app.vercel.app
BACKUP_API_TOKEN=your-admin-jwt-token
```

**To get your BACKUP_API_TOKEN:**
1. Login to your MDM system as admin
2. Copy the JWT token from the response or browser storage
3. Use this token in GitHub secrets

### Step 5: Test the Setup

1. **Test Google Drive Connection:**
   ```bash
   curl -X GET "https://your-app.vercel.app/api/backup/drive/test" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Test Manual Backup:**
   ```bash
   curl -X POST "https://your-app.vercel.app/api/backup/full" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json"
   ```

3. **Check Backup Health:**
   ```bash
   curl -X GET "https://your-app.vercel.app/api/backup/health" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## 📊 Available API Endpoints

### Backup Operations
- `GET /api/backup/health` - System health check
- `GET /api/backup/stats` - Backup statistics
- `POST /api/backup/full` - Full database backup
- `GET /api/backup/export/users` - Export users only
- `GET /api/backup/export/attendance` - Export attendance data
- `GET /api/backup/export/students` - Export student registrations

### Google Drive Management
- `GET /api/backup/drive/test` - Test Drive connection
- `GET /api/backup/drive/quota` - Check Drive quota
- `GET /api/backup/drive/files` - List backup files
- `GET /api/backup/drive/download/:fileId` - Download backup
- `DELETE /api/backup/drive/cleanup` - Cleanup old backups

### Configuration
- `GET /api/backup/config` - Backup configuration
- `GET /api/backup/schedule` - Backup schedule info

## 🤖 GitHub Actions Automation

The system includes automated workflows:

### Daily Backup (2:00 AM UTC)
- Performs full database backup
- Uploads to Google Drive
- Checks system health
- Cleans up old backups (30+ days)
- Provides detailed summary

### Manual Backup Trigger
- Go to GitHub Actions tab
- Select "Automated Database Backup"
- Click "Run workflow"
- Choose backup type and options

### Weekly Verification
- Verifies backup files exist
- Checks backup frequency
- Reports any issues

## 📈 Monitoring and Maintenance

### Backup Verification
```bash
# Check recent backups
curl -X GET "https://your-app.vercel.app/api/backup/drive/files?limit=7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check Google Drive quota
curl -X GET "https://your-app.vercel.app/api/backup/drive/quota" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Manual Cleanup
```bash
# Remove backups older than 30 days
curl -X DELETE "https://your-app.vercel.app/api/backup/drive/cleanup?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Considerations

1. **Service Account Permissions:**
   - Use minimal required permissions
   - Regularly rotate service account keys
   - Monitor access logs

2. **API Token Security:**
   - Use admin-only tokens for backups
   - Regularly rotate JWT secrets
   - Monitor backup API usage

3. **Data Encryption:**
   - Data is encrypted in transit (HTTPS)
   - Google Drive provides encryption at rest
   - Consider additional encryption for sensitive data

## 🚨 Troubleshooting

### Common Issues

1. **Google Drive Authentication Failed:**
   - Verify service account key is correct
   - Check if Drive API is enabled
   - Ensure service account has proper permissions

2. **Backup API Returns 401:**
   - Check if JWT token is valid
   - Verify user has admin privileges
   - Ensure token hasn't expired

3. **GitHub Actions Failing:**
   - Verify GitHub secrets are set correctly
   - Check if Vercel app URL is accessible
   - Review GitHub Actions logs for details

4. **Large Backup Files:**
   - Use compression (`?compress=true`)
   - Consider paginated exports for large datasets
   - Monitor Google Drive quota usage

### Debug Commands

```bash
# Test authentication
curl -X GET "https://your-app.vercel.app/api/backup/health" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" -v

# Check compression stats
curl -X GET "https://your-app.vercel.app/api/backup/export/users?compress=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Verify Google Drive setup
curl -X GET "https://your-app.vercel.app/api/backup/drive/test" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 Backup File Format

Backup files are stored in JSON format with the following structure:

```json
{
  "backupType": "full",
  "backupDate": "2025-01-09T02:00:00.000Z",
  "version": "1.0.0",
  "collections": {
    "users": {
      "count": 25,
      "data": [...]
    },
    "attendance": {
      "count": 1500,
      "data": [...]
    },
    "registeredStudents": {
      "count": 900,
      "data": [...]
    }
  },
  "summary": {
    "totalUsers": 25,
    "totalAttendanceRecords": 1500,
    "totalStudentRecords": 900,
    "totalSize": 2048576
  },
  "cloudBackup": {
    "uploaded": true,
    "fileId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "fileName": "mdm-backup-2025-01-09.json",
    "uploadDate": "2025-01-09T02:00:15.000Z"
  }
}
```

## 🎯 Best Practices

1. **Regular Testing:**
   - Test backup restoration monthly
   - Verify backup file integrity
   - Monitor backup success rates

2. **Storage Management:**
   - Set up quota alerts in Google Drive
   - Implement retention policies
   - Consider multiple backup destinations

3. **Documentation:**
   - Keep backup procedures documented
   - Maintain recovery procedures
   - Document any custom configurations

4. **Monitoring:**
   - Set up alerts for backup failures
   - Monitor backup file sizes
   - Track backup performance metrics

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Verify all environment variables are set correctly
4. Test individual API endpoints manually

For additional help, refer to:
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
