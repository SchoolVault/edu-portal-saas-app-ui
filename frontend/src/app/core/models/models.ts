import type { ParentFeeDtos } from './parent-fee.dto';

export type AppRole = 'super_admin' | 'admin' | 'teacher' | 'parent' | 'student' | 'library_staff';

/** Body for {@code PUT /api/v1/auth/profile} — mirrors Spring {@code AuthDTOs.UpdateProfileRequest}. */
export interface UpdateAccountProfileRequest {
  name?: string;
  phone?: string | null;
  avatar?: string | null;
}

export interface User {
  /** ERP user id (Java Long → JSON number). */
  id: number;
  /** Optional when phone-only accounts use a synthetic server-side address. */
  email?: string;
  name: string;
  role: AppRole;
  tenantId: string;
  avatar?: string;
  phone?: string;
  /** Mirrors backend `UserProfile.interfaceLocale` (en | hi, …). */
  interfaceLocale?: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
  schoolCode: string;
  interfaceLocale?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface PasswordResetRequest {
  phone: string;
  schoolCode: string;
  verificationToken: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

/** Same shape as Spring {@code AuthDTOs.TokenResponse} (refresh endpoint). */
export interface TokenResponse {
  token: string;
  refreshToken: string;
}

export interface OnboardSchoolRequest {
  schoolName: string;
  schoolCode: string;
  adminName: string;
  /** Optional; server generates a stable synthetic email from {@link phone} when omitted. */
  adminEmail?: string;
  adminPassword: string;
  phone: string;
  address?: string;
  /** Optional UI locale for first admin; mirrors backend when enabled. */
  interfaceLocale?: string;
}

export interface ProfileSummary {
  id: number;
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
  /** TEACHER: roster headcount across assigned classes (GET /auth/profile-summary). */
  assignedStudentCount?: number;
  /** TEACHER: primary subject for shell (first listed subject, else specialization). */
  primaryTeachingSubject?: string;
  subjectCount?: number;
  managedStudentCount?: number;
  managedTeacherCount?: number;
  /** SUPER_ADMIN: count of active school workspaces (non-deleted tenants). */
  platformWorkspaceCount?: number;
  /** TEACHER: classes where this user is the assigned class teacher (photo / roster policy). */
  classTeacherOf?: { classId: number; className?: string; sectionName?: string; totalStudents?: number }[];
  /** SUPER_ADMIN: console operator metadata (API or mock). */
  platformOperatorSince?: string;
  platformLastLoginDisplay?: string;
  platformTimezone?: string;
  platformMfaEnabled?: boolean;
  platformPrimaryRegion?: string;
  /** Server-driven UI language for shell sync after refresh. */
  interfaceLocale?: string;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  classId: number;
  className: string;
  sectionId: number;
  sectionName: string;
  rollNumber: string;
  admissionNumber: string;
  admissionDate: string;
  parentId: number;
  /** Linked parent ERP user id for chat/directory (when parent has a login). */
  parentUserId?: number;
  parentName: string;
  address: string;
  bloodGroup: string;
  avatar?: string;
  /** Homeroom / class teacher when API or seed provides it (parent portal, settings). */
  homeroomTeacherName?: string;
  homeroomTeacherUserId?: number;
  status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'alumni';
  tenantId: string;
}

/** Row from {@code GET /students/{id}/guardian-mappings} — mirrors Spring {@code GuardianDTOs.MappingResponse}. */
export interface StudentGuardianMapping {
  id: number;
  studentId: number;
  guardianId: number;
  guardianName: string;
  relationType: string | null;
  isPrimary: boolean | null;
  isEmergencyContact: boolean | null;
  custodyType: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  primaryPhone?: string | null;
  occupation?: string | null;
  /** From guardian emails_json (first email). */
  email?: string | null;
  /** Extra numbers from guardian phones_json (not the primary column). */
  additionalPhones?: string[] | null;
  /** Guardian linked to a parent portal login. */
  parentPortalLinked?: boolean | null;
}

export interface AttendanceStats {
  studentId?: number;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused?: number;
  attendancePercentage: number;
}

/** Library desk privileges (mirrors backend Enums.LibraryStaffRole). */
export type LibraryStaffRole = 'assistant' | 'librarian' | 'head';

/** Tenant subject master row; mirrors GET /api/v1/academic/subjects/catalog. */
export interface SubjectCatalogItem {
  id: string | null;
  code: string | null;
  name: string;
  category: string | null;
}

export interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  specialization: string;
  joinDate: string;
  subjects: string[];
  /** @deprecated Prefer {@link homeroomClassNames}; kept for legacy mocks/API fields. */
  classIds: number[];
  /** Class display names where this teacher is homeroom/class teacher (from {@code school_classes.class_teacher_id}). */
  homeroomClassNames?: string[];
  salary: number;
  status: 'active' | 'inactive';
  avatar?: string;
  /** Links to User.id when staff logs in with a teacher account. */
  userId?: number;
  /** When set, login JWT includes LIBRARY_MANAGE / LIBRARY_CIRCULATION (backend). */
  libraryStaffRole?: LibraryStaffRole;
  tenantId: string;
}

export interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  tenantId: string;
}

export interface SchoolClass {
  id: number;
  name: string;
  grade: number;
  sections: Section[];
  classTeacherId?: number;
  classTeacherName?: string;
  academicYearId: number;
  tenantId: string;
  /** From API aggregate; optional in mocks. */
  totalStudents?: number;
}

export interface Section {
  id: number;
  name: string;
  classId: number;
  capacity: number;
  studentCount: number;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  sectionId: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy: number;
  tenantId: string;
}

export interface TimetableEntry {
  id: number;
  classId: number;
  sectionId: number;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  /** Optional denormalized labels when API sends them; UI can also resolve from {@link SchoolClass} catalog. */
  className?: string;
  sectionName?: string;
  room: string;
  tenantId: string;
  /** {@code RECURRING} weekly slot vs one-day {@code COVER} from attendance cover assignments */
  scheduleSource?: 'RECURRING' | 'COVER';
  /** ISO date when this row is a cover overlay */
  coverForDate?: string;
}

export type TimetableConflictKind = 'CLASS_PERIOD_OCCUPIED' | 'TEACHER_DOUBLE_BOOKED';

/** Mirrors {@code TimetableDTOs.TimetableConflictPayload} for HTTP 409 responses. */
export interface TimetableConflictPayload {
  conflictType: TimetableConflictKind | string;
  existingEntryId: number;
  day: string;
  period: number;
  subjectName?: string;
  teacherName?: string;
  classId?: number;
  sectionId?: number | null;
  conflictingClassId?: number;
  conflictingSectionId?: number | null;
}

export interface TimetableGridSlot {
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
}

export interface TimetableGrid {
  classId: number;
  sectionId: number;
  days: string[];
  periods: number[];
  grid: Record<string, Record<number, TimetableGridSlot>>;
}

/** Per-class/section audience for an exam (aligns with backend ExamScopeDtos.ClassScopeOut). */
export interface ExamClassScope {
  classId: number;
  sectionId?: number | null;
  className?: string;
  sectionName?: string;
}

/** Scheduled paper slot (aligns with backend ExamScopeDtos.ScheduleSlotOut). */
/** Parent portal exam list item (backend ExamDTOs.ParentExamSummaryResponse). */
export interface ParentExamSummary {
  id: number;
  name: string;
  academicYearId?: number;
  startDate?: string;
  endDate?: string;
  status: string;
  resultsPublished: boolean;
}

export interface ExamScheduleSlot {
  id?: number;
  /** Present when slot is nested under a known exam in UI mocks. */
  examId?: number;
  classId: number;
  sectionId?: number | null;
  className?: string;
  sectionName?: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  room?: string;
  notes?: string;
}

export interface Exam {
  id: number;
  name: string;
  academicYearId: number;
  startDate: string;
  endDate: string;
  classIds: number[];
  /** When set, preferred over classIds for scoped exams (API + UI). */
  classScopes?: ExamClassScope[];
  scheduleSlots?: ExamScheduleSlot[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  /** When false, parents do not see marks until school publishes. */
  resultsPublished?: boolean;
  tenantId: string;
}

export interface PromotionStudentPreview {
  studentId: number;
  firstName: string;
  lastName: string;
  rollNumber: string;
  currentClassName: string;
  averageScore: number;
  eligible: boolean;
  selected?: boolean;
}

export interface PromotionTargetSectionOption {
  id: number;
  name: string;
  capacity?: number;
}

export interface PromotionPreview {
  sourceClassId: number;
  sourceClassName: string;
  targetClassId: number;
  targetClassName: string;
  defaultSectionId?: number;
  defaultSectionName?: string;
  /** All sections of the target class; UI picks one when promoting into fewer sections. */
  targetSections?: PromotionTargetSectionOption[];
  /** Backend hint when target has no sections or fewer than source. */
  sectionPlacementNote?: string;
  students: PromotionStudentPreview[];
}

export interface PromotionSplitSectionRow {
  sectionId: number;
  sectionName: string;
  capacity?: number;
  suggestedAssignCount: number;
}

export interface PromotionSplitPreview {
  fromClassId: number;
  toClassId: number;
  eligibleStudentCount: number;
  hint?: string;
  sections: PromotionSplitSectionRow[];
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
  id?: number;
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

export interface ClassHomeroomGap {
  classId: number;
  className: string;
  grade?: number;
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
  /** Classes with no homeroom teacher — admin should assign in Academic. */
  classesWithoutHomeroomTeacher?: ClassHomeroomGap[];
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

/** Super-admin chat picker row (GET /platform/school-admins/chat-search). */
export interface PlatformSchoolAdminChatHit {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  schoolName: string;
  schoolCode: string;
  tenantId: string;
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

export interface PlatformSchoolDetail {
  school: PlatformSchoolSummary;
  admins: PlatformSchoolAdmin[];
  parentUserCount: number;
  subscriptionPlanCode: string;
  subscriptionStatus: string;
}

export interface PlatformPurgeJob {
  id: string;
  tenantId: string;
  schoolCode: string;
  status: string;
  errorMessage?: string | null;
  rowsDeletedEstimate?: number | null;
  createdAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface PlatformBroadcastResult {
  notificationRowsCreated: number;
  tenantWorkspacesReached: number;
}

export interface PlatformSubscriptionPlan {
  code: string;
  name: string;
  description: string;
  monthlyPriceMinorUnits: number;
  currency: string;
  highlights: string[];
  maxStudentsLabel?: string;
  supportTier?: string;
  billingCadence?: string;
  modules?: string[];
  recommended?: boolean;
  commercialNotes?: string;
  integrationPriceKey?: string;
}

export interface CacheClearRequest {
  tenantId?: string | null;
  regions?: string[] | null;
}

export interface CacheStatistics {
  regionsCleared: number;
  clearedRegions: string[];
  clearedAt: string;
  clearedBy: string;
  targetTenantId?: string | null;
  targetSchoolName?: string | null;
  /** Tenant-scoped clears only — approximate Redis keys removed */
  keysEvicted?: number | null;
}

export interface CacheClearResponse {
  success: boolean;
  message: string;
  statistics: CacheStatistics | null;
}

export interface CacheRegionOption {
  name: string;
  label: string;
  description: string;
  category: 'core' | 'academic' | 'operations' | 'reports';
}

export interface TeacherScheduleItem {
  classId: number;
  sectionId: number;
  period: number;
  subject: string;
  className: string;
  sectionName: string;
  room: string;
  startTime: string;
  endTime: string;
}

/** Coded feed row for teacher home — UI maps {@link code} to i18n (language switch safe). */
export type TeacherDashboardActivityCode =
  | 'EXAM_SCHEDULED'
  | 'ADMIN_ANNOUNCEMENT'
  | 'TIMETABLE_UPDATED'
  | 'ATTENDANCE_PENDING'
  | 'STUDENT_ROSTER_CHANGE';

export interface TeacherDashboardActivityItem {
  code: TeacherDashboardActivityCode;
  type: 'info' | 'success' | 'warning';
  timestamp: string;
  params?: Record<string, string | number>;
  linkRoute: string;
  linkQueryParams?: Record<string, string>;
}

/** Month key {@code YYYY-MM}; presentPercent is 0–100 for the teacher’s scoped classes. */
export interface TeacherAttendanceTrendPoint {
  month: string;
  presentPercent: number;
}

/** Homeroom / class-teacher section — daily points + ring breakdown (GET /reports/dashboard/teacher?month=). */
export interface TeacherHomeroomDailyPoint {
  date: string;
  /** Share of that day’s attendance marks (0–100); retained for other widgets / compatibility. */
  presentPercent: number;
  absentPercent?: number;
  latePercent?: number;
  excusedPercent?: number;
  /** Per-day headcounts (primary for day-by-day stacked bar). */
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  excusedCount?: number;
}

export interface TeacherHomeroomAttendanceDetail {
  month: string;
  classLabel?: string;
  daily: TeacherHomeroomDailyPoint[];
  breakdown: { present: number; absent: number; late: number; excused: number };
}

export interface TeacherDashboardData {
  assignedClasses: number;
  studentsAssigned: number;
  upcomingExams: number;
  /** Sessions/classes where attendance is still to be marked for the current window (actionable KPI). */
  pendingAttendanceSessions: number;
  /**
   * @deprecated Prefer {@link pendingAttendanceSessions}. Kept for older mock/API payloads.
   */
  unreadNotifications?: number;
  todaySchedule: TeacherScheduleItem[];
  pendingTasks: DashboardActivityItem[];
  /** Optional legacy widgets — hidden in UI when empty / phased out. */
  classTeacherOf?: {
    classId: number;
    className: string;
    sectionName?: string;
    /** When set, deep-links to attendance / roster filters. */
    sectionId?: number;
    totalStudents: number;
  }[];
  messageQueue?: { conversationId: string; fromName: string; studentName?: string; preview: string; timestamp: string; priority: 'low' | 'normal' | 'high' }[];
  quickActions?: { label: string; route: string; icon: string }[];
  recentActivities?: TeacherDashboardActivityItem[];
  /** Rolling attendance trend for charts (mock + future GET /reports/dashboard/teacher). */
  attendanceTrend?: TeacherAttendanceTrendPoint[];
  /** Class-teacher homeroom: day-wise % for {@code month} + doughnut breakdown (same API as monthly query). */
  homeroomAttendance?: TeacherHomeroomAttendanceDetail | null;
  /**
   * When true, homeroom attendance rows exist for local today (server); drives teacher dashboard “attendance marked” tile.
   */
  homeroomTodayAttendanceComplete?: boolean;
}

/** Mirrors backend policy field {@code schoolThresholdPercent} when wired. */
export type ParentMetricBand = 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical';

export interface ParentAttendanceMetricContext {
  band: ParentMetricBand;
  /** i18n: dashboard.parent.metric.attendance.band.* */
  labelKey: string;
  schoolThresholdPct: number;
}

export interface ParentResultMetricContext {
  band: ParentMetricBand;
  labelKey: string;
  averagePercent?: number;
}

export type ParentFeeUrgencyLevel = 'none' | 'low' | 'medium' | 'high';

export interface ParentFeeMetricContext {
  urgency: ParentFeeUrgencyLevel;
  labelKey: string;
  nextDueDate?: string;
  daysUntilDue?: number | null;
}

export type ParentDashboardActivityCode =
  | 'ATTENDANCE_MARKED'
  | 'FEE_PAYMENT_RECORDED'
  | 'RESULT_PUBLISHED'
  | 'ANNOUNCEMENT_POSTED';

/** Coded activity row — UI maps {@link code} to i18n keys (works with app language switch). */
export interface ParentDashboardActivityItem {
  code: ParentDashboardActivityCode;
  type: 'info' | 'success' | 'warning';
  timestamp: string;
  params?: Record<string, string | number>;
}

export interface ParentDashboardData {
  childCount: number;
  children?: Student[];
  selectedChild?: Student;
  selectedChildId?: number;
  attendancePercentage: number;
  overallGrade: string;
  feeDue: number;
  childPerformance: MarkRecord[];
  feeStatus: FeePayment[];
  /** Explains attendance vs school threshold (QA: raw % without context). */
  attendanceMetric?: ParentAttendanceMetricContext;
  /** Explains grade / performance band (QA: result without context). */
  resultMetric?: ParentResultMetricContext;
  /** Fee urgency + next due (QA: fee tile lacks urgency). */
  feeMetric?: ParentFeeMetricContext;
  /** Parent dashboard feed (QA: missing recent activity). */
  recentActivities?: ParentDashboardActivityItem[];
  alerts?: {
    type: 'info' | 'warning' | 'success' | 'error';
    /** Plain text (e.g. API). */
    title?: string;
    message?: string;
    /** i18n keys — when set, template prefers these over title/message. */
    titleKey?: string;
    messageKey?: string;
    messageParams?: Record<string, string | number>;
    ctaLabel?: string;
    ctaLabelKey?: string;
    ctaRoute?: string;
    ctaQueryParams?: Record<string, string>;
  }[];
  upcoming?: DashboardUpcomingEvent[];
  attendanceSnapshot?: { present: number; absent: number; late: number; excused: number; totalDays: number };
}

export interface StudentPerformanceRow {
  studentId: number;
  studentName: string;
  subjects: Record<string, number>;
  totalMarks: number;
  totalMax: number;
  percentage: number;
  grade: string;
  rank: number;
}

export interface AttendanceSummaryRow {
  studentId: number;
  studentName: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  totalDays: number;
  attendancePercentage: number;
}

export interface ClassSummaryRow {
  classId: number;
  className: string;
  grade: number;
  sections: number;
  totalStudents: number;
  attendancePercentage: number;
  performancePercentage: number;
  feeCollectionPercentage: number;
  classTeacherName: string;
}

export interface SectionSummaryRow {
  sectionId: number;
  sectionName: string;
  classId: number;
  className: string;
  studentCount: number;
}

export interface TeacherWorkloadRow {
  teacherId: number;
  teacherName: string;
  specialization: string;
  subjects: string[];
  status: string;
}

export interface ReportCard {
  studentId: number;
  studentName: string;
  subjects: MarkRecord[];
  totalMarks: number;
  totalMaxMarks: number;
  overallPercentage: number;
  overallGrade: string;
}

export interface MarkRecord {
  id: number;
  examId: number;
  studentId: number;
  studentName: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  classId: number;
  tenantId: string;
}

/** Backend: teacher marks-entry authorization scope per exam */
export interface MarksEntryScopeRow {
  examId: number;
  classId: number;
  sectionId: number | null;
  subjectName: string;
}

export interface FeeStructure {
  id: number;
  name: string;
  classId: number;
  className: string;
  academicYearId: number;
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
  id: number;
  studentId: number;
  studentName: string;
  feeStructureId: number;
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

/** Mirrors {@code FeeDTOs.BulkAssignFeesRequest}. */
export interface BulkAssignFeesRequest {
  feeStructureId: number;
  classId: number;
  sectionId?: number | null;
  dueDate: string;
  discount?: number;
  /** Default true when omitted. */
  skipIfDuplicate?: boolean;
  correlationId?: string;
}

/** Mirrors {@code FeeDTOs.BulkAssignFeesSkipEntry}. */
export interface BulkAssignFeesSkipEntry {
  studentId: number;
  code: string;
  detail?: string;
}

/** Mirrors {@code FeeDTOs.BulkAssignFeesResponse}. */
export interface BulkAssignFeesResponse {
  createdCount: number;
  skippedCount: number;
  skipped: BulkAssignFeesSkipEntry[];
  createdSample: FeePayment[];
}

/** @see ParentFeeDtos — mirrors {@code FeeDTOs.ParentFeeLineItem}. */
export type ParentFeeLineItem = ParentFeeDtos.ParentFeeLineItem;
/** @see ParentFeeDtos — mirrors {@code FeeDTOs.ParentFeeObligationResponse}. */
export type ParentFeeObligation = ParentFeeDtos.ParentFeeObligationResponse;
/** @see ParentFeeDtos — mirrors {@code FeeDTOs.CreateCheckoutSessionRequest}. */
export type CheckoutSessionRequest = ParentFeeDtos.CreateCheckoutSessionRequest;
/** @see ParentFeeDtos — mirrors {@code FeeDTOs.CheckoutSessionResponse}. */
export type CheckoutSession = ParentFeeDtos.CheckoutSessionResponse;
/** @see ParentFeeDtos — mirrors {@code FeeDTOs.PaymentReceiptResponse}. */
export type PaymentReceipt = ParentFeeDtos.PaymentReceiptResponse;

export interface ChatParticipantSummary {
  userId: number;
  userRole: string;
  displayName?: string;
  /** Optional professional label from user profile / API (e.g. Principal) — mirrors Spring {@code ParticipantSummary.jobTitle}. */
  jobTitle?: string;
}

/**
 * Student line for chat identity (GET /chat/inbox may include under counterpartInsight).
 * Backend mirrors: {@code linkedStudents[]} + {@code linkedStudentTotal} when truncated.
 */
export interface ChatLinkedStudentBrief {
  studentId: number;
  studentName: string;
  /** Short class label, e.g. "5A" or "8-A" — server may pre-format for locale. */
  classShort?: string;
}

/**
 * Who the other party is in a direct thread — from API or derived client-side from directory/rosters.
 */
export interface ChatCounterpartInsight {
  roleCode: string;
  linkedStudents?: ChatLinkedStudentBrief[];
  /** When {@link linkedStudents} shows fewer than total linked children. */
  linkedStudentTotal?: number;
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
  /** Optional; same shape as backend DTO on inbox rows. */
  counterpartInsight?: ChatCounterpartInsight;
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
  senderUserId: number;
  senderRole: string;
  senderName?: string;
  /** Optional; mirrors Spring {@code MessageResponse.senderJobTitle}. */
  senderJobTitle?: string;
  body: string;
  bodyType: string;
  clientMessageId?: string;
  createdAt?: string;
}

export interface ChatDirectoryUserCard {
  userId: number;
  name: string;
  role: string;
  /** When present (e.g. admin directory), used to render parent identity in chat without extra API. */
  linkedStudents?: ChatLinkedStudentBrief[];
  linkedStudentTotal?: number;
}

export interface ChatDirectoryStudentCard {
  studentId: number;
  studentName: string;
  parent?: ChatDirectoryUserCard;
}

export interface ChatDirectoryClassRoster {
  classId: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  students: ChatDirectoryStudentCard[];
}

export interface ChatDirectoryParentChildRoster {
  studentId: number;
  studentName: string;
  classId?: number;
  className?: string;
  sectionId?: number;
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

export interface AnnouncementPreview {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  /** Backend / mock: {@code ALL}, {@code PARENTS}, {@code TEACHERS}, … — drives shell audience split. */
  targetAudience?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  userId: number;
  createdAt: string;
  link?: string;
  /** Optional sender / source label when the API provides it (forward-compatible). */
  senderLabel?: string;
}

/** One row in the merged inbox (announcements + notifications), sorted by {@code createdAt} desc. */
export interface InboxUnifiedItem {
  kind: 'announcement' | 'notification';
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  /** Announcement audience enum name from API (e.g. ALL). */
  audienceKey?: string;
  authorLine?: string;
  notificationType?: AppNotification['type'];
  read?: boolean;
}

export interface TransportVehicle {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  capacity: number;
  model?: string;
  tenantId?: string;
}

export interface TransportDriver {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber?: string;
  tenantId?: string;
}

export interface TransportRoute {
  id: string;
  name: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  vehicleId?: string;
  driverId?: string;
  vehicleType?: string;
  liveLatitude?: number;
  liveLongitude?: number;
  liveRecordedAt?: string;
  stops: { id?: number; name: string; time: string; order: number }[];
  assignedStudents: number;
  students?: { id: number; studentId: number; studentName: string; pickupStop?: string; dropStop?: string }[];
  tenantId: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  /** false = soft-removed from catalog (tenant library fine / catalog toggle). */
  catalogActive?: boolean;
  tenantId: string;
}

export interface BookIssue {
  id: string;
  bookId: number;
  bookTitle: string;
  studentId: number;
  studentName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fine: number;
  status: 'issued' | 'returned' | 'overdue';
  tenantId: string;
}

export interface HostelBuilding {
  id: string;
  name: string;
  code: string;
  genderScope?: string;
  roomCount: number;
  availableBeds: number;
  tenantId?: string;
}

export interface HostelResident {
  allocationId: string;
  studentId: number;
  studentName: string;
  fromDate?: string;
  toDate?: string;
}

export interface HostelRoom {
  id: string;
  roomNumber: string;
  block: string;
  floor: number;
  capacity: number;
  occupancy: number;
  type: string;
  hostelId?: string;
  hostelName?: string;
  residents?: HostelResident[];
  tenantId: string;
}

export interface SalaryStructure {
  id: number;
  teacherId: number;
  teacherName: string;
  basicSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  netSalary: number;
  tenantId: string;
}

export interface Payslip {
  id: string;
  teacherId: number;
  teacherName: string;
  month: string;
  year: number;
  basicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  status: 'generated' | 'paid';
  /** When salary was marked paid / disbursed (UI + PDF). */
  paymentDate?: string;
  tenantId: string;
}

export interface TeacherPaymentDetails {
  teacherId: number;
  teacherName: string;
  monthlyNetSalary: number;
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountMasked?: string;
  bankIfsc?: string;
  bankDetailsComplete?: boolean;
}

export interface DocumentRecord {
  id: string;
  name: string;
  type: string;
  category: string;
  uploadedBy: string;
  uploadDate: string;
  size: string;
  /** Download / preview URL when backend provides signed or static path. */
  fileUrl?: string;
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

/** Super-admin platform health API (/api/v1/platform/health). */
export interface PlatformHealthSnapshot {
  checkedAt: string;
  jvm: { heapUsedBytes: number; heapMaxBytes: number; heapUsagePercent: number };
  disk: { path: string; totalBytes: number; usableBytes: number; usagePercent: number };
  components: { name: string; status: string; detail?: string }[];
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

/** Multi-campus branch row (aligns with backend SchoolBranchDTO). */
export interface SchoolBranch {
  tenantId: string;
  schoolName: string;
  schoolCode: string;
  address?: string;
  phone?: string;
  email?: string;
  currentTenant: boolean;
}

// ============================================================
// PHONE AUTHENTICATION & GUARDIAN SYSTEM
// ============================================================

export type RelationType = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'GRANDFATHER' | 'GRANDMOTHER' | 'UNCLE' | 'AUNT' | 'SIBLING' | 'OTHER';

export type OtpPurpose = 'LOGIN' | 'SIGNUP' | 'PASSWORD_RESET' | 'PHONE_VERIFY';

export type OtpChannel = 'SMS' | 'WHATSAPP' | 'VOICE' | 'EMAIL';

/** Guardian (Parent/Legal Guardian) */
export interface Guardian {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email?: string;
  relationType: RelationType;
  occupation?: string;
  annualIncome?: number;
  educationLevel?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  alternatePhone?: string;
  userId?: number;
  hasPortalAccess: boolean;
  isPrimaryContact: boolean;
  canPickupStudent: boolean;
  emergencyContact: boolean;
  linkedStudentCount: number;
  linkedStudents?: LinkedStudentSummary[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LinkedStudentSummary {
  studentId: number;
  studentName: string;
  className?: string;
  sectionName?: string;
  relationType: string;
  isPrimary: boolean;
  admissionNumber: string;
}

export interface CreateGuardianRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  relationType: RelationType;
  occupation?: string;
  annualIncome?: number;
  educationLevel?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  alternatePhone?: string;
  provisionPortalAccess?: boolean;
  portalPassword?: string;
  isPrimaryContact?: boolean;
  canPickupStudent?: boolean;
  emergencyContact?: boolean;
}

export interface UpdateGuardianRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  relationType?: RelationType;
  occupation?: string;
  city?: string;
  isPrimaryContact?: boolean;
  canPickupStudent?: boolean;
  emergencyContact?: boolean;
}

export interface GuardianPageResponse {
  guardians: Guardian[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface SendOtpRequest {
  phone: string;
  schoolCode: string;
  purpose: OtpPurpose;
  channel?: OtpChannel;
  requestId?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  requestId: string;
  expiresInSeconds: number;
  canRetryAfterSeconds: number;
  devOtpCode?: string; // For development only
}

export interface VerifyOtpRequest {
  phone: string;
  schoolCode: string;
  otpCode: string;
  purpose: OtpPurpose;
  requestId?: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  message: string;
  remainingAttempts: number;
  verificationToken?: string;
}

export interface PhoneLoginRequest {
  phone: string;
  schoolCode: string;
  verificationToken: string;
  interfaceLocale?: string;
}

export interface ResendOtpRequest {
  phone: string;
  schoolCode: string;
  purpose: OtpPurpose;
  channel?: OtpChannel;
}

export interface StudentWithGuardians {
  student: Student;
  guardians: Guardian[];
}

export interface GuardianDetail {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  relationType: RelationType;
  occupation?: string;
  addressLine1?: string;
  city?: string;
  isPrimary: boolean;
  isFinancialResponsible: boolean;
  provisionPortalAccess: boolean;
}

export interface CreateStudentWithGuardiansRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: string;
  gender: string;
  classId: number;
  sectionId: number;
  rollNumber?: string;
  admissionNumber: string;
  admissionDate?: string;
  address?: string;
  bloodGroup?: string;
  guardians: GuardianDetail[];
}

export interface BulkStudentImportRequest {
  students: StudentImportRow[];
  skipDuplicates?: boolean;
  validateOnly?: boolean;
  correlationId?: string;
}

export interface StudentImportRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  className: string;
  sectionName: string;
  rollNumber?: string;
  admissionNumber: string;
  admissionDate?: string;
  address?: string;
  bloodGroup?: string;
  guardian1FirstName: string;
  guardian1LastName: string;
  guardian1Phone: string;
  guardian1Email?: string;
  guardian1Relation: RelationType;
  guardian1Occupation?: string;
  guardian2FirstName?: string;
  guardian2LastName?: string;
  guardian2Phone?: string;
  guardian2Email?: string;
  guardian2Relation?: RelationType;
  rowNumber?: number;
}

export interface BulkStudentImportResponse {
  totalRows: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: ImportError[];
  results: StudentImportResult[];
  correlationId?: string;
  jobId?: number;
}

export interface ImportError {
  rowNumber: number;
  field: string;
  errorCode: string;
  errorMessage: string;
  rejectedValue?: string;
}

export interface StudentImportResult {
  rowNumber: number;
  admissionNumber: string;
  studentId?: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  message: string;
  guardianIds?: number[];
}
