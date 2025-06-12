# MongoDB Atlas Connection Issues - Deployment Guide

## Problem Solved
This guide addresses the MongoDB Atlas connection timeout issue that occurs overnight with serverless deployments on Vercel.

### Original Error:
```json
{
    "message": "Server error",
    "error": "Operation users.findOne() buffering timed out after 10000ms"
}
```

## Root Causes Identified

1. **No Connection Pooling**: Serverless functions need proper connection pooling configuration
2. **Missing Timeout Settings**: Default mongoose timeouts are not suitable for serverless environments
3. **Connection Reuse Issues**: Cold starts cause stale connections
4. **No Connection State Management**: No proper handling of connection states

## Solutions Implemented

### 1. Enhanced Database Configuration (`config/database.js`)

**Key Features:**
- **Connection Pooling**: `maxPoolSize: 10` for optimal connection management
- **Timeout Settings**: 
  - `serverSelectionTimeoutMS: 5000` - Quick server selection
  - `socketTimeoutMS: 45000` - Socket timeout for long operations
  - `connectTimeoutMS: 10000` - Initial connection timeout
- **Buffer Management**: Disabled mongoose buffering for immediate failures
- **Heartbeat**: `heartbeatFrequencyMS: 10000` for connection health checks
- **Retry Logic**: Enabled `retryWrites` and `retryReads`

### 2. Connection State Management

**Global Connection Tracking:**
```javascript
let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Using existing MongoDB connection');
    return mongoose.connection;
  }
  // ... connection logic
};
```

### 3. Request-Level Connection Middleware

**Automatic Connection Handling:**
```javascript
export const ensureDbConnection = async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
};
```

### 4. Vercel Configuration Optimization

**Enhanced `vercel.json`:**
- **Function Timeout**: `maxDuration: 30` seconds
- **Lambda Size**: `maxLambdaSize: "50mb"`
- **Environment**: Production mode settings

## Deployment Steps

### 1. Environment Variables
Ensure your Vercel project has the following environment variable:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### 2. MongoDB Atlas Configuration
In your MongoDB Atlas cluster:
- **Network Access**: Add `0.0.0.0/0` (or specific Vercel IPs)
- **Database Access**: Ensure user has read/write permissions
- **Connection String**: Use the SRV connection string format

### 3. Deploy to Vercel
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel --prod
```

## Monitoring and Troubleshooting

### 1. Connection Health Check
A health check endpoint has been added to monitor connection status:
```
GET /api/health/db
```

Example response:
```json
{
  "status": "success",
  "connectionState": "connected",
  "readyState": 1,
  "timestamp": "2025-06-12T03:00:26.265Z"
}
```

This endpoint helps you monitor the database connection status in real-time.

### 2. Vercel Function Logs
Monitor your deployment logs:
```bash
vercel logs [deployment-url]
```

### 3. Common Issues and Solutions

**Issue**: Still getting timeout errors
**Solution**: 
- Check MongoDB Atlas network access whitelist
- Verify connection string format
- Ensure environment variables are set in Vercel

**Issue**: Cold start delays
**Solution**: 
- The middleware ensures connection on each request
- Consider implementing a warming function for critical endpoints

**Issue**: Connection pool exhaustion
**Solution**: 
- Monitor connection usage
- Adjust `maxPoolSize` if needed
- Implement connection cleanup in error handlers

## Best Practices for Serverless MongoDB

1. **Always use connection pooling** with appropriate limits
2. **Set aggressive timeouts** for quick failure detection
3. **Disable mongoose buffering** in serverless environments
4. **Implement connection state tracking** to avoid redundant connections
5. **Use middleware** to ensure connections before database operations
6. **Monitor connection health** with dedicated endpoints
7. **Handle connection errors gracefully** with proper error responses

## Performance Optimizations

1. **Database Indexes**: Automatically created for multi-tenant queries
2. **Connection Reuse**: Global connection state prevents redundant connections
3. **Quick Failures**: Aggressive timeouts prevent hanging requests
4. **Retry Logic**: Built-in retry for transient network issues

## Testing the Fix

After deployment, test the following scenarios:

1. **Immediate Requests**: Should work normally
2. **After Idle Period**: Wait 30+ minutes, then test (simulates overnight scenario)
3. **High Load**: Multiple concurrent requests
4. **Error Recovery**: Test behavior after network interruptions

The connection timeout issue should now be resolved, and your API should maintain stable connections even after idle periods.
