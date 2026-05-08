import type {
  AdminDashboardData,
  MarkRecord,
  ParentDashboardActivityItem,
  ParentDashboardData,
  TeacherAttendanceTrendPoint,
  TeacherDashboardData,
  TeacherHomeroomAttendanceDetail,
} from '../models/models';
import {
  buildAttendanceMetricContext,
  buildFeeMetricContext,
  buildResultMetricContext,
} from '../utils/parent-dashboard-metrics';
import { MOCK_SCHOOL_CLASSES } from './academic.mock-data';
import { MOCK_EXAMS_SEED } from './exam.mock-data';
import { MOCK_PARENT_CHILDREN, MOCK_PARENT_SEED_FEE_PAYMENTS, mockParentMarkRows } from './parent.mock-data';
import { MOCK_TEACHERS } from './teachers.mock-data';
import { MOCK_TIMETABLE_ENTRIES } from './timetable.mock-data';
import { examAppliesToStudent } from '../utils/exam-scope';
import {
  mockActiveStudentCount,
  mockClassesWithoutHomeroomTeacher,
  mockStudentsInSection,
  mockTeacherAssignedSlots,
} from './mock-aggregates';

/** Demo homeroom Class 8-A — roster size matches {@link MOCK_STUDENTS} for that section. */
const DEMO_HOMEROOM_CLASS_ID = 8;
const DEMO_HOMEROOM_SECTION_ID = 801;
const DEMO_HOMEROOM_STUDENT_COUNT = mockStudentsInSection(DEMO_HOMEROOM_CLASS_ID, DEMO_HOMEROOM_SECTION_ID).length;
import {
  eachDateInclusive,
  mockAttendanceStatusFor,
  mockTenantAttendanceOverviewForMonth,
  mockTenantAttendanceOverviewForToday,
} from './attendance.mock-data';

const DEMO_TEACHER_RECORD_ID = 1;

/** Matches {@link timetable-mock.generator} — no Sunday rows; map weekend to nearest school day for demo. */
const TIMETABLE_WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

function mockCalendarWeekday(): string {
  const js = new Date().getDay();
  if (js === 0) {
    return 'Monday';
  }
  return TIMETABLE_WEEKDAYS[js - 1] ?? 'Monday';
}

function sectionNameFor(classId: number, sectionId: number): string {
  const c = MOCK_SCHOOL_CLASSES.find(x => x.id === classId);
  return c?.sections?.find(s => s.id === sectionId)?.name ?? '';
}

function classNameFor(classId: number): string {
  return MOCK_SCHOOL_CLASSES.find(x => x.id === classId)?.name ?? `Class ${classId}`;
}

function buildTeacherTodaySchedule(teacherRecordId: number): TeacherDashboardData['todaySchedule'] {
  const day = mockCalendarWeekday();
  const forDay = MOCK_TIMETABLE_ENTRIES.filter(e => e.teacherId === teacherRecordId && e.day === day).sort(
    (a, b) => a.period - b.period,
  );
  /** At most one row per period (seed guarantees no double-booking; this keeps UI safe if data drifts). */
  const byPeriod = new Map<number, (typeof forDay)[0]>();
  for (const e of forDay) {
    if (!byPeriod.has(e.period)) {
      byPeriod.set(e.period, e);
    }
  }
  const teacher = MOCK_TEACHERS.find(t => t.id === teacherRecordId);
  const primarySubject = (teacher?.specialization ?? '').trim();
  return [...byPeriod.values()].map(e => ({
    classId: e.classId,
    sectionId: e.sectionId,
    period: e.period,
    subject: primarySubject || e.subjectName,
    className: classNameFor(e.classId),
    sectionName: sectionNameFor(e.classId, e.sectionId),
    room: e.room ?? '',
    startTime: e.startTime,
    endTime: e.endTime,
  }));
}

function upcomingExamCount(): number {
  return MOCK_EXAMS_SEED.filter(e => e.status === 'upcoming' || e.status === 'ongoing').length;
}

/** Six-month rolling series for the teacher attendance chart (deterministic demo curve). */
/** Homeroom daily % + ring breakdown for teacher dashboard (mock; mirrors API shape). */
export function buildMockTeacherHomeroom(monthYm: string): TeacherHomeroomAttendanceDetail {
  const [y, m] = monthYm.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const daily: {
    date: string;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    presentPercent: number;
    absentPercent: number;
    latePercent: number;
    excusedPercent: number;
  }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${monthYm}-${String(d).padStart(2, '0')}`;
    const present = Math.min(36, Math.max(30, 33 + (d % 4) - (d % 3)));
    const late = Math.min(3, (d % 4) + (d % 2));
    const absent = Math.min(4, Math.max(0, (d % 6) - 2));
    const excused = d % 5 === 0 ? 2 : d % 11 === 0 ? 1 : 0;
    const t = present + absent + late + excused;
    const scale = t > 0 ? 100 / t : 1;
    daily.push({
      date,
      presentCount: present,
      absentCount: absent,
      lateCount: late,
      excusedCount: excused,
      presentPercent: +(present * scale).toFixed(2),
      absentPercent: +(absent * scale).toFixed(2),
      latePercent: +(late * scale).toFixed(2),
      excusedPercent: +(excused * scale).toFixed(2),
    });
  }
  return {
    month: monthYm,
    classLabel: 'Class 7 · A',
    daily,
    breakdown: { present: 142, absent: 12, late: 8, excused: 3 },
  };
}

function buildTeacherAttendanceTrend(): TeacherAttendanceTrendPoint[] {
  const out: TeacherAttendanceTrendPoint[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const wave = 86 + ((i + now.getMonth()) % 5) * 2;
    out.push({ month, presentPercent: Math.min(98, wave) });
  }
  return out;
}

function currentMonthYm(): string {
  return new Date().toISOString().slice(0, 7);
}

function overallGradeFromMarks(marks: MarkRecord[]): string {
  if (!marks.length) {
    return '-';
  }
  const total =
    marks.reduce((sum, mark) => sum + (mark.marksObtained / Math.max(mark.maxMarks, 1)) * 100, 0) / marks.length;
  if (total >= 90) {
    return 'A+';
  }
  if (total >= 80) {
    return 'A';
  }
  if (total >= 70) {
    return 'B+';
  }
  if (total >= 60) {
    return 'B';
  }
  if (total >= 50) {
    return 'C';
  }
  return 'D';
}

export const MOCK_TEACHER_DASHBOARD: TeacherDashboardData = {
  assignedClasses: mockTeacherAssignedSlots(DEMO_TEACHER_RECORD_ID).length,
  /** Homeroom roster size (matches {@link classTeacherOf}[0].totalStudents); not timetable-wide student union. */
  studentsAssigned: DEMO_HOMEROOM_STUDENT_COUNT,
  upcomingExams: upcomingExamCount(),
  pendingAttendanceSessions: 4,
  unreadNotifications: 0,
  /** Homeroom for demo teacher (Sarah Mitchell, record id 1) — Class 8-A. */
  homeroomTodayAttendanceComplete: false,
  classTeacherOf: [
    {
      classId: DEMO_HOMEROOM_CLASS_ID,
      className: 'Class 8',
      sectionName: 'A',
      sectionId: DEMO_HOMEROOM_SECTION_ID,
      totalStudents: DEMO_HOMEROOM_STUDENT_COUNT,
    },
  ],
  messageQueue: [],
  quickActions: [
    { label: 'Inbox', route: '/app/chat', icon: 'bi-inbox-fill' },
    { label: 'Attendance', route: '/app/attendance', icon: 'bi-calendar-check-fill' },
    { label: 'Exams', route: '/app/exams', icon: 'bi-journal-text' },
  ],
  todaySchedule: buildTeacherTodaySchedule(DEMO_TEACHER_RECORD_ID),
  recentActivities: [
    {
      code: 'EXAM_SCHEDULED',
      type: 'warning',
      timestamp: new Date(Date.now() - 3600_000).toISOString(),
      params: { title: 'Unit Test 2 — Mathematics' },
      linkRoute: '/app/exams',
    },
    {
      code: 'ADMIN_ANNOUNCEMENT',
      type: 'info',
      timestamp: new Date(Date.now() - 7200_000).toISOString(),
      params: {},
      linkRoute: '/app/inbox',
    },
    {
      code: 'TIMETABLE_UPDATED',
      type: 'info',
      timestamp: new Date(Date.now() - 86400_000).toISOString(),
      params: { detail: 'Class 10-B · Period 4' },
      linkRoute: '/app/timetable',
    },
    {
      code: 'ATTENDANCE_PENDING',
      type: 'warning',
      timestamp: new Date(Date.now() - 900_000).toISOString(),
      params: { count: 4 },
      linkRoute: '/app/attendance',
      linkQueryParams: { focus: 'pending' },
    },
    {
      code: 'STUDENT_ROSTER_CHANGE',
      type: 'success',
      timestamp: new Date(Date.now() - 172800_000).toISOString(),
      params: { name: 'Class 8-A' },
      linkRoute: '/app/students',
    },
  ],
  attendanceTrend: buildTeacherAttendanceTrend(),
  homeroomAttendance: buildMockTeacherHomeroom(currentMonthYm()),
  pendingTasks: [
    {
      title: 'Submit Class 9-B attendance',
      description: 'Second-period roster for Class 9 section B is still open for today.',
      type: 'warning',
      timestamp: '09:45 AM',
    },
    {
      title: 'Review midterm papers',
      description: 'Moderation review list has pending answer sheets for Class 8-A.',
      type: 'info',
      timestamp: 'Today',
    },
    {
      title: 'Library period swap',
      description: 'Confirm cover for period 6 if you are unavailable Thursday.',
      type: 'info',
      timestamp: '1 hour ago',
    },
  ],
};

const adminMonthOverview = () => mockTenantAttendanceOverviewForMonth(currentMonthYm());
const adminTodayOverview = () => mockTenantAttendanceOverviewForToday();

export const MOCK_ADMIN_DASHBOARD: AdminDashboardData = (() => {
  const att = adminMonthOverview();
  const attToday = adminTodayOverview();
  return {
    totalStudents: mockActiveStudentCount(),
    totalTeachers: MOCK_TEACHERS.filter(t => t.status === 'active').length,
    feesCollected: 284000,
    feesPending: 46300,
    collectionRate: 86,
    feesCollectedMonthly: 47000,
    feesPendingMonthly: 8200,
    collectionRateMonthly: 85,
    feesCollectedYearly: 284000,
    feesPendingYearly: 46300,
    collectionRateYearly: 86,
    monthlyAdmissions: [
      { label: 'Sep', value: 42 },
      { label: 'Oct', value: 35 },
      { label: 'Nov', value: 28 },
      { label: 'Dec', value: 15 },
      { label: 'Jan', value: 48 },
      { label: 'Feb', value: 32 },
    ],
    monthlyCollections: [
      { label: 'Sep', value: 45000 },
      { label: 'Oct', value: 52000 },
      { label: 'Nov', value: 48000 },
      { label: 'Dec', value: 38000 },
      { label: 'Jan', value: 55000 },
      { label: 'Feb', value: 47000 },
    ],
    attendanceToday: {
      total: attToday.total,
      present: attToday.present,
      absent: attToday.absent,
      late: attToday.late,
      excused: attToday.excused,
    },
    attendanceOverview: {
      total: att.total,
      present: att.present,
      absent: att.absent,
      late: att.late,
      excused: att.excused,
    },
    recentActivities: [
      {
        title: 'New student Arjun Patel admitted',
        description: 'Joined Class 5-A through the admissions office',
        type: 'success',
        timestamp: '2 hours ago',
      },
      {
        title: 'Fee payment batch posted',
        description: '37 receipts reconciled against January dues',
        type: 'info',
        timestamp: '4 hours ago',
      },
      {
        title: 'Midterm marks published',
        description: 'Class 8 results are now visible to parents',
        type: 'warning',
        timestamp: '6 hours ago',
      },
      {
        title: 'Transport route updated',
        description: 'Route 3 stop timings were adjusted for the afternoon run',
        type: 'info',
        timestamp: '1 day ago',
      },
    ],
    upcomingEvents: [
      { id: 1, title: 'Parent-Teacher Meeting', date: '2026-04-15', description: 'Campus-wide parent interaction day' },
      { id: 2, title: 'Annual Sports Day', date: '2026-04-22', description: 'Inter-house athletics and opening ceremony' },
      { id: 3, title: 'Final Exam Window', date: '2026-05-05', description: 'Main term-end examinations begin' },
    ],
    classesWithoutHomeroomTeacher: mockClassesWithoutHomeroomTeacher(),
  };
})();

/** Exported for API fallback path in {@link DashboardService} (metrics + feed stay consistent). */
export function buildMockParentActivities(childFirstName: string, classLabel: string): ParentDashboardActivityItem[] {
  return [
    {
      code: 'RESULT_PUBLISHED',
      type: 'success',
      timestamp: '2026-04-14T14:20:00',
      params: { child: childFirstName },
    },
    {
      code: 'ATTENDANCE_MARKED',
      type: 'info',
      timestamp: '2026-04-15T08:05:00',
      params: { child: childFirstName, classLabel },
    },
    {
      code: 'FEE_PAYMENT_RECORDED',
      type: 'info',
      timestamp: '2026-04-10T11:40:00',
      params: { child: childFirstName },
    },
    {
      code: 'ANNOUNCEMENT_POSTED',
      type: 'warning',
      timestamp: '2026-04-12T09:00:00',
      params: {},
    },
  ];
}

export function buildMockParentDashboardData(fromIso: string, toIso: string, preferredChildId?: number): ParentDashboardData {
  const children = MOCK_PARENT_CHILDREN.map(c => ({ ...c }));
  const selected =
    preferredChildId != null ? children.find(c => c.id === preferredChildId) ?? children[0] : children[0];
  const marks = selected ? mockParentMarkRows(selected.id, `${selected.firstName} ${selected.lastName}`).map(m => ({ ...m })) : [];
  const stats = selected
    ? (() => {
        let present = 0;
        let absent = 0;
        let late = 0;
        let excused = 0;
        for (const d of eachDateInclusive(fromIso, toIso)) {
          const st = mockAttendanceStatusFor(selected.id, d);
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
        const total = present + absent + late + excused;
        const pct = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 0;
        return { present, absent, late, excused, total, pct };
      })()
    : { present: 0, absent: 0, late: 0, excused: 0, total: 0, pct: 0 };

  const feeRows = selected ? MOCK_PARENT_SEED_FEE_PAYMENTS.filter(p => p.studentId === selected.id).map(p => ({ ...p })) : [];
  const feeDue = feeRows.reduce((sum, fee) => sum + (fee.dueAmount ?? 0), 0);
  const alerts: ParentDashboardData['alerts'] = [];
  if (feeDue > 0 && selected) {
    alerts.push({
      type: 'warning',
      titleKey: 'dashboard.parent.alert.feeTitle',
      messageKey: 'dashboard.parent.alert.feeMessage',
      messageParams: {
        amount: `₹${feeDue.toLocaleString('en-IN')}`,
        name: `${selected.firstName} ${selected.lastName}`.trim(),
      },
      ctaLabelKey: 'dashboard.parent.cta.payNow',
      ctaRoute: '/app/parent/children',
      ctaQueryParams: { tab: 'fees', child: String(selected.id) },
    });
  }
  if (stats.total > 0 && stats.pct < 85) {
    alerts.push({
      type: 'info',
      titleKey: 'dashboard.parent.alert.attendanceTitle',
      messageKey: 'dashboard.parent.alert.attendanceMessage',
      messageParams: { pct: stats.pct.toFixed(1) },
      ctaLabelKey: 'dashboard.parent.cta.openAnnouncements',
      ctaRoute: '/app/inbox',
    });
  }
  if (marks.length && selected) {
    alerts.push({
      type: 'success',
      titleKey: 'dashboard.parent.alert.resultsTitle',
      messageKey: 'dashboard.parent.alert.resultsMessage',
      messageParams: {
        count: marks.length,
        grade: overallGradeFromMarks(marks),
      },
      ctaLabelKey: 'dashboard.parent.cta.viewExams',
      ctaRoute: '/app/exams',
      ctaQueryParams: { tab: 'results', studentId: String(selected.id) },
    });
  }
  alerts.push({
    type: 'info',
    titleKey: 'dashboard.parent.alert.ptmTitle',
    messageKey: 'dashboard.parent.alert.ptmMessage',
    ctaLabelKey: 'dashboard.parent.cta.openAnnouncements',
    ctaRoute: '/app/inbox',
  });

  const upcoming: ParentDashboardData['upcoming'] = [];
  if (selected) {
    for (const e of MOCK_EXAMS_SEED) {
      if (e.status === 'cancelled' || !examAppliesToStudent(e, selected)) {
        continue;
      }
      if (e.status === 'upcoming' || e.status === 'ongoing') {
        upcoming.push({
          id: e.id,
          title: e.name,
          date: e.startDate ?? '',
          description: e.endDate ? `Until ${e.endDate}` : '',
        });
      }
    }
    upcoming.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  const overallGrade = overallGradeFromMarks(marks);
  const classLabel = selected
    ? `${selected.className || ''}${selected.sectionName ? ' · ' + selected.sectionName : ''}`.trim()
    : '';

  return {
    childCount: children.length,
    children,
    selectedChild: selected,
    selectedChildId: selected?.id,
    attendancePercentage: stats.pct,
    overallGrade,
    feeDue,
    attendanceSnapshot: {
      totalDays: stats.total,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      excused: stats.excused,
    },
    attendanceMetric: buildAttendanceMetricContext(stats.pct),
    resultMetric: buildResultMetricContext(overallGrade, marks),
    feeMetric: buildFeeMetricContext(feeDue, feeRows),
    recentActivities: selected ? buildMockParentActivities(selected.firstName, classLabel || selected.className) : [],
    alerts,
    upcoming,
    childPerformance: marks,
    feeStatus: feeRows,
  };
}
