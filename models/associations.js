import { Admin } from './adminModel.js';
import { Student } from './studentModel.js';
import { Subject } from './subjectModel.js';
import { Attendance } from './attendanceModel.js';

// Admin Associations
Admin.hasMany(Student, { foreignKey: 'adminId', as: 'students' });
Admin.hasMany(Subject, { foreignKey: 'adminId', as: 'subjects' });
Admin.hasMany(Attendance, { foreignKey: 'adminId', as: 'attendances' });

// Student Associations
Student.belongsTo(Admin, { foreignKey: 'adminId', as: 'admin' });

// Subject Associations
Subject.belongsTo(Admin, { foreignKey: 'adminId', as: 'admin' });

// Attendance Associations
Attendance.belongsTo(Admin, { foreignKey: 'adminId', as: 'admin' });

export { Admin, Student, Subject, Attendance };