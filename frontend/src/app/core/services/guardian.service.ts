import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

export interface CreateGuardianPayload {
  fullName: string;
  occupation?: string;
  primaryPhone?: string;
}

export interface CreateMappingPayload {
  guardianId: string;
  relationType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
  isPrimary?: boolean;
  isEmergencyContact?: boolean;
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

  addStudentMapping(studentId: string, body: CreateMappingPayload): Observable<void> {
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
}
