import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AttendanceSummaryRow,
  ClassSummaryRow,
  ReportGenerationJob,
  ReportCard,
  ReportPublicationSnapshot,
  ReportAnalyticsPack,
  ReportAnalyticsPackConfig,
  ReportShareDispatch,
  ReportWorkflowEventLog,
  ReportTemplateDefinition,
  SectionSummaryRow,
  StudentPerformanceRow,
  TeacherWorkloadRow
} from '../models/models';
import {
  buildMockClassSummary,
  buildMockFeeCollectionSummary,
  buildMockReportAttendanceSummary,
  buildMockReportCard,
  buildMockSectionSummary,
  buildMockStudentPerformance,
  buildMockTeacherWorkload,
} from '../mocks/report.mock-data';
import { ApiService, PageResp } from './api.service';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private api: ApiService) {}

  getStudentPerformance(classId: number, examId: number, sectionId?: number | null): Observable<StudentPerformanceRow[]> {
    if (runtimeConfig.useMocks) {
      return of(
        buildMockStudentPerformance(classId, examId).map(r => ({
          ...r,
          subjects: { ...r.subjects },
        }))
      ).pipe();
    }
    const query = new URLSearchParams();
    query.set('classId', String(classId));
    query.set('examId', String(examId));
    if (sectionId != null) {
      query.set('sectionId', String(sectionId));
    }
    return this.api.get<any[]>(`/reports/student-performance?${query.toString()}`).pipe(
      map(rows =>
        rows.map(row => ({
          studentId: Number(row.studentId),
          studentName: row.studentName,
          subjects: row.subjects ?? {},
          totalMarks: Number(row.totalMarks ?? 0),
          totalMax: Number(row.totalMax ?? 0),
          percentage: Number(row.percentage ?? 0),
          grade: row.grade ?? '',
          rank: Number(row.rank ?? 0)
        }))
      )
    );
  }

  getAttendanceSummary(classId: number, month: string, sectionId?: number | null): Observable<AttendanceSummaryRow[]> {
    if (runtimeConfig.useMocks) {
      return of(buildMockReportAttendanceSummary(classId, month).map(r => ({ ...r }))).pipe();
    }
    const query = new URLSearchParams();
    query.set('classId', String(classId));
    query.set('month', month);
    if (sectionId != null) {
      query.set('sectionId', String(sectionId));
    }
    return this.api.get<any[]>(`/reports/attendance-summary?${query.toString()}`).pipe(
      map(rows =>
        rows.map(row => ({
          studentId: Number(row.studentId),
          studentName: row.studentName,
          present: Number(row.present ?? 0),
          absent: Number(row.absent ?? 0),
          late: Number(row.late ?? 0),
          excused: Number(row.excused ?? 0),
          totalDays: Number(row.totalDays ?? 0),
          attendancePercentage: Number(row.attendancePercentage ?? 0)
        }))
      )
    );
  }

  getClassSummary(): Observable<ClassSummaryRow[]> {
    if (runtimeConfig.useMocks) {
      return of(buildMockClassSummary().map(r => ({ ...r }))).pipe();
    }
    return this.api.get<any[]>('/reports/class-summary').pipe(
      map(rows =>
        rows.map(row => ({
          classId: Number(row.classId),
          className: row.className,
          grade: Number(row.grade ?? 0),
          sections: Number(row.sections ?? 0),
          totalStudents: Number(row.totalStudents ?? 0),
          attendancePercentage: Number(row.attendancePercentage ?? 0),
          performancePercentage: Number(row.performancePercentage ?? 0),
          feeCollectionPercentage: Number(row.feeCollectionPercentage ?? 0),
          overdueAccounts: Number(row.overdueAccounts ?? 0)
        }))
      )
    );
  }

  getClassSummaryPage(page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<ClassSummaryRow>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<any>('/reports/class-summary/paged', { page, size }).pipe(
        map(p => ({
          ...p,
          content: p.content.map(row => ({
            classId: Number(row.classId),
            className: row.className,
            grade: Number(row.grade ?? 0),
            sections: Number(row.sections ?? 0),
            totalStudents: Number(row.totalStudents ?? 0),
            attendancePercentage: Number(row.attendancePercentage ?? 0),
            performancePercentage: Number(row.performancePercentage ?? 0),
            feeCollectionPercentage: Number(row.feeCollectionPercentage ?? 0),
            overdueAccounts: Number(row.overdueAccounts ?? 0),
          })),
        }))
      );
    }
    return this.getClassSummary().pipe(map(all => sliceToPage(all, page, size)));
  }

  getSectionSummary(): Observable<SectionSummaryRow[]> {
    if (runtimeConfig.useMocks) {
      return of(buildMockSectionSummary().map(r => ({ ...r }))).pipe();
    }
    return this.api.get<any[]>('/reports/section-summary').pipe(
      map(rows =>
        rows.map(row => ({
          sectionId: Number(row.sectionId),
          sectionName: row.sectionName ?? '',
          classId: Number(row.classId),
          className: row.className ?? '',
          studentCount: Number(row.studentCount ?? 0),
          classTeacherName: row.classTeacherName ?? '-'
        }))
      )
    );
  }

  getSectionSummaryPage(page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<SectionSummaryRow>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<any>('/reports/section-summary/paged', { page, size }).pipe(
        map(p => ({
          ...p,
          content: p.content.map(row => ({
            sectionId: Number(row.sectionId),
            sectionName: row.sectionName ?? '',
            classId: Number(row.classId),
            className: row.className ?? '',
            studentCount: Number(row.studentCount ?? 0),
            classTeacherName: row.classTeacherName ?? '-',
          })),
        }))
      );
    }
    return this.getSectionSummary().pipe(map(all => sliceToPage(all, page, size)));
  }

  getTeacherWorkload(): Observable<TeacherWorkloadRow[]> {
    if (runtimeConfig.useMocks) {
      return of(buildMockTeacherWorkload().map(r => ({ ...r, subjects: [...r.subjects] }))).pipe();
    }
    return this.api.get<any[]>('/reports/teacher-workload').pipe(
      map(rows =>
        rows.map(row => ({
          teacherId: Number(row.teacherId),
          teacherName: row.teacherName,
          specialization: row.specialization ?? '',
          subjects: row.subjects ?? [],
          homeroomClasses: row.homeroomClasses ?? '-',
          assignedClasses: Number(row.assignedClasses ?? 0),
          weeklyPeriods: Number(row.weeklyPeriods ?? 0),
          status: row.status ?? ''
        }))
      )
    );
  }

  getTeacherWorkloadPage(page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<TeacherWorkloadRow>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<any>('/reports/teacher-workload/paged', { page, size }).pipe(
        map(p => ({
          ...p,
          content: p.content.map(row => ({
            teacherId: Number(row.teacherId),
            teacherName: row.teacherName,
            specialization: row.specialization ?? '',
            subjects: row.subjects ?? [],
            homeroomClasses: row.homeroomClasses ?? '-',
            assignedClasses: Number(row.assignedClasses ?? 0),
            weeklyPeriods: Number(row.weeklyPeriods ?? 0),
            status: row.status ?? '',
          })),
        }))
      );
    }
    return this.getTeacherWorkload().pipe(map(all => sliceToPage(all, page, size)));
  }

  getFeeCollectionSummary(classId?: number, sectionId?: number | null): Observable<{
    totalCollected: number;
    totalPending: number;
    overdueCount: number;
    totalStudents: number;
    collectionRate: number;
  }> {
    if (runtimeConfig.useMocks) {
      return of({ ...buildMockFeeCollectionSummary() });
    }
    const query = new URLSearchParams();
    if (classId != null) query.set('classId', String(classId));
    if (sectionId != null) query.set('sectionId', String(sectionId));
    const qs = query.toString();
    return this.api.get(`/reports/fee-collection${qs ? `?${qs}` : ''}`);
  }

  getReportCard(studentId: number, examId?: number, locale = 'en'): Observable<ReportCard> {
    if (runtimeConfig.useMocks) {
      const c = buildMockReportCard(studentId, examId ?? 2);
      return of({
        ...c,
        subjects: c.subjects.map(s => ({ ...s })),
      }).pipe();
    }
    const qp = new URLSearchParams();
    if (examId != null) qp.set('examId', String(examId));
    qp.set('locale', locale);
    return this.api.get<any>(`/exams/report-card/${studentId}?${qp.toString()}`).pipe(
      map(card => ({
        studentId: Number(card.studentId),
        studentName: card.studentName,
        localeCode: card.localeCode ?? locale,
        boardCode: card.boardCode,
        termCode: card.termCode,
        sections: card.sections ?? [],
        subjects: (card.subjects ?? []).map((mark: any) => ({
          ...mark,
          id: Number(mark.id),
          examId: Number(mark.examId),
          studentId: Number(mark.studentId),
          classId: mark.classId != null ? Number(mark.classId) : 0,
          tenantId: mark.tenantId ?? ''
        })),
        totalMarks: Number(card.totalMarks ?? 0),
        totalMaxMarks: Number(card.totalMaxMarks ?? 0),
        overallPercentage: Number(card.overallPercentage ?? 0),
        overallGrade: card.overallGrade ?? ''
      }))
    );
  }

  listTemplates(): Observable<ReportTemplateDefinition[]> {
    if (runtimeConfig.useMocks) {
      return of([
        {
          id: 1,
          templateCode: 'CBSE_PERFORMANCE',
          name: 'CBSE Student Performance',
          reportType: 'STUDENT_PERFORMANCE',
          defaultFormat: 'PDF',
        },
      ]);
    }
    return this.api.get<ReportTemplateDefinition[]>('/reports/templates');
  }

  upsertTemplate(payload: ReportTemplateDefinition): Observable<ReportTemplateDefinition> {
    if (runtimeConfig.useMocks) {
      return of({ ...payload, id: payload.id ?? Date.now() });
    }
    return this.api.post<ReportTemplateDefinition>('/reports/templates', payload);
  }

  generateReport(payload: {
    templateId?: number | null;
    reportType: string;
    format: 'PDF' | 'CSV';
    requestId?: string;
    scheduleAt?: string;
    async?: boolean;
    shareConfig?: {
      channels?: string[];
      targetRoles?: string[];
      locales?: string[];
      templateCode?: string;
    };
    filters: Record<string, unknown>;
  }): Observable<ReportGenerationJob> {
    if (runtimeConfig.useMocks) {
      return of({
        id: Date.now(),
        requestId: payload.requestId || `mock-${Date.now()}`,
        reportType: payload.reportType,
        format: payload.format,
        status: 'COMPLETED',
        fileName: `report.${payload.format.toLowerCase()}`,
        contentType: payload.format === 'PDF' ? 'application/pdf' : 'text/csv',
        createdAt: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        workflowState: 'DRAFT',
      });
    }
    return this.api.post<ReportGenerationJob>('/reports/generate', payload);
  }

  listGeneratedReports(page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<ReportGenerationJob>> {
    if (runtimeConfig.useMocks) {
      return of(sliceToPage([], page, size));
    }
    return this.api.getPageParams<ReportGenerationJob>('/reports/jobs', { page, size });
  }

  downloadGeneratedReport(jobId: number): Observable<Blob> {
    return this.api.getBlob(`/reports/jobs/${jobId}/download`);
  }

  retryReportJob(jobId: number): Observable<ReportGenerationJob> {
    if (runtimeConfig.useMocks) {
      return of({
        id: jobId,
        requestId: `retry-${Date.now()}`,
        reportType: 'STUDENT_PERFORMANCE',
        format: 'PDF',
        status: 'QUEUED',
        createdAt: new Date().toISOString(),
        workflowState: 'DRAFT',
      });
    }
    return this.api.put<ReportGenerationJob>(`/reports/jobs/${jobId}/retry`, {});
  }

  listDispatches(jobId: number, page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<ReportShareDispatch>> {
    if (runtimeConfig.useMocks) {
      return of(sliceToPage([], page, size));
    }
    return this.api.getPageParams<ReportShareDispatch>(`/reports/jobs/${jobId}/dispatches`, { page, size });
  }

  listWorkflowEvents(jobId: number, page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<ReportWorkflowEventLog>> {
    if (runtimeConfig.useMocks) {
      return of(sliceToPage([], page, size));
    }
    return this.api.getPageParams<ReportWorkflowEventLog>(`/reports/jobs/${jobId}/events`, { page, size });
  }

  seedDefaultReportPacks(): Observable<number> {
    if (runtimeConfig.useMocks) {
      return of(3);
    }
    return this.api.post<number>('/reports/templates/seed-defaults', {});
  }

  approveReportJob(jobId: number, payload: { note?: string; idempotencyKey?: string; expectedUpdatedAt?: string }): Observable<ReportGenerationJob> {
    if (runtimeConfig.useMocks) {
      return of({ id: jobId, requestId: `approve-${jobId}`, reportType: 'STUDENT_PERFORMANCE', format: 'PDF', status: 'COMPLETED', workflowState: 'APPROVED', workflowNote: payload.note, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    return this.api.put<ReportGenerationJob>(`/reports/jobs/${jobId}/approve`, payload);
  }

  publishReportJob(jobId: number, payload: { note?: string; idempotencyKey?: string; expectedUpdatedAt?: string }): Observable<ReportGenerationJob> {
    if (runtimeConfig.useMocks) {
      return of({ id: jobId, requestId: `publish-${jobId}`, reportType: 'STUDENT_PERFORMANCE', format: 'PDF', status: 'COMPLETED', workflowState: 'PUBLISHED', workflowNote: payload.note, publishedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    return this.api.put<ReportGenerationJob>(`/reports/jobs/${jobId}/publish`, payload);
  }

  listPublicationSnapshots(jobId: number): Observable<ReportPublicationSnapshot[]> {
    if (runtimeConfig.useMocks) {
      return of([]);
    }
    return this.api.get<ReportPublicationSnapshot[]>(`/reports/jobs/${jobId}/snapshots`);
  }

  rollbackToSnapshot(jobId: number, versionNo: number, note?: string): Observable<ReportGenerationJob> {
    if (runtimeConfig.useMocks) {
      return of({ id: jobId, requestId: `rollback-${jobId}`, reportType: 'STUDENT_PERFORMANCE', format: 'PDF', status: 'COMPLETED', workflowState: 'PUBLISHED', workflowNote: note, createdAt: new Date().toISOString() });
    }
    return this.api.put<ReportGenerationJob>(`/reports/jobs/${jobId}/rollback`, { versionNo, note });
  }

  getAnalyticsPack(payload: { packCode?: string; classId?: number | null; sectionId?: number | null; examId?: number | null; month?: string }): Observable<ReportAnalyticsPack> {
    if (runtimeConfig.useMocks) {
      return of({ packCode: payload.packCode ?? 'CUSTOM', trendBands: [], laggingStudents: [], promotionEligibility: [], guardrails: {} });
    }
    const params = new URLSearchParams();
    if (payload.packCode) params.set('packCode', payload.packCode);
    if (payload.classId != null) params.set('classId', String(payload.classId));
    if (payload.sectionId != null) params.set('sectionId', String(payload.sectionId));
    if (payload.examId != null) params.set('examId', String(payload.examId));
    if (payload.month) params.set('month', payload.month);
    return this.api.get<ReportAnalyticsPack>(`/reports/analytics-pack?${params.toString()}`);
  }

  listAnalyticsPackConfigs(): Observable<ReportAnalyticsPackConfig[]> {
    if (runtimeConfig.useMocks) {
      return of([]);
    }
    return this.api.get<ReportAnalyticsPackConfig[]>('/reports/analytics-pack/configs');
  }

  upsertAnalyticsPackConfig(payload: ReportAnalyticsPackConfig): Observable<ReportAnalyticsPackConfig> {
    if (runtimeConfig.useMocks) {
      return of({ ...payload, id: payload.id ?? Date.now() });
    }
    return this.api.post<ReportAnalyticsPackConfig>('/reports/analytics-pack/configs', payload);
  }
}
