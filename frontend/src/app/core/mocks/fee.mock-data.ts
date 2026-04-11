import type { FeePayment, FeeStructure } from '../models/models';

export const MOCK_FEE_STRUCTURES_SEED: FeeStructure[] = [
  {
    id: 1,
    name: 'Standard Fee - Class 1-5',
    classId: 5,
    className: 'Class 5',
    academicYearId: 1,
    components: [
      { name: 'Tuition', amount: 2400, type: 'tuition' },
      { name: 'Transport', amount: 600, type: 'transport' },
      { name: 'Hostel', amount: 0, type: 'hostel' },
      { name: 'Uniform', amount: 350, type: 'uniform' },
      { name: 'Library', amount: 200, type: 'library' },
      { name: 'Lab Fee', amount: 300, type: 'lab' },
    ],
    totalAmount: 3850,
    tenantId: 't1',
  },
  {
    id: 2,
    name: 'Standard Fee - Class 6-8',
    classId: 8,
    className: 'Class 8',
    academicYearId: 1,
    components: [
      { name: 'Tuition', amount: 3200, type: 'tuition' },
      { name: 'Transport', amount: 600, type: 'transport' },
      { name: 'Hostel', amount: 800, type: 'hostel' },
      { name: 'Uniform', amount: 400, type: 'uniform' },
      { name: 'Library', amount: 300, type: 'library' },
      { name: 'Lab Fee', amount: 500, type: 'lab' },
      { name: 'Computer Fee', amount: 400, type: 'misc' },
    ],
    totalAmount: 6200,
    tenantId: 't1',
  },
  {
    id: 3,
    name: 'Standard Fee - Class 9-12',
    classId: 10,
    className: 'Class 10',
    academicYearId: 1,
    components: [
      { name: 'Tuition', amount: 4000, type: 'tuition' },
      { name: 'Transport', amount: 600, type: 'transport' },
      { name: 'Hostel', amount: 1200, type: 'hostel' },
      { name: 'Uniform', amount: 500, type: 'uniform' },
      { name: 'Library', amount: 400, type: 'library' },
      { name: 'Lab Fee', amount: 800, type: 'lab' },
      { name: 'Computer Fee', amount: 500, type: 'misc' },
      { name: 'Sports Fee', amount: 200, type: 'sports' },
    ],
    totalAmount: 8200,
    tenantId: 't1',
  },
];

export const MOCK_FEE_PAYMENTS_SEED: FeePayment[] = [
  { id: 1, studentId: 1, studentName: 'Arjun Patel', feeStructureId: 1, amount: 3850, paidAmount: 3850, dueAmount: 0, status: 'paid', paymentDate: '2025-07-15', dueDate: '2025-07-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-001', tenantId: 't1' },
  { id: 2, studentId: 2, studentName: 'Emily Watson', feeStructureId: 2, amount: 6200, paidAmount: 3100, dueAmount: 3100, status: 'partial', paymentDate: '2025-07-20', dueDate: '2025-07-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-002', tenantId: 't1' },
  { id: 3, studentId: 3, studentName: 'Liam Chen', feeStructureId: 2, amount: 6200, paidAmount: 0, dueAmount: 6200, status: 'overdue', dueDate: '2025-07-31', discount: 0, lateFee: 250, tenantId: 't1' },
  { id: 4, studentId: 4, studentName: 'Sofia Martinez', feeStructureId: 2, amount: 6200, paidAmount: 6200, dueAmount: 0, status: 'paid', paymentDate: '2025-07-10', dueDate: '2025-07-31', discount: 500, lateFee: 0, receiptNumber: 'REC-2025-003', tenantId: 't1' },
  { id: 5, studentId: 9, studentName: 'Mason Davis', feeStructureId: 3, amount: 8200, paidAmount: 0, dueAmount: 8200, status: 'unpaid', dueDate: '2026-01-31', discount: 0, lateFee: 0, tenantId: 't1' },
  { id: 6, studentId: 10, studentName: 'Charlotte Wilson', feeStructureId: 3, amount: 8200, paidAmount: 8200, dueAmount: 0, status: 'paid', paymentDate: '2026-01-05', dueDate: '2026-01-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2026-001', tenantId: 't1' },
  { id: 7, studentId: 11, studentName: 'Oliver Taylor', feeStructureId: 3, amount: 8200, paidAmount: 4000, dueAmount: 4200, status: 'partial', paymentDate: '2026-01-10', dueDate: '2026-01-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2026-002', tenantId: 't1' },
  { id: 8, studentId: 12, studentName: 'Emma Chen', feeStructureId: 2, amount: 6200, paidAmount: 4800, dueAmount: 1400, status: 'partial', paymentDate: '2025-08-01', dueDate: '2025-07-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-004', tenantId: 't1' },
];
