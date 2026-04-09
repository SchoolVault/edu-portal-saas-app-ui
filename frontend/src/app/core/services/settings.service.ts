import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SchoolBranch, TenantConfig } from '../models/models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

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
    if (environment.useMocks) {
      const base: TenantConfig = {
        id: '1',
        schoolName: 'SchoolVault Academy',
        schoolCode: 'SCH001',
        address: '123 Education Lane, Knowledge City',
        phone: '+91-9876009834',
        email: 'schoolvault@gmail.com',
        primaryColor: '#1B3A30',
        secondaryColor: '#C05C3D',
        features: {},
        tenantId: 't1'
      };
      return of({ ...base, ...readMockTenant() });
    }
    return this.api.get<TenantConfig>('/settings');
  }

  update(config: Partial<TenantConfig>): Observable<TenantConfig> {
    if (environment.useMocks) {
      writeMockTenant(config);
      return this.get();
    }
    return this.api.put<TenantConfig>('/settings', config);
  }

  listBranches(schoolCode?: string): Observable<SchoolBranch[]> {
    const code = (schoolCode ?? '').trim() || 'SCH001';
    if (environment.useMocks) {
      return of([
        {
          tenantId: 't1',
          schoolName: 'SchoolVault Academy — Main campus',
          schoolCode: code,
          address: '123 Education Lane, Knowledge City',
          phone: '+91-9876009834',
          email: 'main@schoolvault.edu',
          currentTenant: true
        },
        {
          tenantId: 't-branch-east',
          schoolName: 'SchoolVault Academy — East wing',
          schoolCode: code,
          address: '88 Riverside Road, Knowledge City',
          phone: '+91-9876009900',
          email: 'east@schoolvault.edu',
          currentTenant: false
        },
        {
          tenantId: 't-branch-north',
          schoolName: 'SchoolVault Academy — North junior',
          schoolCode: code,
          address: '2 Oak Avenue, Knowledge City',
          phone: '+91-9876009911',
          email: 'north@schoolvault.edu',
          currentTenant: false
        }
      ]);
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
