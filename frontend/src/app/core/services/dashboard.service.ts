import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { AdminDashboardData, MarkRecord, ParentDashboardData, TeacherDashboardData } from '../models/models';
import { buildMockParentDashboardData, MOCK_ADMIN_DASHBOARD, MOCK_TEACHER_DASHBOARD } from '../mocks/dashboard.mock-data';
import { ApiService } from './api.service';
import { ParentService } from './parent.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: ApiService, private parentService: ParentService) {}

  getAdminDashboard(): Observable<AdminDashboardData> {
    if (runtimeConfig.useMocks) {
      return of({ ...MOCK_ADMIN_DASHBOARD }).pipe();
    }
    return this.api.get<AdminDashboardData>('/reports/dashboard/admin');
  }

  getTeacherDashboard(): Observable<TeacherDashboardData> {
    if (runtimeConfig.useMocks) {
      return of({
        ...MOCK_TEACHER_DASHBOARD,
        classTeacherOf: (MOCK_TEACHER_DASHBOARD.classTeacherOf ?? []).map(r => ({ ...r })),
        messageQueue: (MOCK_TEACHER_DASHBOARD.messageQueue ?? []).map(m => ({ ...m })),
        quickActions: (MOCK_TEACHER_DASHBOARD.quickActions ?? []).map(a => ({ ...a })),
        todaySchedule: (MOCK_TEACHER_DASHBOARD.todaySchedule ?? []).map(s => ({ ...s })),
        pendingTasks: (MOCK_TEACHER_DASHBOARD.pendingTasks ?? []).map(t => ({ ...t })),
      }).pipe(delay(200));
    }
    return this.api.get<any>('/reports/dashboard/teacher').pipe(
      map(dashboard => ({
        ...dashboard,
        classTeacherOf: (dashboard.classTeacherOf ?? []).map((row: any) => ({
          ...row,
          classId: row.classId != null ? String(row.classId) : ''
        })),
        messageQueue: (dashboard.messageQueue ?? []).map((m: any) => ({
          ...m,
          conversationId: String(m.conversationId ?? '')
        })),
        quickActions: dashboard.quickActions ?? [],
        todaySchedule: (dashboard.todaySchedule ?? []).map((item: any) => ({
          ...item,
          classId: item.classId != null ? String(item.classId) : '',
          sectionId: item.sectionId != null ? String(item.sectionId) : ''
        }))
      }))
    );
  }

  getParentDashboard(from: string, to: string): Observable<ParentDashboardData> {
    if (runtimeConfig.useMocks) {
      return of(buildMockParentDashboardData(from, to)).pipe(delay(200));
    }
    return this.parentService.getChildren().pipe(
      switchMap(children => {
        const selectedChild = children[0];
        if (!selectedChild) {
        return of({
            childCount: 0,
            children: [],
            attendancePercentage: 0,
            overallGrade: '-',
            feeDue: 0,
            childPerformance: [],
            feeStatus: [],
            alerts: [],
            upcoming: [],
            attendanceSnapshot: { totalDays: 0, present: 0, absent: 0, late: 0, excused: 0 }
          });
        }
        return forkJoin({
          marks: this.parentService.getChildMarks(selectedChild.id),
          fees: this.parentService.getChildFees(selectedChild.id),
          attendance: this.parentService.getChildAttendance(selectedChild.id, from, to)
        }).pipe(
          map(({ marks, fees, attendance }) => {
            const feeDue = fees.reduce((sum, fee) => sum + (fee.dueAmount ?? 0), 0);
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
            return {
              childCount: children.length,
              children,
              selectedChild,
              selectedChildId: selectedChild.id,
              attendancePercentage: attendance.attendancePercentage,
              overallGrade: this.getOverallGrade(marks),
              feeDue,
              childPerformance: marks,
              feeStatus: fees,
              alerts,
              upcoming: [] as ParentDashboardData['upcoming'],
              attendanceSnapshot: {
                totalDays: attendance.totalDays,
                present: attendance.present,
                absent: attendance.absent,
                late: attendance.late,
                excused: attendance.excused ?? 0
              }
            };
          })
        );
      })
    );
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
