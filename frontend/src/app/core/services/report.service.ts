import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AttendanceSummaryRow,
  ClassSummaryRow,
  ReportCard,
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

  getStudentPerformance(classId: number, examId: number): Observable<StudentPerformanceRow[]> {
    if (runtimeConfig.useMocks) {
      return of(
        buildMockStudentPerformance(classId, examId).map(r => ({
          ...r,
          subjects: { ...r.subjects },
        }))
      ).pipe();
    }
    return this.api.get<any[]>(`/reports/student-performance?classId=${classId}&examId=${examId}`).pipe(
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

  getAttendanceSummary(classId: number, month: string): Observable<AttendanceSummaryRow[]> {
    if (runtimeConfig.useMocks) {
      return of(buildMockReportAttendanceSummary(classId, month).map(r => ({ ...r }))).pipe();
    }
    return this.api.get<any[]>(`/reports/attendance-summary?classId=${classId}&month=${month}`).pipe(
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
          classTeacherName: row.classTeacherName ?? ''
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
            classTeacherName: row.classTeacherName ?? '',
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
          studentCount: Number(row.studentCount ?? 0)
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
            status: row.status ?? '',
          })),
        }))
      );
    }
    return this.getTeacherWorkload().pipe(map(all => sliceToPage(all, page, size)));
  }

  getFeeCollectionSummary(classId?: number): Observable<{
    totalCollected: number;
    totalPending: number;
    overdueCount: number;
    totalStudents: number;
    collectionRate: number;
  }> {
    if (runtimeConfig.useMocks) {
      return of({ ...buildMockFeeCollectionSummary() });
    }
    return this.api.get(`/reports/fee-collection${classId != null ? `?classId=${classId}` : ''}`);
  }

  getReportCard(studentId: number, examId?: number): Observable<ReportCard> {
    if (runtimeConfig.useMocks) {
      const c = buildMockReportCard(studentId, examId ?? 2);
      return of({
        ...c,
        subjects: c.subjects.map(s => ({ ...s })),
      }).pipe();
    }
    return this.api.get<any>(`/exams/report-card/${studentId}${examId != null ? `?examId=${examId}` : ''}`).pipe(
      map(card => ({
        studentId: Number(card.studentId),
        studentName: card.studentName,
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
}
