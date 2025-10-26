
      /*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    */
    
import bcrypt from "bcrypt";
import { User, sequelize } from "../models/userModel.js";
import { Student } from "../models/studentModel.js";
import { Admin } from "../models/adminModel.js";
import { Attendance } from "../models/attendanceModel.js";
import { Subject } from "../models/subjectModel.js";
import { Op } from "sequelize";

export const loginPage = (req, res) => res.render("login", { title: "Login" });
export const registerPage = (req, res) => res.render("register", { title: "Register" });
export const forgotPasswordPage = (req, res) => res.render("forgotpassword", { title: "Forgot Password" });
export const studentDashboard = (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  // If logged in as admin, redirect to admin dashboard
  if (req.session.userType !== 'student') {
    if (req.session.userType === 'admin') return res.redirect('/admin-dashboard');
    return res.redirect('/login');
  }

  // Render student dashboard with student info
  return (async () => {
    try {
      const student = await Student.findByPk(req.session.userId);
      res.render('student/student-dashboard', {
        title: 'Student Dashboard',
        userName: student ? student.fullName : req.session.userName,
        userInitial: student ? student.fullName.charAt(0).toUpperCase() : (req.session.userName || 'U').charAt(0)
      });
    } catch (error) {
      console.error('Student dashboard render error:', error);
      res.redirect('/login');
    }
  })();
};

// API endpoint for student dashboard data
export const getDashboardData = async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'student') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const studentId = req.session.userId;

    // Fetch attendance records for this student
    const records = await Attendance.findAll({ where: { studentId }, order: [['date', 'ASC']] });

    // Compute metrics
    const totalRecords = records.length;
    const presentToday = records.filter(r => {
      const today = new Date();
      const rDate = new Date(r.date);
      return rDate.toDateString() === today.toDateString() && r.status && r.status.toLowerCase() === 'present';
    }).length;
    const absentToday = records.filter(r => {
      const today = new Date();
      const rDate = new Date(r.date);
      return rDate.toDateString() === today.toDateString() && r.status && r.status.toLowerCase() === 'absent';
    }).length;

    const attendedCount = records.filter(r => r.status && r.status.toLowerCase() === 'present').length;
    const absentCount = records.filter(r => r.status && r.status.toLowerCase() === 'absent').length;
    const attendanceRate = totalRecords === 0 ? 0 : (attendedCount / totalRecords) * 100;

    // Weekly breakdown - last 7 days
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      labels.push(label);

      const dayRecords = records.filter(r => {
        const rDate = new Date(r.date);
        return rDate.toDateString() === d.toDateString();
      });
      if (dayRecords.length === 0) {
        data.push(0);
      } else {
        const present = dayRecords.filter(rr => rr.status && rr.status.toLowerCase() === 'present').length;
        data.push(present / dayRecords.length);
      }
    }

    const dashboardData = {
      metrics: {
        totalRecords,
        presentToday,
        absentToday,
        attendedCount,
        absentCount,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      },
      weeklyAttendance: {
        labels,
        data
      },
      monthlyTrend: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [0, 0, 0, 0, 0, 0]
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// API endpoint for admin dashboard data
export const getAdminDashboardData = async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get real data from database
    const totalStudents = await Student.count();
    
    // Sample data - in a real application, this would come from attendance records
    const dashboardData = {
      metrics: {
        totalStudents: totalStudents,
        presentToday: 0,
        absentToday: 0,
        lateArrivals: 0
      },
      weeklyAttendance: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [95, 100, 92, 85, 60, 50, 78]
      },
      departmentDistribution: {
        labels: ['Computer Studies', 'Business Management', 'Arts and Science'],
        data: [60, 35, 5]
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Admin dashboard data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const adminDashboard = async (req, res) => {
  // If not logged in, redirect to login
  if (!req.session.userId) return res.redirect('/login');

  // If logged in as student, redirect to student dashboard
  if (req.session.userType === 'student') return res.redirect('/student-dashboard');

  // Only admins should access this page
  if (req.session.userType !== 'admin') return res.redirect('/login');
  
  try {
    // Get admin details from database
    const admin = await Admin.findByPk(req.session.userId);
    
    res.render("admin/admin-dashboard", { 
      title: "Admin Dashboard",
      userName: admin.fullName,
      userRole: admin.role,
      userUsername: admin.username,
      userEmail: admin.email,
      userInitial: admin.fullName.charAt(0).toUpperCase()
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.redirect("/login");
  }
};

export const checkinoutPage = async (req, res) => {
  // Allow both admin and student users to view this page (kiosk / check-in flow)
  if (!req.session.userId || (req.session.userType !== "admin" && req.session.userType !== "student")) {
    return res.redirect("/login");
  }

  try {
    const admin = await Admin.findByPk(req.session.userId);
    // Sample placeholders for integration
    const sampleLocation = {
      campus: 'Bongabong Campus',
      building: 'IT Building',
      wifi: true
    };

    res.render('admin/checkinout', {
      title: 'Check In/Out',
      userName: admin.fullName,
      userRole: admin.role,
      userUsername: admin.username,
      userEmail: admin.email,
      userInitial: admin.fullName.charAt(0).toUpperCase(),
      location: sampleLocation
    });
  } catch (error) {
    console.error('Check In/Out page error:', error);
    res.redirect('/admin-dashboard');
  }
};

export const historyPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  try {
    const user = req.session.userType === 'admin' ? await Admin.findByPk(req.session.userId) : await Student.findByPk(req.session.userId);
    res.render('admin/history', {
      title: 'Attendance History',
      userName: user ? user.fullName : 'User',
      userRole: req.session.userType || 'User'
    });
  } catch (error) {
    console.error('History page error:', error);
    res.redirect('/');
  }
};

export const getHistory = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const records = await Attendance.findAll({ 
      order: [['date', 'DESC']], 
      limit: 1000 
    });
    
    // Map to plain objects with all required fields
    const data = records.map(r => ({
      studentId: r.studentId,
      studentName: r.studentName,
      course: r.course,
      subject: r.subject,
      checkIn: r.checkIn,
      checkOut: r.checkOut || null,
      status: r.status,
      date: r.date,
      campus: r.campus
    }));
    
    console.log(`✅ Retrieved ${data.length} attendance records for history`);
    res.json({ data });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Students page (admin-accessible)
export const studentsPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  try {
    const user = req.session.userType === 'admin' ? await Admin.findByPk(req.session.userId) : await Student.findByPk(req.session.userId);
    res.render('admin/students', {
      title: 'Students',
      userName: user ? user.fullName : 'User',
      userRole: req.session.userType || 'User'
    });
  } catch (error) {
    console.error('Students page error:', error);
    res.redirect('/');
  }
};

// API: return students list for DataTables or client UI
export const getStudents = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const students = await Student.findAll({ order: [['fullName', 'ASC']] });
    const data = students.map(s => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      studentId: s.studentId,
      course: s.course,
      year: s.year,
      section: s.section
    }));
    res.json({ data });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API: delete a student (admin only)
export const deleteStudent = async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized - admin required' });
  }

  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing student id' });

    const student = await Student.findByPk(id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const name = student.fullName;
    await student.destroy();
    console.log('✅ Student deleted:', { id, name, deletedBy: req.session.userName || 'Admin' });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Calendar page (admin and students)
export const calendarPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  try {
    const user = req.session.userType === 'admin' ? await Admin.findByPk(req.session.userId) : await Student.findByPk(req.session.userId);
    res.render('admin/calendar', {
      title: 'Calendar',
      userName: user ? user.fullName : 'User',
      userRole: req.session.userType || 'User'
    });
  } catch (error) {
    console.error('Calendar page error:', error);
    res.redirect('/admin-dashboard');
  }
};

// Student Calendar page - student-only view that mirrors admin calendar UI
export const studentCalendarPage = async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'student') {
    return res.redirect('/login');
  }

  try {
    const student = await Student.findByPk(req.session.userId);
    res.render('student/student-calendar', {
      title: 'Calendar',
      userName: student ? student.fullName : req.session.userName,
      userRole: 'Student'
    });
  } catch (error) {
    console.error('Student calendar page error:', error);
    res.redirect('/student-dashboard');
  }
};

// Student Check In/Out page
export const studentCheckinPage = async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'student') {
    return res.redirect('/login');
  }

  try {
    const student = await Student.findByPk(req.session.userId);
    res.render('student/student-checkinout', {
      title: 'Check In/Out',
      userName: student ? student.fullName : req.session.userName,
      userRole: 'Student',
      userInitial: student ? student.fullName.charAt(0).toUpperCase() : (req.session.userName || 'S').charAt(0),
      studentId: student ? student.studentId : ''
    });
  } catch (error) {
    console.error('Student checkin page error:', error);
    res.redirect('/student-dashboard');
  }
};

// Student Subjects page
export const studentSubjectsPage = async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'student') {
    return res.redirect('/login');
  }

  try {
    const student = await Student.findByPk(req.session.userId);
    res.render('student/student-subjects', {
      title: 'Subjects',
      userName: student ? student.fullName : req.session.userName,
      userRole: 'Student'
    });
  } catch (error) {
    console.error('Student subjects page error:', error);
    res.redirect('/student-dashboard');
  }
};

// API: get current logged-in student's profile
export const getCurrentStudent = async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'student') return res.status(401).json({ error: 'Unauthorized' });
  try {
    const student = await Student.findByPk(req.session.userId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ data: {
      id: student.id,
      fullName: student.fullName,
      studentId: student.studentId,
      course: student.course,
      email: student.email,
      year: student.year,
      section: student.section
    }});
  } catch (err) {
    console.error('Get current student error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API: update current student's profile (or admin updating student by id)
export const updateCurrentStudent = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = req.params;
    // allow students to update their own record; admins can update any
    if (req.session.userType === 'student' && Number(id) !== Number(req.session.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const student = await Student.findByPk(id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { fullName, email, course, year, section } = req.body;
    // Basic validation
    if (!fullName || !email || !course) return res.status(400).json({ error: 'Missing required fields' });
    // Email basic format
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });

    await student.update({ fullName, email, course, year: year || student.year, section: section || student.section });
    res.json({ success: true, data: { id: student.id, fullName: student.fullName, email: student.email, course: student.course, year: student.year, section: student.section } });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Subjects page
export const subjectsPage = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  try {
    const user = req.session.userType === 'admin' ? await Admin.findByPk(req.session.userId) : await Student.findByPk(req.session.userId);
    if (req.session.userType === 'admin') {
      res.render('admin/subjects', {
        title: 'Subjects',
        userName: user ? user.fullName : 'User',
        userRole: req.session.userType || 'User'
      });
    } else {
      res.render('subjects', {
        title: 'Subjects',
        userName: user ? user.fullName : 'User',
        userRole: req.session.userType || 'User'
      });
    }
  } catch (error) {
    console.error('Subjects page error:', error);
    res.redirect('/admin-dashboard');
  }
};

// Generate Attendance page
export const generateAttendancePage = async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'admin') {
    return res.redirect('/login');
  }
  
  try {
    const admin = await Admin.findByPk(req.session.userId);
    res.render('admin/generate_attendance', {
      title: 'Generate Attendance',
      userName: admin ? admin.fullName : 'Admin',
      userRole: 'Admin'
    });
  } catch (error) {
    console.error('Generate attendance page error:', error);
    res.redirect('/admin-dashboard');
  }
};

// API: get all subjects
export const getSubjects = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const subjects = await Subject.findAll({ order: [['day', 'ASC'], ['startTime', 'ASC']] });
    res.json({ data: subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API: create subject
export const createSubject = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { name, code, day, startTime, endTime, room, lateThreshold } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Subject name is required' });
    }
    
    // Validate time format if provided
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid time format' });
      }
      
      if (start >= end) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
    }
    
    const subject = await Subject.create({ 
      name: name.trim(), 
      code: code ? code.trim() : null, 
      day: day || null, 
      startTime: startTime || null, 
      endTime: endTime || null, 
      room: room ? room.trim() : null,
      lateThreshold: lateThreshold !== undefined && lateThreshold !== null && `${lateThreshold}`.trim() !== '' ? parseInt(lateThreshold, 10) : null 
    });
    
    console.log('✅ Subject created successfully:', {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      day: subject.day,
      startTime: subject.startTime,
      endTime: subject.endTime,
      room: subject.room
    });
    
    res.json({ success: true, data: subject });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API: update subject
export const updateSubject = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = req.params;
    const { name, code, day, startTime, endTime, room, lateThreshold } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Subject name is required' });
    }
    
    // Validate time format if provided
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid time format' });
      }
      
      if (start >= end) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
    }
    
    const subject = await Subject.findByPk(id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    
    await subject.update({ 
      name: name.trim(), 
      code: code ? code.trim() : null, 
      day: day || null, 
      startTime: startTime || null, 
      endTime: endTime || null, 
      room: room ? room.trim() : null,
      lateThreshold: lateThreshold !== undefined && lateThreshold !== null && `${lateThreshold}`.trim() !== '' ? parseInt(lateThreshold, 10) : null 
    });
    
    console.log('✅ Subject updated successfully:', {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      day: subject.day,
      startTime: subject.startTime,
      endTime: subject.endTime,
      room: subject.room
    });
    
    res.json({ success: true, data: subject });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API: delete subject
export const deleteSubject = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    
    const subjectName = subject.name;
    await subject.destroy();
    console.log('✅ Subject deleted successfully:', subjectName);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API: Student check-in for attendance
export const studentCheckin = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const { studentId, password, subjectId, subjectName } = req.body;
    
    // Validate input
    if (!studentId || !password || !subjectId || !subjectName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Find student by studentId
    const student = await Student.findOne({ where: { studentId } });
    if (!student) {
      return res.status(404).json({ error: 'Invalid Student ID or Password. Please try again.' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid Student ID or Password. Please try again.' });
    }
    
    // Check if student already checked in for this subject today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingAttendance = await Attendance.findOne({
      where: {
        studentId: student.studentId,
        subject: subjectName,
        date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });
    
    if (existingAttendance) {
      return res.status(400).json({ error: 'Student has already checked in for this subject today.' });
    }
    
    // Create attendance record
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    
    // Determine status based on subject startTime and lateThreshold
    let computedStatus = 'Present';
    try {
      const subject = await Subject.findByPk(subjectId);
      if (subject && subject.startTime) {
        // Parse startTime (HH:MM) and current time
        const now = new Date();
        const [sh, sm] = subject.startTime.split(':').map(Number);
        const scheduled = new Date(now);
        scheduled.setHours(sh || 0, sm || 0, 0, 0);

        const thresholdMinutes = Number.isInteger(subject.lateThreshold) ? subject.lateThreshold : 15;
        const lateCutoff = new Date(scheduled.getTime() + thresholdMinutes * 60000);
        const absentCutoff = new Date(scheduled.getTime() + thresholdMinutes * 2 * 60000);

        if (now <= lateCutoff) {
          computedStatus = 'Present';
        } else if (now > lateCutoff && now < absentCutoff) {
          computedStatus = 'Late';
        } else if (now >= absentCutoff) {
          computedStatus = 'Absent';
        }
      }
    } catch (e) {
      // Fallback to default Present if any error occurs
      computedStatus = 'Present';
    }

    const attendance = await Attendance.create({
      studentName: student.fullName,
      studentId: student.studentId,
      course: student.course,
      date: new Date(),
      checkIn: currentTime,
      subject: subjectName,
      status: computedStatus,
      campus: 'Bongabong Campus'
    });
    
    console.log('✅ Student check-in recorded:', {
      studentName: student.fullName,
      studentId: student.studentId,
      subject: subjectName,
      time: currentTime
    });
    
    res.json({ 
      success: true, 
      data: {
        studentName: student.fullName,
        studentId: student.studentId,
        course: student.course,
        checkIn: currentTime,
        subject: subjectName,
        status: 'Present'
      }
    });
  } catch (error) {
    console.error('Student check-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API: Get recent activity
export const getRecentActivity = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const activities = await Attendance.findAll({
      order: [['date', 'DESC']],
      limit: 20,
      where: {
        date: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    
    const data = activities.map(activity => ({
      studentName: activity.studentName,
      studentId: activity.studentId,
      course: activity.course,
      checkIn: activity.checkIn,
      subject: activity.subject,
      status: activity.status,
      date: activity.date
    }));
    
    res.json({ data });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API: Get student activity (for student dashboard)
export const getStudentActivity = async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'student') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const student = await Student.findByPk(req.session.userId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const activities = await Attendance.findAll({
      where: { studentId: student.studentId },
      order: [['date', 'DESC']],
      limit: 10
    });
    
    const data = activities.map(activity => ({
      subject: activity.subject,
      checkIn: activity.checkIn,
      status: activity.status,
      course: activity.course,
      campus: activity.campus,
      date: activity.date
    }));
    
    res.json({ data });
  } catch (error) {
    console.error('Get student activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API: Get student's today schedule
export const getStudentSchedule = async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'student') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const subjects = await Subject.findAll({
      where: { day: today },
      order: [['startTime', 'ASC']]
    });
    
    const data = subjects.map(subject => ({
      name: subject.name,
      code: subject.code,
      startTime: subject.startTime,
      endTime: subject.endTime,
      room: subject.room
    }));
    
    res.json({ data });
  } catch (error) {
    console.error('Get student schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API: Student checkout
export const studentCheckout = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const { studentId, subjectName } = req.body;
    
    // Validate input
    if (!studentId || !subjectName) {
      return res.status(400).json({ error: 'Student ID and Subject are required' });
    }
    
    // Find the most recent attendance record for this student and subject
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await Attendance.findOne({
      where: {
        studentId: studentId,
        subject: subjectName,
        date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        checkOut: null // Only find records that haven't been checked out
      },
      order: [['date', 'DESC']]
    });
    
    if (!attendance) {
      return res.status(404).json({ error: 'No active attendance record found for checkout' });
    }
    
    // Update checkout time
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    
    await attendance.update({ checkOut: currentTime });
    
    console.log('✅ Student checkout recorded:', {
      studentName: attendance.studentName,
      studentId: attendance.studentId,
      subject: attendance.subject,
      checkOut: currentTime
    });
    
    res.json({ 
      success: true, 
      data: {
        studentName: attendance.studentName,
        studentId: attendance.studentId,
        subject: attendance.subject,
        checkOut: currentTime,
        status: attendance.status
      }
    });
  } catch (error) {
    console.error('Student checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API: Get attendance summary counts by date (present, late, absent)
export const getAttendanceSummaryByDate = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Missing date parameter (YYYY-MM-DD)' });
    }

    const start = new Date(date);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const records = await Attendance.findAll({
      where: {
        date: {
          [Op.gte]: start,
          [Op.lt]: end
        }
      }
    });

    const summary = records.reduce((acc, r) => {
      const status = (r.status || '').toLowerCase();
      if (status === 'present') acc.present += 1;
      else if (status === 'late') acc.late += 1;
      else if (status === 'absent') acc.absent += 1;
      return acc;
    }, { present: 0, late: 0, absent: 0 });

    res.json({
      date: start.toISOString().slice(0, 10),
      counts: summary,
      total: records.length
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API: Delete attendance record
export const deleteAttendanceRecord = async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized - Admin access required' });
  }

  try {
    const { studentId, subject, date } = req.body;
    
    if (!studentId || !subject || !date) {
      return res.status(400).json({ error: 'Missing required fields: studentId, subject, date' });
    }

    // Find the attendance record
    const record = await Attendance.findOne({
      where: {
        studentId: studentId,
        subject: subject,
        date: new Date(date)
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Delete the record
    await record.destroy();

    console.log('✅ Attendance record deleted:', {
      studentId: studentId,
      subject: subject,
      date: date,
      deletedBy: req.session.userName || 'Admin'
    });

    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Try to find student first
    let user = await Student.findOne({ 
      where: { 
        [Op.or]: [
          { email: email },
          { studentId: email }
        ]
      } 
    });
    
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        req.flash("error_msg", "Invalid credentials");
        return res.redirect("/login");
      }
      req.session.userId = user.id;
      req.session.userType = "student";
      req.session.userName = user.fullName;
      return res.redirect("/student-dashboard");
    }
    
    // Try to find admin
    user = await Admin.findOne({ 
      where: { 
        [Op.or]: [
          { email: email },
          { username: email }
        ]
      } 
    });
    
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        req.flash("error_msg", "Invalid credentials");
        return res.redirect("/login");
      }
      req.session.userId = user.id;
      req.session.userType = "admin";
      req.session.userName = user.fullName;
      return res.redirect("/admin-dashboard");
    }
    
    // User not found
    req.flash("error_msg", "Invalid credentials");
    res.redirect("/login");
    
  } catch (error) {
    console.error("Login error:", error);
    req.flash("error_msg", "An error occurred during login");
    res.redirect("/login");
  }
};

export const registerStudent = async (req, res) => {
  const { fullName, email, studentId, course, year, section, password, confirmPassword } = req.body;
  
  try {
    // Validate passwords match
    if (password !== confirmPassword) {
      req.flash("error_msg", "Passwords do not match");
      return res.redirect("/register");
    }
    
    // Check if student already exists
    const existingStudent = await Student.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { studentId: studentId }
        ]
      }
    });
    
    if (existingStudent) {
      req.flash("error_msg", "Student with this email or ID already exists");
      return res.redirect("/register");
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const student = await Student.create({
      fullName,
      email,
      studentId,
      course,
      year,
      section,
      password: hashed
    });
    
    req.flash("success_msg", "Student registered successfully");
    res.redirect("/login");
    
  } catch (error) {
    console.error("Student registration error:", error);
    req.flash("error_msg", "An error occurred during registration");
    res.redirect("/register");
  }
};

export const registerAdmin = async (req, res) => {
  const { fullName, email, username, role, department, password, confirmPassword } = req.body;
  
  try {
    // Validate passwords match
    if (password !== confirmPassword) {
      req.flash("error_msg", "Passwords do not match");
      return res.redirect("/register");
    }
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { username: username }
        ]
      }
    });
    
    if (existingAdmin) {
      req.flash("error_msg", "Admin with this email or username already exists");
      return res.redirect("/register");
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      fullName,
      email,
      username,
      role,
      department,
      password: hashed
    });
    
    req.flash("success_msg", "Admin registered successfully");
    res.redirect("/login");
    
  } catch (error) {
    console.error("Admin registration error:", error);
    req.flash("error_msg", "An error occurred during registration");
    res.redirect("/register");
  }
};

export const logoutUser = (req, res) => {
  req.session.destroy();
  res.redirect("/login");
};
