import type { AdminDashboardData, ParentDashboardData, TeacherDashboardData } from '../models/models';
import { MOCK_PARENT_CHILDREN, mockParentMarkRows } from './parent.mock-data';

export const MOCK_ADMIN_DASHBOARD: AdminDashboardData = {
  totalStudents: 2847,
  totalTeachers: 124,
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
    total: 2678,
    present: 2498,
    absent: 92,
    late: 61,
    excused: 27,
  },
  recentActivities: [
    { title: 'New student Arjun Patel admitted', description: 'Joined Class 5-A through the admissions office', type: 'success', timestamp: '2 hours ago' },
    { title: 'Fee payment batch posted', description: '37 receipts reconciled against January dues', type: 'info', timestamp: '4 hours ago' },
    { title: 'Midterm marks published', description: 'Class 8 results are now visible to parents', type: 'warning', timestamp: '6 hours ago' },
    { title: 'Transport route updated', description: 'Route 3 stop timings were adjusted for the afternoon run', type: 'info', timestamp: '1 day ago' },
  ],
  upcomingEvents: [
    { id: 1, title: 'Parent-Teacher Meeting', date: '2026-04-15', description: 'Campus-wide parent interaction day' },
    { id: 2, title: 'Annual Sports Day', date: '2026-04-22', description: 'Inter-house athletics and opening ceremony' },
    { id: 3, title: 'Final Exam Window', date: '2026-05-05', description: 'Main term-end examinations begin' },
  ],
  classesWithoutHomeroomTeacher: [
    { classId: 901, className: 'Grade 6 — Emerald', grade: 6 },
    { classId: 902, className: 'Grade 9 — Sapphire', grade: 9 },
  ],
};

export const MOCK_TEACHER_DASHBOARD: TeacherDashboardData = {
  assignedClasses: 6,
  studentsAssigned: 186,
  upcomingExams: 3,
  unreadNotifications: 5,
  classTeacherOf: [{ classId: 8, className: 'Class 8', sectionName: 'A', totalStudents: 38 }],
  messageQueue: [
    { conversationId: 'c-101', fromName: 'Michael Chen', studentName: 'Emma Chen', preview: 'Can we discuss her math progress?', timestamp: 'Today · 10:12', priority: 'high' },
    { conversationId: 'c-102', fromName: 'Parent - Rahul Singh', studentName: 'Arjun Singh', preview: 'Requesting re-test date for science.', timestamp: 'Yesterday · 17:40', priority: 'normal' },
  ],
  quickActions: [
    { label: 'Inbox', route: '/app/chat', icon: 'bi-inbox-fill' },
    { label: 'Attendance', route: '/app/attendance', icon: 'bi-calendar-check-fill' },
    { label: 'Exams', route: '/app/exams', icon: 'bi-journal-text' },
  ],
  todaySchedule: [
    { classId: 8, sectionId: 801, period: 1, subject: 'Mathematics', className: 'Class 8', sectionName: 'A', room: 'Room 201', startTime: '08:00', endTime: '08:45' },
    { classId: 9, sectionId: 902, period: 2, subject: 'Mathematics', className: 'Class 9', sectionName: 'B', room: 'Room 301', startTime: '08:45', endTime: '09:30' },
    { classId: 10, sectionId: 1001, period: 4, subject: 'Physics', className: 'Class 10', sectionName: 'A', room: 'Lab 1', startTime: '10:30', endTime: '11:15' },
  ],
  pendingTasks: [
    { title: 'Submit Class 9-B Attendance', description: 'Today’s second period attendance is pending', type: 'warning', timestamp: '09:45 AM' },
    { title: 'Review Midterm Papers', description: '12 answer sheets left in the moderation queue', type: 'info', timestamp: 'Today' },
    { title: 'Parent Message', description: 'One guardian requested a callback about performance concerns', type: 'info', timestamp: '1 hour ago' },
  ],
};

export function buildMockParentDashboardData(): ParentDashboardData {
  const children = MOCK_PARENT_CHILDREN.map(c => ({ ...c }));
  const marks = mockParentMarkRows(12, 'Emma Chen').map(m => ({ ...m }));
  return {
    childCount: children.length,
    children,
    selectedChild: children[0],
    selectedChildId: children[0]?.id,
    attendancePercentage: 96.2,
    overallGrade: 'A',
    feeDue: 1200,
    attendanceSnapshot: { totalDays: 22, present: 20, absent: 1, late: 1, excused: 0 },
    alerts: [
      { type: 'warning', title: 'Fee due this month', message: '₹1,200 is pending for Emma Chen. Pay before the due date to avoid late fee.', ctaLabel: 'Pay now', ctaRoute: '/app/parent' },
      { type: 'info', title: 'Parent–Teacher Meeting', message: 'PTM is scheduled next week. Confirm your slot from Inbox.', ctaLabel: 'Open Inbox', ctaRoute: '/app/chat' },
    ],
    upcoming: [
      { id: 101, title: 'Unit Test: Mathematics', date: '2026-04-16', description: 'Chapters 5–7' },
      { id: 102, title: 'PTM (Class 8)', date: '2026-04-20', description: 'Meet class teacher and subject teachers' },
    ],
    childPerformance: marks,
    feeStatus: [
      { id: 8, studentId: 12, studentName: 'Emma Chen', feeStructureId: 2, amount: 5000, paidAmount: 3800, dueAmount: 1200, status: 'partial', paymentDate: '2025-08-01', dueDate: '2025-08-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-004', tenantId: 't1' },
      { id: 9, studentId: 18, studentName: 'Lily Chen', feeStructureId: 1, amount: 3500, paidAmount: 3500, dueAmount: 0, status: 'paid', paymentDate: '2025-08-01', dueDate: '2025-08-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-008', tenantId: 't1' },
    ],
  };
}
