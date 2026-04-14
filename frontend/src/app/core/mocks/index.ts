/**
 * Central mock payloads for `useMocks: true`. Services import from here (or domain files below)
 * so removing mock mode is mostly “delete core/mocks + switch environment”.
 */
export { MOCK_LOGIN_USERS, findMockLoginUser, buildMockProfileSummary, type MockLoginRecord } from './auth.mock-data';
export { MOCK_ACADEMIC_YEARS, MOCK_SUBJECT_CATALOG, MOCK_SCHOOL_CLASSES } from './academic.mock-data';
export { MOCK_TIMETABLE_ENTRIES } from './timetable.mock-data';
export { MOCK_STUDENTS } from './students.mock-data';
export { MOCK_TEACHERS } from './teachers.mock-data';
export { MOCK_LIBRARY_BOOKS, MOCK_LIBRARY_ISSUES } from './library.mock-data';
export { MOCK_LEAVE_REQUESTS_SEED, MOCK_LEAVE_SEQ_START } from './leave.mock-data';
export { MOCK_ADMIN_DASHBOARD, MOCK_TEACHER_DASHBOARD, buildMockParentDashboardData } from './dashboard.mock-data';
export {
  mockActiveStudentCount,
  mockActiveStudents,
  mockClassesWithoutHomeroomTeacher,
  mockHomeroomRowsForTeacherRecordId,
  mockStudentsInClass,
  mockStudentsInSection,
} from './mock-aggregates';
export * from './parent.mock-data';
export { MOCK_OPERATIONS_STAFF_SEED, MOCK_OPERATIONS_INVENTORY_SEED, mockPayrollAccrualSummary } from './operations.mock-data';
export { MOCK_TRANSPORT_VEHICLES_SEED, MOCK_TRANSPORT_DRIVERS_SEED, MOCK_TRANSPORT_ROUTES_SEED } from './transport.mock-data';
export { MOCK_HOSTEL_BUILDINGS_SEED, MOCK_HOSTEL_ROOMS_SEED } from './hostel.mock-data';
export { MOCK_FEE_STRUCTURES_SEED, MOCK_FEE_PAYMENTS_SEED } from './fee.mock-data';
export { MOCK_PAYROLL_STRUCTURES, MOCK_PAYROLL_TEACHER_PAYMENT_DETAILS, MOCK_PAYSLIP_GENERATION_TEMPLATES } from './payroll.mock-data';
export { MOCK_ANNOUNCEMENTS_SEED } from './communication.mock-data';
export {
  buildMockClassSummary,
  buildMockFeeCollectionSummary,
  buildMockReportAttendanceSummary,
  buildMockReportCard,
  buildMockSectionSummary,
  buildMockStudentPerformance,
  buildMockTeacherWorkload,
} from './report.mock-data';
export { MOCK_SCHOOL_NOTIFICATIONS_SEED, MOCK_PLATFORM_OPERATOR_NOTIFICATIONS_SEED } from './notification.mock-data';
export {
  MOCK_CHAT_DIRECTORY_TEACHER,
  MOCK_CHAT_DIRECTORY_PARENT,
  MOCK_CHAT_DIRECTORY_ADMIN,
  buildMockChatInboxSeed,
} from './chat.mock-data';
export { MOCK_EXAMS_SEED, MOCK_EXAM_MARKS_SEED, MOCK_EXAM_SCHEDULE_SEED } from './exam.mock-data';
export {
  MOCK_PLATFORM_SCHOOLS_SEED,
  MOCK_PLATFORM_ADMINS_SEED,
  MOCK_PLATFORM_SUBSCRIPTION_PLANS_SEED,
  MOCK_PLATFORM_DASHBOARD_BASE,
} from './platform.mock-data';
export { MOCK_TENANT_CONFIG_DEFAULT, mockSchoolBranches } from './settings.mock-data';
export { MOCK_DIRECTORY_STATIC_ENTRIES } from './directory.mock-data';
export { buildMockPaymentCheckoutOrderResponse } from './payment.mock-data';
export type { PaymentDtos } from '../payment/payment.dto';
export type { DirectoryDtos, DirectoryEntry, DirectorySearchResponse } from '../models/directory.dto';
export type { ParentFeeDtos } from '../models/parent-fee.dto';
export type { ChatDirectoryDtos } from '../models/chat-directory.dto';
export { MOCK_DOCUMENTS_LIST } from './documents.mock-data';
export {
  buildMockAttendanceRecordsForClassDate,
  buildMockReportAttendanceSummaryForClassMonth,
  mockAttendanceRecordsForStudentInRange,
  mockAttendanceStatsForStudentInRange,
  mockAttendanceStatusFor,
  mockTenantAttendanceOverviewForMonth,
  seedInitialMockAttendanceRecords,
  stableMockAttendanceRowId,
} from './attendance.mock-data';
