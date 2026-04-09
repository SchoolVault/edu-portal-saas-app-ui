export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
  section?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'bi-grid-1x2-fill', route: '/app/dashboard', roles: ['admin', 'teacher', 'parent'], section: 'Main' },
  { label: 'Platform', icon: 'bi-buildings-fill', route: '/app/super-admin', roles: ['super_admin'], section: 'Main' },
  { label: 'Schools', icon: 'bi-bank2', route: '/app/platform-schools', roles: ['super_admin'], section: 'Platform' },
  { label: 'Subscriptions', icon: 'bi-receipt', route: '/app/platform-subscriptions', roles: ['super_admin'], section: 'Platform' },
  { label: 'Broadcasts', icon: 'bi-megaphone-fill', route: '/app/platform-broadcasts', roles: ['super_admin'], section: 'Platform' },
  { label: 'System health', icon: 'bi-heart-pulse', route: '/app/platform-health', roles: ['super_admin'], section: 'Platform' },
  { label: 'Settings', icon: 'bi-gear-fill', route: '/app/platform-settings', roles: ['super_admin'], section: 'Platform' },
  { label: 'My Children', icon: 'bi-person-vcard-fill', route: '/app/parent', roles: ['parent'], section: 'Main' },
  { label: 'Academic', icon: 'bi-mortarboard-fill', route: '/app/academic', roles: ['admin'], section: 'Main' },
  { label: 'Students', icon: 'bi-people-fill', route: '/app/students', roles: ['admin', 'teacher'], section: 'People' },
  { label: 'Teachers', icon: 'bi-person-badge-fill', route: '/app/teachers', roles: ['admin'], section: 'People' },
  { label: 'Attendance', icon: 'bi-calendar-check-fill', route: '/app/attendance', roles: ['admin', 'teacher'], section: 'Academics' },
  { label: 'Timetable', icon: 'bi-clock-fill', route: '/app/timetable', roles: ['admin', 'teacher', 'parent'], section: 'Academics' },
  { label: 'Exams', icon: 'bi-journal-text', route: '/app/exams', roles: ['admin', 'teacher', 'parent'], section: 'Academics' },
  { label: 'Fees', icon: 'bi-credit-card-fill', route: '/app/fees', roles: ['admin'], section: 'Finance' },
  { label: 'Payroll', icon: 'bi-wallet-fill', route: '/app/payroll', roles: ['admin'], section: 'Finance' },
  { label: 'Inbox', icon: 'bi-inbox-fill', route: '/app/inbox', roles: ['admin', 'teacher', 'parent', 'student'], section: 'Connect' },
  { label: 'Chat', icon: 'bi-chat-dots-fill', route: '/app/chat', roles: ['admin', 'teacher', 'parent'], section: 'Connect' },
  { label: 'Leave', icon: 'bi-calendar-x', route: '/app/leave', roles: ['admin', 'teacher'], section: 'Connect' },
  { label: 'Reports', icon: 'bi-graph-up', route: '/app/reports', roles: ['admin'], section: 'Analytics' },
  { label: 'Transport', icon: 'bi-bus-front-fill', route: '/app/transport', roles: ['admin'], section: 'Operations' },
  { label: 'Library', icon: 'bi-book-fill', route: '/app/library', roles: ['admin', 'teacher'], section: 'Operations' },
  { label: 'Hostel', icon: 'bi-house-fill', route: '/app/hostel', roles: ['admin'], section: 'Operations' },
  { label: 'Documents', icon: 'bi-folder2-open', route: '/app/documents', roles: ['admin', 'teacher'], section: 'System' },
  { label: 'Audit Log', icon: 'bi-shield-check', route: '/app/audit', roles: ['admin'], section: 'System' },
  { label: 'Settings', icon: 'bi-gear-fill', route: '/app/settings', roles: ['admin'], section: 'System' },
];

export const ROLES = { SUPER_ADMIN: 'super_admin', ADMIN: 'admin', TEACHER: 'teacher', PARENT: 'parent', STUDENT: 'student' } as const;

export const STUDENT_STATUS = ['active', 'inactive', 'graduated'] as const;
export const ATTENDANCE_STATUS = ['present', 'absent', 'late', 'excused'] as const;
export const FEE_STATUS = ['paid', 'partial', 'unpaid', 'overdue'] as const;
export const EXAM_STATUS = ['upcoming', 'ongoing', 'completed'] as const;
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export const GENDERS = ['male', 'female', 'other'] as const;

export const API_ENDPOINTS = {
  AUTH: { LOGIN: '/api/auth/login', LOGOUT: '/api/auth/logout' },
  STUDENTS: { BASE: '/api/students' },
  TEACHERS: { BASE: '/api/teachers' },
  ACADEMIC: { BASE: '/api/academic' },
  ATTENDANCE: { BASE: '/api/attendance' },
  TIMETABLE: { BASE: '/api/timetable' },
  EXAMS: { BASE: '/api/exams' },
  FEES: { BASE: '/api/fees' },
  COMMUNICATION: { BASE: '/api/communication' },
  REPORTS: { BASE: '/api/reports' },
};

export const DEFAULT_FEATURES: Record<string, boolean> = {
  transport: true,
  library: true,
  hostel: true,
  payroll: true,
  documents: true,
  audit: true,
  communication: true,
  reports: true,
};
