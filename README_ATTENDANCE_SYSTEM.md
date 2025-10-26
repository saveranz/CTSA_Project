# Attendance Tracking System

A complete login and registration system built with the XianFire framework, featuring separate student and admin authentication flows.

## Features Implemented

### 1. Login Page
- **UI Design**: Matches the provided design with school building background
- **Authentication**: Supports both student and admin login
- **Input Fields**: Email, Student ID, or Admin Username + Password
- **Password Visibility**: Eye icon toggle for password fields
- **Error Handling**: Flash messages for invalid credentials

### 2. Registration Page
- **Tabbed Interface**: Student and Admin registration forms
- **Student Registration**:
  - Full Name, Email, Student ID, Course, Year, Section, Password
  - Course dropdown with predefined options
  - Password confirmation validation
- **Admin Registration**:
  - Full Name, Email, Username, Role, Department, Password
  - Department dropdown with predefined options
  - Password confirmation validation
- **Password Visibility**: Eye icon toggle for all password fields

### 3. Authentication Logic
- **Student Authentication**: Login with email or student ID
- **Admin Authentication**: Login with email or username
- **Password Security**: Bcrypt hashing for all passwords
- **Session Management**: User type tracking (student/admin)
- **Redirect Logic**: Students → Student Dashboard, Admins → Admin Dashboard

### 4. Dashboard Pages
- **Student Dashboard**: Attendance overview with statistics
- **Admin Dashboard**: Management interface with student statistics
- **Navigation**: Logout functionality and user welcome messages

### 5. Database Models
- **Student Model**: fullName, email, studentId, course, year, section, password
- **Admin Model**: fullName, email, username, role, department, password
- **Sequelize Integration**: Automatic table creation and relationships

## Technical Implementation

### File Structure
```
├── controllers/
│   └── authController.js          # Authentication logic
├── models/
│   ├── studentModel.js            # Student database model
│   ├── adminModel.js              # Admin database model
│   └── userModel.js               # Original user model (kept for compatibility)
├── views/
│   ├── login.xian                 # Login page with UI design
│   ├── register.xian              # Registration page with tabs
│   ├── student-dashboard.xian     # Student dashboard
│   ├── admin-dashboard.xian       # Admin dashboard
│   └── partials/
│       ├── head.xian              # HTML head template
│       └── footer.xian            # HTML footer template
├── routes/
│   └── index.js                   # Updated routing
└── public/
    └── tailwind.css               # Custom CSS for background
```

### Key Features
1. **Password Visibility Toggle**: JavaScript-powered eye icon for all password fields
2. **Form Validation**: Client-side and server-side validation
3. **Flash Messages**: Success and error message display
4. **Responsive Design**: Mobile-friendly interface
5. **Security**: Password hashing, session management, input validation

### Routes
- `GET /login` - Login page
- `POST /login` - Login authentication
- `GET /register` - Registration page
- `POST /register/student` - Student registration
- `POST /register/admin` - Admin registration
- `GET /student-dashboard` - Student dashboard (protected)
- `GET /admin-dashboard` - Admin dashboard (protected)
- `GET /logout` - Logout and session cleanup

### Database Setup
The system automatically creates the necessary database tables when the application starts. Make sure your MySQL database is running and configured in `models/db.js`.

## Usage

1. **Start the application**: `npm run xian-start`
2. **Access the system**: Navigate to `http://localhost:3000`
3. **Register users**: Use the registration page to create student or admin accounts
4. **Login**: Use the login page with email/username and password
5. **Dashboard access**: Users are automatically redirected to their appropriate dashboard

## Background Image
The system expects a `bg_login.jpg` image file in the `public/` directory. This should be the school building image as described in the requirements. If the image is not available, a green gradient fallback is provided.

## Security Features
- Password hashing with bcrypt
- Session-based authentication
- Input validation and sanitization
- Protected routes with authentication checks
- Flash message system for user feedback
