import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, delay, map, switchMap } from 'rxjs/operators';
import { AdminDashboardData, MarkRecord, ParentDashboardData, TeacherDashboardData } from '../models/models';
import {
  buildMockParentActivities,
  buildMockParentDashboardData,
  buildMockTeacherHomeroom,
  MOCK_ADMIN_DASHBOARD,
  MOCK_TEACHER_DASHBOARD,
} from '../mocks/dashboard.mock-data';
import { ApiService } from './api.service';
import { ParentService } from './parent.service';
import { runtimeConfig } from '../config/runtime-config';
import {
  buildAttendanceMetricContext,
  buildFeeMetricContext,
  buildResultMetricContext,
} from '../utils/parent-dashboard-metrics';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: ApiService, private parentService: ParentService) {}

  getAdminDashboard(): Observable<AdminDashboardData> {
    if (runtimeConfig.useMocks) {
      return of({ ...MOCK_ADMIN_DASHBOARD }).pipe();
    }
    return this.api.get<AdminDashboardData>('/reports/dashboard/admin');
  }

  getTeacherDashboard(monthYm?: string | null): Observable<TeacherDashboardData> {
    const ym = (monthYm ?? new Date().toISOString().slice(0, 7)).slice(0, 7);
    if (runtimeConfig.useMocks) {
      return of({
        ...MOCK_TEACHER_DASHBOARD,
        classTeacherOf: (MOCK_TEACHER_DASHBOARD.classTeacherOf ?? []).map(r => ({ ...r })),
        messageQueue: (MOCK_TEACHER_DASHBOARD.messageQueue ?? []).map(m => ({ ...m })),
        quickActions: (MOCK_TEACHER_DASHBOARD.quickActions ?? []).map(a => ({ ...a })),
        todaySchedule: (MOCK_TEACHER_DASHBOARD.todaySchedule ?? []).map(s => ({ ...s })),
        pendingTasks: (MOCK_TEACHER_DASHBOARD.pendingTasks ?? []).map(t => ({ ...t })),
        recentActivities: (MOCK_TEACHER_DASHBOARD.recentActivities ?? []).map(a => ({ ...a })),
        attendanceTrend: (MOCK_TEACHER_DASHBOARD.attendanceTrend ?? []).map(p => ({ ...p })),
        homeroomAttendance: buildMockTeacherHomeroom(ym),
        homeroomTodayAttendanceComplete: MOCK_TEACHER_DASHBOARD.homeroomTodayAttendanceComplete ?? false,
      }).pipe(delay(200));
    }
    return this.api.getParams<any>('/reports/dashboard/teacher', { month: ym }).pipe(
      map(dashboard => {
        const pending =
          dashboard.pendingAttendanceSessions != null
            ? Number(dashboard.pendingAttendanceSessions)
            : dashboard.unreadNotifications != null
              ? Number(dashboard.unreadNotifications)
              : 0;
        const homeroom = dashboard.homeroomAttendance;
        return {
          ...dashboard,
          pendingAttendanceSessions: pending,
          homeroomTodayAttendanceComplete: Boolean(dashboard.homeroomTodayAttendanceComplete),
          classTeacherOf: (dashboard.classTeacherOf ?? []).map((row: any) => ({
            ...row,
            classId: row.classId != null ? Number(row.classId) : 0,
            sectionId: row.sectionId != null ? Number(row.sectionId) : undefined,
            totalStudents: row.totalStudents != null ? Number(row.totalStudents) : 0,
          })),
          messageQueue: (dashboard.messageQueue ?? []).map((m: any) => ({
            ...m,
            conversationId: String(m.conversationId ?? ''),
          })),
          quickActions: dashboard.quickActions ?? [],
          todaySchedule: (dashboard.todaySchedule ?? []).map((item: any) => ({
            ...item,
            classId: item.classId != null ? Number(item.classId) : 0,
            sectionId: item.sectionId != null ? Number(item.sectionId) : 0,
          })),
          recentActivities: (dashboard.recentActivities ?? []).map((a: any) => ({
            code: a.code,
            type: a.type ?? 'info',
            timestamp: String(a.timestamp ?? ''),
            params: a.params ?? {},
            linkRoute: String(a.linkRoute ?? '/app/dashboard'),
            linkQueryParams: a.linkQueryParams ?? undefined,
          })),
          pendingTasks: dashboard.pendingTasks ?? [],
          attendanceTrend: (dashboard.attendanceTrend ?? []).map((p: any) => ({
            month: String(p.month ?? ''),
            presentPercent: Number(p.presentPercent ?? 0),
          })),
          homeroomAttendance: homeroom
            ? {
                month: String(homeroom.month ?? ym),
                classLabel: homeroom.classLabel ?? undefined,
                daily: (homeroom.daily ?? []).map((d: any) => ({
                  date: String(d.date ?? ''),
                  presentPercent: Number(d.presentPercent ?? 0),
                  absentCount: d.absentCount != null ? Number(d.absentCount) : undefined,
                  lateCount: d.lateCount != null ? Number(d.lateCount) : undefined,
                })),
                breakdown: {
                  present: Number(homeroom.breakdown?.present ?? 0),
                  absent: Number(homeroom.breakdown?.absent ?? 0),
                  late: Number(homeroom.breakdown?.late ?? 0),
                  excused: Number(homeroom.breakdown?.excused ?? 0),
                },
              }
            : null,
        } as TeacherDashboardData;
      })
    );
  }

  /**
   * @param preferredChildId optional selected child (must be in linked children); defaults to first child server-side / in mocks.
   */
  getParentDashboard(from: string, to: string, preferredChildId?: number | null): Observable<ParentDashboardData> {
    if (runtimeConfig.useMocks) {
      return of(buildMockParentDashboardData(from, to, preferredChildId ?? undefined)).pipe(delay(200));
    }
    const q = new URLSearchParams({ from, to });
    if (preferredChildId != null) {
      q.set('childId', String(preferredChildId));
    }
    return this.api.get<any>(`/reports/dashboard/parent?${q.toString()}`).pipe(
      map(raw => this.normalizeParentDashboardApi(raw)),
      catchError(() =>
        this.parentService.getChildren().pipe(
          switchMap(children => {
            const selected =
              (preferredChildId != null ? children.find(c => c.id === preferredChildId) : null) ?? children[0];
            if (!selected) {
              return of(this.emptyParentDashboard());
            }
            return forkJoin({
              marks: this.parentService.getChildMarks(selected.id),
              fees: this.parentService.getChildFees(selected.id),
              attendance: this.parentService.getChildAttendance(selected.id, from, to),
            }).pipe(map(({ marks, fees, attendance }) => this.buildParentDashboardFallback(children, selected, marks, fees, attendance)));
          })
        )
      )
    );
  }

  private emptyParentDashboard(): ParentDashboardData {
    return {
      childCount: 0,
      children: [],
      attendancePercentage: 0,
      overallGrade: '-',
      feeDue: 0,
      childPerformance: [],
      feeStatus: [],
      alerts: [],
      upcoming: [],
      attendanceSnapshot: { totalDays: 0, present: 0, absent: 0, late: 0, excused: 0 },
      recentActivities: [],
    };
  }

  private normalizeParentDashboardApi(raw: any): ParentDashboardData {
    const attendancePct = Number(raw.attendancePercentage ?? 0);
    const marks = (raw.childPerformance ?? raw.marks ?? []) as MarkRecord[];
    const feeStatus = (raw.feeStatus ?? []) as ParentDashboardData['feeStatus'];
    const overallGrade = String(raw.overallGrade ?? '-');
    return {
      childCount: Number(raw.childCount ?? 0),
      children: raw.children ?? [],
      selectedChild: raw.selectedChild,
      selectedChildId: raw.selectedChildId != null ? Number(raw.selectedChildId) : undefined,
      attendancePercentage: attendancePct,
      overallGrade,
      feeDue: Number(raw.feeDue ?? 0),
      childPerformance: marks,
      feeStatus: feeStatus ?? [],
      attendanceMetric: raw.attendanceMetric?.band
        ? {
            band: raw.attendanceMetric.band,
            schoolThresholdPct: Number(raw.attendanceMetric.schoolThresholdPercent ?? 85),
            labelKey: `dashboard.parent.metric.attendance.band.${raw.attendanceMetric.band}`,
          }
        : buildAttendanceMetricContext(attendancePct),
      resultMetric: raw.resultMetric?.band
        ? {
            band: raw.resultMetric.band,
            averagePercent:
              raw.resultMetric.averagePercent != null ? Number(raw.resultMetric.averagePercent) : undefined,
            labelKey: `dashboard.parent.metric.result.band.${raw.resultMetric.band}`,
          }
        : buildResultMetricContext(overallGrade, marks),
      feeMetric: (() => {
        const computed = buildFeeMetricContext(Number(raw.feeDue ?? 0), feeStatus ?? []);
        const fm = raw.feeMetric;
        if (!fm?.urgency) {
          return computed;
        }
        // Server may send urgency without dates when ledger rows lack due_date; merge from fee rows (same rules as UI util).
        return {
          urgency: fm.urgency,
          labelKey: `dashboard.parent.metric.fee.urgency.${fm.urgency}`,
          nextDueDate: fm.nextDueDate ?? computed.nextDueDate,
          daysUntilDue:
            fm.daysUntilDue !== undefined && fm.daysUntilDue !== null ? Number(fm.daysUntilDue) : computed.daysUntilDue,
        };
      })(),
      recentActivities: (raw.recentActivities ?? []).map((a: any) => ({
        code: a.code,
        type: a.type ?? 'info',
        timestamp: String(a.timestamp ?? ''),
        params: a.params ?? {},
      })),
      alerts: raw.alerts ?? [],
      upcoming: raw.upcoming ?? [],
      attendanceSnapshot: raw.attendanceSnapshot ?? {
        totalDays: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      },
    };
  }

  private buildParentDashboardFallback(
    children: ParentDashboardData['children'],
    selectedChild: NonNullable<ParentDashboardData['selectedChild']>,
    marks: MarkRecord[],
    fees: ParentDashboardData['feeStatus'],
    attendance: import('../models/models').AttendanceStats
  ): ParentDashboardData {
    const feeDue = (fees ?? []).reduce((sum, fee) => sum + (fee.dueAmount ?? 0), 0);
    const alerts: ParentDashboardData['alerts'] = [];
    if (feeDue > 0) {
      alerts.push({
        type: 'warning',
        title: 'Fee balance outstanding',
        message: `There is an unpaid balance for ${selectedChild.firstName} ${selectedChild.lastName}. Open My children → Fees to pay or review receipts.`,
        ctaLabelKey: 'dashboard.parent.cta.openFees',
        ctaRoute: '/app/parent/children',
        ctaQueryParams: { tab: 'fees', child: String(selectedChild.id) },
      });
    }
    if ((attendance.totalDays ?? 0) > 0 && (attendance.attendancePercentage ?? 100) < 85) {
      alerts.push({
        type: 'info',
        title: 'Attendance this month',
        message: `Attendance is ${attendance.attendancePercentage?.toFixed(1) ?? '—'}% for the selected period. Check school announcements for notices from the class teacher.`,
        ctaLabelKey: 'dashboard.parent.cta.openAnnouncements',
        ctaRoute: '/app/inbox',
      });
    }
    if (marks.length) {
      alerts.push({
        type: 'success',
        title: 'Latest results on file',
        message: `${marks.length} subject record(s) available. Overall grade trend: ${this.getOverallGrade(marks)}. View details under Examinations.`,
        ctaLabelKey: 'dashboard.parent.cta.viewExams',
        ctaRoute: '/app/exams',
        ctaQueryParams: { tab: 'results', studentId: String(selectedChild.id) },
      });
    }
    const overallGrade = this.getOverallGrade(marks);
    const classLabel = `${selectedChild.className || ''}${selectedChild.sectionName ? ' · ' + selectedChild.sectionName : ''}`.trim();
    return {
      childCount: children?.length ?? 0,
      children,
      selectedChild,
      selectedChildId: selectedChild.id,
      attendancePercentage: attendance.attendancePercentage,
      overallGrade,
      feeDue,
      childPerformance: marks,
      feeStatus: fees ?? [],
      attendanceMetric: buildAttendanceMetricContext(attendance.attendancePercentage),
      resultMetric: buildResultMetricContext(overallGrade, marks),
      feeMetric: buildFeeMetricContext(feeDue, fees ?? []),
      recentActivities: buildMockParentActivities(selectedChild.firstName, classLabel || selectedChild.className),
      alerts,
      upcoming: [],
      attendanceSnapshot: {
        totalDays: attendance.totalDays,
        present: attendance.present,
        absent: attendance.absent,
        late: attendance.late,
        excused: attendance.excused ?? 0,
      },
    };
  }

  private getOverallGrade(marks: MarkRecord[]): string {
    if (!marks.length) {
      return '-';
    }
    const total = marks.reduce((sum, mark) => sum + ((mark.marksObtained / Math.max(mark.maxMarks, 1)) * 100), 0) / marks.length;
    if (total >= 90) return 'A+';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B+';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    return 'D';
  }
}
