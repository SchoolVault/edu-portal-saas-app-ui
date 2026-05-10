import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

export interface CreateGuardianPayload {
  fullName: string;
  occupation?: string;
  primaryPhone?: string;
  emailsJson?: string;
  phonesJson?: string;
}

export interface CreateMappingPayload {
  guardianId: string;
  relationType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
  isPrimary?: boolean;
  isEmergencyContact?: boolean;
}

export interface UpdateGuardianPayload {
  fullName?: string;
  occupation?: string;
  primaryPhone?: string;
  emailsJson?: string;
  phonesJson?: string;
}

export interface UpdateMappingPayload {
  relationType?: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
  isPrimary?: boolean;
  isEmergencyContact?: boolean;
}

export interface GuardianLookup {
  id: string;
  fullName: string;
  primaryPhone?: string;
}

@Injectable({ providedIn: 'root' })
export class GuardianService {
  constructor(private api: ApiService) {}

  createGuardian(body: CreateGuardianPayload): Observable<{ id: string }> {
    if (runtimeConfig.useMocks) {
      return throwError(() => new Error('Guardian API disabled in mock mode'));
    }
    return this.api.post<any>('/guardians', body).pipe(map(g => ({ id: String(g.id) })));
  }

  addStudentMapping(studentId: number, body: CreateMappingPayload): Observable<void> {
    if (runtimeConfig.useMocks) {
      return throwError(() => new Error('Guardian API disabled in mock mode'));
    }
    return this.api.post<void>(`/students/${studentId}/guardian-mappings`, {
      guardianId: Number(body.guardianId),
      relationType: body.relationType,
      isPrimary: body.isPrimary ?? false,
      isEmergencyContact: body.isEmergencyContact ?? false
    });
  }

  updateGuardian(guardianId: number, body: UpdateGuardianPayload): Observable<void> {
    if (runtimeConfig.useMocks) {
      return throwError(() => new Error('Guardian API disabled in mock mode'));
    }
    return this.api.put<void>(`/guardians/${guardianId}`, body);
  }

  updateStudentMapping(studentId: number, mappingId: number, body: UpdateMappingPayload): Observable<void> {
    if (runtimeConfig.useMocks) {
      return throwError(() => new Error('Guardian API disabled in mock mode'));
    }
    return this.api.put<void>(`/students/${studentId}/guardian-mappings/${mappingId}`, body);
  }

  removeStudentMapping(studentId: number, mappingId: number): Observable<void> {
    if (runtimeConfig.useMocks) {
      return throwError(() => new Error('Guardian API disabled in mock mode'));
    }
    return this.api.delete<void>(`/students/${studentId}/guardian-mappings/${mappingId}`);
  }

  searchByPhone(phone: string): Observable<GuardianLookup[]> {
    if (runtimeConfig.useMocks) {
      return throwError(() => new Error('Guardian API disabled in mock mode'));
    }
    return this.api
      .getParams<any[]>('/guardians/search', { phone })
      .pipe(
        map((rows: any[]) =>
          rows.map((r: any) => ({ id: String(r.id), fullName: r.fullName ?? '', primaryPhone: r.primaryPhone ?? '' }))
        )
      );
  }
}
