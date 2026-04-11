import type { AttendanceRecord } from '../models/models';

const MOCK_CLASS_ROSTER_FOR_ATTENDANCE: Array<{ id: number; name: string }> = [
  { id: 1, name: 'Arjun Patel' },
  { id: 2, name: 'Emily Watson' },
  { id: 3, name: 'Liam Chen' },
  { id: 4, name: 'Sofia Martinez' },
  { id: 5, name: 'Noah Williams' },
  { id: 6, name: 'Ava Johnson' },
  { id: 7, name: 'Ethan Brown' },
  { id: 8, name: 'Isabella Garcia' },
];

const STATUSES: ('present' | 'absent' | 'late')[] = ['present', 'present', 'present', 'present', 'present', 'absent', 'late', 'present'];

/** Same shape as a typical GET /attendance mock for Class 5-A on `date`. */
export function buildMockAttendanceRecordsForClassDate(date: string): AttendanceRecord[] {
  return MOCK_CLASS_ROSTER_FOR_ATTENDANCE.map((s, i) => ({
    id: 9000 + i,
    studentId: s.id,
    studentName: s.name,
    classId: 5,
    sectionId: 501,
    date,
    status: STATUSES[i % STATUSES.length],
    markedBy: 2,
    tenantId: 't1',
  }));
}
