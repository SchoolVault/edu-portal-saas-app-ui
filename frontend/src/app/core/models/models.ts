export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'parent';
  tenantId: string;
  avatar?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  schoolCode: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  rollNumber: string;
  admissionNumber: string;
  admissionDate: string;
  parentId: string;
  parentName: string;
  address: string;
  bloodGroup: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'graduated';
  tenantId: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  specialization: string;
  joinDate: string;
  subjects: string[];
  classIds: string[];
  salary: number;
  status: 'active' | 'inactive';
  avatar?: string;
  tenantId: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  tenantId: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: number;
  sections: Section[];
  classTeacherId?: string;
  classTeacherName?: string;
  academicYearId: string;
  tenantId: string;
}

export interface Section {
  id: string;
  name: string;
  classId: string;
  capacity: number;
  studentCount: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  sectionId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy: string;
  tenantId: string;
}

export interface TimetableEntry {
  id: string;
  classId: string;
  sectionId: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room: string;
  tenantId: string;
}

export interface Exam {
  id: string;
  name: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  classIds: string[];
  status: 'upcoming' | 'ongoing' | 'completed';
  tenantId: string;
}

export interface MarkRecord {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  classId: string;
  tenantId: string;
}

export interface FeeStructure {
  id: string;
  name: string;
  classId: string;
  className: string;
  academicYearId: string;
  components: FeeComponent[];
  totalAmount: number;
  tenantId: string;
}

export interface FeeComponent {
  name: string;
  amount: number;
  type: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  studentName: string;
  feeStructureId: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  paymentDate?: string;
  dueDate: string;
  discount: number;
  lateFee: number;
  receiptNumber?: string;
  tenantId: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  targetAudience: string;
  createdAt: string;
  tenantId: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  userId: string;
  createdAt: string;
  link?: string;
}

export interface TransportRoute {
  id: string;
  name: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  stops: { name: string; time: string; order: number }[];
  assignedStudents: number;
  tenantId: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  tenantId: string;
}

export interface BookIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fine: number;
  status: 'issued' | 'returned' | 'overdue';
  tenantId: string;
}

export interface HostelRoom {
  id: string;
  roomNumber: string;
  block: string;
  floor: number;
  capacity: number;
  occupancy: number;
  type: string;
  tenantId: string;
}

export interface SalaryStructure {
  id: string;
  teacherId: string;
  teacherName: string;
  basicSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  netSalary: number;
  tenantId: string;
}

export interface Payslip {
  id: string;
  teacherId: string;
  teacherName: string;
  month: string;
  year: number;
  basicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  status: 'generated' | 'paid';
  tenantId: string;
}

export interface DocumentRecord {
  id: string;
  name: string;
  type: string;
  category: string;
  uploadedBy: string;
  uploadDate: string;
  size: string;
  tenantId: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  ipAddress: string;
  tenantId: string;
}

export interface TenantConfig {
  id: string;
  schoolName: string;
  schoolCode: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  primaryColor: string;
  secondaryColor: string;
  features: Record<string, boolean>;
  tenantId: string;
}
