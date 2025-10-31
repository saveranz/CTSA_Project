import { Student } from "../models/studentModel.js";
import { Subject } from "../models/subjectModel.js";
import { getFakeITSubjects } from "./authController.js";

export const studentSubjectsPage = async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'student') {
    return res.redirect('/login');
  }

  try {
    const student = await Student.findByPk(req.session.userId);
    // Get subjects from database, fallback to fake subjects if none exist
    let subjects = await Subject.findAll({
      order: [['day', 'ASC'], ['startTime', 'ASC']]
    });

    if (!subjects || subjects.length === 0) {
      subjects = getFakeITSubjects();
    }

    // Group subjects by day and time slot for the schedule
    const schedule = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    days.forEach(day => {
      const daySubjects = subjects.filter(s => s.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      schedule[day] = daySubjects;
    });

    // Calculate time slots for the schedule
    const timeSlots = Array.from(new Set(subjects.map(s => s.startTime)))
      .sort((a, b) => a.localeCompare(b));

    // Helper function to get subject abbreviation
    const getSubjectAbbr = (name) => {
      const words = name.split(' ');
      if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
      return words.map(word => word[0]).join('').toUpperCase();
    };

    // Calculate attendance rates (mock data for now)
    const attendanceRates = subjects.map(subject => ({
      ...subject,
      attendanceRate: Math.floor(Math.random() * (95 - 75) + 75) // Random between 75-95%
    }));

    res.render('student/student-subjects', {
      title: 'Student Subjects',
      userName: student ? student.fullName : req.session.userName,
      subjects: attendanceRates,
      schedule,
      timeSlots,
      days,
      getSubjectAbbr
    });
  } catch (error) {
    console.error('Student subjects page error:', error);
    res.redirect('/student-dashboard');
  }
};