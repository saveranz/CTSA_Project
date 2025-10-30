#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { Attendance, sequelize } from '../models/attendanceModel.js';

async function listRecent() {
  try {
    await sequelize.authenticate();
    const rows = await Attendance.findAll({ order: [['date', 'DESC']], limit: 20 });
    console.log(`Found ${rows.length} attendance records (last ${rows.length}):`);
    for (const r of rows) {
      console.log({ id: r.id, studentName: r.studentName, studentId: r.studentId, subject: r.subject, date: r.date, checkIn: r.checkIn, checkOut: r.checkOut, status: r.status });
    }
    await sequelize.close();
  } catch (err) {
    console.error('List failed:', err);
    try { await sequelize.close(); } catch (e) {}
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  listRecent().then(() => process.exit(0));
}
