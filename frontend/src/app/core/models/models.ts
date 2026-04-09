export type AppRole = 'super_admin' | 'admin' | 'teacher' | 'parent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: AppRole;
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
  refreshToken: string;
  user: User;
}

export interface OnboardSchoolRequest {
  schoolName: string;
  schoolCode: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  phone?: string;
  address?: string;
}

export interface ProfileSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AppRole;
  tenantId: string;
  avatar?: string;
  schoolName?: string;
  schoolCode?: string;
  schoolEmail?: string;
  schoolPhone?: string;
  schoolAddress?: string;
  primaryColor?: string;
  secondaryColor?: string;
  userTitle?: string;
  qualification?: string;
  specialization?: string;
  childCount?: number;
  assignedClassCount?: number;
  subjectCount?: number;
  managedStudentCount?: number;
  managedTeacherCount?: number;
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

export interface AttendanceStats {
  studentId?: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused?: number;
  attendancePercentage: number;
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

export interface TimetableGridSlot {
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
}

export interface TimetableGrid {
  classId: string;
  sectionId: string;
  days: string[];
  periods: number[];
  grid: Record<string, Record<number, TimetableGridSlot>>;
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

export interface PromotionStudentPreview {
  studentId: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  currentClassName: string;
  averageScore: number;
  eligible: boolean;
  selected?: boolean;
}

export interface PromotionPreview {
  sourceClassId: string;
  sourceClassName: string;
  targetClassId: string;
  targetClassName: string;
  defaultSectionId?: string;
  defaultSectionName?: string;
  students: PromotionStudentPreview[];
}

export interface PromotionResult {
  promotedCount: number;
  targetClassName: string;
  targetSectionName: string;
}

export interface DashboardMetricPoint {
  label: string;
  value: number;
}

export interface DashboardActivityItem {
  title: string;
  description: string;
  type: string;
  timestamp: string;
}

export interface DashboardUpcomingEvent {
  id?: string;
  title: string;
  date: string;
  description: string;
}

export interface DashboardAttendanceOverview {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface AdminDashboardData {
  totalStudents: number;
  totalTeachers: number;
  feesCollected: number;
  feesPending: number;
  collectionRate: number;
  monthlyAdmissions: DashboardMetricPoint[];
  monthlyCollections: DashboardMetricPoint[];
  attendanceOverview: DashboardAttendanceOverview;
  recentActivities: DashboardActivityItem[];
  upcomingEvents: DashboardUpcomingEvent[];
}

export interface PlatformMetricPoint {
  label: string;
  value: number;
}

export interface PlatformActivity {
  title: string;
  description: string;
  tone: string;
  timestamp: string;
}

export interface PlatformSchoolSummary {
  tenantId: string;
  schoolName: string;
  schoolCode: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
  studentCount: number;
  teacherCount: number;
  adminCount: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface PlatformSchoolAdmin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  schoolCode: string;
  active: boolean;
  createdAt?: string;
}

export interface PlatformDashboardData {
  totalSchools: number;
  activeSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  schoolGrowth: PlatformMetricPoint[];
  revenueTrend: PlatformMetricPoint[];
  recentActivities: PlatformActivity[];
  topSchools: PlatformSchoolSummary[];
}

export interface TeacherScheduleItem {
  classId: string;
  sectionId: string;
  period: number;
  subject: string;
  className: string;
  sectionName: string;
  room: string;
  startTime: string;
  endTime: string;
}

export interface TeacherDashboardData {
  assignedClasses: number;
  studentsAssigned: number;
  upcomingExams: number;
  unreadNotifications: number;
  todaySchedule: TeacherScheduleItem[];
  pendingTasks: DashboardActivityItem[];
  classTeacherOf?: { classId: string; className: string; sectionName?: string; totalStudents: number }[];
  messageQueue?: { conversationId: string; fromName: string; studentName?: string; preview: string; timestamp: string; priority: 'low' | 'normal' | 'high' }[];
  quickActions?: { label: string; route: string; icon: string }[];
}

export interface ParentDashboardData {
  childCount: number;
  children?: Student[];
  selectedChild?: Student;
  selectedChildId?: string;
  attendancePercentage: number;
  overallGrade: string;
  feeDue: number;
  childPerformance: MarkRecord[];
  feeStatus: FeePayment[];
  alerts?: { type: 'info' | 'warning' | 'success' | 'error'; title: string; message: string; ctaLabel?: string; ctaRoute?: string }[];
  upcoming?: { id: string; title: string; date: string; description?: string }[];
  attendanceSnapshot?: { present: number; absent: number; late: number; excused: number; totalDays: number };
}

export interface StudentPerformanceRow {
  studentId: string;
  studentName: string;
  subjects: Record<string, number>;
  totalMarks: number;
  totalMax: number;
  percentage: number;
  grade: string;
  rank: number;
}

export interface AttendanceSummaryRow {
  studentId: string;
  studentName: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  totalDays: number;
  attendancePercentage: number;
}

export interface ClassSummaryRow {
  classId: string;
  className: string;
  grade: number;
  sections: number;
  totalStudents: number;
  attendancePercentage: number;
  performancePercentage: number;
  feeCollectionPercentage: number;
  classTeacherName: string;
}

export interface TeacherWorkloadRow {
  teacherId: string;
  teacherName: string;
  specialization: string;
  subjects: string[];
  status: string;
}

export interface ReportCard {
  studentId: string;
  studentName: string;
  subjects: MarkRecord[];
  totalMarks: number;
  totalMaxMarks: number;
  overallPercentage: number;
  overallGrade: string;
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

export interface ParentFeeLineItem {
  name: string;
  amount: number;
  type: string;
}

export interface ParentFeeObligation {
  paymentId: string;
  studentId: string;
  studentName: string;
  feeStructureId: string;
  feeStructureName: string;
  className?: string;
  dueDate?: string;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  currency: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  discount: number;
  lateFee: number;
  payableNow: number;
  lineItems: ParentFeeLineItem[];
}

export interface CheckoutSessionRequest {
  paymentId: string;
  studentId: string;
  amount: number;
  provider: string;
  returnUrl?: string;
}

export interface CheckoutSession {
  attemptId: string;
  provider: string;
  providerOrderId: string;
  checkoutToken: string;
  currency: string;
  amount: number;
  checkoutUrl: string;
  status: string;
}

export interface PaymentReceipt {
  receiptNumber: string;
  paymentId: string;
  studentId: string;
  studentName: string;
  feeStructureName: string;
  className?: string;
  provider?: string;
  providerPaymentId?: string;
  paymentMethod?: string;
  paymentDate?: string;
  dueDate?: string;
  currency: string;
  amountPaid: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  discount: number;
  lateFee: number;
  lineItems: ParentFeeLineItem[];
}

export interface ChatParticipantSummary {
  userId: string;
  userRole: string;
  displayName?: string;
}

export interface ChatInboxConversation {
  conversationId: string;
  type: 'direct' | 'group' | 'system';
  subject?: string;
  contextType?: string;
  contextId?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  participants: ChatParticipantSummary[];
  unreadCount: number;
}

export interface ChatCreateConversationRequest {
  type: 'direct' | 'group';
  subject?: string;
  contextType?: string;
  contextId?: string;
  participants: ChatParticipantSummary[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderRole: string;
  senderName?: string;
  body: string;
  bodyType: string;
  clientMessageId?: string;
  createdAt?: string;
}

export interface ChatDirectoryUserCard {
  userId: string;
  name: string;
  role: string;
}

export interface ChatDirectoryStudentCard {
  studentId: string;
  studentName: string;
  parent?: ChatDirectoryUserCard;
}

export interface ChatDirectoryClassRoster {
  classId: string;
  className?: string;
  sectionId?: string;
  sectionName?: string;
  students: ChatDirectoryStudentCard[];
}

export interface ChatDirectoryParentChildRoster {
  studentId: string;
  studentName: string;
  classId?: string;
  className?: string;
  sectionId?: string;
  sectionName?: string;
  classTeacher?: ChatDirectoryUserCard;
}

export interface ChatDirectoryResponse {
  myClassRosters?: ChatDirectoryClassRoster[];
  myChildren?: ChatDirectoryParentChildRoster[];
  teachers?: ChatDirectoryUserCard[];
  parents?: ChatDirectoryUserCard[];
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
