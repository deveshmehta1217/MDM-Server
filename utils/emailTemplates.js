// Email templates
export const getPasswordResetEmailTemplate = (user, resetUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request - EduMeal Tracker App</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #ff6b35;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .reset-icon {
                font-size: 48px;
                color: #ff6b35;
                margin-bottom: 15px;
            }
            .reset-title {
                font-size: 24px;
                font-weight: bold;
                color: #ff6b35;
                margin-bottom: 10px;
            }
            .reset-message {
                font-size: 16px;
                color: #555;
                margin-bottom: 30px;
            }
            .info-box {
                background: #fff3e0;
                border-left: 4px solid #ff6b35;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .info-label {
                font-weight: bold;
                color: #555;
                width: 40%;
            }
            .info-value {
                color: #333;
                width: 60%;
            }
            .reset-button {
                display: inline-block;
                background:#0070e8;
                color: white;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 30px;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
                text-align: center;
                box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
                transition: all 0.3s ease;
            }
            .reset-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
            }
            .security-notice {
                background: #e8f5e8;
                border: 1px solid #4caf50;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
            }
            .security-item {
                margin: 10px 0;
                padding-left: 20px;
                position: relative;
            }
            .security-item::before {
                content: "🔒";
                position: absolute;
                left: 0;
                font-size: 14px;
            }
            .warning-box {
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .contact-info {
                background: #f1f8e9;
                border: 1px solid #8bc34a;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
            }
            .whatsapp-box {
                background: #e8f5e8;
                border: 1px solid #25d366;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                text-align: center;
            }
            .whatsapp-button {
                display: inline-block;
                background: #25d366;
                color: white;
                padding: 12px 25px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 10px;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">EduMeal Tracker</div>
            </div>
            
            <div style="text-align: center;">
                <div class="reset-icon">🔐</div>
                <div class="reset-title">Password Reset Request</div>
                <div class="reset-message">We received a request to reset your password</div>
            </div>
            
            <p>Hello <strong>${user.contactPersonName}</strong>,</p>
            
            <p>You have requested to reset your password for your EduMeal Tracker App account. If you didn't make this request, please ignore this email and your password will remain unchanged.</p>
            
            <div class="info-box">
                <h3 style="margin-top: 0; color: #ff6b35;">📋 Account Details</h3>
                <div class="info-row">
                    <span class="info-label">School Name:</span>
                    <span class="info-value">${user.schoolName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">School ID:</span>
                    <span class="info-value">${user.schoolId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${user.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Request Time:</span>
                    <span class="info-value">${new Date().toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="reset-button">
                    🔑 Reset My Password
                </a>
            </div>
            
            <div class="warning-box">
                <h4 style="margin-top: 0; color: #856404;">⚠️ Important Security Notice</h4>
                <p style="margin-bottom: 0; font-weight: bold;">This link will expire in 1 hour for your security.</p>
            </div>
            
            <div class="security-notice">
                <h4 style="margin-top: 0; color: #2e7d32;">🛡️ Security Tips</h4>
                <div class="security-item">Choose a strong password with at least 8 characters</div>
                <div class="security-item">Include uppercase, lowercase, numbers, and special characters</div>
                <div class="security-item">Don't reuse passwords from other accounts</div>
                <div class="security-item">Keep your password confidential and secure</div>
            </div>
            
            <div class="contact-info">
                <h4 style="margin-top: 0; color: #689f38;">📞 Need Help?</h4>
                <p style="margin-bottom: 0;">If you're having trouble with the password reset or didn't request this change, please contact our support team immediately. We're here to help keep your account secure.</p>
            </div>
            
            <div class="footer">
                <p><strong>EduMeal Tracker App Security Team</strong></p>
                <p style="font-size: 12px; color: #999;">
                    This is an automated security email. Please do not reply to this message.<br>
                    If you didn't request this password reset, please contact support immediately.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const getRegistrationEmailTemplate = (user) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 26px; font-weight: bold; color: #007bff; }
            .welcome-text { font-size: 22px; color: #2c3e50; margin-bottom: 10px; font-weight: bold; }
            .info-box { background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; color: #555; width: 45%; }
            .info-value { color: #333; width: 55%; text-align: right; }
            .status-badge { display: inline-block; padding: 6px 12px; background: #ffc107; color: #856404; border-radius: 20px; font-weight: bold; font-size: 13px; }
            .tutorial-section { background: #fff3e0; border: 1px solid #ff9800; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }
            .tutorial-button { display: inline-block; background: #ff9800; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 10px; }
            .whatsapp-box { background: #e8f5e8; border: 1px solid #25d366; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }
            .whatsapp-button { display: inline-block; background: #25d366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 10px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 13px; }
            .gj { color: #555; font-size: 15px; margin-top: 4px; display: block; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><div class="logo">EduMeal Tracker System</div></div>
            
            <div class="welcome-text">
                Welcome to EduMeal Tracker App!
                <span class="gj">EduMeal Tracker App માં આપનું સ્વાગત છે!</span>
            </div>
            
            <p>Dear <strong>${user.contactPersonName}</strong>,</p>
            <p>Thank you for registering. Your <strong>Account</strong> has been created and is pending <strong>Verification</strong>.</p>
            <p class="gj">રજીસ્ટ્રેશન કરવા બદલ આભાર. તમારું <strong>Account</strong> બનાવી દેવામાં આવ્યું છે અને અત્યારે <strong>Verification</strong> માટે બાકી છે.</p>

            <div class="info-box">
                <h3 style="margin-top: 0; color: #007bff;">📋 Registration Details</h3>
                <div class="info-row">
                    <span class="info-label">School Name / શાળાનું નામ</span>
                    <span class="info-value">${user.schoolName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status / સ્થિતિ</span>
                    <span class="info-value"><span class="status-badge">⏳ Pending Verification</span></span>
                </div>
            </div>

            <div class="tutorial-section">
                <h3 style="margin-top: 0; color: #e65100;">📺 Tutorial Playlist</h3>
                <p>Watch these videos to learn how to use the <strong>App</strong>.</p>
                <p class="gj"><strong>App</strong> નો ઉપયોગ કેવી રીતે કરવો તે શીખવા માટે આ વિડીયો જુઓ.</p>
                <a href="${process.env.TUTORIAL_PLAYLIST_LINK || '#'}" class="tutorial-button">▶️ Watch Tutorials / વિડીયો જુઓ</a>
            </div>

            ${process.env.WHATSAPP_VERIFICATION_GROUP_LINK ? `
            <div class="whatsapp-box">
                <h4 style="margin-top: 0; color: #25d366;">💬 Join Our Community</h4>
                <p>Connect with other schools and get <strong>Support</strong> by joining our <strong>WhatsApp Group</strong>!</p>
                <p class="gj">અમારી <strong>WhatsApp Group</strong> માં જોડાઈને અન્ય શાળાઓ સાથે કનેક્ટ થાઓ અને <strong>Support</strong> મેળવો!</p>
                <a href="${process.env.WHATSAPP_VERIFICATION_GROUP_LINK}" class="whatsapp-button">
                    📱 Join WhatsApp Group / ગ્રુપમાં જોડાઓ
                </a>
            </div>
            ` : ''}

            <div class="footer">
                <p><strong>EduMeal Tracker Team</strong></p>
                <p>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const getVerificationEmailTemplate = (user, isVerified = true) => {
  const statusColor = isVerified ? '#4caf50' : '#f44336';
  const statusIcon = isVerified ? '✅' : '❌';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .status-header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid ${statusColor}; padding-bottom: 20px; }
            .status-title { font-size: 24px; font-weight: bold; color: ${statusColor}; margin-top: 10px; }
            .gj { color: #555; font-size: 15px; display: block; margin-top: 5px; }
            .login-button { display: block; background: ${statusColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; text-align: center; margin: 25px 0; }
            .tutorial-box { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
            .whatsapp-box { background: #e8f5e8; border: 1px solid #25d366; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }
            .whatsapp-button { display: inline-block; background: #25d366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 10px; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="status-header">
                <div style="font-size: 48px;">${statusIcon}</div>
                <div class="status-title">
                    ${isVerified ? 'Account Verified' : 'Verification Revoked'}
                    <span class="gj">${isVerified ? 'Account Verify થઈ ગયું છે' : 'Account Verification રદ કરેલ છે'}</span>
                </div>
            </div>
            
            <p>Dear <strong>${user.contactPersonName}</strong>,</p>
            <p>
                ${isVerified 
                  ? 'Congratulations! Your account is now active. You can <strong>Login</strong> and start using all features.' 
                  : 'Your account <strong>Verification</strong> has been revoked. Please contact the <strong>Admin</strong> team.'}
            </p>
            <p class="gj">
                ${isVerified 
                  ? 'અભિનંદન! તમારું એકાઉન્ટ હવે એક્ટિવ છે. તમે <strong>Login</strong> કરીને બધી સુવિધાઓનો ઉપયોગ કરી શકો છો.' 
                  : 'તમારા એકાઉન્ટનું <strong>Verification</strong> રદ કરવામાં આવ્યું છે. કૃપા કરીને <strong>Admin</strong> ટીમનો સંપર્ક કરો.'}
            </p>

            ${isVerified ? `
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="login-button">
                🚀 Login to App / એપમાં લોગિન કરો
            </a>

            <div class="tutorial-box">
                <h4 style="margin: 0; color: #1565c0;">📖 Tutorial Playlist</h4>
                <p class="gj"><strong>App</strong> નો ઉપયોગ કેવી રીતે કરવો તે શીખવા માટે આ વિડીયો જુઓ:</p>
                <a href="${process.env.TUTORIAL_PLAYLIST_LINK || '#'}" style="color: #1565c0; font-weight: bold; text-decoration: underline;">
                    Click here for Tutorials / ટ્યુટોરીયલ માટે અહીં ક્લિક કરો
                </a>
            </div>

            ${process.env.WHATSAPP_VERIFICATION_GROUP_LINK ? `
            <div class="whatsapp-box">
                <h4 style="margin: 0; color: #25d366;">🎉 Join Verified Schools Community</h4>
                <p>Join our exclusive <strong>WhatsApp Group</strong> for verified schools to get advanced <strong>Support</strong>!</p>
                <p class="gj">એડવાન્સ <strong>Support</strong> મેળવવા માટે વેરિફાઇડ શાળાઓ માટેના અમારા ખાસ <strong>WhatsApp Group</strong> માં જોડાઓ!</p>
                <a href="${process.env.WHATSAPP_VERIFICATION_GROUP_LINK}" class="whatsapp-button">
                    📱 Join Verified Group / ગ્રુપમાં જોડાઓ
                </a>
            </div>
            ` : ''}
            ` : ''}

            <div class="footer">
                <p><strong>EduMeal Tracker Team</strong></p>
                <p>School: ${user.schoolName} | ID: ${user.schoolId}</p>
            </div>
        </div>
    </body>
    </html>
  `;
};