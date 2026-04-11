import type {
  AttendanceRecord,
  AttendanceStats,
  FeePayment,
  MarkRecord,
  ParentFeeLineItem,
  ParentFeeObligation,
  PaymentReceipt,
  Student,
} from '../models/models';

/** Primary demo child for parent login (u3) — aligns with students.mock-data s12. */
export const MOCK_PARENT_DEMO_STUDENT: Student = {
  id: 12,
  firstName: 'Emma',
  lastName: 'Chen',
  email: 'emma.c@school.com',
  phone: '+1-555-0212',
  dateOfBirth: '2009-02-14',
  gender: 'female',
  classId: 8,
  className: 'Class 8',
  sectionId: 801,
  sectionName: 'A',
  rollNumber: '805',
  admissionNumber: 'ADM2022080',
  admissionDate: '2022-06-08',
  parentId: 3,
  parentUserId: 3,
  parentName: 'Michael Chen',
  address: '963 Willow Street',
  bloodGroup: 'A+',
  status: 'active',
  tenantId: 't1',
};

export const MOCK_PARENT_CHILDREN: Student[] = [{ ...MOCK_PARENT_DEMO_STUDENT }];

export const MOCK_PARENT_RECEIPT_LINES: ParentFeeLineItem[] = [
  { name: 'Tuition', amount: 3200, type: 'tuition' },
  { name: 'Transport', amount: 600, type: 'transport' },
  { name: 'Hostel', amount: 800, type: 'hostel' },
  { name: 'Uniform', amount: 400, type: 'uniform' },
  { name: 'Library', amount: 300, type: 'library' },
  { name: 'Lab Fee', amount: 500, type: 'lab' },
  { name: 'Computer Fee', amount: 400, type: 'misc' },
];

export function mockParentMarkRows(studentId: number, studentName: string): MarkRecord[] {
  return [
    { id: 1, examId: 2, studentId, studentName, subjectName: 'Mathematics', marksObtained: 92, maxMarks: 100, grade: 'A+', classId: 8, tenantId: 't1' },
    { id: 2, examId: 2, studentId, studentName, subjectName: 'Science', marksObtained: 85, maxMarks: 100, grade: 'A', classId: 8, tenantId: 't1' },
    { id: 3, examId: 2, studentId, studentName, subjectName: 'English', marksObtained: 88, maxMarks: 100, grade: 'A', classId: 8, tenantId: 't1' },
  ];
}

export function mockParentAttendanceStats(studentId: number): AttendanceStats {
  return {
    studentId,
    totalDays: 22,
    present: 20,
    absent: 1,
    late: 1,
    excused: 0,
    attendancePercentage: 95.5,
  };
}

export function mockParentAttendanceRecords(studentId: number, from: string, to: string): AttendanceRecord[] {
  return [
    { id: 1, studentId, studentName: 'Emma Chen', classId: 8, sectionId: 801, date: from, status: 'present', markedBy: 2, tenantId: 't1' },
    { id: 2, studentId, studentName: 'Emma Chen', classId: 8, sectionId: 801, date: to, status: 'late', markedBy: 2, tenantId: 't1' },
  ];
}

/** Numeric payment/fee ids align with FeeDTOs Longs (legacy mock slugs fp8/fs2 → 8 / 2). */
export const MOCK_PARENT_SEED_FEE_PAYMENTS: FeePayment[] = [
  { id: 8, studentId: 12, studentName: 'Emma Chen', feeStructureId: 2, amount: 6200, paidAmount: 4800, dueAmount: 1400, status: 'partial', paymentDate: '2026-03-10', dueDate: '2026-03-31', discount: 0, lateFee: 50, receiptNumber: 'REC-2026-101', tenantId: 't1' },
  { id: 9, studentId: 18, studentName: 'Lily Chen', feeStructureId: 1, amount: 3500, paidAmount: 3500, dueAmount: 0, status: 'paid', paymentDate: '2026-03-02', dueDate: '2026-03-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2026-102', tenantId: 't1' },
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
