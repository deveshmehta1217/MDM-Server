# Mid Day Meal Management System (MDM Server)

A multi-tenant backend server for managing and generating reports for the Mid Day Meal scheme in government primary schools across Gujarat.

## Features

- **Multi-Tenant Architecture**: Complete data isolation between schools
- **User Authentication**: JWT-based login/register with school-level access
- **Daily Attendance Management**: Track student attendance by class and category
- **Student Registration Management**: Manage registered students by academic year
- **Advanced Reporting**:
  - Daily Reports (PDF/Excel)
  - Semi-Monthly Reports (PDF/Excel)
  - Monthly Reports
  - Custom Date Range Reports
- **School Management**: Support for multiple schools with unique 11-digit IDs
- **Role-Based Access**: Admin and Teacher roles with appropriate permissions

## Tech Stack

- Node.js
- Express.js
- MongoDB with optimized indexes
- ExcelJS (Excel report generation)
- Puppeteer (PDF report generation)
- JWT Authentication with school context
- Multi-tenant data architecture

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd MDM-Server
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

4. Set up assets:
   - Create an `assets` folder in the root directory
   - Add required files:
     - `logo.png` - School logo
     - `Semi Monthly First.xlsx` - Template for first half monthly report
     - `Semi Monthly Second.xlsx` - Template for second half monthly report
     - `fonts/Shruti.ttf` - Gujarati font file

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Attendance
- `GET /api/attendance/:date` - Get attendance for a date
- `GET /api/attendance/:date/:standard/:division` - Get class-wise attendance
- `POST /api/attendance` - Create attendance record
- `PUT /api/attendance/:id` - Update attendance record
- `POST /api/attendance/save` - Save/Update attendance record

### Reports
- `GET /api/attendance/report/daily/:date` - Get daily report
- `GET /api/attendance/report/pdf/daily/:date` - Download daily PDF report
- `GET /api/attendance/report/excel/daily/:date` - Download daily Excel report
- `GET /api/attendance/report/semi-monthly/:year/:month/:half` - Get semi-monthly report
- `GET /api/attendance/report/excel/semi-monthly/:year/:month/:half` - Download semi-monthly Excel report
- `GET /api/attendance/report/pdf/semi-monthly/:year/:month/:half` - Download semi-monthly PDF report
- `GET /api/attendance/report/monthly/:year/:month` - Get monthly report
- `GET /api/attendance/report/custom/:startDate/:endDate` - Get custom date range report

## Data Models

### User
- name: String
- password: String (hashed)
- mobileNo: String (10 digits, unique)
- email: String (unique, validated)
- schoolName: String
- schoolId: String (11 digits, indexed)
- isAdmin: Boolean (default: false)
- createdAt: Date

### Attendance
- schoolId: String (11 digits, indexed)
- standard: Number (0-8)
- division: String (A-D)
- date: Date
- registeredStudents: Object (by category and gender)
- presentStudents: Object (by category and gender)
- mealTakenStudents: Object (by category and gender)

### RegisteredStudents
- schoolId: String (11 digits, indexed)
- standard: Number (0-8)
- division: String (A-D)
- academicYear: String
- counts: Object (by category and gender)

## Multi-Tenant Features

### School Isolation
- Complete data separation between schools
- School-specific authentication and authorization
- Automatic schoolId filtering in all queries

### Security
- JWT tokens include school context
- Role-based access control (Admin/Teacher)
- Input validation and sanitization
- Protected routes with school-level permissions

### Scalability
- Optimized database indexes for multi-tenant queries
- Efficient compound indexes on (schoolId + other fields)
- Support for 15-20 schools on Vercel free plan
- Ready for horizontal scaling

For detailed multi-tenant setup instructions, see [MULTI_TENANT_SETUP.md](./MULTI_TENANT_SETUP.md)

## Author

Devesh Mehta

### Contact Information
- GitHub: [@devesh1217](https://github.com/devesh1217)
- LinkedIn: [@devesh1217](https://linkedin.com/in/devesh1217)
- Website: [devesh-mehta.vercel.app](https://devesh-mehta.vercel.app/?utm_source=git_mdm_server)

## License

ISC
