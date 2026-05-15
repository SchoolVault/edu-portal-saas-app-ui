import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, mergeMap } from 'rxjs/operators';
import { MOCK_EXAM_MARKS_SEED, MOCK_EXAMS_SEED, MOCK_EXAM_SCHEDULE_SEED } from '../mocks/exam.mock-data';
import { mockParentPortalExams } from '../mocks/parent.mock-data';
import {
  Exam,
  ExamBulkOperationLog,
  ExamClassScope,
  ExamEventLog,
  ExamNotificationJob,
  ExamScheduleSlot,
  ExamModuleConfigHistoryItem,
  ExamModuleConfig,
  ExamModuleConfigKey,
  ExamTemplate,
  MarkRecord,
  MarksEntryScopeRow
} from '../models/models';
import { ApiService, PageResp } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';

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

  /**
   * Staff exam grid: same {@link PageResp} as {@code GET /api/v1/exams/paged}.
   */
  getExamsPage(opts: { page?: number; size?: number; q?: string; status?: string }): Observable<PageResp<Exam>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<any>('/exams/paged', {
          page,
          size,
          q: opts.q?.trim() || undefined,
          status: opts.status?.trim() || undefined,
        })
        .pipe(map(p => ({ ...p, content: p.content.map(exam => this.normalizeExam(exam)) })));
    }
    return this.getExams().pipe(
      map(all => {
        let rows = [...all];
        const qq = opts.q?.trim().toLowerCase();
        if (qq) {
          rows = rows.filter(e => (e.name || '').toLowerCase().includes(qq));
        }
        const st = opts.status?.trim().toLowerCase();
        if (st) {
          const isLifecycleStatus = st === 'upcoming' || st === 'ongoing' || st === 'completed' || st === 'cancelled';
          rows = rows.filter(e =>
            isLifecycleStatus
              ? (e.status || '').toLowerCase() === st
              : (e.workflowState || '').toLowerCase() === st
          );
        }
        return sliceToPage(rows, page, size);
      })
    );
  }

  /** Parent role: server-scoped list (GET /parent/exams). Prefer {@link #getParentPortalExamsAggregated} for large catalogs. */
  getParentPortalExams(): Observable<Exam[]> {
    return this.getParentPortalExamsAggregated();
  }

  /** One page of parent-scoped exams ({@code GET /api/v1/parent/exams/paged}). */
  getParentPortalExamsPage(page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<Exam>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<any>('/parent/exams/paged', { page, size }).pipe(
        map(p => ({ ...p, content: (p.content ?? []).map((exam: any) => this.normalizeExam(exam)) }))
      );
    }
    const all = mockParentPortalExams().map(e => this.copyExam(e));
    return of(sliceToPage(all, page, size)).pipe(delay(120));
  }

  /** Fetches all pages (bounded page size) so existing parent UI keeps a full in-memory list without blocking on one huge payload. */
  getParentPortalExamsAggregated(): Observable<Exam[]> {
    if (runtimeConfig.useMocks) {
      return of(mockParentPortalExams().map(e => this.copyExam(e))).pipe(delay(200));
    }
    const pageSize = 50;
    const load = (page: number, acc: Exam[]): Observable<Exam[]> =>
      this.getParentPortalExamsPage(page, pageSize).pipe(
        mergeMap(resp => {
          const merged = [...acc, ...(resp.content ?? [])];
          if (resp.last || !resp.content?.length) {
            return of(merged);
          }
          return load(page + 1, merged);
        })
      );
    return load(0, []);
  }

  getMarksByExam(examId: number): Observable<MarkRecord[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>(`/exams/${examId}/marks`).pipe(map(marks => marks.map(mark => this.normalizeMark(mark))));
    }
    return of(this.marks.filter(m => m.examId === examId)).pipe(delay(400));
  }

  /** Teacher UI: which class/section/subject combinations may receive marks for this exam */
  getMarksEntryScope(examId: number): Observable<MarksEntryScopeRow[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<MarksEntryScopeRow[]>(`/exams/${examId}/marks-entry-scope`);
    }
    const subjects = [...new Set(this.marks.filter(m => m.examId === examId).map(m => m.subjectName))];
    const classId = this.marks.find(m => m.examId === examId)?.classId ?? 0;
    return of(
      subjects.map(subjectName => ({
        examId,
        classId,
        sectionId: null,
        subjectName
      }))
    ).pipe(delay(150));
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
            paperType: s.paperType?.trim() || null,
            invigilatorName: s.invigilatorName?.trim() || null,
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
        examType: exam.examType?.trim() || null,
        boardCode: exam.boardCode?.trim() || null,
        sessionType: exam.sessionType?.trim() || null,
        termCode: exam.termCode?.trim() || null,
        assessmentKind: exam.assessmentKind?.trim() || null,
        markingScheme: exam.markingScheme?.trim() || null,
        gradingConfig: exam.gradingConfig ?? null,
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

  updateExam(examId: number, exam: Exam, classScopes?: ExamClassScope[]): Observable<Exam> {
    if (!runtimeConfig.useMocks) {
      const payload: Record<string, unknown> = {
        name: exam.name,
        examType: exam.examType?.trim() || null,
        boardCode: exam.boardCode?.trim() || null,
        sessionType: exam.sessionType?.trim() || null,
        termCode: exam.termCode?.trim() || null,
        assessmentKind: exam.assessmentKind?.trim() || null,
        markingScheme: exam.markingScheme?.trim() || null,
        gradingConfig: exam.gradingConfig ?? null,
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
      return this.api.put<any>(`/exams/${examId}`, payload).pipe(map(updated => this.normalizeExam(updated)));
    }
    const idx = this.exams.findIndex(e => e.id === examId);
    if (idx < 0) {
      return of(this.copyExam(exam)).pipe(delay(200));
    }
    const merged: Exam = {
      ...this.exams[idx],
      ...exam,
      id: examId,
      classScopes: classScopes?.length ? [...classScopes] : exam.classIds.map(cid => ({ classId: cid, sectionId: null }))
    };
    this.exams[idx] = merged;
    return of(this.copyExam(merged)).pipe(delay(250));
  }

  saveMarks(examId: number, marks: MarkRecord[]): Observable<MarkRecord[]> {
    const requestId = `marks-${examId}-${Date.now()}`;
    if (!runtimeConfig.useMocks) {
      return this.api
        .post<any[]>('/exams/marks', {
          examId,
          requestId,
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

  getTemplates(): Observable<ExamTemplate[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<ExamTemplate[]>('/exams/templates');
    }
    return of([
      {
        id: 1,
        name: 'CBSE Comprehensive',
        boardType: 'CBSE',
        defaultMarkingScheme: 'hybrid',
        rules: { formula: '(theory*0.7)+(practical*0.3)' },
        components: [
          { componentCode: 'THEORY', componentLabel: 'Theory', maxMarks: 70, weightagePct: 70 },
          { componentCode: 'PRACTICAL', componentLabel: 'Practical', maxMarks: 30, weightagePct: 30 }
        ]
      }
    ]).pipe(delay(120));
  }

  getEventLogsPage(examId: number, page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<ExamEventLog>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<ExamEventLog>(`/exams/${examId}/events`, { page, size });
    }
    return of(sliceToPage([], page, size)).pipe(delay(80));
  }

  getNotificationJobsPage(examId: number, page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<ExamNotificationJob>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<ExamNotificationJob>(`/exams/${examId}/notification-jobs`, { page, size });
    }
    return of(sliceToPage([], page, size)).pipe(delay(80));
  }

  getBulkOperationLogsPage(examId: number, page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<ExamBulkOperationLog>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<ExamBulkOperationLog>(`/exams/${examId}/bulk-operations`, { page, size });
    }
    return of(sliceToPage([], page, size)).pipe(delay(80));
  }

  processNotificationJobs(batchSize = 25): Observable<number> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<number>(`/exams/notification-jobs/process?batchSize=${batchSize}`, {});
    }
    return of(0).pipe(delay(60));
  }

  submitForApproval(examId: number, note?: string): Observable<Exam> {
    if (!runtimeConfig.useMocks) {
      return this.api.put<any>(`/exams/${examId}/submit-approval`, { note: note?.trim() || null }).pipe(map(ex => this.normalizeExam(ex)));
    }
    return this.transitionMockWorkflow(examId, 'PENDING_APPROVAL', note);
  }

  approveExam(examId: number, publishNow = false, note?: string): Observable<Exam> {
    if (!runtimeConfig.useMocks) {
      return this.api.put<any>(`/exams/${examId}/approve`, { publishNow, note: note?.trim() || null }).pipe(map(ex => this.normalizeExam(ex)));
    }
    return this.transitionMockWorkflow(examId, publishNow ? 'PUBLISHED' : 'APPROVED', note);
  }

  rejectExam(examId: number, note?: string): Observable<Exam> {
    if (!runtimeConfig.useMocks) {
      return this.api.put<any>(`/exams/${examId}/reject`, { note: note?.trim() || null }).pipe(map(ex => this.normalizeExam(ex)));
    }
    return this.transitionMockWorkflow(examId, 'REJECTED', note);
  }

  freezeExam(examId: number, note?: string): Observable<Exam> {
    if (!runtimeConfig.useMocks) {
      return this.api.put<any>(`/exams/${examId}/freeze`, { note: note?.trim() || null }).pipe(map(ex => this.normalizeExam(ex)));
    }
    return this.transitionMockWorkflow(examId, 'FROZEN', note);
  }

  getModuleConfigs(academicYearId: number): Observable<ExamModuleConfig[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<ExamModuleConfig[]>(`/exams/configs?academicYearId=${academicYearId}`);
    }
    return of([]).pipe(delay(80));
  }

  getModuleConfigHistory(academicYearId: number, configKey: ExamModuleConfigKey): Observable<ExamModuleConfigHistoryItem[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<ExamModuleConfigHistoryItem[]>(`/exams/configs/${configKey}/history?academicYearId=${academicYearId}`);
    }
    return of([]).pipe(delay(80));
  }

  upsertModuleConfig(
    configKey: ExamModuleConfigKey,
    academicYearId: number,
    config: Record<string, unknown>,
    note?: string
  ): Observable<ExamModuleConfig> {
    if (!runtimeConfig.useMocks) {
      return this.api.put<ExamModuleConfig>(`/exams/configs/${configKey}`, {
        academicYearId,
        config,
        note: note?.trim() || null
      });
    }
    return of({
      id: Date.now(),
      academicYearId,
      configKey,
      config,
      versionNo: 1,
      note
    }).pipe(delay(120));
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
      examType: exam.examType ?? exam.exam_type ?? undefined,
      boardCode: exam.boardCode ?? exam.board_code ?? undefined,
      sessionType: exam.sessionType ?? exam.session_type ?? undefined,
      termCode: exam.termCode ?? exam.term_code ?? undefined,
      assessmentKind: exam.assessmentKind ?? exam.assessment_kind ?? undefined,
      markingScheme: exam.markingScheme ?? exam.marking_scheme ?? undefined,
      gradingConfig: exam.gradingConfig ?? exam.grading_config ?? undefined,
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
      resultsPublished: !!exam.resultsPublished,
      workflowState: exam.workflowState ?? exam.workflow_state ?? undefined,
      workflowNote: exam.workflowNote ?? exam.workflow_note ?? undefined,
      parentViewable:
        exam.parentViewable != null ? !!exam.parentViewable : exam.parent_viewable != null ? !!exam.parent_viewable : undefined,
      parentViewableReason: exam.parentViewableReason ?? exam.parent_viewable_reason ?? undefined,
      parentCountdownDays:
        exam.parentCountdownDays != null
          ? Number(exam.parentCountdownDays)
          : exam.parent_countdown_days != null
            ? Number(exam.parent_countdown_days)
            : undefined,
      parentSubjectCount:
        exam.parentSubjectCount != null
          ? Number(exam.parentSubjectCount)
          : exam.parent_subject_count != null
            ? Number(exam.parent_subject_count)
            : undefined,
      parentAveragePercentage:
        exam.parentAveragePercentage != null
          ? Number(exam.parentAveragePercentage)
          : exam.parent_average_percentage != null
            ? Number(exam.parent_average_percentage)
            : undefined,
      parentOverallGrade: exam.parentOverallGrade ?? exam.parent_overall_grade ?? undefined,
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
      paperType: s.paperType ?? s.paper_type ?? undefined,
      invigilatorName: s.invigilatorName ?? s.invigilator_name ?? undefined,
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

  private transitionMockWorkflow(examId: number, state: string, note?: string): Observable<Exam> {
    const ex = this.exams.find(e => e.id === examId);
    if (!ex) {
      return throwError(() => new Error('Exam not found'));
    }
    ex.workflowState = state;
    ex.workflowNote = note?.trim() || undefined;
    if (state === 'PUBLISHED') {
      ex.resultsPublished = true;
    }
    return of(this.copyExam(ex)).pipe(delay(200));
  }
}
