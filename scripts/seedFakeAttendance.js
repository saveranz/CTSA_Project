#!/usr/bin/env node
// Seed fake attendance records for admin history/testing
import { fileURLToPath } from 'url';
import { Attendance, sequelize } from '../models/attendanceModel.js';
import { Op } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);

const fakes = [
  {
    studentName: 'Angelica B. Bejer',
    studentId: '00418',
    course: 'Information Technology',
    subject: 'Application Development and Emerging Technologies',
    checkIn: '12:04 PM',
    checkOut: null,
    status: 'Absent',
    campus: 'Bongabong Campus',
    // date will be today
    offsetDays: 0
  },
  {
    studentName: 'Carlos Dela Cruz',
    studentId: '00419',
    course: 'Information Technology',
    subject: 'Networking 2',
    checkIn: '01:05 PM',
    checkOut: '03:00 PM',
    status: 'Present',
    campus: 'Bongabong Campus',
    offsetDays: 0
  },
  {
    studentName: 'Maria Santos',
    studentId: '00420',
    course: 'Information Technology',
    subject: 'Event Driven Programming',
    checkIn: '06:10 PM',
    checkOut: null,
    status: 'Late',
    campus: 'Bongabong Campus',
    offsetDays: 1
  },
  {
    studentName: 'Juan Dela Cruz',
    studentId: '00421',
    course: 'Information Technology',
    subject: 'Database Systems',
    checkIn: '09:00 AM',
    checkOut: '11:00 AM',
    status: 'Present',
    campus: 'Bongabong Campus',
    offsetDays: 2
  },
  {
    studentName: 'Ana Reyes',
    studentId: '00422',
    course: 'Information Technology',
    subject: 'Web Technologies',
    checkIn: '02:10 PM',
    checkOut: '04:00 PM',
    status: 'Present',
    campus: 'Bongabong Campus',
    offsetDays: 3
  },
  {
    studentName: 'Pedro Tan',
    studentId: '00423',
    course: 'Information Technology',
    subject: 'Networking 2',
    checkIn: '01:30 PM',
    checkOut: null,
    status: 'Late',
    campus: 'Bongabong Campus',
    offsetDays: 4
  }
];

async function seedAttendances() {
  try {
    await sequelize.authenticate();
    console.log('DB connection ok — seeding fake attendances');

    const created = [];

    for (const f of fakes) {
      const d = new Date();
      d.setDate(d.getDate() - f.offsetDays);
      // set to midday for consistency when storing DATE
      d.setHours(12, 0, 0, 0);

      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      // avoid duplicate for same studentId+subject+date
      const existing = await Attendance.findOne({
        where: {
          studentId: f.studentId,
          subject: f.subject,
          date: {
            [Op.gte]: start,
            [Op.lt]: end
          }
        }
      });

      if (existing) {
        // update existing to match fake (useful if you re-run)
        await existing.update({
          studentName: f.studentName,
          course: f.course,
          checkIn: f.checkIn,
          checkOut: f.checkOut,
          status: f.status,
          campus: f.campus,
          date: d
        });
        created.push(existing.id);
      } else {
        const rec = await Attendance.create({
          studentName: f.studentName,
          studentId: f.studentId,
          course: f.course,
          date: d,
          checkIn: f.checkIn,
          checkOut: f.checkOut,
          subject: f.subject,
          status: f.status,
          campus: f.campus
        });
        created.push(rec.id);
      }
    }

    console.log('Seeding complete — attendance IDs:', created);
    await sequelize.close();
    return created;
  } catch (err) {
    console.error('Seeding failed:', err);
    try { await sequelize.close(); } catch (e) {}
    process.exit(1);
  }
}

if (process.argv[1] === __filename) {
  seedAttendances().then(() => process.exit(0));
}
