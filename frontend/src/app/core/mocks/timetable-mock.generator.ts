import type { TimetableEntry } from '../models/models';

/**
 * Indian-school-style mock timetable: each faculty member teaches exactly one subject (their specialization).
 * At most one class section per (weekday, period) per teacher — no double-booking on the dashboard.
 * Library periods use only {@link LIBRARIAN_TEACHER_ID}; other teachers never appear on Library rows.
 */
const TENANT_ID = 't1';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** Classroom faculty (one canonical subject each). Length must equal {@link SECTIONS.length} for the Latin-square grid. */
const TEACHING_FACULTY: { teacherId: number; teacherName: string; subjectName: string }[] = [
  { teacherId: 1, teacherName: 'Sarah Mitchell', subjectName: 'Mathematics' },
  { teacherId: 2, teacherName: "James O'Brien", subjectName: 'English' },
  { teacherId: 3, teacherName: 'Priya Sharma', subjectName: 'Science' },
  { teacherId: 4, teacherName: 'Robert Kim', subjectName: 'Social Studies' },
  { teacherId: 5, teacherName: 'Maria Torres', subjectName: 'Computer Science' },
  { teacherId: 6, teacherName: 'David Anderson', subjectName: 'Physical Education' },
  { teacherId: 7, teacherName: 'Aisha Khan', subjectName: 'Art' },
  { teacherId: 8, teacherName: 'Thomas Lee', subjectName: 'Physics' },
  { teacherId: 9, teacherName: 'Arjun Mehta', subjectName: 'Hindi' },
  { teacherId: 10, teacherName: 'Neha Gupta', subjectName: 'Chemistry' },
  { teacherId: 11, teacherName: 'Ravi Nair', subjectName: 'Biology' },
];

export const LIBRARIAN_TEACHER_ID = 12;
const LIBRARIAN = { teacherId: LIBRARIAN_TEACHER_ID, teacherName: 'Kavita Iyer', subjectName: 'Library' as const };

/**
 * Demo sections covered by the grid (includes classes used by parent-portal mock children: 6, 7, 8, 9, 10, 11).
 * Same count as {@link TEACHING_FACULTY.length} so each period assigns one subject per section with a bijection to teachers.
 */
const SECTIONS: { classId: number; sectionId: number }[] = [
  { classId: 6, sectionId: 601 },
  { classId: 7, sectionId: 701 },
  { classId: 7, sectionId: 702 },
  { classId: 8, sectionId: 801 },
  { classId: 8, sectionId: 802 },
  { classId: 9, sectionId: 901 },
  { classId: 9, sectionId: 902 },
  { classId: 10, sectionId: 1001 },
  { classId: 10, sectionId: 1002 },
  { classId: 11, sectionId: 1101 },
  { classId: 11, sectionId: 1102 },
];

const PERIOD_SCHEDULE: { period: number; startTime: string; endTime: string }[] = [
  { period: 1, startTime: '08:00', endTime: '08:45' },
  { period: 2, startTime: '08:45', endTime: '09:30' },
  { period: 3, startTime: '09:45', endTime: '10:30' },
  { period: 4, startTime: '10:30', endTime: '11:15' },
  { period: 5, startTime: '11:30', endTime: '12:15' },
  { period: 6, startTime: '12:15', endTime: '13:00' },
  { period: 7, startTime: '13:15', endTime: '14:00' },
  { period: 8, startTime: '14:00', endTime: '14:45' },
];

function roomLabel(classId: number, period: number, sectionId: number): string {
  const tail = (classId * 17 + sectionId + period) % 90;
  return `Room ${170 + tail}`;
}

/**
 * Latin-style shift: section {@code sIdx} at {@code period} on a given weekday gets faculty
 * {@code TEACHING_FACULTY[(sIdx + period - 1 + dayOffset) % N]} — each period, all {@code N} teachers appear exactly once.
 */
function facultyIndexForSlot(sectionIndex: number, period: number, dayOffset: number): number {
  return (sectionIndex + period - 1 + dayOffset) % TEACHING_FACULTY.length;
}

export function buildGeneratedMockTimetableEntries(): TimetableEntry[] {
  const rows: TimetableEntry[] = [];
  let nextId = 1;
  for (const day of WEEKDAYS) {
    const dayOffset = WEEKDAYS.indexOf(day);
    for (const slot of PERIOD_SCHEDULE) {
      for (let sIdx = 0; sIdx < SECTIONS.length; sIdx++) {
        const sec = SECTIONS[sIdx];
        const fi = facultyIndexForSlot(sIdx, slot.period, dayOffset);
        const f = TEACHING_FACULTY[fi];
        rows.push({
          id: nextId++,
          classId: sec.classId,
          sectionId: sec.sectionId,
          day,
          period: slot.period,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subjectName: f.subjectName,
          teacherId: f.teacherId,
          teacherName: f.teacherName,
          room: roomLabel(sec.classId, slot.period, sec.sectionId),
          tenantId: TENANT_ID,
        });
      }
    }
  }

  /** One library block per weekday — librarian only; replaces the generated cell for the same (day, period, section). */
  const librarySection = { classId: 8, sectionId: 801 };
  const libraryPeriod = 8;
  for (const day of WEEKDAYS) {
    const slot = PERIOD_SCHEDULE.find(p => p.period === libraryPeriod)!;
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      if (
        r.day === day &&
        r.period === libraryPeriod &&
        r.classId === librarySection.classId &&
        r.sectionId === librarySection.sectionId
      ) {
        rows.splice(i, 1);
        break;
      }
    }
    rows.push({
      id: nextId++,
      classId: librarySection.classId,
      sectionId: librarySection.sectionId,
      day,
      period: libraryPeriod,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subjectName: LIBRARIAN.subjectName,
      teacherId: LIBRARIAN.teacherId,
      teacherName: LIBRARIAN.teacherName,
      room: 'Library',
      tenantId: TENANT_ID,
    });
  }

  return rows;
}
