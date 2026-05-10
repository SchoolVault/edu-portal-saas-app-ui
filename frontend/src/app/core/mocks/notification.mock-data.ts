import type { AppNotification } from '../models/models';

/** Admin / registrar style in-app rows (matches staff-heavy API seeds). */
export const MOCK_SCHOOL_NOTIFICATIONS_SEED: AppNotification[] = [
  { id: 'n1', title: 'New Admission', message: 'Arjun Patel has been admitted to Class 5-A', type: 'success', read: false, userId: 1, createdAt: '2026-02-05T10:30:00Z' },
  {
    id: 'n2',
    title: 'Fee Payment Received',
    message: 'Fee payment received from Emily Watson',
    type: 'info',
    read: false,
    userId: 1,
    createdAt: '2026-02-05T09:15:00Z',
    link: '/app/dashboard',
    senderLabel: 'Fees desk',
  },
  { id: 'n3', title: 'Exam Schedule Updated', message: 'Midterm exam schedule has been updated for Class 8', type: 'warning', read: false, userId: 1, createdAt: '2026-02-04T16:45:00Z' },
  { id: 'n4', title: 'Attendance Alert', message: 'Class 3-B has below 80% attendance today', type: 'error', read: true, userId: 1, createdAt: '2026-02-04T11:00:00Z' },
  { id: 'n5', title: 'Parent Meeting', message: 'Parent-teacher meeting scheduled for Feb 15', type: 'info', read: true, userId: 1, createdAt: '2026-02-03T14:20:00Z' },
  { id: 'n6', title: 'Library Book Overdue', message: '5 books are overdue from Class 7 students', type: 'warning', read: true, userId: 1, createdAt: '2026-02-03T10:00:00Z' },
];

/** Parent inbox: includes parent-scoped items that must not appear for teachers in mocks. */
export const MOCK_PARENT_NOTIFICATIONS_SEED: AppNotification[] = [
  {
    id: 'np1',
    title: 'Notification for Parent Only',
    message: 'This is a testing notification for Parent Only',
    type: 'info',
    read: true,
    userId: 2,
    createdAt: '2026-04-17T07:00:00Z',
    senderLabel: 'School office',
  },
  {
    id: 'np2',
    title: 'Testing for Parents',
    message: 'Testing 123',
    type: 'info',
    read: false,
    userId: 2,
    createdAt: '2026-04-16T18:00:00Z',
  },
  {
    id: 'np3',
    title: 'Testing for Parents',
    message: 'Testing 123',
    type: 'info',
    read: false,
    userId: 2,
    createdAt: '2026-04-16T18:05:00Z',
  },
  {
    id: 'np4',
    title: 'School Reopening Notice',
    message: 'School will reopen on April 1st, 2026. All students must report by 8:00 AM.',
    type: 'success',
    read: false,
    userId: 2,
    createdAt: '2026-04-15T12:00:00Z',
  },
];

/** Teacher inbox: school-wide / staff items only — no parent-only fan-out rows. */
export const MOCK_TEACHER_NOTIFICATIONS_SEED: AppNotification[] = [
  {
    id: 'nt1',
    title: 'Staff room meeting',
    message: 'Briefing tomorrow 7:45 AM — exam duty assignments.',
    type: 'warning',
    read: false,
    userId: 3,
    createdAt: '2026-04-17T06:00:00Z',
    senderLabel: 'Academic office',
  },
  {
    id: 'nt2',
    title: 'Timetable adjustment',
    message: 'Period 4 on Friday moved to Lab-2 for your Grade 8 section.',
    type: 'info',
    read: true,
    userId: 3,
    createdAt: '2026-04-16T09:00:00Z',
  },
  {
    id: 'nt3',
    title: 'School Reopening Notice',
    message: 'School will reopen on April 1st, 2026. All students must report by 8:00 AM.',
    type: 'success',
    read: false,
    userId: 3,
    createdAt: '2026-04-15T12:00:00Z',
  },
];

export const MOCK_PLATFORM_OPERATOR_NOTIFICATIONS_SEED: AppNotification[] = [
  {
    id: 'p1',
    title: 'Billing reconciliation run scheduled',
    message: 'Monthly subscription sync is scheduled for all active school workspaces.',
    type: 'info',
    read: false,
    userId: 9901,
    createdAt: '2026-04-10T14:00:00.000Z',
    link: '/app/platform-subscriptions',
  },
  {
    id: 'p2',
    title: 'Platform maintenance window',
    message: 'Reserve 22:00–22:30 UTC for database patching; campuses may see brief read-only mode.',
    type: 'warning',
    read: false,
    userId: 9901,
    createdAt: '2026-04-10T10:00:00.000Z',
    link: '/app/platform-health',
  },
  {
    id: 'p3',
    title: 'New workspace onboarded',
    message: 'Riverdale Public School completed provisioning — review directory and subscription tier.',
    type: 'success',
    read: true,
    userId: 9901,
    createdAt: '2026-04-09T08:00:00.000Z',
    link: '/app/platform-schools',
  },
];
