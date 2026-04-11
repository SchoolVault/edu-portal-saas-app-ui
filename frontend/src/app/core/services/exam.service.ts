import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { MOCK_EXAM_MARKS_SEED, MOCK_EXAMS_SEED, MOCK_EXAM_SCHEDULE_SEED } from '../mocks/exam.mock-data';
import { Exam, ExamClassScope, ExamScheduleSlot, MarkRecord } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class ExamService {
  private exams: Exam[] = MOCK_EXAMS_SEED.map(e => ({
    ...e,
    classIds: [...e.classIds],
    classScopes: (e.classScopes ?? []).map(s => ({ ...s })),
  }));

  private marks: MarkRecord[] = MOCK_EXAM_MARKS_SEED.map(m => ({ ...m }));

  private mockSchedule: Record<number, ExamScheduleSlot[]> = JSON.parse(JSON.stringify(MOCK_EXAM_SCHEDULE_SEED)) as Record<
    number,
    ExamScheduleSlot[]
  >;

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

  getMarksByExam(examId: number): Observable<MarkRecord[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>(`/exams/${examId}/marks`).pipe(map(marks => marks.map(mark => this.normalizeMark(mark))));
    }
    return of(this.marks.filter(m => m.examId === examId)).pipe(delay(400));
  }

  getMarksByStudent(studentId: number): Observable<MarkRecord[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>(`/exams/marks/student/${studentId}`).pipe(map(marks => marks.map(mark => this.normalizeMark(mark))));
    }
    return of(this.marks.filter(m => m.studentId === studentId)).pipe(delay(300));
  }

  getSchedule(examId: number): Observable<ExamScheduleSlot[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>(`/exams/${examId}/schedule`).pipe(map(rows => rows.map(r => this.normalizeSlot(r, examId))));
    }
    return of((this.mockSchedule[examId] ?? []).map(s => ({ ...s }))).pipe(delay(200));
  }

  replaceSchedule(examId: number, slots: Omit<ExamScheduleSlot, 'id' | 'examId'>[]): Observable<ExamScheduleSlot[]> {
    if (!runtimeConfig.useMocks) {
      try {
        const body = {
          slots: slots.map(s => ({
            classId: s.classId,
            sectionId: s.sectionId ?? null,
            subjectName: (s.subjectName || '').trim(),
            examDate: (s.examDate || '').trim(),
            startTime: this.toApiTime(s.startTime, 'Start'),
            endTime: this.toApiTime(s.endTime, 'End'),
            room: s.room?.trim() || null,
            notes: s.notes?.trim() || null
          }))
        };
        return this.api.put<any[]>(`/exams/${examId}/schedule`, body).pipe(map(rows => rows.map(r => this.normalizeSlot(r, examId))));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Invalid timetable data';
        return throwError(() => new Error(msg));
      }
    }
    const base = Date.now();
    const next: ExamScheduleSlot[] = slots.map((s, i) => ({
      id: base + i,
      examId,
      ...s
    }));
    this.mockSchedule[examId] = next;
    const ex = this.exams.find(e => e.id === examId);
    if (ex) {
      ex.scheduleSlots = [...next];
    }
    return of(next).pipe(delay(300));
  }

  addExam(exam: Exam, classScopes?: ExamClassScope[]): Observable<Exam> {
    if (!runtimeConfig.useMocks) {
      const payload: Record<string, unknown> = {
        name: exam.name,
        academicYearId: exam.academicYearId ?? null,
        startDate: exam.startDate || null,
        endDate: exam.endDate || null,
        classIds: exam.classIds ?? []
      };
      if (classScopes && classScopes.length) {
        payload['classScopes'] = classScopes.map(s => ({
          classId: s.classId,
          sectionId: s.sectionId ?? null
        }));
      }
      return this.api.post<any>('/exams', payload).pipe(map(created => this.normalizeExam(created)));
    }
    const nextId = Math.max(0, ...this.exams.map(e => e.id)) + 1;
    const row: Exam = {
      ...exam,
      id: nextId,
      classScopes: classScopes?.length ? [...classScopes] : exam.classIds.map(cid => ({ classId: cid, sectionId: null })),
      scheduleSlots: []
    };
    this.exams = [row, ...this.exams];
    this.mockSchedule[row.id] = [];
    return of(this.copyExam(row)).pipe(delay(400));
  }

  saveMarks(examId: number, marks: MarkRecord[]): Observable<MarkRecord[]> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .post<any[]>('/exams/marks', {
          examId,
          marks: marks.map(mark => ({
            studentId: mark.studentId,
            studentName: mark.studentName,
            subjectName: mark.subjectName,
            marksObtained: Number(mark.marksObtained),
            maxMarks: Number(mark.maxMarks),
            classId: mark.classId ?? null
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
    const eid = Number(exam.id);
    return {
      ...exam,
      id: eid,
      academicYearId: exam.academicYearId != null ? Number(exam.academicYearId) : 0,
      classIds: (exam.classIds ?? exam.class_ids ?? []).map((id: any) => Number(id)),
      classScopes: classScopes.length
        ? classScopes.map((s: any) => ({
            classId: Number(s.classId ?? s.class_id),
            sectionId:
              s.sectionId != null && s.sectionId !== ''
                ? Number(s.sectionId)
                : s.section_id != null && s.section_id !== ''
                  ? Number(s.section_id)
                  : null,
            className: s.className ?? s.class_name,
            sectionName: s.sectionName ?? s.section_name
          }))
        : undefined,
      scheduleSlots: scheduleSlots.length ? scheduleSlots.map((s: any) => this.normalizeSlot(s, eid)) : undefined,
      status: (exam.status ?? 'upcoming') as Exam['status'],
      tenantId: exam.tenantId ?? ''
    };
  }

  private toApiTime(raw: string | undefined | null, label: string): string {
    const v = raw != null ? String(raw).trim() : '';
    if (!v) {
      throw new Error(`${label} time is required for each timetable row`);
    }
    return v.length === 5 ? `${v}:00` : v;
  }

  private normalizeSlot(s: any, examId: number): ExamScheduleSlot {
    return {
      id: s.id != null ? Number(s.id) : undefined,
      examId: Number(s.examId ?? s.exam_id ?? examId),
      classId: Number(s.classId ?? s.class_id),
      sectionId:
        s.sectionId != null && s.sectionId !== '' ? Number(s.sectionId) : s.section_id != null && s.section_id !== '' ? Number(s.section_id) : null,
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
      id: Number(mark.id),
      examId: Number(mark.examId),
      studentId: Number(mark.studentId),
      classId: mark.classId != null ? Number(mark.classId) : 0,
      tenantId: mark.tenantId ?? ''
    };
  }
}
