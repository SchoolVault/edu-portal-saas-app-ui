import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface TenantFinanceProfile {
  tenantId: string;
  feeSettlementMode: string;
  razorpayRouteLinkedAccountId?: string | null;
  razorpayRouteLinkedAccountMasked?: string | null;
  platformCommissionBps: number;
  financeNotes?: string | null;
  paymentRoutingOnboardingStatus?: string | null;
  paymentRoutingSubmittedAt?: string | null;
  paymentRoutingLiveAt?: string | null;
  paymentRoutingLiveByUserId?: number | null;
  paymentRoutingOnboardingDeclaration?: string | null;
  /** Per-school: allow parent Razorpay (etc.) checkout from parent portal. */
  parentOnlineFeeCheckoutEnabled?: boolean;
  /** In-app salary transfer via payout API; default off — use external bank run + mark paid. */
  payrollDigitalPayoutEnabled?: boolean;
}

export type LibraryBorrowerType = 'STUDENT' | 'STAFF' | 'GUARDIAN' | 'OTHER';

export interface LibraryBorrowerPolicy {
  allowedBorrowerTypes: LibraryBorrowerType[];
}
import { MOCK_TENANT_CONFIG_DEFAULT, mockSchoolBranches } from '../mocks/settings.mock-data';
import { SchoolBranch, TenantConfig } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

const MOCK_TENANT_LS = 'erp_mock_tenant_general_v1';

/** In-memory finance profile when `useMocks` (GET/PUT/submit/withdraw stay consistent). */
let mockFinanceProfileState: TenantFinanceProfile | null = null;

function mockFinanceProfileDefault(): TenantFinanceProfile {
  return {
    tenantId: 'mock-tenant',
    feeSettlementMode: 'OFFLINE_SCHOOL_COLLECTION',
    razorpayRouteLinkedAccountId: null,
    razorpayRouteLinkedAccountMasked: null,
    platformCommissionBps: 0,
    financeNotes: null,
    paymentRoutingOnboardingStatus: 'NOT_REQUIRED',
    paymentRoutingSubmittedAt: null,
    paymentRoutingLiveAt: null,
    paymentRoutingLiveByUserId: null,
    paymentRoutingOnboardingDeclaration: null,
    parentOnlineFeeCheckoutEnabled: false,
    payrollDigitalPayoutEnabled: false,
  };
}

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

  getFeatures(): Observable<Record<string, boolean>> {
    if (runtimeConfig.useMocks) {
      const t = readMockTenant();
      return of({ ...MOCK_TENANT_CONFIG_DEFAULT.features, ...(t.features || {}) }).pipe(delay(80));
    }
    return this.api.get<Record<string, boolean>>('/settings/features');
  }

  /** Merges with existing flags on the server (partial updates safe). */
  updateFeatures(flags: Record<string, boolean>): Observable<Record<string, boolean>> {
    if (runtimeConfig.useMocks) {
      const prev = readMockTenant();
      const merged = { ...MOCK_TENANT_CONFIG_DEFAULT.features, ...(prev.features || {}), ...flags };
      writeMockTenant({ ...prev, features: merged });
      return of({ ...merged }).pipe(delay(120));
    }
    return this.api.put<Record<string, boolean>>('/settings/features', flags);
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

  getFinanceProfile(): Observable<TenantFinanceProfile> {
    if (runtimeConfig.useMocks) {
      const row = { ...(mockFinanceProfileState ?? mockFinanceProfileDefault()) };
      return of(row).pipe(delay(40));
    }
    return this.api.get<TenantFinanceProfile>('/settings/finance-profile');
  }

  updateFinanceProfile(body: Partial<TenantFinanceProfile>): Observable<TenantFinanceProfile> {
    if (runtimeConfig.useMocks) {
      const prev = { ...(mockFinanceProfileState ?? mockFinanceProfileDefault()) };
      const merged = { ...prev, ...body, tenantId: prev.tenantId } as TenantFinanceProfile;
      merged.parentOnlineFeeCheckoutEnabled = merged.feeSettlementMode !== 'OFFLINE_SCHOOL_COLLECTION';
      if (merged.feeSettlementMode === 'ROUTE_LINKED_ACCOUNT') {
        merged.paymentRoutingOnboardingStatus =
          merged.paymentRoutingOnboardingStatus === 'LIVE' || merged.paymentRoutingOnboardingStatus === 'SUBMITTED'
            ? merged.paymentRoutingOnboardingStatus
            : 'DRAFT';
        if (merged.razorpayRouteLinkedAccountId) {
          const raw = merged.razorpayRouteLinkedAccountId;
          merged.razorpayRouteLinkedAccountMasked =
            raw.length > 10 ? `${raw.slice(0, 7)}…${raw.slice(-4)}` : 'acc_****';
        }
      } else {
        merged.paymentRoutingOnboardingStatus = 'NOT_REQUIRED';
        merged.paymentRoutingSubmittedAt = null;
        merged.paymentRoutingLiveAt = null;
        merged.paymentRoutingLiveByUserId = null;
        merged.paymentRoutingOnboardingDeclaration = null;
      }
      mockFinanceProfileState = merged;
      return of({ ...merged }).pipe(delay(60));
    }
    return this.api.put<TenantFinanceProfile>('/settings/finance-profile', body);
  }

  submitFinanceProfileForReview(declaration: string): Observable<TenantFinanceProfile> {
    if (runtimeConfig.useMocks) {
      const prev = { ...(mockFinanceProfileState ?? mockFinanceProfileDefault()) };
      const next: TenantFinanceProfile = {
        ...prev,
        paymentRoutingOnboardingStatus: 'SUBMITTED',
        paymentRoutingSubmittedAt: new Date().toISOString(),
        paymentRoutingOnboardingDeclaration: declaration.trim(),
      };
      mockFinanceProfileState = next;
      return of({ ...next }).pipe(delay(120));
    }
    return this.api.post<TenantFinanceProfile>('/settings/finance-profile/submit-for-review', { declaration });
  }

  withdrawFinanceProfileSubmission(): Observable<TenantFinanceProfile> {
    if (runtimeConfig.useMocks) {
      const prev = { ...(mockFinanceProfileState ?? mockFinanceProfileDefault()) };
      const next: TenantFinanceProfile = {
        ...prev,
        paymentRoutingOnboardingStatus: 'DRAFT',
        paymentRoutingSubmittedAt: null,
        paymentRoutingOnboardingDeclaration: null,
      };
      mockFinanceProfileState = next;
      return of({ ...next }).pipe(delay(100));
    }
    return this.api.post<TenantFinanceProfile>('/settings/finance-profile/withdraw-submission', {});
  }

  getLibraryBorrowerPolicy(): Observable<LibraryBorrowerPolicy> {
    if (runtimeConfig.useMocks) {
      const t = readMockTenant();
      const defaults: LibraryBorrowerPolicy = { allowedBorrowerTypes: ['STUDENT', 'STAFF'] };
      return of((t as any).libraryBorrowerPolicy ?? defaults).pipe(delay(60));
    }
    return this.api.get<LibraryBorrowerPolicy>('/settings/library/borrower-policy');
  }

  updateLibraryBorrowerPolicy(body: LibraryBorrowerPolicy): Observable<LibraryBorrowerPolicy> {
    if (runtimeConfig.useMocks) {
      const prev = readMockTenant();
      const next = {
        allowedBorrowerTypes: Array.from(new Set((body?.allowedBorrowerTypes ?? []).filter(Boolean))) as LibraryBorrowerType[],
      };
      writeMockTenant({ ...prev, libraryBorrowerPolicy: next } as any);
      return of(next).pipe(delay(90));
    }
    return this.api.put<LibraryBorrowerPolicy>('/settings/library/borrower-policy', body);
  }
}
