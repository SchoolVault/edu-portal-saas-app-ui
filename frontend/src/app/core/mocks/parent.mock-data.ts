import type {
  AttendanceRecord,
  AttendanceStats,
  Exam,
  ExamScheduleSlot,
  FeePayment,
  MarkRecord,
  ParentExamSummary,
  ParentFeeLineItem,
  ParentFeeObligation,
  PaymentReceipt,
  Student,
  TimetableEntry,
} from '../models/models';
import { MOCK_TIMETABLE_ENTRIES } from './timetable.mock-data';
import { examAppliesToStudent } from '../utils/exam-scope';
import { MOCK_EXAM_MARKS_SEED, MOCK_EXAMS_SEED, MOCK_EXAM_SCHEDULE_SEED } from './exam.mock-data';
import { MOCK_STUDENTS } from './students.mock-data';
import { mockAttendanceRecordsForStudentInRange, mockAttendanceStatsForStudentInRange } from './attendance.mock-data';

export { examAppliesToStudent };

/** Demo homeroom for Michael Chen's children (Sarah Mitchell = teacher@school.com user id 2). */
const DEMO_HOMEROOM = { homeroomTeacherName: 'Sarah Mitchell', homeroomTeacherUserId: 2 } as const;

function isLinkedToParentUser(s: Student, parentUserId: number): boolean {
  const uid = s.parentUserId ?? s.parentId;
  return uid === parentUserId;
}

function demoPrimaryChildFirst(a: Student, b: Student): number {
  if (a.id === 12) {
    return -1;
  }
  if (b.id === 12) {
    return 1;
  }
  return a.id - b.id;
}

/**
 * Active students linked to demo parent portal user id 3 (Michael Chen).
 * Uses {@code parentUserId} when set (portal user) else {@code parentId} — matches backend union semantics.
 */
export const MOCK_PARENT_CHILDREN: Student[] = MOCK_STUDENTS.filter(s => isLinkedToParentUser(s, 3) && s.status === 'active')
  .sort(demoPrimaryChildFirst)
  .map(s => ({
    ...s,
    homeroomTeacherName: DEMO_HOMEROOM.homeroomTeacherName,
    homeroomTeacherUserId: DEMO_HOMEROOM.homeroomTeacherUserId,
  }));

/** Primary demo child (first linked); fee mocks default to this student when unspecified. */
export const MOCK_PARENT_DEMO_STUDENT: Student = { ...MOCK_PARENT_CHILDREN[0] };

export const MOCK_PARENT_RECEIPT_LINES: ParentFeeLineItem[] = [
  { name: 'Tuition', amount: 3200, type: 'tuition' },
  { name: 'Transport', amount: 600, type: 'transport' },
  { name: 'Hostel', amount: 800, type: 'hostel' },
  { name: 'Uniform', amount: 400, type: 'uniform' },
  { name: 'Library', amount: 300, type: 'library' },
  { name: 'Lab Fee', amount: 500, type: 'lab' },
  { name: 'Computer Fee', amount: 400, type: 'misc' },
];

/** Marks visible to parents: same tenant seed, in-scope exams, resultsPublished only. */
export function mockParentPublishedMarks(studentId: number): MarkRecord[] {
  const student = MOCK_PARENT_CHILDREN.find(c => c.id === studentId);
  if (!student) {
    return [];
  }
  return MOCK_EXAM_MARKS_SEED.filter(m => {
    if (m.studentId !== studentId) {
      return false;
    }
    const ex = MOCK_EXAMS_SEED.find(e => e.id === m.examId);
    return !!(ex && ex.resultsPublished && examAppliesToStudent(ex, student));
  }).map(m => ({ ...m, classId: student.classId, tenantId: m.tenantId ?? 't1' }));
}

export function mockParentExamsForStudent(studentId: number): ParentExamSummary[] {
  const student = MOCK_PARENT_CHILDREN.find(c => c.id === studentId);
  if (!student) {
    return [];
  }
  return MOCK_EXAMS_SEED.filter(e => e.status !== 'cancelled' && examAppliesToStudent(e, student))
    .map(e => ({
      id: e.id,
      name: e.name,
      academicYearId: e.academicYearId,
      startDate: e.startDate,
      endDate: e.endDate,
      status: e.status,
      resultsPublished: !!e.resultsPublished,
    }))
    .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
}

export function mockParentExamSchedule(studentId: number, examId: number): ExamScheduleSlot[] {
  const student = MOCK_PARENT_CHILDREN.find(c => c.id === studentId);
  if (!student) {
    return [];
  }
  const ex = MOCK_EXAMS_SEED.find(e => e.id === examId);
  if (!ex || !examAppliesToStudent(ex, student)) {
    return [];
  }
  const rows = MOCK_EXAM_SCHEDULE_SEED[examId] ?? [];
  return rows
    .filter(
      r =>
        r.classId === student.classId && (r.sectionId == null || r.sectionId === student.sectionId)
    )
    .map(r => ({ ...r, examId }));
}

export function mockParentExamMarks(studentId: number, examId: number): MarkRecord[] {
  return mockParentPublishedMarks(studentId).filter(m => m.examId === examId);
}

/** @deprecated Use {@link mockParentPublishedMarks} — kept for dashboard seed compatibility. */
export function mockParentMarkRows(studentId: number, _studentName: string): MarkRecord[] {
  return mockParentPublishedMarks(studentId);
}

/** Same virtual rows as teacher/admin mocks — pass the same {@code from}/{@code to} as the parent API. */
export function mockParentAttendanceStats(studentId: number, fromIso: string, toIso: string): AttendanceStats {
  return mockAttendanceStatsForStudentInRange(studentId, fromIso, toIso);
}

export function mockParentAttendanceRecords(studentId: number, _studentName: string, from: string, to: string): AttendanceRecord[] {
  return mockAttendanceRecordsForStudentInRange(studentId, from, to);
}

function miniLinesForTotal(total: number): ParentFeeLineItem[] {
  const tuition = Math.round(total * 0.86);
  return [
    { name: 'Tuition', amount: tuition, type: 'tuition' },
    { name: 'Activities & lab', amount: total - tuition, type: 'misc' },
  ];
}

/** Numeric payment ids align with fee checkout Longs. */
export const MOCK_PARENT_SEED_FEE_PAYMENTS: FeePayment[] = [
  { id: 8, studentId: 12, studentName: 'Emma Chen', feeStructureId: 2, amount: 6200, paidAmount: 4800, dueAmount: 1400, status: 'partial', paymentDate: '2026-03-10', dueDate: '2026-03-31', discount: 0, lateFee: 50, receiptNumber: 'REC-2026-101', tenantId: 't1' },
  { id: 10, studentId: 24, studentName: 'Jordan Lee', feeStructureId: 1, amount: 4200, paidAmount: 2000, dueAmount: 2200, status: 'partial', paymentDate: '2026-02-01', dueDate: '2026-04-15', discount: 0, lateFee: 0, receiptNumber: 'REC-2026-110', tenantId: 't1' },
  { id: 11, studentId: 25, studentName: 'Nina Park', feeStructureId: 3, amount: 5800, paidAmount: 0, dueAmount: 5800, status: 'unpaid', dueDate: '2026-04-30', discount: 0, lateFee: 0, tenantId: 't1' },
  { id: 12, studentId: 27, studentName: 'Taylor Brooks', feeStructureId: 4, amount: 7200, paidAmount: 5000, dueAmount: 2200, status: 'partial', paymentDate: '2026-01-15', dueDate: '2026-05-10', discount: 0, lateFee: 40, receiptNumber: 'REC-2026-112', tenantId: 't1' },
];

export const MOCK_PARENT_SEED_FEE_OBLIGATIONS: ParentFeeObligation[] = [
  {
    paymentId: 8,
    studentId: 12,
    studentName: 'Emma Chen',
    feeStructureId: 2,
    feeStructureName: 'Standard Fee - Class 6-8',
    className: 'Class 8',
    dueDate: '2026-03-31',
    status: 'partial',
    currency: 'INR',
    totalAmount: 6200,
    paidAmount: 4800,
    dueAmount: 1400,
    discount: 0,
    lateFee: 50,
    payableNow: 1450,
    lineItems: [
      { name: 'Tuition', amount: 3200, type: 'tuition' },
      { name: 'Transport', amount: 600, type: 'transport' },
      { name: 'Hostel', amount: 800, type: 'hostel' },
      { name: 'Uniform', amount: 400, type: 'uniform' },
      { name: 'Library', amount: 300, type: 'library' },
      { name: 'Lab Fee', amount: 500, type: 'lab' },
      { name: 'Computer Fee', amount: 400, type: 'misc' },
    ],
  },
  {
    paymentId: 10,
    studentId: 24,
    studentName: 'Jordan Lee',
    feeStructureId: 1,
    feeStructureName: 'Primary Fee - Class 6',
    className: 'Class 6',
    dueDate: '2026-04-15',
    status: 'partial',
    currency: 'INR',
    totalAmount: 4200,
    paidAmount: 2000,
    dueAmount: 2200,
    discount: 0,
    lateFee: 0,
    payableNow: 2200,
    lineItems: miniLinesForTotal(4200),
  },
  {
    paymentId: 11,
    studentId: 25,
    studentName: 'Nina Park',
    feeStructureId: 3,
    feeStructureName: 'Upper Primary - Class 9',
    className: 'Class 9',
    dueDate: '2026-04-30',
    status: 'unpaid',
    currency: 'INR',
    totalAmount: 5800,
    paidAmount: 0,
    dueAmount: 5800,
    discount: 0,
    lateFee: 0,
    payableNow: 5800,
    lineItems: miniLinesForTotal(5800),
  },
  {
    paymentId: 12,
    studentId: 27,
    studentName: 'Taylor Brooks',
    feeStructureId: 4,
    feeStructureName: 'Senior Secondary - Class 11',
    className: 'Class 11',
    dueDate: '2026-05-10',
    status: 'partial',
    currency: 'INR',
    totalAmount: 7200,
    paidAmount: 5000,
    dueAmount: 2200,
    discount: 0,
    lateFee: 40,
    payableNow: 2240,
    lineItems: miniLinesForTotal(7200),
  },
];

export function buildParentMockInitialReceipts(): PaymentReceipt[] {
  const lines = MOCK_PARENT_RECEIPT_LINES.map(l => ({ ...l }));
  return [
    {
      receiptNumber: 'REC-2026-101',
      paymentId: 8,
      studentId: 12,
      studentName: 'Emma Chen',
      feeStructureName: 'Standard Fee - Class 6-8',
      className: 'Class 8',
      provider: 'upi',
      providerPaymentId: 'UPI-778821',
      paymentMethod: 'UPI',
      paymentDate: '2026-03-10',
      dueDate: '2026-03-31',
      currency: 'INR',
      amountPaid: 4800,
      totalAmount: 6200,
      paidAmount: 4800,
      dueAmount: 1400,
      discount: 0,
      lateFee: 50,
      lineItems: lines.map(l => ({ ...l })),
    },
    {
      receiptNumber: 'REC-DEMO-20260214',
      paymentId: 8,
      studentId: 12,
      studentName: 'Emma Chen',
      feeStructureName: 'Standard Fee - Class 6-8',
      className: 'Class 8',
      provider: 'mockpay',
      providerPaymentId: 'MOCK-PARTIAL-1',
      paymentMethod: 'MOCKPAY',
      paymentDate: '2026-02-14',
      dueDate: '2026-03-31',
      currency: 'INR',
      amountPaid: 1200,
      totalAmount: 6200,
      paidAmount: 3600,
      dueAmount: 2600,
      discount: 0,
      lateFee: 0,
      lineItems: lines.map(l => ({ ...l })),
    },
    {
      receiptNumber: 'REC-DEMO-20260120',
      paymentId: 8,
      studentId: 12,
      studentName: 'Emma Chen',
      feeStructureName: 'Standard Fee - Class 6-8',
      className: 'Class 8',
      provider: 'card',
      providerPaymentId: 'CARD-99102',
      paymentMethod: 'CARD',
      paymentDate: '2026-01-20',
      dueDate: '2026-03-31',
      currency: 'INR',
      amountPaid: 2400,
      totalAmount: 6200,
      paidAmount: 2400,
      dueAmount: 3800,
      discount: 0,
      lateFee: 0,
      lineItems: lines.map(l => ({ ...l })),
    },
  ];
}

/**
 * Mirrors GET /parent/exams: exams that apply to linked children, with classIds / classScopes / scheduleSlots
 * trimmed to those children (no other classes’ timetable rows).
 */
export function mockParentPortalExams(): Exam[] {
  const children = MOCK_PARENT_CHILDREN;
  return MOCK_EXAMS_SEED.filter(
    ex => ex.status !== 'cancelled' && children.some(s => examAppliesToStudent(ex, s))
  ).map(ex => {
    const inScope = children.filter(s => examAppliesToStudent(ex, s));
    const classIds = [...new Set(inScope.map(c => c.classId))];
    const allScopes = ex.classScopes ?? [];
    const classScopes =
      allScopes.length === 0
        ? undefined
        : allScopes
            .filter(
              s =>
                inScope.some(
                  c =>
                    c.classId === s.classId &&
                    (s.sectionId == null || (c.sectionId > 0 && c.sectionId === s.sectionId))
                )
            )
            .map(s => ({ ...s }));
    const scheduleSlots = (MOCK_EXAM_SCHEDULE_SEED[ex.id] ?? [])
      .filter(slot =>
        inScope.some(
          c =>
            c.classId === slot.classId &&
            (slot.sectionId == null || (c.sectionId > 0 && c.sectionId === slot.sectionId))
        )
      )
      .map(s => ({ ...s, examId: ex.id }));
    return { ...ex, classIds, classScopes, scheduleSlots };
  });
}

/** Class/section-scoped weekly slots for a linked child (same seed as {@link MOCK_TIMETABLE_ENTRIES}). */
export function mockParentTimetableForChild(studentId: number): TimetableEntry[] {
  const student = MOCK_PARENT_CHILDREN.find(c => c.id === studentId);
  if (!student) {
    return [];
  }
  return MOCK_TIMETABLE_ENTRIES.filter(
    e =>
      e.classId === student.classId &&
      (student.sectionId <= 0 || e.sectionId === student.sectionId)
  ).map(e => ({ ...e }));
}
