# MDM Attendance System API Documentation for Frontend Developers

## Overview

This document provides comprehensive API documentation for the MDM (Mid Day Meal) System. The system includes user management with verification requirements and attendance tracking functionality.

## Base URL

```
http://your-server-url/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## User Verification System

The system implements a verification requirement for most operations:
- Users can register, login, and manage their profile without verification
- All attendance-related operations require valid verification
- Verification validity is configurable (default: 1 year)
- Only admins can verify/unverify users

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Email Configuration (for password reset)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# Verification Validity (in years)
VERIFICATION_VALIDITY_YEARS=1
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/api/auth/register`

**Description:** Register a new user account

**Request Body:**
```json
{
  "schoolSubName": "school no 123",
  "password": "password123",
  "mobileNo": "9876543210",
  "email": "john@example.com",
  "schoolName": "ABC Primary School",
  "schoolId": "12345678901",
  "kendraNo": "KEN001",
  "contactPersonName": "Jane Smith",
  "contactPersonMobile": "9876543211",
  "contactPersonEmail": "jane@example.com",
  "paymentScreenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "isAdmin": false
}
```

**Response (201):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "schoolSubName": "school no 123",
    "mobileNo": "9876543210",
    "email": "john@example.com",
    "schoolName": "ABC Primary School",
    "schoolId": "12345678901",
    "kendraNo": "KEN001",
    "contactPersonName": "Jane Smith",
    "contactPersonMobile": "9876543211",
    "contactPersonEmail": "jane@example.com",
    "isAdmin": false,
    "isVerified": false,
    "verifiedAt": null
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Validation Rules:**
- All fields are required except `paymentScreenshot`
- `mobileNo`: Exactly 10 digits, unique
- `email`: Valid email format, unique
- `schoolId`: Exactly 11 digits
- `contactPersonMobile`: Exactly 10 digits
- `contactPersonEmail`: Valid email format
- `password`: Minimum 6 characters
- `paymentScreenshot` (optional): Base64 encoded image (JPEG, JPG, PNG, GIF), maximum 1MB size

---

### 2. Login User
**POST** `/api/auth/login`

**Description:** Login user and get JWT token

**Request Body:**
```json
{
  "schoolId": "12345678901",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "schoolSubName": "school no 123",
    "mobileNo": "9876543210",
    "email": "john@example.com",
    "schoolName": "ABC Primary School",
    "schoolId": "12345678901",
    "kendraNo": "KEN001",
    "contactPersonName": "Jane Smith",
    "contactPersonMobile": "9876543211",
    "contactPersonEmail": "jane@example.com",
    "isAdmin": false,
    "isVerified": false,
    "verifiedAt": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. Get User Profile
**GET** `/api/auth/profile`

**Description:** Get current user profile (No verification required)

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "_id": "user_id",
  "schoolSubName": "school no 123",
  "mobileNo": "9876543210",
  "email": "john@example.com",
  "schoolName": "ABC Primary School",
  "schoolId": "12345678901",
  "kendraNo": "KEN001",
  "contactPersonName": "Jane Smith",
  "contactPersonMobile": "9876543211",
  "contactPersonEmail": "jane@example.com",
  "isAdmin": false,
  "isVerified": false,
  "verifiedAt": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Update User Profile
**PUT** `/api/auth/profile`

**Description:** Update user profile (No verification required)

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (All fields optional)
```json
{
  "name": "John Updated",
  "mobileNo": "9876543212",
  "email": "john.updated@example.com",
  "schoolName": "ABC Updated School",
  "kendraNo": "KEN002",
  "contactPersonName": "Jane Updated",
  "contactPersonMobile": "9876543213",
  "contactPersonEmail": "jane.updated@example.com"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "user_id",
    "name": "John Updated",
    "mobileNo": "9876543212",
    "email": "john.updated@example.com",
    "schoolName": "ABC Updated School",
    "schoolId": "12345678901",
    "kendraNo": "KEN002",
    "contactPersonName": "Jane Updated",
    "contactPersonMobile": "9876543213",
    "contactPersonEmail": "jane.updated@example.com",
    "isAdmin": false,
    "isVerified": false,
    "verifiedAt": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 5. Change Password
**PUT** `/api/auth/change-password`

**Description:** Change user password (No verification required)

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

### 6. Forgot Password
**POST** `/api/auth/forgot-password`

**Description:** Send password reset email

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent successfully"
}
```

---

### 7. Reset Password
**POST** `/api/auth/reset-password`

**Description:** Reset password using token from email

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

### 8. Get Verification Status
**GET** `/api/auth/verification-status`

**Description:** Get current user's verification status

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "isVerified": true,
  "verifiedAt": "2024-01-01T00:00:00.000Z",
  "isVerificationValid": true,
  "validityPeriodYears": 1,
  "verificationExpiry": "2025-01-01T00:00:00.000Z"
}
```

---

## Admin-Only Endpoints

### 9. Verify User
**POST** `/api/auth/verify/:userId`

**Description:** Verify a user (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "message": "User verified successfully",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "schoolName": "ABC Primary School",
    "schoolId": "12345678901",
    "isVerified": true,
    "verifiedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 10. Unverify User
**POST** `/api/auth/unverify/:userId`

**Description:** Revoke user verification (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "message": "User verification revoked successfully",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "schoolName": "ABC Primary School",
    "schoolId": "12345678901",
    "isVerified": false,
    "verifiedAt": null
  }
}
```

---

### 11. Get All Users
**GET** `/api/auth/users`

**Description:** Get all users with pagination and filtering (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `verified` (optional): Filter by verification status (true/false)
- `search` (optional): Search in name, email, school name, school ID, kendra number

**Example:** `/api/auth/users?page=1&limit=20&verified=true&search=john`

**Response (200):**
```json
{
  "users": [
    {
      "_id": "user_id",
      "name": "John Doe",
      "mobileNo": "9876543210",
      "email": "john@example.com",
      "schoolName": "ABC Primary School",
      "schoolId": "12345678901",
      "kendraNo": "KEN001",
      "contactPersonName": "Jane Smith",
      "contactPersonMobile": "9876543211",
      "contactPersonEmail": "jane@example.com",
      "isAdmin": false,
      "isVerified": true,
      "verifiedAt": "2024-01-01T00:00:00.000Z",
      "isVerificationValid": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalUsers": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 12. Get Payment Screenshot
**GET** `/api/auth/payment-screenshot/:userId`

**Description:** Get payment screenshot for a user (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**URL Parameters:** `userId` (User ID)

**Response (200):**
```json
{
  "user": {
    "_id": "user_id",
    "schoolSubName": "school no 123",
    "email": "john@example.com",
    "schoolName": "ABC Primary School",
    "schoolId": "12345678901",
    "paymentScreenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "paymentScreenshotUploadedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

**Error Responses:**
```json
{
  "message": "No payment screenshot found for this user"
}
```

---

### 13. Delete Payment Screenshot
**DELETE** `/api/auth/payment-screenshot/:userId`

**Description:** Delete payment screenshot for a user after verification (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**URL Parameters:** `userId` (User ID)

**Response (200):**
```json
{
  "message": "Payment screenshot deleted successfully",
  "user": {
    "_id": "user_id",
    "schoolSubName": "school no 123",
    "email": "john@example.com",
    "schoolName": "ABC Primary School",
    "schoolId": "12345678901",
    "paymentScreenshot": null,
    "paymentScreenshotUploadedAt": null
  }
}
```

**Error Responses:**
```json
{
  "message": "No payment screenshot found for this user"
}
```

---

## Attendance Endpoints

**⚠️ All attendance endpoints require valid verification**

### 12. Get Daily Report Data
**GET** `/api/attendance/report/data/daily/:date`

**Description:** Get daily attendance report data for Excel generation

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:** `date` (YYYY-MM-DD format)

**Example:** `/api/attendance/report/data/daily/2024-01-15`

**Response (200):**
```json
{
  "date": "15/01/2024",
  "processedData": [
    {
      "record": {
        "standard": 1,
        "division": "A",
        "registeredStudents": {
          "sc": { "male": 10, "female": 8 },
          "st": { "male": 5, "female": 7 },
          "obc": { "male": 15, "female": 12 },
          "general": { "male": 20, "female": 18 }
        },
        "presentStudents": {
          "sc": { "male": 8, "female": 6 },
          "st": { "male": 4, "female": 5 },
          "obc": { "male": 12, "female": 10 },
          "general": { "male": 18, "female": 16 }
        },
        "mealTakenStudents": {
          "sc": { "male": 8, "female": 6 },
          "st": { "male": 4, "female": 5 },
          "obc": { "male": 12, "female": 10 },
          "general": { "male": 18, "female": 16 }
        }
      },
      "rowData": ["1 - A", 10, 8, 5, 7, 15, 12, 20, 18, 50, 45, 95, 8, 6, 4, 5, 12, 10, 18, 16, 42, 37, 79, 8, 6, 4, 5, 12, 10, 18, 16, 42, 37, 79],
      "isLastOfStd1to4": false,
      "isLastOfStd5to8": false
    }
  ],
  "totals": {
    "std1to4": [/* array of totals */],
    "std5to8": [/* array of totals */],
    "grandTotal": [/* array of grand totals */]
  },
  "timestamp": "15/01/2024, 02:30:00 PM"
}
```

---

### 13. Get Semi-Monthly Report Data
**GET** `/api/attendance/report/data/semi-monthly/:year/:month/:half`

**Description:** Get semi-monthly attendance report data for Excel generation

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `year`: Year (e.g., 2024)
- `month`: Month (1-12)
- `half`: Half of month (1 or 2)

**Example:** `/api/attendance/report/data/semi-monthly/2024/1/1`

**Response (200):**
```json
{
  "reportData": [
    {
      "standardRange": {
        "name": "બાલવાટિકા",
        "worksheetName": "બાલવાટિકા",
        "stdName": "બાલવાટિકા",
        "filter": { "standard": "0", "division": "A" }
      },
      "registeredTotals": {
        "sc": { "male": 10, "female": 8 },
        "st": { "male": 5, "female": 7 },
        "obc": { "male": 15, "female": 12 },
        "general": { "male": 20, "female": 18 }
      },
      "groupedByDate": {
        "2024-01-01": {
          "presentStudents": {
            "sc": { "male": 8, "female": 6 },
            "st": { "male": 4, "female": 5 },
            "obc": { "male": 12, "female": 10 },
            "general": { "male": 18, "female": 16 },
            "totalMale": 42,
            "totalFemale": 37,
            "grandTotal": 79
          },
          "mealTakenStudents": {
            "sc": { "male": 8, "female": 6 },
            "st": { "male": 4, "female": 5 },
            "obc": { "male": 12, "female": 10 },
            "general": { "male": 18, "female": 16 },
            "totalMale": 42,
            "totalFemale": 37,
            "grandTotal": 79
          }
        }
      },
      "totals": {
        "presentStudents": {
          "sc": { "male": 120, "female": 90 },
          "st": { "male": 60, "female": 75 },
          "obc": { "male": 180, "female": 150 },
          "general": { "male": 270, "female": 240 },
          "totalMale": 630,
          "totalFemale": 555,
          "grandTotal": 1185
        },
        "mealTakenStudents": {
          "sc": { "male": 120, "female": 90 },
          "st": { "male": 60, "female": 75 },
          "obc": { "male": 180, "female": 150 },
          "general": { "male": 270, "female": 240 },
          "totalMale": 630,
          "totalFemale": 555,
          "grandTotal": 1185
        }
      },
      "dateList": ["2024-01-01", "2024-01-02", "..."]
    }
  ],
  "metadata": {
    "month": 1,
    "year": 2024,
    "half": 1,
    "gujaratiMonth": "જાન્યુઆરી",
    "academicYear": { "start": "2023", "end": "2024" },
    "dateList": ["2024-01-01", "2024-01-02", "..."],
    "currentDate": "15/01/2024"
  }
}
```

---

### 14. Create Attendance
**POST** `/api/attendance`

**Description:** Create a new attendance record (Requires verification)

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "standard": 1,
  "division": "A",
  "date": "2024-01-15",
  "registeredStudents": {
    "sc": { "male": 10, "female": 8 },
    "st": { "male": 5, "female": 7 },
    "obc": { "male": 15, "female": 12 },
    "general": { "male": 20, "female": 18 }
  },
  "presentStudents": {
    "sc": { "male": 8, "female": 6 },
    "st": { "male": 4, "female": 5 },
    "obc": { "male": 12, "female": 10 },
    "general": { "male": 18, "female": 16 }
  },
  "mealTakenStudents": {
    "sc": { "male": 8, "female": 6 },
    "st": { "male": 4, "female": 5 },
    "obc": { "male": 12, "female": 10 },
    "general": { "male": 18, "female": 16 }
  }
}
```

**Response (201):**
```json
{
  "_id": "attendance_id",
  "schoolId": "12345678901",
  "standard": 1,
  "division": "A",
  "date": "2024-01-15T00:00:00.000Z",
  "registeredStudents": {
    "sc": { "male": 10, "female": 8 },
    "st": { "male": 5, "female": 7 },
    "obc": { "male": 15, "female": 12 },
    "general": { "male": 20, "female": 18 }
  },
  "presentStudents": {
    "sc": { "male": 8, "female": 6 },
    "st": { "male": 4, "female": 5 },
    "obc": { "male": 12, "female": 10 },
    "general": { "male": 18, "female": 16 }
  },
  "mealTakenStudents": {
    "sc": { "male": 8, "female": 6 },
    "st": { "male": 4, "female": 5 },
    "obc": { "male": 12, "female": 10 },
    "general": { "male": 18, "female": 16 }
  },
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

### 15. Update Attendance
**PUT** `/api/attendance/:id`

**Description:** Update an attendance record (Requires verification)

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:** `id` (attendance record ID)

**Request Body:** Same as Create Attendance

**Response (200):** Same as Create Attendance

---

### 16. Save Attendance (Upsert)
**POST** `/api/attendance/save`

**Description:** Create or update attendance record (Requires verification)

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as Create Attendance

**Response (200):** Same as Create Attendance

---

### 17. Get Attendance by Date
**GET** `/api/attendance/:date`

**Description:** Get all attendance records for a specific date (Requires verification)

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:** `date` (YYYY-MM-DD format)

**Response (200):**
```json
[
  {
    "_id": "attendance_id",
    "schoolId": "12345678901",
    "standard": 1,
    "division": "A",
    "date": "2024-01-15T00:00:00.000Z",
    "registeredStudents": {
      "sc": { "male": 10, "female": 8 },
      "st": { "male": 5, "female": 7 },
      "obc": { "male": 15, "female": 12 },
      "general": { "male": 20, "female": 18 }
    },
    "presentStudents": {
      "sc": { "male": 8, "female": 6 },
      "st": { "male": 4, "female": 5 },
      "obc": { "male": 12, "female": 10 },
      "general": { "male": 18, "female": 16 }
    },
    "mealTakenStudents": {
      "sc": { "male": 8, "female": 6 },
      "st": { "male": 4, "female": 5 },
      "obc": { "male": 12, "female": 10 },
      "general": { "male": 18, "female": 16 }
    }
  }
]
```

---

### 18. Get Attendance by Class
**GET** `/api/attendance/:date/:standard/:division`

**Description:** Get attendance for specific class and date (Requires verification)

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `date`: Date (YYYY-MM-DD format)
- `standard`: Standard/Class number
- `division`: Division/Section

**Response (200):** Single attendance record (same structure as above)

---

## Error Responses

### Common Error Codes

**400 Bad Request:**
```json
{
  "message": "All fields are required"
}
```

**401 Unauthorized:**
```json
{
  "message": "Invalid credentials"
}
```

**403 Forbidden (Verification Required):**
```json
{
  "message": "Account verification required or expired. Please contact administrator.",
  "code": "VERIFICATION_REQUIRED"
}
```

**403 Forbidden (Admin Required):**
```json
{
  "message": "Access denied. Admin privileges required."
}
```

**404 Not Found:**
```json
{
  "message": "User not found"
}
```

**500 Server Error:**
```json
{
  "message": "Server error",
  "error": "Detailed error message"
}
```

---

## Frontend Integration Examples

### React Native/JavaScript

```javascript
// API Base Configuration
const API_BASE_URL = 'http://your-server-url/api';

// Helper function to get auth token
const getAuthToken = async () => {
  // Get from AsyncStorage or your preferred storage
  return await AsyncStorage.getItem('authToken');
};

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API Error');
  }

  return response.json();
};

// Example: Login
const login = async (schoolId, password) => {
  try {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ schoolId, password })
    });
    
    // Store token
    await AsyncStorage.setItem('authToken', response.token);
    return response;
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
};

// Example: Get verification status
const getVerificationStatus = async () => {
  try {
    return await apiCall('/auth/verification-status');
  } catch (error) {
    console.error('Verification status error:', error.message);
    throw error;
  }
};

// Example: Create attendance
const createAttendance = async (attendanceData) => {
  try {
    return await apiCall('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData)
    });
  } catch (error) {
    if (error.message.includes('verification')) {
      // Handle verification required error
      alert('Account verification required. Please contact administrator.');
    }
    throw error;
  }
};

// Example: Get daily report data for Excel
const getDailyReportData = async (date) => {
  try {
    return await apiCall(`/attendance/report/data/daily/${date}`);
  } catch (error) {
    console.error('Daily report error:', error.message);
    throw error;
  }
};
```

### Error Handling

```javascript
// Centralized error handler
const handleApiError = (error) => {
  if (error.message.includes('verification')) {
    // Show verification required message
    showVerificationRequiredDialog();
  } else if (error.message.includes('Invalid credentials')) {
    // Redirect to login
    redirectToLogin();
  } else {
    // Show generic error
    showErrorMessage(error.message);
  }
};

// Usage
try {
  const data = await createAttendance(attendanceData);
  // Handle success
} catch (error) {
  handleApiError(error);
}
```

### Verification Status Check

```javascript
// Check verification status on app start
const checkVerificationStatus = async () => {
  try {
    const status = await getVerificationStatus();
    
    if (!status.isVerificationValid) {
      // Show verification required screen
      showVerificationRequiredScreen({
        isVerified: status.isVerified,
        verifiedAt: status.verifiedAt,
        expiryDate: status.verificationExpiry
      });
    }
  } catch (error) {
    console.error('Verification check failed:', error);
  }
};
```

---

## Testing

### Using curl

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "password": "password123",
    "mobileNo": "9876543210",
    "email": "test@example.com",
    "schoolName": "Test School",
    "schoolId": "12345678901",
    "kendraNo": "KEN001",
    "contactPersonName": "Contact Person",
    "contactPersonMobile": "9876543211",
    "contactPersonEmail": "contact@example.com"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "12345678901",
    "password": "password123"
  }'

# Get profile (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"

# Try to create attendance (will fail without verification)
curl -X POST http://localhost:5000/api/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "standard": 1,
    "division": "A",
    "date": "2024-01-15",
    "registeredStudents": {
      "sc": {"male": 10, "female": 8},
      "st": {"male": 5, "female": 7},
      "obc": {"male": 15, "female": 12},
      "general": {"male": 20, "female": 18}
    },
    "presentStudents": {
      "sc": {"male": 8, "female": 6},
      "st": {"male": 4, "female": 5},
      "obc": {"male": 12, "female": 10},
      "general": {"male": 18, "female": 16}
    },
    "mealTakenStudents": {
      "sc": {"male": 8, "female": 6},
      "st": {"male": 4, "female": 5},
      "obc": {"male": 12, "female": 10},
      "general": {"male": 18, "female": 16}
    }
  }'
```

---

## Backup System Endpoints

**⚠️ All backup endpoints require authentication and most require admin privileges**

### 19. Backup Health Check
**GET** `/api/backup/health`

**Description:** Check backup system health and database connectivity

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-09T14:30:00.000Z",
    "database": {
      "connected": true,
      "collections": {
        "users": 25,
        "attendance": 1500,
        "registeredStudents": 900
      }
    },
    "environment": {
      "nodeVersion": "v18.17.0",
      "platform": "linux",
      "memoryUsage": {
        "rss": 45678592,
        "heapTotal": 20971520,
        "heapUsed": 15728640,
        "external": 1048576
      }
    },
    "backup": {
      "googleDriveEnabled": true,
      "compressionEnabled": true,
      "maxRecordsPerPage": 1000
    }
  }
}
```

---

### 20. Backup Statistics
**GET** `/api/backup/stats`

**Description:** Get backup statistics and data overview

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": {
      "totalUsers": 25,
      "verifiedUsers": 20,
      "adminUsers": 2
    },
    "attendance": {
      "totalRecords": 1500,
      "oldestRecord": "2024-01-01T00:00:00.000Z",
      "newestRecord": "2025-01-09T00:00:00.000Z"
    },
    "studentsByYear": [
      {
        "_id": "2024-2025",
        "count": 900
      }
    ],
    "lastUpdated": "2025-01-09T14:30:00.000Z"
  }
}
```

---

### 21. Export Users Data
**GET** `/api/backup/export/users`

**Description:** Export all users data (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `compress` (optional): Compress data (true/false, default: false)

**Example:** `/api/backup/export/users?compress=true`

**Response (200):**
```json
{
  "success": true,
  "message": "Exported 25 users",
  "compressed": true,
  "data": {
    "exportType": "users",
    "exportDate": "2025-01-09T14:30:00.000Z",
    "totalRecords": 25,
    "data": [
      {
        "_id": "user_id",
        "schoolSubName": "school no 123",
        "mobileNo": "9876543210",
        "email": "john@example.com",
        "schoolName": "ABC Primary School",
        "schoolId": "12345678901",
        "kendraNo": "KEN001",
        "contactPersonName": "Jane Smith",
        "contactPersonMobile": "9876543211",
        "contactPersonEmail": "jane@example.com",
        "isAdmin": false,
        "isVerified": true,
        "verifiedAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 22. Export Attendance Data
**GET** `/api/backup/export/attendance`

**Description:** Export attendance data with filtering and pagination (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `schoolId` (optional): Filter by school ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 1000)
- `compress` (optional): Compress data (true/false)

**Example:** `/api/backup/export/attendance?startDate=2024-01-01&endDate=2024-12-31&compress=true`

**Response (200):**
```json
{
  "success": true,
  "message": "Exported 1500 attendance records (Page 1/2)",
  "compressed": true,
  "data": {
    "exportType": "attendance",
    "exportDate": "2025-01-09T14:30:00.000Z",
    "filters": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "schoolId": null
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalRecords": 1500,
      "recordsInThisPage": 1000
    },
    "data": [
      {
        "_id": "attendance_id",
        "schoolId": "12345678901",
        "standard": 1,
        "division": "A",
        "date": "2024-01-15T00:00:00.000Z",
        "registeredStudents": {
          "sc": { "male": 10, "female": 8 },
          "st": { "male": 5, "female": 7 },
          "obc": { "male": 15, "female": 12 },
          "general": { "male": 20, "female": 18 }
        },
        "presentStudents": {
          "sc": { "male": 8, "female": 6 },
          "st": { "male": 4, "female": 5 },
          "obc": { "male": 12, "female": 10 },
          "general": { "male": 18, "female": 16 }
        },
        "mealTakenStudents": {
          "sc": { "male": 8, "female": 6 },
          "st": { "male": 4, "female": 5 },
          "obc": { "male": 12, "female": 10 },
          "general": { "male": 18, "female": 16 }
        }
      }
    ]
  }
}
```

---

### 23. Export Students Data
**GET** `/api/backup/export/students`

**Description:** Export registered students data (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `schoolId` (optional): Filter by school ID
- `academicYear` (optional): Filter by academic year
- `compress` (optional): Compress data (true/false)

**Example:** `/api/backup/export/students?academicYear=2024-2025&compress=true`

**Response (200):**
```json
{
  "success": true,
  "message": "Exported 900 registered student records",
  "compressed": true,
  "data": {
    "exportType": "registeredStudents",
    "exportDate": "2025-01-09T14:30:00.000Z",
    "filters": {
      "schoolId": null,
      "academicYear": "2024-2025"
    },
    "totalRecords": 900,
    "data": [
      {
        "_id": "student_id",
        "schoolId": "12345678901",
        "standard": 1,
        "division": "A",
        "academicYear": "2024-2025",
        "counts": {
          "general": { "male": 20, "female": 18 },
          "obc": { "male": 15, "female": 12 },
          "sc": { "male": 10, "female": 8 },
          "st": { "male": 5, "female": 7 }
        }
      }
    ]
  }
}
```

---

### 24. Full Database Backup
**POST** `/api/backup/full`

**Description:** Create a complete database backup (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Full backup completed successfully",
  "data": {
    "backupType": "full",
    "backupDate": "2025-01-09T14:30:00.000Z",
    "version": "1.0.0",
    "collections": {
      "users": {
        "count": 25,
        "data": [/* user records */]
      },
      "attendance": {
        "count": 1500,
        "data": [/* attendance records */]
      },
      "registeredStudents": {
        "count": 900,
        "data": [/* student records */]
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
      "uploadDate": "2025-01-09T14:30:15.000Z"
    }
  }
}
```

---

### 25. Test Google Drive Connection
**GET** `/api/backup/drive/test`

**Description:** Test Google Drive API connection (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "success": true,
  "connected": true,
  "user": {
    "displayName": "MDM Backup Service",
    "emailAddress": "service-account@project.iam.gserviceaccount.com"
  },
  "message": "Google Drive connection successful"
}
```

---

### 26. Check Google Drive Quota
**GET** `/api/backup/drive/quota`

**Description:** Check Google Drive storage quota (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "success": true,
  "quota": {
    "used": 1073741824,
    "limit": 16106127360,
    "usedFormatted": "1.00 GB",
    "limitFormatted": "15.00 GB",
    "usedPercentage": 6.67,
    "available": 15032385536,
    "availableFormatted": "14.00 GB"
  }
}
```

---

### 27. List Backup Files
**GET** `/api/backup/drive/files`

**Description:** List backup files from Google Drive (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `limit` (optional): Number of files to return (default: 10)

**Example:** `/api/backup/drive/files?limit=5`

**Response (200):**
```json
{
  "success": true,
  "files": [
    {
      "id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      "name": "mdm-backup-2025-01-09.json",
      "size": "2048576",
      "createdTime": "2025-01-09T14:30:15.000Z",
      "modifiedTime": "2025-01-09T14:30:15.000Z"
    }
  ]
}
```

---

### 28. Download Backup File
**GET** `/api/backup/drive/download/:fileId`

**Description:** Download a backup file from Google Drive (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**URL Parameters:** `fileId` (Google Drive file ID)

**Response (200):** File download with appropriate headers

---

### 29. Cleanup Old Backups
**DELETE** `/api/backup/drive/cleanup`

**Description:** Delete old backup files from Google Drive (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `days` (optional): Retention period in days (default: 30)

**Example:** `/api/backup/drive/cleanup?days=30`

**Response (200):**
```json
{
  "success": true,
  "deletedCount": 5,
  "failedCount": 0,
  "results": [
    {
      "success": true,
      "fileId": "file_id_1",
      "fileName": "mdm-backup-2024-12-01.json",
      "createdTime": "2024-12-01T02:00:00.000Z"
    }
  ]
}
```

---

### 30. Backup Configuration
**GET** `/api/backup/config`

**Description:** Get backup system configuration (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "googleDrive": {
      "enabled": true,
      "configured": true,
      "folderId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
    },
    "compression": {
      "enabled": true,
      "threshold": 1024
    },
    "retention": {
      "defaultDays": 30,
      "maxBackups": 100
    },
    "limits": {
      "maxRecordsPerPage": 1000,
      "maxFileSize": "50MB"
    }
  }
}
```

---

### 31. Manual Backup Trigger
**POST** `/api/backup/trigger`

**Description:** Manually trigger a backup operation (Admin only)

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "type": "full",
  "compress": true
}
```

**Available Types:** `full`, `users`, `attendance`, `students`

**Response (200):** Same as respective backup endpoint

---

## Backup Integration Examples

### JavaScript/React

```javascript
// Backup API helper functions
const backupAPI = {
  // Check backup system health
  checkHealth: async () => {
    return await apiCall('/backup/health');
  },

  // Get backup statistics
  getStats: async () => {
    return await apiCall('/backup/stats');
  },

  // Create full backup
  createFullBackup: async () => {
    return await apiCall('/backup/full', { method: 'POST' });
  },

  // Export specific data
  exportData: async (type, options = {}) => {
    const params = new URLSearchParams(options).toString();
    return await apiCall(`/backup/export/${type}?${params}`);
  },

  // Test Google Drive connection
  testDriveConnection: async () => {
    return await apiCall('/backup/drive/test');
  },

  // Check Google Drive quota
  checkDriveQuota: async () => {
    return await apiCall('/backup/drive/quota');
  },

  // List backup files
  listBackupFiles: async (limit = 10) => {
    return await apiCall(`/backup/drive/files?limit=${limit}`);
  },

  // Cleanup old backups
  cleanupOldBackups: async (days = 30) => {
    return await apiCall(`/backup/drive/cleanup?days=${days}`, {
      method: 'DELETE'
    });
  }
};

// Example: Admin backup dashboard
const BackupDashboard = () => {
  const [backupStats, setBackupStats] = useState(null);
  const [driveQuota, setDriveQuota] = useState(null);
  const [backupFiles, setBackupFiles] = useState([]);

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      const [stats, quota, files] = await Promise.all([
        backupAPI.getStats(),
        backupAPI.checkDriveQuota(),
        backupAPI.listBackupFiles(5)
      ]);

      setBackupStats(stats.data);
      setDriveQuota(quota.quota);
      setBackupFiles(files.files);
    } catch (error) {
      console.error('Failed to load backup data:', error);
    }
  };

  const handleFullBackup = async () => {
    try {
      const result = await backupAPI.createFullBackup();
      alert('Backup completed successfully!');
      loadBackupData(); // Refresh data
    } catch (error) {
      alert('Backup failed: ' + error.message);
    }
  };

  const handleExportUsers = async () => {
    try {
      const result = await backupAPI.exportData('users', { compress: true });
      // Handle download or display result
      console.log('Users exported:', result);
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  return (
    <div>
      <h2>Backup Dashboard</h2>
      
      {/* Backup Statistics */}
      {backupStats && (
        <div>
          <h3>Database Statistics</h3>
          <p>Users: {backupStats.users.totalUsers}</p>
          <p>Attendance Records: {backupStats.attendance.totalRecords}</p>
          <p>Student Records: {backupStats.studentsByYear.reduce((sum, year) => sum + year.count, 0)}</p>
        </div>
      )}

      {/* Google Drive Quota */}
      {driveQuota && (
        <div>
          <h3>Google Drive Storage</h3>
          <p>Used: {driveQuota.usedFormatted} / {driveQuota.limitFormatted} ({driveQuota.usedPercentage}%)</p>
          <progress value={driveQuota.usedPercentage} max="100"></progress>
        </div>
      )}

      {/* Backup Actions */}
      <div>
        <h3>Backup Actions</h3>
        <button onClick={handleFullBackup}>Create Full Backup</button>
        <button onClick={handleExportUsers}>Export Users</button>
        <button onClick={() => backupAPI.cleanupOldBackups(30)}>Cleanup Old Backups</button>
      </div>

      {/* Recent Backup Files */}
      <div>
        <h3>Recent Backup Files</h3>
        {backupFiles.map(file => (
          <div key={file.id}>
            <p>{file.name} - {new Date(file.createdTime).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Testing Backup Endpoints

```bash
# Check backup health
curl -X GET http://localhost:5000/api/backup/health \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get backup statistics
curl -X GET http://localhost:5000/api/backup/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Create full backup
curl -X POST http://localhost:5000/api/backup/full \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Export users with compression
curl -X GET "http://localhost:5000/api/backup/export/users?compress=true" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Test Google Drive connection
curl -X GET http://localhost:5000/api/backup/drive/test \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Check Google Drive quota
curl -X GET http://localhost:5000/api/backup/drive/quota \
  -H "Authorization: Bearer ADMIN_TOKEN"

# List backup files
curl -X GET "http://localhost:5000/api/backup/drive/files?limit=5" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Cleanup old backups
curl -X DELETE "http://localhost:5000/api/backup/drive/cleanup?days=30" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

This documentation provides everything frontend developers need to integrate with the MDM Attendance System API, including authentication, user management, verification system, attendance functionality, and the comprehensive backup system.
