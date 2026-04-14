import type { AttendanceRecord, AttendanceStats, AttendanceSummaryRow, Student } from '../models/models';
import { MOCK_STUDENTS } from './students.mock-data';
import { mockActiveStudents, mockStudentsInClass, mockStudentsInSection } from './mock-aggregates';

/** Matches demo teacher user Sarah Mitchell (`teacher@school.com` user id 2). */
export const MOCK_ATTENDANCE_MARKED_BY_USER_ID = 2;
const MOCK_TENANT_ID = 't1';

function hash31(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Deterministic status for (student, calendar day) so parent, teacher, and admin mocks
 * all reflect the same virtual `attendance_records` rows.
 */
export function mockAttendanceStatusFor(studentId: number, dateIso: string): AttendanceRecord['status'] {
  const h = hash31(`${studentId}|${dateIso}`) % 100;
  if (h < 78) {
    return 'present';
  }
  if (h < 88) {
    return 'late';
  }
  if (h < 95) {
    return 'absent';
  }
  return 'excused';
}

/** Stable synthetic PK for mock rows (mirrors DB uniqueness per tenant/student/day). */
export function stableMockAttendanceRowId(studentId: number, dateIso: string): number {
  return Math.abs((studentId * 1_000_003) ^ hash31(`att|${studentId}|${dateIso}`)) % 2_000_000_000;
}

function studentDisplayName(s: Student): string {
  return `${s.firstName} ${s.lastName}`.trim();
}

export function eachDateInclusive(fromIso: string, toIso: string): string[] {
  const out: string[] = [];
  const start = new Date(`${fromIso}T12:00:00`);
  const end = new Date(`${toIso}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return out;
  }
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

function recentCalendarDates(backDays: number): string[] {
  const out: string[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (let i = 0; i < backDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function buildAttendanceRecordForStudentDate(student: Student, dateIso: string): AttendanceRecord {
  return {
    id: stableMockAttendanceRowId(student.id, dateIso),
    studentId: student.id,
    studentName: studentDisplayName(student),
    classId: student.classId,
    sectionId: student.sectionId,
    date: dateIso,
    status: mockAttendanceStatusFor(student.id, dateIso),
    markedBy: MOCK_ATTENDANCE_MARKED_BY_USER_ID,
    tenantId: MOCK_TENANT_ID,
  };
}

/** One row per roster student for a class section on a calendar day (teacher attendance UI). */
export function buildMockAttendanceRecordsForClassDate(classId: number, sectionId: number, date: string): AttendanceRecord[] {
  const roster = mockStudentsInSection(classId, sectionId);
  return roster.map(s => buildAttendanceRecordForStudentDate(s, date));
}

export function mockAttendanceRecordsForStudentInRange(studentId: number, fromIso: string, toIso: string): AttendanceRecord[] {
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  if (!student || student.status !== 'active') {
    return [];
  }
  return eachDateInclusive(fromIso, toIso).map(d => buildAttendanceRecordForStudentDate(student, d));
}

/** Mirrors production parent stats: counts over raw rows in the date range. */
export function mockAttendanceStatsForStudentInRange(studentId: number, fromIso: string, toIso: string): AttendanceStats {
  const rows = mockAttendanceRecordsForStudentInRange(studentId, fromIso, toIso);
  const present = rows.filter(r => r.status === 'present').length;
  const absent = rows.filter(r => r.status === 'absent').length;
  const late = rows.filter(r => r.status === 'late').length;
  const excused = rows.filter(r => r.status === 'excused').length;
  const total = rows.length;
  const pct = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 0;
  return {
    studentId,
    totalDays: total,
    present,
    absent,
    late,
    excused,
    attendancePercentage: pct,
  };
}

/**
 * In-memory seed for {@link AttendanceService} mock mode: same generator as parent/report views
 * for overlapping dates.
 */
export function seedInitialMockAttendanceRecords(backDays = 50): AttendanceRecord[] {
  const dates = recentCalendarDates(backDays);
  const out: AttendanceRecord[] = [];
  for (const student of mockActiveStudents()) {
    for (const d of dates) {
      out.push(buildAttendanceRecordForStudentDate(student, d));
    }
  }
  return out;
}

function monthRangeYm(ym: string): { from: string; to: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym.trim());
  if (!m) {
    return null;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) {
    return null;
  }
  const moPad = m[2];
  const from = `${y}-${moPad}-01`;
  const last = new Date(y, mo, 0).getDate();
  const to = `${y}-${moPad}-${String(last).padStart(2, '0')}`;
  return { from, to };
}

/** Roll-up of deterministic daily statuses for every active student in the tenant (admin headline). */
export function mockTenantAttendanceOverviewForMonth(monthYm: string): {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
} {
  const range = monthRangeYm(monthYm);
  if (!range) {
    return { total: 0, present: 0, absent: 0, late: 0, excused: 0 };
  }
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  let total = 0;
  for (const s of mockActiveStudents()) {
    for (const d of eachDateInclusive(range.from, range.to)) {
      total++;
      const st = mockAttendanceStatusFor(s.id, d);
      if (st === 'present') {
        present++;
      } else if (st === 'absent') {
        absent++;
      } else if (st === 'late') {
        late++;
      } else {
        excused++;
      }
    }
  }
  return { total, present, absent, late, excused };
}

/** Report grid: one row per active student in class for the calendar month. */
export function buildMockReportAttendanceSummaryForClassMonth(classId: number, monthYm: string): AttendanceSummaryRow[] {
  const range = monthRangeYm(monthYm);
  if (!range) {
    return [];
  }
  return mockStudentsInClass(classId).map(s => {
    const st = mockAttendanceStatsForStudentInRange(s.id, range.from, range.to);
    return {
      studentId: s.id,
      studentName: studentDisplayName(s),
      present: st.present ?? 0,
      absent: st.absent ?? 0,
      late: st.late ?? 0,
      excused: st.excused ?? 0,
      totalDays: st.totalDays ?? 0,
      attendancePercentage: st.attendancePercentage ?? 0,
    };
  });
}
