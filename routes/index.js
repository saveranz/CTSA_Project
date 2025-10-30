
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
    
import express from "express";
import { homePage } from "../controllers/homeController.js";
const router = express.Router();
// Redirect root to login page
router.get("/", (req, res) => {
  res.redirect("/login");
});

import { 
  loginPage, 
  registerPage, 
  forgotPasswordPage, 
  studentDashboard, 
  adminDashboard, 
  loginUser, 
  registerStudent, 
  registerAdmin, 
  logoutUser,
  getDashboardData,
  getAdminDashboardData,
  checkinoutPage,
  studentCheckinPage,
  studentCalendarPage,
  studentSubjectsPage,
  historyPage,
  getHistory,
  studentsPage,
  getStudents,
  calendarPage,
  subjectsPage,
  getSubjects,
  getFakeSubjectsAPI,
  seedFakeSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  generateAttendancePage,
  studentCheckin,
  getRecentActivity,
  getStudentActivity,
  getStudentSchedule,
  getCurrentStudent,
  updateCurrentStudent,
  studentCheckout,
  getAttendanceSummaryByDate,
  deleteAttendanceRecord
} from "../controllers/authController.js";

router.get("/login", loginPage);
router.post("/login", loginUser);
router.get("/register", registerPage);
router.post("/register/student", registerStudent);
router.post("/register/admin", registerAdmin);
router.get("/forgot-password", forgotPasswordPage);
router.get("/student-dashboard", studentDashboard);
router.get("/student/checkinout", studentCheckinPage);
router.get('/student/calendar', studentCalendarPage);
router.get('/student/subjects', studentSubjectsPage);
router.get("/admin-dashboard", adminDashboard);
router.get("/checkinout", checkinoutPage);
router.get("/history", historyPage);
router.get("/students", studentsPage);
router.get("/api/students", getStudents);
router.delete('/api/students/:id', async (req, res) => {
  // forward to controller-level deleteStudent if present
  try {
    // lazy import to avoid circular issues
    const { deleteStudent } = await import('../controllers/authController.js');
    return deleteStudent(req, res);
  } catch (err) {
    console.error('Delete student route error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/api/student', getCurrentStudent);
router.put('/api/student/:id', updateCurrentStudent);
router.get("/calendar", calendarPage);
router.get("/subjects", subjectsPage);
router.get("/api/subjects", getSubjects);
router.get('/api/fake-subjects', getFakeSubjectsAPI);
router.post("/api/subjects", createSubject);
router.post('/api/seed-fake-subjects', seedFakeSubjects);
router.put("/api/subjects/:id", updateSubject);
router.delete("/api/subjects/:id", deleteSubject);
router.get("/api/history", getHistory);
router.get("/api/dashboard-data", getDashboardData);
router.get("/api/admin-dashboard-data", getAdminDashboardData);
router.get("/generate-attendance", generateAttendancePage);
router.post("/api/student-checkin", studentCheckin);
router.get("/api/recent-activity", getRecentActivity);
router.get("/api/student-activity", getStudentActivity);
router.get("/api/student-schedule", getStudentSchedule);
router.post("/api/student-checkout", studentCheckout);
router.get("/api/attendance-summary", getAttendanceSummaryByDate);
router.delete("/api/attendance-delete", deleteAttendanceRecord);
router.get("/logout", logoutUser);

export default router;
