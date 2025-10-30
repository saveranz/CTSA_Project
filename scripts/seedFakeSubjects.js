#!/usr/bin/env node
// Seed fake IT subjects into the database (upsert by code or name)
import { Subject, sequelize } from '../models/subjectModel.js';

const fakes = [
  {
    name: 'Application Development and Emerging Technologies',
    code: 'ITP 312',
    day: 'Monday',
    startTime: '10:00',
    endTime: '16:00',
    room: '116',
    lateThreshold: 15
  },
  {
    name: 'Networking 2',
    code: 'ITP 311',
    day: 'Wednesday',
    startTime: '13:00',
    endTime: '16:30',
    room: '116',
    lateThreshold: 15
  },
  {
    name: 'Event Driven Programming',
    code: 'ITP 313',
    day: 'Wednesday',
    startTime: '18:00',
    endTime: '19:00',
    room: '205',
    lateThreshold: 10
  },
  {
    name: 'Database Systems',
    code: 'ITP 321',
    day: 'Thursday',
    startTime: '09:00',
    endTime: '11:00',
    room: '210',
    lateThreshold: 10
  },
  {
    name: 'Web Technologies',
    code: 'ITP 305',
    day: 'Friday',
    startTime: '14:00',
    endTime: '16:00',
    room: '118',
    lateThreshold: 15
  }
];

async function upsertFakeSubjects() {
  try {
    // Ensure DB connection
    await sequelize.authenticate();
    console.log('DB connection ok — seeding fake subjects');

    const results = { created: [], updated: [] };

    for (const s of fakes) {
      // Try to find by code first, then by name
      let found = null;
      if (s.code) found = await Subject.findOne({ where: { code: s.code } });
      if (!found) found = await Subject.findOne({ where: { name: s.name } });

      if (found) {
        // Update fields to match the fake record
        await found.update({
          name: s.name,
          code: s.code,
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
          lateThreshold: s.lateThreshold
        });
        results.updated.push(found.id);
      } else {
        const created = await Subject.create({
          name: s.name,
          code: s.code,
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
          lateThreshold: s.lateThreshold
        });
        results.created.push(created.id);
      }
    }

    console.log('Seeding complete:', results);
    await sequelize.close();
    return results;
  } catch (err) {
    console.error('Seeding failed:', err);
    try { await sequelize.close(); } catch (e) {}
    process.exit(1);
  }
}

import { fileURLToPath } from 'url';

// Robust check for "executed as script" that works on Windows and POSIX
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  upsertFakeSubjects().then(() => process.exit(0));
}
