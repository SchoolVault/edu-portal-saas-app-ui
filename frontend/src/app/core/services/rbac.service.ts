import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import type {
  CreateCustomSchoolRoleRequest,
  RbacStaffUserRow,
  SchoolRoleRow,
  UpdateCustomSchoolRoleRequest,
  UserSchoolRoleAssignments,
} from '../models/rbac.model';
import {
  mockCreateCustomRole,
  mockDeleteCustomRole,
  mockGetPermissionCatalog,
  mockGetRbacCatalog,
  mockGetUserAssignments,
  mockListRbacStaff,
  mockReplaceAssignments,
  mockUpdateCustomRole,
} from '../mocks/rbac.mock-data';

/**
 * School responsibility roles (catalog + per-staff assignments). Backend: {@code /api/v1/rbac/*}.
 * Toggle {@link runtimeConfig.useRbacMocks} for the same DTOs from in-memory data.
 */
@Injectable({ providedIn: 'root' })
export class RbacService {
  constructor(private api: ApiService) {}

  getPermissionCatalog(): Observable<string[]> {
    if (runtimeConfig.useRbacMocks) {
      return of(mockGetPermissionCatalog()).pipe(delay(100));
    }
    return this.api.get<string[]>('/rbac/permission-catalog');
  }

  listSchoolRoleCatalog(): Observable<SchoolRoleRow[]> {
    if (runtimeConfig.useRbacMocks) {
      return of(mockGetRbacCatalog()).pipe(delay(200));
    }
    return this.api.get<SchoolRoleRow[]>('/rbac/roles');
  }

  listStaffUsers(): Observable<RbacStaffUserRow[]> {
    if (runtimeConfig.useRbacMocks) {
      return of(mockListRbacStaff()).pipe(delay(200));
    }
    return this.api.get<RbacStaffUserRow[]>('/rbac/staff');
  }

  getUserAssignments(userId: number): Observable<UserSchoolRoleAssignments> {
    if (runtimeConfig.useRbacMocks) {
      return of(mockGetUserAssignments(userId)).pipe(delay(150));
    }
    return this.api.get<UserSchoolRoleAssignments>(`/rbac/users/${userId}/assignments`);
  }

  replaceUserAssignments(userId: number, schoolRoleIds: number[]): Observable<UserSchoolRoleAssignments> {
    if (runtimeConfig.useRbacMocks) {
      return of(mockReplaceAssignments(userId, schoolRoleIds)).pipe(delay(250));
    }
    return this.api.put<UserSchoolRoleAssignments>(`/rbac/users/${userId}/assignments`, { schoolRoleIds });
  }

  createCustomSchoolRole(body: CreateCustomSchoolRoleRequest): Observable<SchoolRoleRow> {
    if (runtimeConfig.useRbacMocks) {
      return of(mockCreateCustomRole(body)).pipe(delay(200));
    }
    return this.api.post<SchoolRoleRow>('/rbac/roles/custom', body);
  }

  updateCustomSchoolRole(roleId: number, body: UpdateCustomSchoolRoleRequest): Observable<SchoolRoleRow> {
    if (runtimeConfig.useRbacMocks) {
      return of(mockUpdateCustomRole(roleId, body)).pipe(delay(200));
    }
    return this.api.put<SchoolRoleRow>(`/rbac/roles/${roleId}/custom`, body);
  }

  deleteCustomSchoolRole(roleId: number): Observable<void> {
    if (runtimeConfig.useRbacMocks) {
      return of(mockDeleteCustomRole(roleId)).pipe(delay(200));
    }
    return this.api.delete<void>(`/rbac/roles/${roleId}/custom`);
  }
}
