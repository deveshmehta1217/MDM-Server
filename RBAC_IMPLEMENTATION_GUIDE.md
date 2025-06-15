# Role-Based Access Control (RBAC) Implementation Guide
## MDM Server - Technical Documentation

### Overview
This document outlines the complete implementation of Role-Based Access Control (RBAC) for the MDM Server, transforming it from a single-user-per-school system to a multi-user system with Principal and Teacher roles.

---

## 1. System Architecture

### Current vs New System
**Before:** Single user per school → **After:** Principal + Multiple Teachers per school

### User Roles
- **Principal (Admin):** Full school management access
- **Teacher:** Limited access to assigned classes only

### Key Features
- Teacher self-registration with school code
- Principal approval/rejection of teachers
- Bulk class assignment/removal
- Bulk class lock/unlock functionality
- Dual attendance system (Alpahar + MDM)
- Mobile-based teacher login

---

## 2. Database Schema Changes

### 2.1 New Models

#### Teacher Model
```javascript
{
  _id: ObjectId,
  schoolId: String,           // Links to principal's school
  principalId: ObjectId,      // Reference to principal (User)
  name: String,
  email: String,
  mobileNo: String,           // Used for login (unique per school)
  password: String,           // Hashed password
  isApproved: Boolean,        // Principal approval status
  isActive: Boolean,          // Can be deactivated by principal
  schoolCode: String,         // Code used during registration
  createdAt: Date,
  updatedAt: Date,
  approvedAt: Date,
  approvedBy: ObjectId        // Principal who approved
}
```

#### TeacherClassAssignment Model
```javascript
{
  _id: ObjectId,
  teacherId: ObjectId,
  schoolId: String,
  standard: Number,           // 0-8
  division: String,           // A, B, C, D
  assignedAt: Date,
  assignedBy: ObjectId        // Principal who assigned
}
```

#### ClassLockStatus Model
```javascript
{
  _id: ObjectId,
  schoolId: String,
  standard: Number,
  division: String,
  isLocked: Boolean,
  lockedBy: ObjectId,         // Principal who locked/unlocked
  lockedAt: Date,
  academicYear: String
}
```

#### SchoolCode Model
```javascript
{
  _id: ObjectId,
  schoolId: String,
  code: String,               // 6-digit unique code
  isActive: Boolean,
  createdBy: ObjectId,        // Principal
  expiresAt: Date,           // Optional expiry
  createdAt: Date
}
```

### 2.2 Enhanced Existing Models

#### Updated Attendance Model
```javascript
// Add these fields to existing Attendance schema
{
  // ... existing fields
  attendanceType: {
    type: String,
    enum: ['ALPAHAR', 'MDM'],
    required: true
  },
  takenBy: ObjectId,          // Teacher who took attendance
  takenByRole: {
    type: String,
    enum: ['PRINCIPAL', 'TEACHER'],
    required: true
  },
  takenAt: Date
}
```

#### Updated User Model
```javascript
// Add these fields to existing User schema
{
  // ... existing fields
  schoolCode: String,         // Generated school code for teacher registration
  teacherCount: {
    type: Number,
    default: 0
  },
  maxTeachers: {
    type: Number,
    default: 50               // Configurable limit
  }
}
```

---

## 3. Authentication & Authorization

### 3.1 Login Systems

#### Principal Login (Existing)
- **Endpoint:** `POST /api/auth/login`
- **Credentials:** `schoolId` + `password`
- **JWT Payload:** `{ id, schoolId, role: 'PRINCIPAL', isAdmin: true }`

#### Teacher Login (New)
- **Endpoint:** `POST /api/auth/teacher/login`
- **Credentials:** `mobileNo` + `password` + `schoolId`
- **JWT Payload:** `{ id, teacherId, schoolId, role: 'TEACHER', assignedClasses: [] }`

### 3.2 JWT Token Structure
```javascript
// Principal Token
{
  id: "principalUserId",
  schoolId: "12345678901",
  role: "PRINCIPAL",
  isAdmin: true,
  iat: timestamp,
  exp: timestamp
}

// Teacher Token
{
  id: "teacherId", 
  schoolId: "12345678901",
  role: "TEACHER",
  assignedClasses: [
    { standard: 1, division: "A" },
    { standard: 2, division: "B" }
  ],
  isApproved: true,
  iat: timestamp,
  exp: timestamp
}
```

### 3.3 Middleware Updates
```javascript
// New middleware functions needed
export const authenticateRole = (allowedRoles) => { ... }
export const requireClassAccess = (req, res, next) => { ... }
export const requireUnlockedClass = (req, res, next) => { ... }
export const requireApprovedTeacher = (req, res, next) => { ... }
```

---

## 4. API Endpoints

### 4.1 School Code Management

#### Generate School Code (Principal Only)
```http
POST /api/school/generate-code
Authorization: Bearer <principal_token>

Response:
{
  "success": true,
  "schoolCode": "ABC123",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

#### Get Active School Code (Principal Only)
```http
GET /api/school/code
Authorization: Bearer <principal_token>

Response:
{
  "success": true,
  "schoolCode": "ABC123",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 4.2 Teacher Management

#### Teacher Self-Registration
```http
POST /api/auth/teacher/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "mobileNo": "9876543210",
  "password": "securePassword",
  "schoolCode": "ABC123"
}

Response:
{
  "success": true,
  "message": "Registration successful. Awaiting principal approval.",
  "teacherId": "teacher_id"
}
```

#### Get Pending Teachers (Principal Only)
```http
GET /api/teachers/pending
Authorization: Bearer <principal_token>

Response:
{
  "success": true,
  "teachers": [
    {
      "_id": "teacher_id",
      "name": "John Doe",
      "email": "john@example.com", 
      "mobileNo": "9876543210",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Approve/Reject Teacher (Principal Only)
```http
POST /api/teachers/:teacherId/approve
Authorization: Bearer <principal_token>

{
  "action": "approve" // or "reject"
}

Response:
{
  "success": true,
  "message": "Teacher approved successfully"
}
```

#### Get All Teachers (Principal Only)
```http
GET /api/teachers
Authorization: Bearer <principal_token>

Response:
{
  "success": true,
  "teachers": [
    {
      "_id": "teacher_id",
      "name": "John Doe",
      "email": "john@example.com",
      "mobileNo": "9876543210",
      "isApproved": true,
      "isActive": true,
      "assignedClasses": [
        { "standard": 1, "division": "A" },
        { "standard": 2, "division": "B" }
      ]
    }
  ]
}
```

### 4.3 Class Assignment (Bulk Operations)

#### Bulk Assign Classes (Principal Only)
```http
POST /api/classes/assign-bulk
Authorization: Bearer <principal_token>
Content-Type: application/json

{
  "assignments": [
    {
      "teacherId": "teacher_id_1",
      "classes": [
        { "standard": 1, "division": "A" },
        { "standard": 1, "division": "B" }
      ]
    },
    {
      "teacherId": "teacher_id_2", 
      "classes": [
        { "standard": 2, "division": "A" }
      ]
    }
  ]
}

Response:
{
  "success": true,
  "message": "Classes assigned successfully",
  "assignedCount": 3,
  "errors": []
}
```

#### Bulk Remove Class Assignments (Principal Only)
```http
DELETE /api/classes/assign-bulk
Authorization: Bearer <principal_token>
Content-Type: application/json

{
  "assignments": [
    {
      "teacherId": "teacher_id_1",
      "classes": [
        { "standard": 1, "division": "A" }
      ]
    }
  ]
}

Response:
{
  "success": true,
  "message": "Class assignments removed successfully",
  "removedCount": 1
}
```

### 4.4 Class Lock Management (Bulk Operations)

#### Bulk Lock/Unlock Classes (Principal Only)
```http
POST /api/classes/lock-bulk
Authorization: Bearer <principal_token>
Content-Type: application/json

{
  "action": "lock", // or "unlock"
  "classes": [
    { "standard": 1, "division": "A" },
    { "standard": 1, "division": "B" },
    { "standard": 2, "division": "A" }
  ]
}

Response:
{
  "success": true,
  "message": "Classes locked successfully",
  "affectedCount": 3,
  "errors": []
}
```

#### Get Class Lock Status
```http
GET /api/classes/lock-status
Authorization: Bearer <token>

Response:
{
  "success": true,
  "classes": [
    {
      "standard": 1,
      "division": "A", 
      "isLocked": false,
      "lockedAt": null,
      "lockedBy": null
    },
    {
      "standard": 1,
      "division": "B",
      "isLocked": true,
      "lockedAt": "2024-01-01T10:00:00.000Z",
      "lockedBy": "principal_id"
    }
  ]
}
```

### 4.5 Enhanced Attendance APIs

#### Take Attendance (Teachers - Assigned Classes Only)
```http
POST /api/attendance/take
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "standard": 1,
  "division": "A",
  "date": "2024-01-15",
  "attendanceType": "ALPAHAR", // or "MDM"
  "registeredStudents": { /* existing structure */ },
  "presentStudents": { /* existing structure */ },
  "mealTakenStudents": { /* existing structure */ }
}

Response:
{
  "success": true,
  "message": "Attendance recorded successfully",
  "attendanceId": "attendance_id"
}
```

#### Get Daily Attendance Status (Role-based)
```http
GET /api/attendance/daily-status/:date
Authorization: Bearer <token>

// Principal sees all classes
// Teacher sees only assigned classes

Response:
{
  "success": true,
  "date": "2024-01-15",
  "classes": [
    {
      "standard": 1,
      "division": "A",
      "alpaharTaken": true,
      "mdmTaken": false,
      "assignedTeacher": "John Doe",
      "isLocked": false
    }
  ]
}
```

---

## 5. Frontend Implementation Guide

### 5.1 Authentication Flow

#### Login Component Updates
```javascript
// Add role-based login
const LoginForm = () => {
  const [userType, setUserType] = useState('principal'); // 'principal' or 'teacher'
  
  const handleLogin = async (credentials) => {
    const endpoint = userType === 'principal' 
      ? '/api/auth/login' 
      : '/api/auth/teacher/login';
      
    // Handle login logic
  };
  
  return (
    <div>
      <UserTypeSelector value={userType} onChange={setUserType} />
      {userType === 'principal' ? (
        <PrincipalLoginForm onSubmit={handleLogin} />
      ) : (
        <TeacherLoginForm onSubmit={handleLogin} />
      )}
    </div>
  );
};
```

#### Route Protection
```javascript
// Enhanced route protection
const ProtectedRoute = ({ children, requiredRole, requiredPermissions }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  if (requiredPermissions && !hasPermissions(user, requiredPermissions)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

// Usage
<ProtectedRoute requiredRole="PRINCIPAL">
  <TeacherManagement />
</ProtectedRoute>

<ProtectedRoute requiredRole="TEACHER" requiredPermissions={["TAKE_ATTENDANCE"]}>
  <AttendanceForm />
</ProtectedRoute>
```

### 5.2 Principal Dashboard Components

#### Teacher Management Component
```javascript
const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [schoolCode, setSchoolCode] = useState('');
  
  // Component logic for:
  // - Generating/displaying school code
  // - Approving/rejecting teachers
  // - Managing teacher status
  // - Bulk class assignments
  
  return (
    <div>
      <SchoolCodeSection code={schoolCode} onGenerate={generateCode} />
      <PendingTeachersSection teachers={pendingTeachers} onApprove={approveTeacher} />
      <ActiveTeachersSection teachers={teachers} onAssignClasses={assignClasses} />
    </div>
  );
};
```

#### Bulk Class Assignment Component
```javascript
const BulkClassAssignment = ({ teachers, classes }) => {
  const [assignments, setAssignments] = useState([]);
  
  const handleBulkAssign = async () => {
    await api.post('/api/classes/assign-bulk', { assignments });
  };
  
  return (
    <div>
      <TeacherClassMatrix 
        teachers={teachers}
        classes={classes}
        assignments={assignments}
        onChange={setAssignments}
      />
      <BulkActionButtons onAssign={handleBulkAssign} />
    </div>
  );
};
```

#### Class Lock Management Component
```javascript
const ClassLockManagement = ({ classes }) => {
  const [selectedClasses, setSelectedClasses] = useState([]);
  
  const handleBulkLock = async (action) => {
    await api.post('/api/classes/lock-bulk', {
      action,
      classes: selectedClasses
    });
  };
  
  return (
    <div>
      <ClassGrid 
        classes={classes}
        selectedClasses={selectedClasses}
        onSelectionChange={setSelectedClasses}
      />
      <BulkLockControls onLock={() => handleBulkLock('lock')} onUnlock={() => handleBulkLock('unlock')} />
    </div>
  );
};
```

### 5.3 Teacher Dashboard Components

#### Teacher Registration Component
```javascript
const TeacherRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNo: '',
    password: '',
    schoolCode: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/api/auth/teacher/register', formData);
    // Show success message
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Full Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="mobileNo" placeholder="Mobile Number" required />
      <input name="password" type="password" placeholder="Password" required />
      <input name="schoolCode" placeholder="School Code" required />
      <button type="submit">Register</button>
    </form>
  );
};
```

#### Enhanced Attendance Component
```javascript
const AttendanceForm = () => {
  const { user } = useAuth();
  const [attendanceType, setAttendanceType] = useState('ALPAHAR');
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Only show assigned classes for teachers
  const availableClasses = user.role === 'TEACHER' 
    ? user.assignedClasses 
    : allClasses;
  
  return (
    <div>
      <AttendanceTypeSelector 
        value={attendanceType} 
        onChange={setAttendanceType}
        options={['ALPAHAR', 'MDM']}
      />
      <ClassSelector 
        classes={availableClasses}
        value={selectedClass}
        onChange={setSelectedClass}
      />
      <AttendanceGrid 
        class={selectedClass}
        type={attendanceType}
        onSubmit={submitAttendance}
      />
    </div>
  );
};
```

### 5.4 State Management

#### Auth Context Updates
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const login = async (credentials, userType) => {
    const endpoint = userType === 'principal' 
      ? '/api/auth/login' 
      : '/api/auth/teacher/login';
      
    const response = await api.post(endpoint, credentials);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    setUser(user);
    setIsAuthenticated(true);
  };
  
  const hasPermission = (permission) => {
    if (user.role === 'PRINCIPAL') return true;
    if (user.role === 'TEACHER') {
      // Check teacher-specific permissions
      return checkTeacherPermission(user, permission);
    }
    return false;
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 5.5 UI/UX Considerations

#### Responsive Design
- **Mobile-first approach** for teacher interfaces
- **Desktop-optimized** for principal management tasks
- **Touch-friendly** controls for attendance taking

#### User Experience
- **Clear role indicators** in navigation
- **Contextual help** for new users
- **Bulk operation confirmations** with preview
- **Real-time status updates** for approvals
- **Offline capability** for attendance taking

#### Visual Design
- **Role-based color schemes** (Principal: Blue, Teacher: Green)
- **Status indicators** (Approved, Pending, Locked, etc.)
- **Progress indicators** for bulk operations
- **Clear error messaging** with actionable steps

---

## 6. Implementation Timeline

### Phase 1: Backend Foundation (Week 1-2)
- [ ] Create new database models
- [ ] Implement teacher authentication
- [ ] Add school code generation
- [ ] Create basic CRUD APIs

### Phase 2: Core RBAC Features (Week 3-4)
- [ ] Implement role-based middleware
- [ ] Add bulk assignment APIs
- [ ] Create class lock management
- [ ] Enhanced attendance APIs

### Phase 3: Frontend Implementation (Week 5-6)
- [ ] Update authentication flow
- [ ] Create principal dashboard
- [ ] Build teacher management interface
- [ ] Implement bulk operations UI

### Phase 4: Testing & Refinement (Week 7-8)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] User acceptance testing
- [ ] Documentation completion

---

## 7. Security Considerations

### Data Protection
- **Role-based data isolation** (teachers can't see other teachers' data)
- **Class-level access control** (teachers can only access assigned classes)
- **Audit logging** for all administrative actions

### Authentication Security
- **JWT token expiration** (shorter for teachers)
- **Password complexity requirements**
- **Rate limiting** on login attempts
- **School code expiration** for security

### API Security
- **Input validation** on all endpoints
- **SQL injection prevention**
- **CORS configuration** for frontend domains
- **Request size limits** for bulk operations

---

## 8. Testing Strategy

### Unit Tests
- Model validation tests
- Authentication middleware tests
- Permission checking functions
- Bulk operation logic

### Integration Tests
- Complete authentication flows
- Role-based API access
- Bulk assignment operations
- Class lock/unlock functionality

### End-to-End Tests
- Teacher registration and approval flow
- Principal dashboard operations
- Attendance taking by teachers
- Report generation with role restrictions

---

This documentation provides a complete technical roadmap for implementing RBAC in your MDM Server. The solution is designed to be user-friendly while maintaining security and scalability.
