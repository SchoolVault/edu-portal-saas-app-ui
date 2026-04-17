import type { AppNotification } from '../models/models';

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

export const MOCK_PLATFORM_OPERATOR_NOTIFICATIONS_SEED: AppNotification[] = [
  {
    id: 'p1',
    title: 'Billing reconciliation queued',
    message: 'Monthly subscription sync is prepared for all active school workspaces.',
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
