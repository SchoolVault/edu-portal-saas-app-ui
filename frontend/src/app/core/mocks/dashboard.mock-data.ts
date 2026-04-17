import type { AdminDashboardData, MarkRecord, ParentDashboardActivityItem, ParentDashboardData, TeacherDashboardData } from '../models/models';
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
  mockHomeroomRowsForTeacherRecordId,
  mockStudentsInSection,
} from './mock-aggregates';
import { eachDateInclusive, mockAttendanceStatusFor, mockTenantAttendanceOverviewForMonth } from './attendance.mock-data';

const DEMO_TEACHER_RECORD_ID = 1;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

function mockCalendarWeekday(): string {
  const name = WEEKDAYS[new Date().getDay()];
  return name.charAt(0) + name.slice(1).toLowerCase();
}

function sectionNameFor(classId: number, sectionId: number): string {
  const c = MOCK_SCHOOL_CLASSES.find(x => x.id === classId);
  return c?.sections?.find(s => s.id === sectionId)?.name ?? '';
}

function classNameFor(classId: number): string {
  return MOCK_SCHOOL_CLASSES.find(x => x.id === classId)?.name ?? `Class ${classId}`;
}

function teacherAssignedSlots(teacherRecordId: number) {
  const keys = new Set<string>();
  for (const e of MOCK_TIMETABLE_ENTRIES) {
    if (e.teacherId === teacherRecordId) {
      keys.add(`${e.classId}|${e.sectionId}`);
    }
  }
  return [...keys].map(k => {
    const [classId, sectionId] = k.split('|').map(Number);
    return { classId, sectionId };
  });
}

function teacherAssignedStudentCount(teacherRecordId: number): number {
  const ids = new Set<number>();
  for (const { classId, sectionId } of teacherAssignedSlots(teacherRecordId)) {
    mockStudentsInSection(classId, sectionId).forEach(s => ids.add(s.id));
  }
  return ids.size;
}

function buildTeacherTodaySchedule(teacherRecordId: number): TeacherDashboardData['todaySchedule'] {
  const day = mockCalendarWeekday();
  return MOCK_TIMETABLE_ENTRIES.filter(e => e.teacherId === teacherRecordId && e.day === day)
    .sort((a, b) => a.period - b.period)
    .map(e => ({
      classId: e.classId,
      sectionId: e.sectionId,
      period: e.period,
      subject: e.subjectName,
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
  assignedClasses: teacherAssignedSlots(DEMO_TEACHER_RECORD_ID).length,
  studentsAssigned: teacherAssignedStudentCount(DEMO_TEACHER_RECORD_ID),
  upcomingExams: upcomingExamCount(),
  unreadNotifications: 5,
  classTeacherOf: mockHomeroomRowsForTeacherRecordId(DEMO_TEACHER_RECORD_ID),
  messageQueue: [
    {
      conversationId: 'c-101',
      fromName: 'Michael Chen',
      studentName: 'Emma Chen',
      preview: 'Can we discuss her math progress?',
      timestamp: 'Today · 10:12',
      priority: 'high',
    },
    {
      conversationId: 'c-102',
      fromName: 'Lan Nguyen',
      studentName: 'Chris Nguyen',
      preview: 'Requesting clarification on science project rubric.',
      timestamp: 'Yesterday · 17:40',
      priority: 'normal',
    },
  ],
  quickActions: [
    { label: 'Inbox', route: '/app/chat', icon: 'bi-inbox-fill' },
    { label: 'Attendance', route: '/app/attendance', icon: 'bi-calendar-check-fill' },
    { label: 'Exams', route: '/app/exams', icon: 'bi-journal-text' },
  ],
  todaySchedule: buildTeacherTodaySchedule(DEMO_TEACHER_RECORD_ID),
  pendingTasks: [
    {
      title: 'Submit Class 9-B attendance',
      description: 'Second-period roster for Class 9 section B is still open for today.',
      type: 'warning',
      timestamp: '09:45 AM',
    },
    {
      title: 'Review midterm papers',
      description: 'Moderation queue has pending answer sheets for Class 8-A.',
      type: 'info',
      timestamp: 'Today',
    },
    {
      title: 'Parent message',
      description: 'One guardian requested a callback about term grades.',
      type: 'info',
      timestamp: '1 hour ago',
    },
  ],
};

const adminMonthOverview = () => mockTenantAttendanceOverviewForMonth(currentMonthYm());

export const MOCK_ADMIN_DASHBOARD: AdminDashboardData = (() => {
  const att = adminMonthOverview();
  return {
    totalStudents: mockActiveStudentCount(),
    totalTeachers: MOCK_TEACHERS.filter(t => t.status === 'active').length,
    feesCollected: 284000,
    feesPending: 46300,
    collectionRate: 86,
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
