import { TranslateService } from '@ngx-translate/core';
import { LeaveDayUnit, LeaveRequestRow } from '../services/leave.service';

/**
 * Stable codes aligned with {@code com.school.erp.common.enums.Enums.LeaveTypeCode}
 * and JSON from {@code /api/v1/leave/**}. UI maps to {@code leave.type.<CODE>}.
 */
/** Keep in sync with {@code com.school.erp.common.enums.Enums.LeaveTypeCode}. */
export const LEAVE_TYPE_CODES = ['ANNUAL', 'SICK', 'CASUAL', 'EMERGENCY', 'OTHER'] as const;

/** Same as {@code LeaveService.MIN_REASON_LENGTH_FOR_OTHER} in backend. */
export const LEAVE_OTHER_REASON_MIN_LEN = 10;
export type LeaveTypeCode = (typeof LEAVE_TYPE_CODES)[number];

/** Normalize API / legacy mock values to canonical uppercase type codes when possible. */
export function normalizeLeaveTypeCode(raw: string | null | undefined): string {
  if (raw == null || !String(raw).trim()) {
    return '';
  }
  const t = String(raw).trim();
  const underscored = t.toUpperCase().replace(/\s+/g, '_');
  if ((LEAVE_TYPE_CODES as readonly string[]).includes(underscored)) {
    return underscored;
  }
  const lc = t.toLowerCase();
  if (lc === 'annual') return 'ANNUAL';
  if (lc === 'sick') return 'SICK';
  if (lc === 'casual') return 'CASUAL';
  if (lc === 'emergency') return 'EMERGENCY';
  if (lc === 'other') return 'OTHER';
  return underscored;
}

export function leaveStatusI18nKey(code: string | null | undefined): string {
  return `leave.status.${(code ?? '').toUpperCase()}`;
}

/** i18n key for a canonical type code, or empty when {@code code} is blank. */
export function leaveTypeI18nKey(code: string | null | undefined): string {
  const c = normalizeLeaveTypeCode(code);
  return c ? `leave.type.${c}` : '';
}

/** Resolve a translation for a stable code; fall back to {@code raw} if the key is missing. */
export function translateLeaveLookup(tr: TranslateService, fullKey: string, rawFallback: string): string {
  const t = tr.instant(fullKey);
  return t !== fullKey ? t : rawFallback;
}

/** Normalizes rows from ApiService so mocks, legacy strings, and Spring enums behave consistently. */
export function normalizeLeaveRequestRow(row: LeaveRequestRow): LeaveRequestRow {
  const lt = normalizeLeaveTypeCode(row.leaveType);
  const dayRaw = (row.dayUnit ?? 'FULL_DAY').toString().toUpperCase();
  const day: LeaveDayUnit =
    dayRaw === 'FIRST_HALF' || dayRaw === 'SECOND_HALF' ? (dayRaw as LeaveDayUnit) : 'FULL_DAY';
  return {
    ...row,
    leaveType: lt || row.leaveType,
    status: (row.status ?? '').toUpperCase(),
    dayUnit: day,
  };
}
