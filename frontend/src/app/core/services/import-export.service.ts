import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ApiService, PageResp } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

export interface ImportJobSummary {
  id: number;
  jobType: string;
  status: string;
  originalFilename: string | null;
  totalRows: number;
  successCount: number;
  failCount: number;
  startedAt: string | null;
  finishedAt: string | null;
  summaryMessage: string | null;
  createdAt: string | null;
  /** SHA-256 hex of raw upload bytes (when present). */
  payloadHash?: string | null;
  /** BEST_EFFORT | ALL_OR_NOTHING */
  executionMode?: string | null;
  /** True when job was intentionally queued as a corrective reprocess run. */
  reprocessRequested?: boolean;
}

export interface ImportJobLine {
  id: number;
  lineIndex: number;
  status: string;
  errorMessage: string | null;
  entityType: string | null;
  entityId: number | null;
  payloadJson: string | null;
}

export interface JobSubmitResponse {
  jobId: number;
  status: string;
  totalRows: number;
  executionMode?: string | null;
  /** True when server returned an existing QUEUED/RUNNING job for the same file hash. */
  idempotentReplay?: boolean;
  payloadHash?: string | null;
  advisoryMessage?: string | null;
}

export interface DryRunRowError {
  lineIndex: number;
  errorCode?: string;
  message: string;
  dedupeKey?: string;
}

export interface DryRunResponse {
  jobType: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  advisoryMessage?: string | null;
  sampleErrors: DryRunRowError[];
  importBlocked?: boolean;
  importBlockCode?: string | null;
  importBlockMessage?: string | null;
  createOnlyDuplicateRatio?: number;
  createOnlyEvaluatedRows?: number;
  createOnlyCollisionRows?: number;
}

export interface ImportLedgerLine {
  id: number;
  jobLineId: number | null;
  lineIndex: number;
  outcome: string;
  entityType: string | null;
  entityId: number | null;
  naturalKey: string | null;
  rollbackGuidance: string | null;
  createdAt: string | null;
}

export interface RollbackBundleResponse {
  jobId: number;
  ledgerRowCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  suggestedOperatorSteps: string[];
}

/** Response from POST /import-export/jobs/preview-headers */
export interface FileHeaderPreview {
  jobType: string;
  detectedHeaders: string[];
  canonicalFields: string[];
  /** file header (lowercase) → canonical field key */
  suggestedMapping: Record<string, string>;
}

/** GET /import-export/metrics/summary — tenant activity; JVM metrics use meterNamespaceHint → Prometheus. */
export interface ImportMetricsSummary {
  jobsCreatedLast24h: number;
  jobsCompletedLast24h: number;
  jobsFailedLast24h: number;
  jobsRunningNow: number;
  rowsSucceededLast24h: number;
  rowsFailedLast24h: number;
  meterNamespaceHint?: string | null;
}

const MOCK_JOBS: ImportJobSummary[] = [
  {
    id: 9001,
    jobType: 'STUDENTS',
    status: 'COMPLETED',
    originalFilename: 'admissions-mock.xlsx',
    totalRows: 120,
    successCount: 118,
    failCount: 2,
    startedAt: new Date(Date.now() - 3_600_000).toISOString(),
    finishedAt: new Date(Date.now() - 3_540_000).toISOString(),
    summaryMessage: 'Processed 120 row(s): 118 succeeded, 2 failed.',
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: 9002,
    jobType: 'TEACHERS',
    status: 'QUEUED',
    originalFilename: 'faculty-term2.csv',
    totalRows: 0,
    successCount: 0,
    failCount: 0,
    startedAt: null,
    finishedAt: null,
    summaryMessage: null,
    createdAt: new Date().toISOString(),
  },
];

const MOCK_LINES: ImportJobLine[] = [
  {
    id: 1,
    lineIndex: 0,
    status: 'SUCCESS',
    errorMessage: null,
    entityType: 'STUDENT',
    entityId: 501,
    payloadJson: '{"firstname":"Riya","lastname":"Banerjee","classid":"1"}',
  },
  {
    id: 2,
    lineIndex: 1,
    status: 'FAILED',
    errorMessage: 'Admission number already exists: ADM123',
    entityType: null,
    entityId: null,
    payloadJson: '{"firstname":"Amit","lastname":"Das","admissionnumber":"ADM123"}',
  },
];

@Injectable({ providedIn: 'root' })
export class ImportExportService {
  constructor(private api: ApiService) {}

  getMetricsSummary(schoolCode?: string | null): Observable<ImportMetricsSummary> {
    if (runtimeConfig.useMocks) {
      return of({
        jobsCreatedLast24h: 14,
        jobsCompletedLast24h: 12,
        jobsFailedLast24h: 1,
        jobsRunningNow: 1,
        rowsSucceededLast24h: 4520,
        rowsFailedLast24h: 18,
        meterNamespaceHint: 'school.import',
      }).pipe(delay(200));
    }
    return this.api.getParams<ImportMetricsSummary>('/import-export/metrics/summary', {
      schoolCode: schoolCode?.trim().toUpperCase() || undefined,
    });
  }

  previewHeaders(jobType: string, file: File, schoolCode?: string | null): Observable<FileHeaderPreview> {
    if (runtimeConfig.useMocks) {
      return of({
        jobType,
        detectedHeaders: ['first_name', 'last_name', 'email_address'],
        canonicalFields: ['firstname', 'lastname', 'email', 'phone'],
        suggestedMapping: {
          first_name: 'firstname',
          last_name: 'lastname',
          email_address: 'email',
        },
      }).pipe(delay(280));
    }
    const fd = new FormData();
    fd.append('jobType', jobType);
    fd.append('file', file);
    if (schoolCode && schoolCode.trim().length > 0) {
      fd.append('schoolCode', schoolCode.trim().toUpperCase());
    }
    return this.api.postFormData<FileHeaderPreview>('/import-export/jobs/preview-headers', fd);
  }

  dryRun(jobType: string, file: File, columnMappingJson?: string | null, schoolCode?: string | null): Observable<DryRunResponse> {
    if (runtimeConfig.useMocks) {
      return of({
        jobType,
        totalRows: 3,
        validRows: 2,
        invalidRows: 1,
        importBlocked: false,
        createOnlyEvaluatedRows: 0,
        createOnlyCollisionRows: 0,
        sampleErrors: [{ lineIndex: 2, message: 'Class not found for this year: Class 99' }],
      }).pipe(delay(350));
    }
    const fd = new FormData();
    fd.append('jobType', jobType);
    fd.append('file', file);
    if (columnMappingJson) {
      fd.append('columnMappingJson', columnMappingJson);
    }
    if (schoolCode && schoolCode.trim().length > 0) {
      fd.append('schoolCode', schoolCode.trim().toUpperCase());
    }
    return this.api.postFormData<DryRunResponse>('/import-export/jobs/dry-run', fd);
  }

  submitJob(
    jobType: string,
    file: File,
    columnMappingJson?: string | null,
    schoolCode?: string | null,
    executionMode?: string | null,
    reprocess?: boolean
  ): Observable<JobSubmitResponse> {
    if (runtimeConfig.useMocks) {
      return of({
        jobId: 9100 + Math.floor(Math.random() * 89),
        status: 'QUEUED',
        totalRows: 1,
        executionMode: executionMode || 'BEST_EFFORT',
      }).pipe(delay(400));
    }
    const fd = new FormData();
    fd.append('jobType', jobType);
    fd.append('file', file);
    if (columnMappingJson) {
      fd.append('columnMappingJson', columnMappingJson);
    }
    if (executionMode && executionMode.trim()) {
      fd.append('executionMode', executionMode.trim().toUpperCase());
    }
    if (schoolCode && schoolCode.trim().length > 0) {
      fd.append('schoolCode', schoolCode.trim().toUpperCase());
    }
    if (reprocess === true) {
      fd.append('reprocess', 'true');
    }
    return this.api.postFormData<JobSubmitResponse>('/import-export/jobs', fd);
  }

  listJobs(page = 0, size = 20, schoolCode?: string | null): Observable<PageResp<ImportJobSummary>> {
    if (runtimeConfig.useMocks) {
      return of({
        content: MOCK_JOBS,
        page,
        size,
        totalElements: MOCK_JOBS.length,
        totalPages: 1,
        first: true,
        last: true,
      }).pipe(delay(300));
    }
    return this.api.getPageParams<ImportJobSummary>('/import-export/jobs', {
      page,
      size,
      schoolCode: schoolCode?.trim().toUpperCase() || undefined,
    });
  }

  getJob(jobId: number, schoolCode?: string | null): Observable<ImportJobSummary> {
    if (runtimeConfig.useMocks) {
      const j = MOCK_JOBS.find(x => x.id === jobId);
      return of(j ?? MOCK_JOBS[0]).pipe(delay(200));
    }
    return this.api.getParams<ImportJobSummary>(`/import-export/jobs/${jobId}`, {
      schoolCode: schoolCode?.trim().toUpperCase() || undefined,
    });
  }

  getLines(jobId: number, page = 0, size = 50, schoolCode?: string | null): Observable<PageResp<ImportJobLine>> {
    if (runtimeConfig.useMocks) {
      return of({
        content: MOCK_LINES,
        page,
        size,
        totalElements: MOCK_LINES.length,
        totalPages: 1,
        first: true,
        last: true,
      }).pipe(delay(250));
    }
    return this.api.getPageParams<ImportJobLine>(`/import-export/jobs/${jobId}/lines`, {
      page,
      size,
      schoolCode: schoolCode?.trim().toUpperCase() || undefined,
    });
  }

  getLedger(jobId: number, page = 0, size = 100, schoolCode?: string | null): Observable<PageResp<ImportLedgerLine>> {
    if (runtimeConfig.useMocks) {
      return of({
        content: [
          {
            id: 1,
            jobLineId: 10,
            lineIndex: 0,
            outcome: 'CREATED',
            entityType: 'STUDENT',
            entityId: 501,
            naturalKey: 'ADM:1001',
            rollbackGuidance: 'A new entity was created — remove in directory if needed.',
            createdAt: new Date().toISOString(),
          },
        ],
        page,
        size,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      }).pipe(delay(200));
    }
    return this.api.getPageParams<ImportLedgerLine>(`/import-export/jobs/${jobId}/ledger`, {
      page,
      size,
      schoolCode: schoolCode?.trim().toUpperCase() || undefined,
    });
  }

  getRollbackBrief(jobId: number, schoolCode?: string | null): Observable<RollbackBundleResponse> {
    if (runtimeConfig.useMocks) {
      return of({
        jobId,
        ledgerRowCount: 1,
        createdCount: 1,
        updatedCount: 0,
        skippedCount: 0,
        suggestedOperatorSteps: [
          'This screen summarizes what the import did.',
          'For created rows, remove or edit records in the app if the import was a mistake.',
        ],
      }).pipe(delay(200));
    }
    return this.api.getParams<RollbackBundleResponse>(`/import-export/jobs/${jobId}/rollback-brief`, {
      schoolCode: schoolCode?.trim().toUpperCase() || undefined,
    });
  }

  retryFailed(jobId: number, schoolCode?: string | null): Observable<JobSubmitResponse> {
    if (runtimeConfig.useMocks) {
      return of({ jobId, status: 'QUEUED', totalRows: 1 }).pipe(delay(350));
    }
    const normalizedSchoolCode = schoolCode?.trim().toUpperCase();
    const path = normalizedSchoolCode
      ? `/import-export/jobs/${jobId}/retry-failed?schoolCode=${encodeURIComponent(normalizedSchoolCode)}`
      : `/import-export/jobs/${jobId}/retry-failed`;
    return this.api.post<JobSubmitResponse>(path, {});
  }

  downloadStudentsCsv(): Observable<Blob> {
    if (runtimeConfig.useMocks) {
      const csv =
        'firstname,lastname,email,phone,dateofbirth,gender,classid,sectionid,classname,sectionname,academicyearid,rollnumber,admissionnumber,admissiondate,parentid,parentname,parentemail,parentphone,notifycredentials,importmode,address,bloodgroup\n' +
        'Riya,Banerjee,,,,,1,,,,,ADM-MOCK-1,,,,,parent@example.com,9876500000,Y,UPSERT,,\n';
      return of(new Blob([csv], { type: 'text/csv' })).pipe(delay(200));
    }
    return this.api.getBlob('/import-export/export/students.csv');
  }

  downloadTeachersCsv(): Observable<Blob> {
    if (runtimeConfig.useMocks) {
      const csv =
        'firstname,lastname,email,phone,qualification,specialization,joindate,salary,subjects,createportal,portalrole,libraryrole,importmode,bankaccountholder,bankname,bankaccountnumber,bankifsc,notifycredentials\n' +
        'Meera,Iyer,m.iyer@school.com,,,,,,,Y,TEACHER,,UPSERT,,,,N\n';
      return of(new Blob([csv], { type: 'text/csv' })).pipe(delay(200));
    }
    return this.api.getBlob('/import-export/export/teachers.csv');
  }
}
