export interface OperationalStaffRow {
  id: string;
  staffRole: string;
  fullName: string;
  phone?: string;
  email?: string;
  employeeCode?: string;
  userId?: string;
  transportRouteId?: string;
  notes?: string;
}

export interface VisitorLogRow {
  id: string;
  visitorName: string;
  phone?: string;
  purpose?: string;
  hostName?: string;
  badgeNo?: string;
  checkInAt: string;
  checkOutAt?: string;
  status: string;
}

export interface GatePassRow {
  id: string;
  studentId?: string;
  issuedToName: string;
  validFrom: string;
  validTo: string;
  purpose?: string;
  issuedByUserId?: string;
  status: string;
}

export interface InventoryRow {
  id: string;
  sku: string;
  name: string;
  category?: string;
  quantityOnHand: number;
  reorderLevel: number;
  location?: string;
}

export interface FeeReminderRow {
  id: string;
  studentId: number;
  feePaymentId?: number;
  dueDate?: string;
  channel: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  lastError?: string;
}

export interface PayrollAccrualSummary {
  periodLabel: string;
  grossAccrued: number;
  deductionsAccrued: number;
  netAccrued: number;
  employeeCount: number;
  notes?: string[];
}

export interface AttendanceCoverRow {
  id: number;
  coverDate: string;
  periodNumber?: number;
  classId: number;
  sectionId?: number;
  regularTeacherId?: number;
  coveringTeacherId: number;
  reason?: string;
  status: string;
}

export interface AttendanceCoverAuditRow {
  id: string;
  at: string;
  action: 'CREATED' | 'REPLACED' | 'CANCELLED';
  actorUserId?: number | null;
  actorName?: string;
  coverDate: string;
  classId: number;
  sectionId?: number | null;
  periodNumber?: number | null;
  coveringTeacherId?: number | null;
  replacedCoverAssignmentId?: number | null;
  cancelledCoverAssignmentId?: number | null;
  reason?: string;
  before?: {
    coverAssignmentId?: number | null;
    coveringTeacherId?: number | null;
    reason?: string | null;
  };
  after?: {
    coverAssignmentId?: number | null;
    coveringTeacherId?: number | null;
    reason?: string | null;
  };
}

/** Audit row when a teacher marks attendance outside their homeroom (proxy / substitute). */
export interface AttendanceProxyAuditRow {
  id?: string;
  at: string;
  actorUserId: number;
  actorName?: string;
  classId: number;
  sectionId: number;
  sessionDate: string;
  studentCount: number;
  context: 'PROXY_MARK' | 'SUBSTITUTE_COVER';
}

/** Mirrors {@code AttendanceCoverDTOs.ConflictPayload} from the API for 409 scheduling conflicts. */
export interface AttendanceCoverConflictPayload {
  existingCoverAssignmentId: number;
  existingCoveringTeacherId: number;
  existingCoveringTeacherName?: string;
  coverDate?: string;
  classId?: number;
  sectionId?: number | null;
  periodNumber?: number | null;
}

export interface CreateAttendanceCoverRequest {
  coverDate: string;
  classId: number;
  sectionId?: number;
  regularTeacherId?: number;
  coveringTeacherId: number;
  reason?: string;
  periodNumber?: number;
  /** Must match the conflicting row id returned in {@link AttendanceCoverConflictPayload}. */
  replaceCoverAssignmentId?: number;
}

export type OperationsTab =
  | 'staff'
  | 'visitors'
  | 'gate'
  | 'inventory'
  | 'covers'
  | 'reminders'
  | 'payroll';
