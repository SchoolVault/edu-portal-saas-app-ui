import type { SalaryStructure, TeacherPaymentDetails } from '../models/models';

export const MOCK_PAYROLL_STRUCTURES: SalaryStructure[] = [
  {
    id: 1,
    teacherId: 1,
    teacherName: 'Sarah Mitchell',
    basicSalary: 45000,
    allowances: [{ name: 'HRA', amount: 5000 }],
    deductions: [{ name: 'Tax', amount: 4500 }],
    netSalary: 45500,
    tenantId: 't1',
  },
  {
    id: 2,
    teacherId: 2,
    teacherName: "James O'Brien",
    basicSalary: 42000,
    allowances: [{ name: 'HRA', amount: 4800 }],
    deductions: [{ name: 'Tax', amount: 4000 }],
    netSalary: 42800,
    tenantId: 't1',
  },
];

export const MOCK_PAYROLL_TEACHER_PAYMENT_DETAILS: TeacherPaymentDetails[] = [
  {
    teacherId: 1,
    teacherName: 'Sarah Mitchell',
    monthlyNetSalary: 45500,
    bankAccountHolder: 'Sarah Mitchell',
    bankName: 'State Bank of India',
    bankAccountMasked: '****3210',
    bankIfsc: 'SBIN0001234',
    bankDetailsComplete: true,
  },
  {
    teacherId: 2,
    teacherName: "James O'Brien",
    monthlyNetSalary: 42800,
    bankAccountHolder: "James O'Brien",
    bankName: 'HDFC Bank',
    bankAccountMasked: '****8844',
    bankIfsc: 'HDFC0000999',
    bankDetailsComplete: true,
  },
  {
    teacherId: 3,
    teacherName: 'Anjali Verma',
    monthlyNetSalary: 39800,
    bankAccountHolder: 'Anjali Verma',
    bankName: 'ICICI Bank',
    bankAccountMasked: '****1102',
    bankIfsc: '',
    bankDetailsComplete: false,
  },
];

/** Templates for mock payslip generation (month/year applied in service). */
export const MOCK_PAYSLIP_GENERATION_TEMPLATES: Array<{
  teacherId: number;
  teacherName: string;
  basic: number;
  allow: number;
  ded: number;
  net: number;
}> = [
  { teacherId: 1, teacherName: 'Sarah Mitchell', basic: 45000, allow: 5000, ded: 4500, net: 45500 },
  { teacherId: 2, teacherName: "James O'Brien", basic: 42000, allow: 4800, ded: 4000, net: 42800 },
];
