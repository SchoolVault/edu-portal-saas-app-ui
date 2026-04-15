import type {
  FeePayment,
  MarkRecord,
  ParentAttendanceMetricContext,
  ParentFeeMetricContext,
  ParentFeeUrgencyLevel,
  ParentMetricBand,
  ParentResultMetricContext,
  SchoolClass,
  Student,
} from '../models/models';

/** School policy: attendance at or above this % is considered on track (configurable later via settings API). */
export const PARENT_ATTENDANCE_ON_TRACK_PCT = 85;

function bandForAttendance(pct: number): ParentMetricBand {
  if (pct >= 95) return 'excellent';
  if (pct >= PARENT_ATTENDANCE_ON_TRACK_PCT) return 'good';
  if (pct >= 70) return 'fair';
  if (pct >= 50) return 'needs_attention';
  return 'critical';
}

export function buildAttendanceMetricContext(pct: number): ParentAttendanceMetricContext {
  const band = bandForAttendance(pct);
  return {
    band,
    schoolThresholdPct: PARENT_ATTENDANCE_ON_TRACK_PCT,
    labelKey: `dashboard.parent.metric.attendance.band.${band}`,
  };
}

function bandForGradeLetter(grade: string): ParentMetricBand {
  const g = (grade || '').trim().toUpperCase();
  if (g.startsWith('A')) return 'excellent';
  if (g.startsWith('B')) return 'good';
  if (g.startsWith('C')) return 'fair';
  if (g.startsWith('D')) return 'needs_attention';
  return 'critical';
}

export function buildResultMetricContext(overallGrade: string, marks: MarkRecord[]): ParentResultMetricContext {
  const band = overallGrade === '-' ? 'fair' : bandForGradeLetter(overallGrade);
  let averagePercent: number | undefined;
  if (marks.length) {
    const total =
      marks.reduce((sum, m) => sum + (m.marksObtained / Math.max(m.maxMarks, 1)) * 100, 0) / marks.length;
    averagePercent = Math.round(total * 10) / 10;
  }
  return {
    band,
    labelKey: `dashboard.parent.metric.result.band.${band}`,
    averagePercent,
  };
}

function parseIsoDate(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const d = new Date(iso + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Rough “high balance” threshold (INR); replace with tenant policy later. */
const HIGH_FEE_ABS_INR = 15000;

export function buildFeeMetricContext(feeDue: number, fees: FeePayment[]): ParentFeeMetricContext {
  if (!feeDue || feeDue <= 0) {
    return { urgency: 'none', labelKey: 'dashboard.parent.metric.fee.urgency.none' };
  }
  const open = fees.filter(f => f.dueAmount > 0 && (f.status === 'unpaid' || f.status === 'partial' || f.status === 'overdue'));
  let best: FeePayment | undefined;
  let bestT = Number.POSITIVE_INFINITY;
  for (const f of open) {
    const t = parseIsoDate(f.dueDate);
    if (t) {
      const x = t.getTime();
      if (x < bestT) {
        bestT = x;
        best = f;
      }
    }
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let daysUntil: number | null = null;
  if (best) {
    const due = parseIsoDate(best.dueDate);
    if (due) {
      due.setHours(0, 0, 0, 0);
      daysUntil = Math.round((due.getTime() - today.getTime()) / 86400000);
    }
  }
  let urgency: ParentFeeUrgencyLevel = 'low';
  if (daysUntil != null && daysUntil < 0) urgency = 'high';
  else if (daysUntil != null && daysUntil <= 7) urgency = feeDue >= HIGH_FEE_ABS_INR ? 'high' : 'medium';
  else if (feeDue >= HIGH_FEE_ABS_INR) urgency = 'medium';

  return {
    urgency,
    labelKey: `dashboard.parent.metric.fee.urgency.${urgency}`,
    nextDueDate: best?.dueDate,
    daysUntilDue: daysUntil,
  };
}

export function mergeClassesForAttendanceCatalog(catalog: SchoolClass[], students: Student[]): SchoolClass[] {
  const byId = new Map(catalog.map(c => [c.id, { ...c, sections: c.sections.map(s => ({ ...s })) }]));
  for (const s of students) {
    if (s.status && s.status !== 'active') continue;
    const cid = s.classId;
    if (cid == null || cid < 0) continue;
    if (!byId.has(cid)) {
      byId.set(cid, {
        id: cid,
        name: (s.className && s.className.trim()) || `Class ${cid}`,
        grade: 0,
        sections: [],
        academicYearId: 0,
        tenantId: s.tenantId ?? '',
      });
    }
    const row = byId.get(cid)!;
    if (s.sectionId != null && s.sectionId > 0) {
      if (!row.sections.some(sec => sec.id === s.sectionId)) {
        row.sections = [
          ...row.sections,
          {
            id: s.sectionId,
            name: (s.sectionName && s.sectionName.trim()) || 'Section',
            classId: cid,
            capacity: 40,
            studentCount: 0,
          },
        ];
      }
    }
  }
  return [...byId.values()].sort((a, b) => {
    if (a.grade !== b.grade) return (a.grade ?? 0) - (b.grade ?? 0);
    return a.name.localeCompare(b.name);
  });
}
