import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { MOCK_TENANT_CONFIG_DEFAULT, mockSchoolBranches } from '../mocks/settings.mock-data';
import { SchoolBranch, TenantConfig } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

const MOCK_TENANT_LS = 'erp_mock_tenant_general_v1';

function readMockTenant(): Partial<TenantConfig> {
  try {
    const raw = localStorage.getItem(MOCK_TENANT_LS);
    return raw ? (JSON.parse(raw) as Partial<TenantConfig>) : {};
  } catch {
    return {};
  }
}

function writeMockTenant(patch: Partial<TenantConfig>): void {
  try {
    const prev = readMockTenant();
    localStorage.setItem(MOCK_TENANT_LS, JSON.stringify({ ...prev, ...patch }));
  } catch {
    /* ignore */
  }
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private api: ApiService) {}

  get(): Observable<TenantConfig> {
    if (runtimeConfig.useMocks) {
      return of({ ...MOCK_TENANT_CONFIG_DEFAULT, ...readMockTenant() });
    }
    return this.api.get<TenantConfig>('/settings');
  }

  update(config: Partial<TenantConfig>): Observable<TenantConfig> {
    if (runtimeConfig.useMocks) {
      writeMockTenant(config);
      return this.get();
    }
    return this.api.put<TenantConfig>('/settings', config);
  }

  listBranches(schoolCode?: string): Observable<SchoolBranch[]> {
    const code = (schoolCode ?? '').trim() || 'SCH001';
    if (runtimeConfig.useMocks) {
      return of(mockSchoolBranches(code).map(b => ({ ...b })));
    }
    const q = schoolCode?.trim() ? `?schoolCode=${encodeURIComponent(schoolCode.trim())}` : '';
    return this.api.get<any[]>(`/settings/branches${q}`).pipe(
      map(list =>
        (list || []).map(b => ({
          tenantId: String(b.tenantId ?? ''),
          schoolName: b.schoolName ?? '',
          schoolCode: b.schoolCode ?? '',
          address: b.address ?? undefined,
          phone: b.phone ?? undefined,
          email: b.email ?? undefined,
          currentTenant: !!b.currentTenant
        }))
      )
    );
  }
}
