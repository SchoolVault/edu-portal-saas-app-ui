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
  MOCK_REPORT_ATTENDANCE_SUMMARY,
  MOCK_REPORT_CARD_EMMA,
  MOCK_REPORT_CLASS_SUMMARY,
  MOCK_REPORT_FEE_COLLECTION_SUMMARY,
  MOCK_REPORT_SECTION_SUMMARY,
  MOCK_REPORT_STUDENT_PERFORMANCE,
  MOCK_REPORT_TEACHER_WORKLOAD,
} from '../mocks/report.mock-data';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private api: ApiService) {}

  getStudentPerformance(classId: number, examId: number): Observable<StudentPerformanceRow[]> {
    if (runtimeConfig.useMocks) {
      return of(MOCK_REPORT_STUDENT_PERFORMANCE.map(r => ({ ...r, subjects: { ...r.subjects } }))).pipe();
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
      return of(MOCK_REPORT_ATTENDANCE_SUMMARY.map(r => ({ ...r }))).pipe();
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
      return of(MOCK_REPORT_CLASS_SUMMARY.map(r => ({ ...r }))).pipe();
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

  getSectionSummary(): Observable<SectionSummaryRow[]> {
    if (runtimeConfig.useMocks) {
      return of(MOCK_REPORT_SECTION_SUMMARY.map(r => ({ ...r }))).pipe();
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

  getTeacherWorkload(): Observable<TeacherWorkloadRow[]> {
    if (runtimeConfig.useMocks) {
      return of(MOCK_REPORT_TEACHER_WORKLOAD.map(r => ({ ...r, subjects: [...r.subjects] }))).pipe();
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

  getFeeCollectionSummary(classId?: number): Observable<{
    totalCollected: number;
    totalPending: number;
    overdueCount: number;
    totalStudents: number;
    collectionRate: number;
  }> {
    if (runtimeConfig.useMocks) {
      return of({ ...MOCK_REPORT_FEE_COLLECTION_SUMMARY });
    }
    return this.api.get(`/reports/fee-collection${classId != null ? `?classId=${classId}` : ''}`);
  }

  getReportCard(studentId: number, examId?: number): Observable<ReportCard> {
    if (runtimeConfig.useMocks) {
      const c = MOCK_REPORT_CARD_EMMA;
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
