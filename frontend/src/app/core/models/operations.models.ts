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
  studentId: string;
  feePaymentId?: string;
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
  id: string;
  coverDate: string;
  periodNumber?: number;
  classId: string;
  sectionId?: string;
  regularTeacherId?: string;
  coveringTeacherId: string;
  reason?: string;
  status: string;
}

export type OperationsTab =
  | 'covers'
  | 'staff'
  | 'visitors'
  | 'gate'
  | 'inventory'
  | 'reminders'
  | 'payroll';
