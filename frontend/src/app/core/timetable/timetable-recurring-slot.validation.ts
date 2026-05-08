import type { TimetableEntry } from '../models/models';

/** Title-case weekday match (API sends Monday / MONDAY). */
export function normalizeTimetableDayKey(day: string): string {
  const t = (day ?? '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '';
}

export function timetableSectionKey(sectionId: number | null | undefined): number {
  if (sectionId == null) return 0;
  const n = Number(sectionId);
  return Number.isFinite(n) ? n : 0;
}

export function sameTimetableClassSection(a: TimetableEntry, b: TimetableEntry): boolean {
  return Number(a.classId) === Number(b.classId) && timetableSectionKey(a.sectionId) === timetableSectionKey(b.sectionId);
}

/**
 * Parses "HH:mm" (24h) to minutes since midnight; returns null when unusable for overlap checks.
 */
export function timetableClockToMinutes(hhmm: string | null | undefined): number | null {
  const raw = (hhmm ?? '').trim();
  if (!raw || !/^\d{1,2}:\d{2}$/.test(raw)) {
    return null;
  }
  const [hs, ms] = raw.split(':');
  const h = Number(hs);
  const m = Number(ms);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
}

/** Same rule as backend {@link TimetableSlotConflictResolver}: intervals overlap iff startA < endB && startB < endA. */
export function timetableMinuteRangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function isSyntheticCoverRow(e: TimetableEntry): boolean {
  return e.scheduleSource === 'COVER';
}

export type TimetableLocalViolationKind =
  | 'CLASS_PERIOD'
  | 'TEACHER_PERIOD'
  | 'ROOM_PERIOD'
  | 'CLASS_TIME'
  | 'TEACHER_TIME'
  | 'ROOM_TIME';

export interface TimetableLocalViolation {
  kind: TimetableLocalViolationKind;
  blocking: TimetableEntry;
}

export interface TimetableLocalCheckContext {
  /** Entries for same class (+ section scope): period + intra-class timing. */
  classScopedRows: TimetableEntry[];
  /** All recurring rows for the teacher being assigned. */
  teacherScopedRows: TimetableEntry[];
  /** Broad pool (typically whole-school list) used for room period/time scans. */
  globalRows?: TimetableEntry[];
  /** Rows treated as inactive for this comparison (incoming edit row; row being replaced in a retry). */
  ignoreEntryIds?: ReadonlySet<number>;
}

/** Client-side timetable checks aligned with backend conflict policy (covers excluded). */
export function detectTimetableLocalViolations(
  candidate: TimetableEntry,
  ctx: TimetableLocalCheckContext
): TimetableLocalViolation | null {
  const ignoreEntryIds = new Set<number>(ctx.ignoreEntryIds ?? []);
  const selfId = Number(candidate.id);
  if (Number.isFinite(selfId) && selfId > 0) {
    ignoreEntryIds.add(selfId);
  }

  const dayKey = normalizeTimetableDayKey(candidate.day);
  const teacherId = Number(candidate.teacherId);
  const roomKey = (candidate.room ?? '').trim().toLowerCase();
  const candStart = timetableClockToMinutes(candidate.startTime);
  const candEnd = timetableClockToMinutes(candidate.endTime);
  const global = ctx.globalRows ?? [];
  const period = Number(candidate.period);

  const activeRow = (e: TimetableEntry): boolean =>
    !isSyntheticCoverRow(e) && !ignoreEntryIds.has(e.id);

  // --- Period conflicts (ordering mirrors backend precedence) ---
  for (const e of ctx.classScopedRows) {
    if (!activeRow(e)) continue;
    if (normalizeTimetableDayKey(e.day) !== dayKey) continue;
    if (!sameTimetableClassSection(e, candidate)) continue;
    if (Number(e.period) === period) {
      return { kind: 'CLASS_PERIOD', blocking: e };
    }
  }

  if (teacherId > 0) {
    for (const e of ctx.teacherScopedRows) {
      if (!activeRow(e)) continue;
      if (normalizeTimetableDayKey(e.day) !== dayKey) continue;
      if (Number(e.teacherId) !== teacherId) continue;
      if (Number(e.period) === period) {
        return { kind: 'TEACHER_PERIOD', blocking: e };
      }
    }
  }

  if (roomKey) {
    for (const e of global) {
      if (!activeRow(e)) continue;
      if (normalizeTimetableDayKey(e.day) !== dayKey) continue;
      if ((e.room ?? '').trim().toLowerCase() !== roomKey) continue;
      if (Number(e.period) === period) {
        return { kind: 'ROOM_PERIOD', blocking: e };
      }
    }
  }

  // --- Time-window overlaps ---
  if (candStart == null || candEnd == null || candStart >= candEnd) {
    return null;
  }

  for (const e of ctx.classScopedRows) {
    if (!activeRow(e)) continue;
    if (normalizeTimetableDayKey(e.day) !== dayKey) continue;
    if (!sameTimetableClassSection(e, candidate)) continue;
    const es = timetableClockToMinutes(e.startTime);
    const ee = timetableClockToMinutes(e.endTime);
    if (es == null || ee == null || es >= ee) continue;
    if (timetableMinuteRangesOverlap(candStart, candEnd, es, ee)) {
      return { kind: 'CLASS_TIME', blocking: e };
    }
  }

  if (teacherId > 0) {
    for (const e of ctx.teacherScopedRows) {
      if (!activeRow(e)) continue;
      if (normalizeTimetableDayKey(e.day) !== dayKey) continue;
      if (Number(e.teacherId) !== teacherId) continue;
      const es = timetableClockToMinutes(e.startTime);
      const ee = timetableClockToMinutes(e.endTime);
      if (es == null || ee == null || es >= ee) continue;
      if (timetableMinuteRangesOverlap(candStart, candEnd, es, ee)) {
        return { kind: 'TEACHER_TIME', blocking: e };
      }
    }
  }

  if (roomKey) {
    for (const e of global) {
      if (!activeRow(e)) continue;
      if (normalizeTimetableDayKey(e.day) !== dayKey) continue;
      if ((e.room ?? '').trim().toLowerCase() !== roomKey) continue;
      const es = timetableClockToMinutes(e.startTime);
      const ee = timetableClockToMinutes(e.endTime);
      if (es == null || ee == null || es >= ee) continue;
      if (timetableMinuteRangesOverlap(candStart, candEnd, es, ee)) {
        return { kind: 'ROOM_TIME', blocking: e };
      }
    }
  }

  return null;
}
