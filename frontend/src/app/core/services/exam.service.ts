import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Exam, MarkRecord } from '../models/models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExamService {
  private exams: Exam[] = [
    { id: 'e1', name: 'First Unit Test', academicYearId: 'ay1', startDate: '2025-08-15', endDate: '2025-08-22', classIds: ['c5', 'c6', 'c7', 'c8', 'c9', 'c10'], status: 'completed', tenantId: 't1' },
    { id: 'e2', name: 'Midterm Examination', academicYearId: 'ay1', startDate: '2025-10-10', endDate: '2025-10-20', classIds: ['c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12'], status: 'completed', tenantId: 't1' },
    { id: 'e3', name: 'Second Unit Test', academicYearId: 'ay1', startDate: '2025-12-05', endDate: '2025-12-12', classIds: ['c5', 'c6', 'c7', 'c8', 'c9', 'c10'], status: 'completed', tenantId: 't1' },
    { id: 'e4', name: 'Final Examination', academicYearId: 'ay1', startDate: '2026-03-10', endDate: '2026-03-25', classIds: ['c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12'], status: 'upcoming', tenantId: 't1' },
  ];

  private marks: MarkRecord[] = [
    { id: 'm1', examId: 'e2', studentId: 's1', studentName: 'Arjun Patel', subjectName: 'Mathematics', marksObtained: 85, maxMarks: 100, grade: 'A', classId: 'c5', tenantId: 't1' },
    { id: 'm2', examId: 'e2', studentId: 's1', studentName: 'Arjun Patel', subjectName: 'English', marksObtained: 72, maxMarks: 100, grade: 'B+', classId: 'c5', tenantId: 't1' },
    { id: 'm3', examId: 'e2', studentId: 's1', studentName: 'Arjun Patel', subjectName: 'Science', marksObtained: 90, maxMarks: 100, grade: 'A+', classId: 'c5', tenantId: 't1' },
    { id: 'm4', examId: 'e2', studentId: 's2', studentName: 'Emily Watson', subjectName: 'Mathematics', marksObtained: 78, maxMarks: 100, grade: 'B+', classId: 'c6', tenantId: 't1' },
    { id: 'm5', examId: 'e2', studentId: 's2', studentName: 'Emily Watson', subjectName: 'English', marksObtained: 92, maxMarks: 100, grade: 'A+', classId: 'c6', tenantId: 't1' },
    { id: 'm6', examId: 'e2', studentId: 's4', studentName: 'Sofia Martinez', subjectName: 'Mathematics', marksObtained: 88, maxMarks: 100, grade: 'A', classId: 'c8', tenantId: 't1' },
    { id: 'm7', examId: 'e2', studentId: 's4', studentName: 'Sofia Martinez', subjectName: 'Science', marksObtained: 95, maxMarks: 100, grade: 'A+', classId: 'c8', tenantId: 't1' },
    { id: 'm8', examId: 'e2', studentId: 's9', studentName: 'Mason Davis', subjectName: 'Mathematics', marksObtained: 65, maxMarks: 100, grade: 'B', classId: 'c9', tenantId: 't1' },
    { id: 'm9', examId: 'e2', studentId: 's12', studentName: 'Emma Chen', subjectName: 'Mathematics', marksObtained: 92, maxMarks: 100, grade: 'A+', classId: 'c8', tenantId: 't1' },
    { id: 'm10', examId: 'e2', studentId: 's12', studentName: 'Emma Chen', subjectName: 'Science', marksObtained: 85, maxMarks: 100, grade: 'A', classId: 'c8', tenantId: 't1' },
    { id: 'm11', examId: 'e1', studentId: 's1', studentName: 'Arjun Patel', subjectName: 'Mathematics', marksObtained: 78, maxMarks: 100, grade: 'B+', classId: 'c5', tenantId: 't1' },
    { id: 'm12', examId: 'e1', studentId: 's1', studentName: 'Arjun Patel', subjectName: 'English', marksObtained: 65, maxMarks: 100, grade: 'B', classId: 'c5', tenantId: 't1' },
    { id: 'm13', examId: 'e1', studentId: 's1', studentName: 'Arjun Patel', subjectName: 'Science', marksObtained: 82, maxMarks: 100, grade: 'A', classId: 'c5', tenantId: 't1' },
    { id: 'm14', examId: 'e1', studentId: 's4', studentName: 'Sofia Martinez', subjectName: 'Mathematics', marksObtained: 82, maxMarks: 100, grade: 'A', classId: 'c8', tenantId: 't1' },
    { id: 'm15', examId: 'e1', studentId: 's4', studentName: 'Sofia Martinez', subjectName: 'Science', marksObtained: 90, maxMarks: 100, grade: 'A+', classId: 'c8', tenantId: 't1' },
    { id: 'm16', examId: 'e1', studentId: 's12', studentName: 'Emma Chen', subjectName: 'Mathematics', marksObtained: 88, maxMarks: 100, grade: 'A', classId: 'c8', tenantId: 't1' },
    { id: 'm17', examId: 'e1', studentId: 's12', studentName: 'Emma Chen', subjectName: 'Science', marksObtained: 80, maxMarks: 100, grade: 'A', classId: 'c8', tenantId: 't1' },
    { id: 'm18', examId: 'e3', studentId: 's4', studentName: 'Sofia Martinez', subjectName: 'Mathematics', marksObtained: 91, maxMarks: 100, grade: 'A+', classId: 'c8', tenantId: 't1' },
    { id: 'm19', examId: 'e3', studentId: 's4', studentName: 'Sofia Martinez', subjectName: 'Science', marksObtained: 96, maxMarks: 100, grade: 'A+', classId: 'c8', tenantId: 't1' },
    { id: 'm20', examId: 'e3', studentId: 's12', studentName: 'Emma Chen', subjectName: 'Mathematics', marksObtained: 94, maxMarks: 100, grade: 'A+', classId: 'c8', tenantId: 't1' },
  ];

  getExams(): Observable<Exam[]> {
    if (!environment.useMocks) { return this.api.get<any[]>('/exams').pipe(map(exams => exams.map(exam => this.normalizeExam(exam)))); }
    return of([...this.exams]).pipe(delay(400));
  }
  getMarksByExam(examId: string): Observable<MarkRecord[]> {
    if (!environment.useMocks) { return this.api.get<any[]>(`/exams/${examId}/marks`).pipe(map(marks => marks.map(mark => this.normalizeMark(mark)))); }
    return of(this.marks.filter(m => m.examId === examId)).pipe(delay(400));
  }
  getMarksByStudent(studentId: string): Observable<MarkRecord[]> {
    if (!environment.useMocks) { return this.api.get<any[]>(`/exams/marks/student/${studentId}`).pipe(map(marks => marks.map(mark => this.normalizeMark(mark)))); }
    return of(this.marks.filter(m => m.studentId === studentId)).pipe(delay(300));
  }

  constructor(private api: ApiService) {}

  addExam(exam: Exam): Observable<Exam> {
    if (!environment.useMocks) {
      return this.api.post<any>('/exams', {
        name: exam.name,
        academicYearId: exam.academicYearId ? Number(exam.academicYearId) : null,
        startDate: exam.startDate || null,
        endDate: exam.endDate || null,
        classIds: (exam.classIds ?? []).map(id => Number(id))
      }).pipe(map(created => this.normalizeExam(created)));
    }
    this.exams.push(exam);
    return of(exam).pipe(delay(400));
  }

  saveMarks(examId: string, marks: MarkRecord[]): Observable<MarkRecord[]> {
    if (!environment.useMocks) {
      return this.api.post<any[]>('/exams/marks', {
        examId: Number(examId),
        marks: marks.map(mark => ({
          studentId: Number(mark.studentId),
          studentName: mark.studentName,
          subjectName: mark.subjectName,
          marksObtained: Number(mark.marksObtained),
          maxMarks: Number(mark.maxMarks),
          classId: mark.classId ? Number(mark.classId) : null
        }))
      }).pipe(map(savedMarks => savedMarks.map(mark => this.normalizeMark(mark))));
    }
    this.marks = [...this.marks, ...marks];
    return of(marks).pipe(delay(300));
  }

  private normalizeExam(exam: any): Exam {
    return {
      ...exam,
      id: String(exam.id),
      academicYearId: exam.academicYearId != null ? String(exam.academicYearId) : '',
      classIds: (exam.classIds ?? []).map((id: any) => String(id)),
      status: (exam.status ?? 'upcoming') as Exam['status'],
      tenantId: exam.tenantId ?? ''
    };
  }

  private normalizeMark(mark: any): MarkRecord {
    return {
      ...mark,
      id: String(mark.id),
      examId: String(mark.examId),
      studentId: String(mark.studentId),
      classId: mark.classId != null ? String(mark.classId) : '',
      tenantId: mark.tenantId ?? ''
    };
  }
}
