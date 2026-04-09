import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Exam, ExamClassScope, ExamScheduleSlot, MarkRecord } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { coerceApiLongId } from '../utils/coerce-api-long-id';

@Injectable({ providedIn: 'root' })
export class ExamService {
  private exams: Exam[] = [
    {
      id: 'e1',
      name: 'First Unit Test',
      academicYearId: 'ay1',
      startDate: '2025-08-15',
      endDate: '2025-08-22',
      classIds: ['c5', 'c6', 'c7', 'c8', 'c9', 'c10'],
      classScopes: [
        { classId: 'c5', sectionId: null, className: 'Class 5' },
        { classId: 'c8', sectionId: 'sec8a', className: 'Class 8', sectionName: 'A' }
      ],
      status: 'completed',
      tenantId: 't1'
    },
    {
      id: 'e2',
      name: 'Midterm Examination',
      academicYearId: 'ay1',
      startDate: '2025-10-10',
      endDate: '2025-10-20',
      classIds: ['c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12'],
      status: 'completed',
      tenantId: 't1'
    },
    {
      id: 'e3',
      name: 'Second Unit Test',
      academicYearId: 'ay1',
      startDate: '2025-12-05',
      endDate: '2025-12-12',
      classIds: ['c5', 'c6', 'c7', 'c8', 'c9', 'c10'],
      status: 'completed',
      tenantId: 't1'
    },
    {
      id: 'e4',
      name: 'Final Examination',
      academicYearId: 'ay1',
      startDate: '2026-03-10',
      endDate: '2026-03-25',
      classIds: ['c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12'],
      status: 'upcoming',
      tenantId: 't1'
    }
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
    { id: 'm20', examId: 'e3', studentId: 's12', studentName: 'Emma Chen', subjectName: 'Mathematics', marksObtained: 94, maxMarks: 100, grade: 'A+', classId: 'c8', tenantId: 't1' }
  ];

  private mockSchedule: Record<string, ExamScheduleSlot[]> = {
    e2: [
      {
        id: 'es1',
        examId: 'e2',
        classId: 'c8',
        sectionId: null,
        className: 'Class 8',
        subjectName: 'Mathematics',
        examDate: '2025-10-12',
        startTime: '09:00:00',
        endTime: '12:00:00',
        room: 'Hall A',
        notes: 'Scientific calculator allowed'
      },
      {
        id: 'es2',
        examId: 'e2',
        classId: 'c8',
        sectionId: null,
        className: 'Class 8',
        subjectName: 'Science',
        examDate: '2025-10-13',
        startTime: '09:00:00',
        endTime: '11:30:00',
        room: 'Lab 2'
      }
    ]
  };

  constructor(private api: ApiService) {}

  getExams(): Observable<Exam[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>('/exams').pipe(map(exams => exams.map(exam => this.normalizeExam(exam))));
    }
    return of(
      this.exams.map(e => {
        const copy = this.copyExam(e);
        if (!copy.scheduleSlots?.length && this.mockSchedule[e.id]?.length) {
          copy.scheduleSlots = this.mockSchedule[e.id].map(s => ({ ...s }));
        }
        return copy;
      })
    ).pipe(delay(400));
  }

  getMarksByExam(examId: string): Observable<MarkRecord[]> {
    if (!runtimeConfig.useMocks) {
      const eid = coerceApiLongId(examId, 'exam');
      return this.api.get<any[]>(`/exams/${eid}/marks`).pipe(map(marks => marks.map(mark => this.normalizeMark(mark))));
    }
    return of(this.marks.filter(m => m.examId === examId)).pipe(delay(400));
  }

  getMarksByStudent(studentId: string): Observable<MarkRecord[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>(`/exams/marks/student/${coerceApiLongId(studentId, 'student')}`).pipe(map(marks => marks.map(mark => this.normalizeMark(mark))));
    }
    return of(this.marks.filter(m => m.studentId === studentId)).pipe(delay(300));
  }

  getSchedule(examId: string): Observable<ExamScheduleSlot[]> {
    if (!runtimeConfig.useMocks) {
      const eid = coerceApiLongId(examId, 'exam');
      return this.api.get<any[]>(`/exams/${eid}/schedule`).pipe(map(rows => rows.map(r => this.normalizeSlot(r, examId))));
    }
    return of((this.mockSchedule[examId] ?? []).map(s => ({ ...s }))).pipe(delay(200));
  }

  replaceSchedule(examId: string, slots: Omit<ExamScheduleSlot, 'id' | 'examId'>[]): Observable<ExamScheduleSlot[]> {
    if (!runtimeConfig.useMocks) {
      try {
        const eid = coerceApiLongId(examId, 'exam');
        const body = {
          slots: slots.map(s => ({
            classId: coerceApiLongId(s.classId, 'class'),
            sectionId: s.sectionId ? coerceApiLongId(s.sectionId, 'section') : null,
            subjectName: (s.subjectName || '').trim(),
            examDate: (s.examDate || '').trim(),
            startTime: this.toApiTime(s.startTime, 'Start'),
            endTime: this.toApiTime(s.endTime, 'End'),
            room: s.room?.trim() || null,
            notes: s.notes?.trim() || null
          }))
        };
        return this.api.put<any[]>(`/exams/${eid}/schedule`, body).pipe(map(rows => rows.map(r => this.normalizeSlot(r, examId))));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Invalid timetable data';
        return throwError(() => new Error(msg));
      }
    }
    const next: ExamScheduleSlot[] = slots.map((s, i) => ({
      id: 'es' + Date.now() + i,
      examId,
      ...s
    }));
    this.mockSchedule[examId] = next;
    const ex = this.exams.find(e => String(e.id) === String(examId));
    if (ex) {
      ex.scheduleSlots = [...next];
    }
    return of(next).pipe(delay(300));
  }

  addExam(exam: Exam, classScopes?: ExamClassScope[]): Observable<Exam> {
    if (!runtimeConfig.useMocks) {
      const payload: Record<string, unknown> = {
        name: exam.name,
        academicYearId: exam.academicYearId ? coerceApiLongId(exam.academicYearId, 'academic year') : null,
        startDate: exam.startDate || null,
        endDate: exam.endDate || null,
        classIds: (exam.classIds ?? []).map(id => coerceApiLongId(id, 'class'))
      };
      if (classScopes && classScopes.length) {
        payload['classScopes'] = classScopes.map(s => ({
          classId: coerceApiLongId(s.classId, 'class'),
          sectionId: s.sectionId ? coerceApiLongId(s.sectionId, 'section') : null
        }));
      }
      return this.api.post<any>('/exams', payload).pipe(map(created => this.normalizeExam(created)));
    }
    const row: Exam = {
      ...exam,
      id: 'e' + Date.now(),
      classScopes: classScopes?.length ? [...classScopes] : exam.classIds.map(cid => ({ classId: cid, sectionId: null })),
      scheduleSlots: []
    };
    this.exams = [row, ...this.exams];
    this.mockSchedule[row.id] = [];
    return of(this.copyExam(row)).pipe(delay(400));
  }

  saveMarks(examId: string, marks: MarkRecord[]): Observable<MarkRecord[]> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .post<any[]>('/exams/marks', {
          examId: coerceApiLongId(examId, 'exam'),
          marks: marks.map(mark => ({
            studentId: coerceApiLongId(mark.studentId, 'student'),
            studentName: mark.studentName,
            subjectName: mark.subjectName,
            marksObtained: Number(mark.marksObtained),
            maxMarks: Number(mark.maxMarks),
            classId: mark.classId ? coerceApiLongId(mark.classId, 'class') : null
          }))
        })
        .pipe(map(savedMarks => savedMarks.map(mark => this.normalizeMark(mark))));
    }
    this.marks = [...this.marks, ...marks];
    return of(marks).pipe(delay(300));
  }

  private copyExam(e: Exam): Exam {
    return {
      ...e,
      classIds: [...(e.classIds ?? [])],
      classScopes: e.classScopes?.map(s => ({ ...s })),
      scheduleSlots: e.scheduleSlots?.map(s => ({ ...s }))
    };
  }

  private normalizeExam(exam: any): Exam {
    const classScopes = (exam.classScopes ?? exam.class_scopes ?? []) as any[];
    const scheduleSlots = (exam.scheduleSlots ?? exam.schedule_slots ?? []) as any[];
    return {
      ...exam,
      id: String(exam.id),
      academicYearId: exam.academicYearId != null ? String(exam.academicYearId) : '',
      classIds: (exam.classIds ?? exam.class_ids ?? []).map((id: any) => String(id)),
      classScopes: classScopes.length
        ? classScopes.map((s: any) => ({
            classId: String(s.classId ?? s.class_id),
            sectionId: s.sectionId != null && s.sectionId !== '' ? String(s.sectionId) : s.section_id != null ? String(s.section_id) : null,
            className: s.className ?? s.class_name,
            sectionName: s.sectionName ?? s.section_name
          }))
        : undefined,
      scheduleSlots: scheduleSlots.length ? scheduleSlots.map((s: any) => this.normalizeSlot(s, String(exam.id))) : undefined,
      status: (exam.status ?? 'upcoming') as Exam['status'],
      tenantId: exam.tenantId ?? ''
    };
  }

  /** HH:mm or HH:mm:ss for Spring LocalTime.parse */
  private toApiTime(raw: string | undefined | null, label: string): string {
    const v = raw != null ? String(raw).trim() : '';
    if (!v) {
      throw new Error(`${label} time is required for each timetable row`);
    }
    return v.length === 5 ? `${v}:00` : v;
  }

  private normalizeSlot(s: any, examId: string): ExamScheduleSlot {
    return {
      id: s.id != null ? String(s.id) : '',
      examId: String(s.examId ?? s.exam_id ?? examId),
      classId: String(s.classId ?? s.class_id),
      sectionId: s.sectionId != null ? String(s.sectionId) : s.section_id != null ? String(s.section_id) : null,
      className: s.className ?? s.class_name,
      sectionName: s.sectionName ?? s.section_name,
      subjectName: s.subjectName ?? s.subject_name ?? '',
      examDate: String(s.examDate ?? s.exam_date ?? ''),
      startTime: this.fmtLocalTime(s.startTime ?? s.start_time),
      endTime: this.fmtLocalTime(s.endTime ?? s.end_time),
      room: s.room,
      notes: s.notes
    };
  }

  private fmtLocalTime(v: unknown): string {
    const t = String(v ?? '');
    if (t.length >= 5) {
      return t.slice(0, 5);
    }
    return t;
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
