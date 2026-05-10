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

export interface ExportJobSummary {
  id: number;
  exportType: string;
  status: string;
  fileName: string | null;
  contentSizeBytes: number | null;
  rowCount: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string | null;
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
    payloadJson:
      '{"first_name":"Riya","last_name":"Banerjee","classname":"Class 6","primary_guardian_phone":"9876500000"}',
  },
  {
    id: 2,
    lineIndex: 1,
    status: 'FAILED',
    errorMessage: 'Admission number already exists: ADM123',
    entityType: null,
    entityId: null,
    payloadJson: '{"first_name":"Amit","last_name":"Das","admission_number":"ADM123","primary_guardian_phone":"9876500001"}',
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
        detectedHeaders: ['first_name', 'last_name', 'Student Email'],
        canonicalFields: ['first_name', 'last_name', 'student_email', 'primary_guardian_phone'],
        suggestedMapping: {
          Student_Email: 'student_email',
          first_name: 'first_name',
          last_name: 'last_name',
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
        'academic_year_id (R),import_mode (O),first_name (R),last_name (R),gender (O),date_of_birth (O),student_email (O),class_id (O),section_id (O),classname (R),sectionname (O),roll_number (O),admission_number (R),admission_date (O),primary_guardian_relation (O),primary_guardian_name (R),primary_guardian_email (O),primary_guardian_phone (R),parent_id (O),create_parent_portal (O),notify_credentials (O),address (O),blood_group (O)\n' +
        'CURRENT,UPSERT,Riya,Banerjee,,,,AUTO,AUTO,Class 6,,,ADM-MOCK-1,,,Parent Name,parent@example.com,9876500000,,Y,Y,,,\n';
      return of(new Blob([csv], { type: 'text/csv' })).pipe(delay(200));
    }
    return this.api.getBlob('/import-export/export/students.csv');
  }

  downloadTeachersCsv(): Observable<Blob> {
    if (runtimeConfig.useMocks) {
      const csv =
        'academic_year_id (R),import_mode (O),employee_code (R),first_name (R),last_name (R),phone (R),join_date (O),status (O),email (O),gender (O),dob (O),qualification (O),specialization (O),department (O),subjects (O),can_class_teacher (O),class_teacher_slot (O),create_portal (O),portal_password (O),portal_role (O),library_role (O),school_role_codes (O),notify_credentials (O),salary (O),bank_account_holder (O),bank_name (O),bank_account_number (O),bank_ifsc (O)\n' +
        'CURRENT,UPSERT,T001,Meera,Iyer,9876000001,2024-04-01,ACTIVE,m.iyer@school.com,,,,,Science,Science,N,,Y,,TEACHER,,ACADEMIC_STAFF,N,45000,Meera Iyer,HDFC Bank,1234567890,HDFC0000001\n';
      return of(new Blob([csv], { type: 'text/csv' })).pipe(delay(200));
    }
    return this.api.getBlob('/import-export/export/teachers.csv');
  }

  createExportJob(exportType: 'STUDENTS' | 'TEACHERS' | 'STAFF' | 'FEE_STRUCTURES', schoolCode?: string | null): Observable<ExportJobSummary> {
    if (runtimeConfig.useMocks) {
      return of({
        id: 5000 + Math.floor(Math.random() * 500),
        exportType,
        status: 'QUEUED',
        fileName: null,
        contentSizeBytes: null,
        rowCount: null,
        errorMessage: null,
        startedAt: null,
        finishedAt: null,
        createdAt: new Date().toISOString(),
      }).pipe(delay(200));
    }
    const path = schoolCode?.trim()
      ? `/import-export/export-jobs?exportType=${encodeURIComponent(exportType)}&schoolCode=${encodeURIComponent(schoolCode.trim().toUpperCase())}`
      : `/import-export/export-jobs?exportType=${encodeURIComponent(exportType)}`;
    return this.api.post<ExportJobSummary>(path, {});
  }

  getExportJob(jobId: number, schoolCode?: string | null): Observable<ExportJobSummary> {
    if (runtimeConfig.useMocks) {
      return of({
        id: jobId,
        exportType: 'STUDENTS',
        status: 'COMPLETED',
        fileName: 'canonical-students.csv',
        contentSizeBytes: 2048,
        rowCount: 50,
        errorMessage: null,
        startedAt: new Date(Date.now() - 3000).toISOString(),
        finishedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 5000).toISOString(),
      }).pipe(delay(200));
    }
    return this.api.getParams<ExportJobSummary>(`/import-export/export-jobs/${jobId}`, {
      schoolCode: schoolCode?.trim().toUpperCase() || undefined,
    });
  }

  downloadExportJobCsv(jobId: number, schoolCode?: string | null): Observable<Blob> {
    if (runtimeConfig.useMocks) {
      return of(new Blob(['first_name,last_name\nDemo,User\n'], { type: 'text/csv' })).pipe(delay(120));
    }
    return this.api.getBlobParams(`/import-export/export-jobs/${jobId}/download`, {
      schoolCode: schoolCode?.trim().toUpperCase() || undefined,
    });
  }

  /** Per-job enriched CSV (canonical columns + meta); same permission as job list. */
  downloadNormalizedJobCsv(jobId: number, schoolCode?: string | null): Observable<Blob> {
    if (runtimeConfig.useMocks) {
      const csv =
        'import_line_index,import_line_status,import_line_entity_type,import_line_entity_id,import_ledger_outcome,import_error_message,academic_year_id,import_mode,admission_number,admission_date,roll_number,first_name,last_name,gender,date_of_birth,student_email,class_id,section_id,classname,sectionname,primary_guardian_relation,primary_guardian_name,primary_guardian_email,primary_guardian_phone,parent_code,parent_id,create_parent_portal,notify_credentials,address,blood_group\n' +
        '0,SUCCESS,STUDENT,501,CREATED,,,UPSERT,ADM-1,,,Riya,Banerjee,,,,,,,,,,,,PARENT01,9001,,,,\n';
      return of(new Blob([csv], { type: 'text/csv' })).pipe(delay(200));
    }
    return this.api.getBlobParams(`/import-export/jobs/${jobId}/download-normalized-csv`, {
      schoolCode: schoolCode?.trim().toUpperCase() || undefined,
    });
  }
}
