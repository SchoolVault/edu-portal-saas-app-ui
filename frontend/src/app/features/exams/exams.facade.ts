import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, concatMap, from, map, toArray } from 'rxjs';
import { ExamModuleConfigKey } from '../../core/models/models';
import { ExamService } from '../../core/services/exam.service';

type ModuleConfigDraft = Record<ExamModuleConfigKey, string>;

@Injectable({ providedIn: 'root' })
export class ExamsFacade {
  private readonly draft$ = new BehaviorSubject<ModuleConfigDraft>({
    GRADING_SCHEMA: '{}',
    REPORT_CARD_SCHEMA: '{}',
    WORKFLOW_SCHEMA: '{}',
    AI_SCHEMA: '{}',
  });

  constructor(private readonly examService: ExamService) {}

  get configDraft$(): Observable<ModuleConfigDraft> {
    return this.draft$.asObservable();
  }

  get currentDraft(): ModuleConfigDraft {
    return this.draft$.value;
  }

  setDraft(next: ModuleConfigDraft): void {
    this.draft$.next(next);
  }

  loadConfigs(academicYearId: number): Observable<ModuleConfigDraft> {
    return this.examService.getModuleConfigs(academicYearId).pipe(
      map(rows => {
        const next: ModuleConfigDraft = { ...this.draft$.value };
        for (const row of rows) {
          const key = (row.configKey || '').toUpperCase() as ExamModuleConfigKey;
          if (key in next) {
            next[key] = JSON.stringify(row.config ?? {}, null, 2);
          }
        }
        this.draft$.next(next);
        return next;
      })
    );
  }

  saveConfigs(academicYearId: number, draft: ModuleConfigDraft): Observable<void> {
    const keys: ExamModuleConfigKey[] = ['GRADING_SCHEMA', 'REPORT_CARD_SCHEMA', 'WORKFLOW_SCHEMA', 'AI_SCHEMA'];
    return from(keys).pipe(
      concatMap(key => {
        const payload = JSON.parse(draft[key] || '{}') as Record<string, unknown>;
        return this.examService.upsertModuleConfig(key, academicYearId, payload);
      }),
      toArray(),
      map(() => void 0)
    );
  }

  applyBoardPreset(board: 'CBSE' | 'ICSE' | 'STATE'): ModuleConfigDraft {
    const next: ModuleConfigDraft = { ...this.draft$.value };
    if (board === 'CBSE') {
      next.GRADING_SCHEMA = JSON.stringify({
        scale: 'percentage',
        passPercent: 33,
        bands: [
          { grade: 'A1', min: 91 },
          { grade: 'A2', min: 81 },
          { grade: 'B1', min: 71 },
          { grade: 'B2', min: 61 },
          { grade: 'C1', min: 51 },
          { grade: 'C2', min: 41 },
          { grade: 'D', min: 33 },
          { grade: 'E', min: 0 }
        ]
      }, null, 2);
      next.REPORT_CARD_SCHEMA = JSON.stringify({
        theme: 'cbse-clean',
        sections: [
          {
            key: 'header',
            title: 'Report Header',
            layout: 'list',
            fields: [
              { key: 'generatedAt', label: 'Generated At', format: 'title', visible: true, order: 1 },
              { key: 'subjectCount', label: 'Subjects Count', format: 'number', visible: true, order: 2 }
            ]
          },
          {
            key: 'scholastic',
            title: 'Scholastic Performance',
            layout: 'table',
            columns: [
              { key: 'subjectName', label: 'Subject', visible: true, order: 1 },
              { key: 'marksObtained', label: 'Marks', visible: true, order: 2 },
              { key: 'maxMarks', label: 'Max', visible: true, order: 3 },
              { key: 'grade', label: 'Grade', visible: true, order: 4 }
            ]
          },
          {
            key: 'totals',
            title: 'Overall Summary',
            layout: 'badges',
            fields: [
              { key: 'overallPercentage', label: 'Overall %', format: 'percent', visible: true, order: 1 },
              { key: 'overallGrade', label: 'Grade', visible: true, order: 2 },
              { key: 'totalMarks', label: 'Scored', format: 'number', visible: true, order: 3 },
              { key: 'totalMaxMarks', label: 'Total', format: 'number', visible: true, order: 4 }
            ]
          },
          {
            key: 'remarks',
            title: 'Teacher Remarks',
            layout: 'remarks',
            fields: [{ key: 'remark', label: 'Remark', visible: true, order: 1 }]
          }
        ],
        showRank: false,
        showAttendance: true,
        localeFormats: { en: 'dd-MMM-yyyy', hi: 'dd-MM-yyyy' }
      }, null, 2);
    } else if (board === 'ICSE') {
      next.GRADING_SCHEMA = JSON.stringify({
        scale: 'percentage',
        passPercent: 35,
        bands: [
          { grade: 'A', min: 90 },
          { grade: 'B', min: 80 },
          { grade: 'C', min: 70 },
          { grade: 'D', min: 60 },
          { grade: 'E', min: 50 },
          { grade: 'F', min: 35 },
          { grade: 'G', min: 0 }
        ]
      }, null, 2);
      next.REPORT_CARD_SCHEMA = JSON.stringify({
        theme: 'icse-modern',
        sections: [
          { key: 'header', title: 'Header', layout: 'list' },
          {
            key: 'subjectSummary',
            title: 'Subject Summary',
            layout: 'table',
            columns: [
              { key: 'subjectName', label: 'Subject', visible: true, order: 1 },
              { key: 'marksObtained', label: 'Score', visible: true, order: 2 },
              { key: 'maxMarks', label: 'Out Of', visible: true, order: 3 },
              { key: 'grade', label: 'Band', visible: true, order: 4 }
            ]
          },
          { key: 'totals', title: 'Term Summary', layout: 'badges' },
          { key: 'remarks', title: 'Class Teacher Note', layout: 'remarks' }
        ],
        showRank: true,
        showAttendance: true,
        localeFormats: { en: 'dd-MMM-yyyy', hi: 'dd-MM-yyyy' }
      }, null, 2);
    } else {
      next.GRADING_SCHEMA = JSON.stringify({
        scale: 'percentage',
        passPercent: 35,
        bands: [
          { grade: 'A+', min: 90 },
          { grade: 'A', min: 80 },
          { grade: 'B+', min: 70 },
          { grade: 'B', min: 60 },
          { grade: 'C', min: 50 },
          { grade: 'D', min: 35 },
          { grade: 'E', min: 0 }
        ]
      }, null, 2);
      next.REPORT_CARD_SCHEMA = JSON.stringify({
        theme: 'state-board',
        sections: [
          { key: 'header', title: 'Header', layout: 'list' },
          {
            key: 'subjects',
            title: 'Subjects',
            layout: 'table',
            columns: [
              { key: 'subjectName', label: 'Subject', visible: true, order: 1 },
              { key: 'marksObtained', label: 'Marks', visible: true, order: 2 },
              { key: 'maxMarks', label: 'Max Marks', visible: true, order: 3 },
              { key: 'grade', label: 'Grade', visible: true, order: 4 }
            ]
          },
          { key: 'totals', title: 'Totals', layout: 'badges' },
          { key: 'teacherRemarks', title: 'Teacher Remarks', layout: 'remarks' }
        ],
        showRank: true,
        showAttendance: true,
        localeFormats: { en: 'dd-MM-yyyy', hi: 'dd-MM-yyyy' }
      }, null, 2);
    }
    this.draft$.next(next);
    return next;
  }
}
