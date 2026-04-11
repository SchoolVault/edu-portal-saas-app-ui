/**
 * Seed rows for LeaveService mock store. Field shape matches LeaveRequestRow in leave.service
 * (declared here to avoid circular imports).
 */
export const MOCK_LEAVE_SEQ_START = 100;

export const MOCK_LEAVE_REQUESTS_SEED = [
  {
    id: 1,
    applicantUserId: 2,
    applicantRole: 'TEACHER',
    leaveType: 'Casual',
    startDate: '2026-03-10',
    endDate: '2026-03-10',
    reason: 'Personal work',
    status: 'APPROVED',
    dayUnit: 'FULL_DAY' as const,
    approverRemarks: 'Approved',
  },
  {
    id: 2,
    applicantUserId: 2,
    applicantRole: 'TEACHER',
    leaveType: 'Sick',
    startDate: '2026-04-02',
    endDate: '2026-04-02',
    reason: 'Fever',
    status: 'PENDING',
    dayUnit: 'FIRST_HALF' as const,
  },
];
