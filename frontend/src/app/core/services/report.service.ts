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
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private api: ApiService) {}

  getStudentPerformance(classId: string, examId: string): Observable<StudentPerformanceRow[]> {
    if (runtimeConfig.useMocks) {
      return of([
        { studentId: 's12', studentName: 'Emma Chen', subjects: { Mathematics: 92, Science: 85, English: 88, History: 78 }, totalMarks: 343, totalMax: 400, percentage: 85.8, grade: 'A', rank: 1 },
        { studentId: 's4', studentName: 'Sofia Martinez', subjects: { Mathematics: 88, Science: 95, English: 82, History: 90 }, totalMarks: 355, totalMax: 400, percentage: 88.8, grade: 'A+', rank: 2 },
        { studentId: 's13', studentName: 'Aiden Murphy', subjects: { Mathematics: 78, Science: 82, English: 85, History: 88 }, totalMarks: 333, totalMax: 400, percentage: 83.3, grade: 'A', rank: 3 }
      ]).pipe();
    }
    return this.api.get<any[]>(`/reports/student-performance?classId=${classId}&examId=${examId}`).pipe(
      map(rows => rows.map(row => ({
        studentId: String(row.studentId),
        studentName: row.studentName,
        subjects: row.subjects ?? {},
        totalMarks: Number(row.totalMarks ?? 0),
        totalMax: Number(row.totalMax ?? 0),
        percentage: Number(row.percentage ?? 0),
        grade: row.grade ?? '',
        rank: Number(row.rank ?? 0)
      })))
    );
  }

  getAttendanceSummary(classId: string, month: string): Observable<AttendanceSummaryRow[]> {
    if (runtimeConfig.useMocks) {
      return of([
        { studentId: 's12', studentName: 'Emma Chen', present: 20, absent: 1, late: 1, excused: 0, totalDays: 22, attendancePercentage: 93.2 },
        { studentId: 's4', studentName: 'Sofia Martinez', present: 21, absent: 0, late: 1, excused: 0, totalDays: 22, attendancePercentage: 97.7 },
        { studentId: 's13', studentName: 'Aiden Murphy', present: 18, absent: 2, late: 2, excused: 0, totalDays: 22, attendancePercentage: 86.4 }
      ]).pipe();
    }
    return this.api.get<any[]>(`/reports/attendance-summary?classId=${classId}&month=${month}`).pipe(
      map(rows => rows.map(row => ({
        studentId: String(row.studentId),
        studentName: row.studentName,
        present: Number(row.present ?? 0),
        absent: Number(row.absent ?? 0),
        late: Number(row.late ?? 0),
        excused: Number(row.excused ?? 0),
        totalDays: Number(row.totalDays ?? 0),
        attendancePercentage: Number(row.attendancePercentage ?? 0)
      })))
    );
  }

  getClassSummary(): Observable<ClassSummaryRow[]> {
    if (runtimeConfig.useMocks) {
      return of([
        { classId: 'c5', className: 'Class 5', grade: 5, sections: 2, totalStudents: 74, attendancePercentage: 94.1, performancePercentage: 81.2, feeCollectionPercentage: 90.0, classTeacherName: 'James O’Brien' },
        { classId: 'c8', className: 'Class 8', grade: 8, sections: 2, totalStudents: 75, attendancePercentage: 93.5, performancePercentage: 79.8, feeCollectionPercentage: 91.0, classTeacherName: 'Sarah Mitchell' },
        { classId: 'c9', className: 'Class 9', grade: 9, sections: 2, totalStudents: 68, attendancePercentage: 88.9, performancePercentage: 72.1, feeCollectionPercentage: 78.0, classTeacherName: 'Priya Sharma' }
      ]).pipe();
    }
    return this.api.get<any[]>('/reports/class-summary').pipe(
      map(rows => rows.map(row => ({
        classId: String(row.classId),
        className: row.className,
        grade: Number(row.grade ?? 0),
        sections: Number(row.sections ?? 0),
        totalStudents: Number(row.totalStudents ?? 0),
        attendancePercentage: Number(row.attendancePercentage ?? 0),
        performancePercentage: Number(row.performancePercentage ?? 0),
        feeCollectionPercentage: Number(row.feeCollectionPercentage ?? 0),
        classTeacherName: row.classTeacherName ?? ''
      })))
    );
  }

  getSectionSummary(): Observable<SectionSummaryRow[]> {
    if (runtimeConfig.useMocks) {
      return of([
        { sectionId: 'sec5a', sectionName: 'A', classId: 'c5', className: 'Class 5', studentCount: 38 },
        { sectionId: 'sec5b', sectionName: 'B', classId: 'c5', className: 'Class 5', studentCount: 36 },
        { sectionId: 'sec8a', sectionName: 'A', classId: 'c8', className: 'Class 8', studentCount: 40 }
      ]).pipe();
    }
    return this.api.get<any[]>('/reports/section-summary').pipe(
      map(rows => rows.map(row => ({
        sectionId: String(row.sectionId),
        sectionName: row.sectionName ?? '',
        classId: String(row.classId),
        className: row.className ?? '',
        studentCount: Number(row.studentCount ?? 0)
      })))
    );
  }

  getTeacherWorkload(): Observable<TeacherWorkloadRow[]> {
    if (runtimeConfig.useMocks) {
      return of([
        { teacherId: 't1', teacherName: 'Sarah Mitchell', specialization: 'Mathematics', subjects: ['Mathematics', 'Physics'], status: 'ACTIVE' },
        { teacherId: 't2', teacherName: 'James O’Brien', specialization: 'English', subjects: ['English', 'Literature'], status: 'ACTIVE' },
        { teacherId: 't5', teacherName: 'Maria Torres', specialization: 'Computer Science', subjects: ['Computer Science', 'IT'], status: 'ACTIVE' }
      ]).pipe();
    }
    return this.api.get<any[]>('/reports/teacher-workload').pipe(
      map(rows => rows.map(row => ({
        teacherId: String(row.teacherId),
        teacherName: row.teacherName,
        specialization: row.specialization ?? '',
        subjects: row.subjects ?? [],
        status: row.status ?? ''
      })))
    );
  }

  getFeeCollectionSummary(classId?: string): Observable<{ totalCollected: number; totalPending: number; overdueCount: number; totalStudents: number; collectionRate: number }> {
    if (runtimeConfig.useMocks) {
      return of({ totalCollected: 284000, totalPending: 46300, overdueCount: 18, totalStudents: 2847, collectionRate: 86 });
    }
    return this.api.get(`/reports/fee-collection${classId ? `?classId=${classId}` : ''}`);
  }

  getReportCard(studentId: string, examId?: string): Observable<ReportCard> {
    if (runtimeConfig.useMocks) {
      return of({
        studentId: 's12',
        studentName: 'Emma Chen',
        subjects: [
          { id: 'm1', examId: 'e2', studentId: 's12', studentName: 'Emma Chen', subjectName: 'Mathematics', marksObtained: 92, maxMarks: 100, grade: 'A+', classId: 'c8', tenantId: 't1' },
          { id: 'm2', examId: 'e2', studentId: 's12', studentName: 'Emma Chen', subjectName: 'Science', marksObtained: 85, maxMarks: 100, grade: 'A', classId: 'c8', tenantId: 't1' },
          { id: 'm3', examId: 'e2', studentId: 's12', studentName: 'Emma Chen', subjectName: 'English', marksObtained: 88, maxMarks: 100, grade: 'A', classId: 'c8', tenantId: 't1' },
          { id: 'm4', examId: 'e2', studentId: 's12', studentName: 'Emma Chen', subjectName: 'History', marksObtained: 78, maxMarks: 100, grade: 'B+', classId: 'c8', tenantId: 't1' }
        ],
        totalMarks: 343,
        totalMaxMarks: 400,
        overallPercentage: 85.8,
        overallGrade: 'A'
      }).pipe();
    }
    return this.api.get<any>(`/exams/report-card/${studentId}${examId ? `?examId=${examId}` : ''}`).pipe(
      map(card => ({
        studentId: String(card.studentId),
        studentName: card.studentName,
        subjects: (card.subjects ?? []).map((mark: any) => ({
          ...mark,
          id: String(mark.id),
          examId: String(mark.examId),
          studentId: String(mark.studentId),
          classId: mark.classId != null ? String(mark.classId) : '',
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
