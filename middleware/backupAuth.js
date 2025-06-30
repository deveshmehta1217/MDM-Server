// Simple API key authentication for backup endpoints
export const authenticateBackupAPI = (req, res, next) => {
    try {
        const apiKey = req.headers['x-backup-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
        
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'Backup API key required',
                error: 'Missing X-Backup-API-Key header or Authorization Bearer token'
            });
        }

        const validApiKey = process.env.BACKUP_API_KEY;
        
        if (!validApiKey) {
            console.error('BACKUP_API_KEY not configured in environment variables');
            return res.status(500).json({
                success: false,
                message: 'Backup service not properly configured',
                error: 'Server configuration error'
            });
        }

        if (apiKey !== validApiKey) {
            console.warn('Invalid backup API key attempt:', {
                providedKey: apiKey.substring(0, 8) + '...',
                timestamp: new Date().toISOString(),
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            return res.status(401).json({
                success: false,
                message: 'Invalid backup API key',
                error: 'Authentication failed'
            });
        }

        // Set a flag to indicate this is a backup API request
        req.isBackupAPI = true;
        req.backupAuth = {
            authenticated: true,
            method: 'api-key',
            timestamp: new Date().toISOString()
        };

        next();

    } catch (error) {
        console.error('Backup API authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: error.message
        });
    }
};

// Optional: Rate limiting for backup API
export const backupRateLimit = (req, res, next) => {
    // Simple in-memory rate limiting (you might want to use Redis in production)
    const rateLimitKey = `backup_${req.ip}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 10; // Max 10 requests per minute

    if (!global.backupRateLimit) {
        global.backupRateLimit = new Map();
    }

    const requestLog = global.backupRateLimit.get(rateLimitKey) || [];
    const recentRequests = requestLog.filter(timestamp => now - timestamp < windowMs);

    if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
            success: false,
            message: 'Too many backup requests',
            error: `Rate limit exceeded. Max ${maxRequests} requests per minute.`,
            retryAfter: Math.ceil(windowMs / 1000)
        });
    }

    recentRequests.push(now);
    global.backupRateLimit.set(rateLimitKey, recentRequests);

    next();
};
