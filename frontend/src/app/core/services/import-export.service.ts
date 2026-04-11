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
}

const MOCK_JOBS: ImportJobSummary[] = [
  {
    id: 9001,
    jobType: 'STUDENTS',
    status: 'COMPLETED',
    originalFilename: 'admissions-mock.zip',
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
    originalFilename: 'faculty-term2.zip',
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

  submitJob(jobType: string, file: File): Observable<JobSubmitResponse> {
    if (runtimeConfig.useMocks) {
      return of({
        jobId: 9100 + Math.floor(Math.random() * 89),
        status: 'QUEUED',
        totalRows: 1,
      }).pipe(delay(400));
    }
    const fd = new FormData();
    fd.append('jobType', jobType);
    fd.append('file', file);
    return this.api.postFormData<JobSubmitResponse>('/import-export/jobs', fd);
  }

  listJobs(page = 0, size = 20): Observable<PageResp<ImportJobSummary>> {
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
    return this.api.getPage<ImportJobSummary>(`/import-export/jobs?page=${page}&size=${size}`);
  }

  getJob(jobId: number): Observable<ImportJobSummary> {
    if (runtimeConfig.useMocks) {
      const j = MOCK_JOBS.find(x => x.id === jobId);
      return of(j ?? MOCK_JOBS[0]).pipe(delay(200));
    }
    return this.api.get<ImportJobSummary>(`/import-export/jobs/${jobId}`);
  }

  getLines(jobId: number, page = 0, size = 50): Observable<PageResp<ImportJobLine>> {
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
    return this.api.getPage<ImportJobLine>(`/import-export/jobs/${jobId}/lines?page=${page}&size=${size}`);
  }

  retryFailed(jobId: number): Observable<JobSubmitResponse> {
    if (runtimeConfig.useMocks) {
      return of({ jobId, status: 'QUEUED', totalRows: 1 }).pipe(delay(350));
    }
    return this.api.post<JobSubmitResponse>(`/import-export/jobs/${jobId}/retry-failed`, {});
  }

  downloadStudentsCsv(): Observable<Blob> {
    if (runtimeConfig.useMocks) {
      const csv =
        'firstname,lastname,email,classid,sectionid,admissionnumber,parentemail,notifycredentials\n' +
        'Riya,Banerjee,,1,,ADM-MOCK-1,parent@example.com,Y\n';
      return of(new Blob([csv], { type: 'text/csv' })).pipe(delay(200));
    }
    return this.api.getBlob('/import-export/export/students.csv');
  }

  downloadTeachersCsv(): Observable<Blob> {
    if (runtimeConfig.useMocks) {
      const csv =
        'firstname,lastname,email,createportal,portalrole\n' +
        'Meera,Iyer,m.iyer@school.com,Y,TEACHER\n';
      return of(new Blob([csv], { type: 'text/csv' })).pipe(delay(200));
    }
    return this.api.getBlob('/import-export/export/teachers.csv');
  }
}
