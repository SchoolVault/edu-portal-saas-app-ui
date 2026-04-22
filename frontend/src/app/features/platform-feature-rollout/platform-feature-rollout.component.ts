import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DEFAULT_PLATFORM_TENANT_FEATURES, PLATFORM_TENANT_FEATURE_KEYS } from '../../core/constants/platform-tenant-features';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { PlatformSchoolSummary } from '../../core/models/models';
import { PlatformService } from '../../core/services/platform.service';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';

@Component({
  selector: 'app-platform-feature-rollout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ErpPaginationComponent, TranslateModule],
  styles: [
    `
      .fr-hero {
        border-radius: var(--radius-lg, 12px);
        border: 1px solid var(--clr-border-light, #e8eef0);
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--clr-primary, #1b3a30) 10%, var(--clr-surface, #fff)) 0%,
          var(--clr-surface, #fff) 55%
        );
        padding: 1rem 1.1rem;
        margin-bottom: 1rem;
      }
      .fr-hero__title {
        font-size: 1.05rem;
        font-weight: 800;
        margin: 0 0 0.25rem;
        color: var(--clr-text-primary, #0f172a);
      }
      .fr-hero__meta {
        font-size: 12px;
        color: var(--clr-text-muted, #64748b);
      }
      .fr-feature-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.65rem 0;
        border-bottom: 1px solid var(--clr-border-light, #e8eef0);
      }
      .fr-feature-rows {
        min-height: 280px;
      }
      .fr-feature-row:last-of-type {
        border-bottom: none;
      }
      .fr-effective-card {
        border: 1px solid var(--clr-border-light, #e8eef0);
        border-radius: 12px;
        background: color-mix(in srgb, var(--clr-primary, #1b3a30) 4%, var(--clr-surface, #fff));
        padding: 0.75rem;
        margin-bottom: 0.9rem;
      }
      .fr-effective-title {
        font-size: 0.9rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
        color: var(--clr-text-primary, #0f172a);
      }
      .fr-effective-lead {
        font-size: 12px;
        color: var(--clr-text-muted, #64748b);
        margin-bottom: 0.55rem;
      }
      .fr-chip-group {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .fr-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 11px;
        font-weight: 700;
        border-radius: 999px;
        padding: 0.22rem 0.55rem;
        border: 1px solid transparent;
      }
      .fr-chip--enabled {
        background: color-mix(in srgb, var(--clr-success, #059669) 14%, var(--clr-surface, #fff));
        color: color-mix(in srgb, var(--clr-success, #059669) 80%, #0f172a 20%);
        border-color: color-mix(in srgb, var(--clr-success, #059669) 42%, transparent);
      }
      .fr-chip--disabled {
        background: color-mix(in srgb, var(--clr-warning, #d97706) 14%, var(--clr-surface, #fff));
        color: color-mix(in srgb, var(--clr-warning, #d97706) 78%, #0f172a 22%);
        border-color: color-mix(in srgb, var(--clr-warning, #d97706) 44%, transparent);
      }
      .fr-chip-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        background: color-mix(in srgb, var(--clr-surface, #fff) 86%, var(--clr-text-muted, #64748b) 14%);
        color: var(--clr-text-muted, #64748b);
      }
      .fr-section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.4rem;
        margin: 0.55rem 0 0.35rem;
      }
      .fr-section-head:first-of-type {
        margin-top: 0;
      }
      .fr-section-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: var(--clr-text-muted, #64748b);
      }
      .fr-toggle {
        position: relative;
        width: 44px;
        height: 24px;
        flex-shrink: 0;
      }
      .fr-toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .fr-toggle__ui {
        position: absolute;
        inset: 0;
        background: var(--clr-border, #cbd5e1);
        border-radius: 999px;
        transition: background 0.2s;
      }
      .fr-toggle__knob {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        background: var(--clr-surface);
        border-radius: 50%;
        transition: transform 0.2s;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
      }
      .fr-toggle input:checked + .fr-toggle__ui {
        background: var(--clr-success, #059669);
      }
      .fr-toggle input:checked + .fr-toggle__ui .fr-toggle__knob {
        transform: translateX(20px);
      }
      .fr-table-wrap {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        border-radius: 12px;
      }
      .fr-school-table {
        min-width: 560px;
      }
      @media (max-width: 767.98px) {
        .fr-feature-row {
          align-items: flex-start;
        }
      }
      @media (max-width: 575.98px) {
        .fr-school-table thead {
          display: none;
        }
        .fr-school-table {
          min-width: 0;
        }
        .fr-school-table tbody tr {
          display: block;
          border: 1px solid var(--clr-border-light, #e8eef0);
          border-radius: 12px;
          padding: 0.65rem;
          margin: 0 0 0.6rem;
          background: var(--clr-surface, #fff);
        }
        .fr-school-table tbody td {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          border: 0;
          padding: 0.3rem 0;
          text-align: right;
        }
        .fr-school-table tbody td::before {
          content: attr(data-label);
          color: var(--clr-text-muted);
          font-weight: 600;
          text-align: left;
        }
        .fr-feature-row {
          flex-direction: column;
          gap: 0.45rem;
        }
      }
    `,
  ],
  template: `
    <div data-testid="platform-feature-rollout">
      <div class="erp-filter-toolbar mb-4">
        <div>
          <div class="badge-erp badge-info mb-2">{{ 'featureRollout.badge' | translate }}</div>
          <h2 style="font-size: 26px; font-weight: 800;">{{ 'featureRollout.title' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'featureRollout.lead' | translate }}</p>
        </div>
        <div class="erp-filter-toolbar__actions">
          <a routerLink="/app/super-admin" class="btn-outline-erp btn-sm erp-filter-toolbar__action">{{ 'featureRollout.backPlatform' | translate }}</a>
          <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="reloadSchools()" [disabled]="loading">
            <i class="bi bi-arrow-clockwise"></i>
            {{ loading ? ('featureRollout.refreshing' | translate) : ('featureRollout.refresh' | translate) }}
          </button>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-6">
          <div class="erp-card">
            <div class="erp-card-header">
              <div>
                <h3 class="erp-card-title">{{ 'superAdmin.portfolio.title' | translate }}</h3>
                <p class="text-muted mb-0" style="font-size: 12px;">{{ 'featureRollout.schoolsHint' | translate }}</p>
              </div>
            </div>
            <div class="px-3 pt-3 pb-0">
              <div class="erp-filter-toolbar">
                <div class="erp-filter-toolbar__search">
                  <div>
                    <label class="erp-label small mb-1">{{ 'superAdmin.portfolio.search' | translate }}</label>
                    <input
                      type="search"
                      class="erp-input"
                      [(ngModel)]="schoolSearchInput"
                      (ngModelChange)="schoolSearch$.next($event)"
                      [placeholder]="'superAdmin.portfolio.searchPh' | translate"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="fr-table-wrap">
            <table class="erp-table fr-school-table">
              <thead>
                <tr>
                  <th>{{ 'superAdmin.portfolio.thSchool' | translate }}</th>
                  <th>{{ 'superAdmin.portfolio.thStatus' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="!loading && !schools.length">
                  <td colspan="2" class="text-muted text-center py-4">{{ 'featureRollout.noSchools' | translate }}</td>
                </tr>
                <tr
                  *ngFor="let school of schools"
                  (click)="selectSchool(school)"
                  style="cursor: pointer;"
                  [style.background]="selectedSchool?.tenantId === school.tenantId ? 'var(--clr-surface-alt)' : ''"
                >
                  <td [attr.data-label]="'superAdmin.portfolio.thSchool' | translate">
                    <div style="font-weight: 700;">{{ school.schoolName }}</div>
                    <div style="font-size: 12px; color: var(--clr-text-muted);">
                      {{ school.schoolCode }} · {{ school.tenantId }}
                    </div>
                  </td>
                  <td [attr.data-label]="'superAdmin.portfolio.thStatus' | translate">
                    <span class="badge-erp" [ngClass]="school.active ? 'badge-success' : 'badge-warning'">
                      {{ school.active ? ('superAdmin.status.active' | translate) : ('superAdmin.status.attention' | translate) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
            <app-erp-pagination
              *ngIf="schoolsTotal > 0"
              [totalElements]="schoolsTotal"
              [pageIndex]="schoolsPageIndex"
              [pageSize]="schoolsPageSize"
              (pageIndexChange)="onSchoolsPageIndexChange($event)"
              (pageSizeChange)="onSchoolsPageSizeChange($event)"
            />
          </div>
        </div>
        <div class="col-lg-6">
          <div class="erp-card" style="min-height: 420px;">
            <div class="erp-card-header pb-0">
              <div>
                <h3 class="erp-card-title">{{ 'superAdmin.features.panelTitle' | translate }}</h3>
                <p class="text-muted mb-0" style="font-size: 12px;">{{ 'superAdmin.features.panelLead' | translate }}</p>
              </div>
            </div>
            <div class="px-3 pb-3">
              <div *ngIf="!selectedSchool" class="empty-state" style="padding: 48px 12px;">
                <i class="bi bi-sliders"></i>
                <h3>{{ 'featureRollout.pickSchoolTitle' | translate }}</h3>
                <p>{{ 'featureRollout.pickSchoolLead' | translate }}</p>
              </div>
              <ng-container *ngIf="selectedSchool as sch">
                <div class="fr-hero">
                  <div class="fr-hero__title">{{ sch.schoolName }}</div>
                  <div class="fr-hero__meta">
                    <span class="me-2"><i class="bi bi-hash me-1"></i>{{ sch.schoolCode }}</span>
                    <span class="d-block mt-1"><i class="bi bi-hdd-network me-1"></i>{{ sch.tenantId }}</span>
                  </div>
                </div>
                <div class="fr-effective-card">
                  <div class="fr-effective-title">{{ 'featureRollout.effectiveTitle' | translate }}</div>
                  <div class="fr-effective-lead">{{ 'featureRollout.effectiveLead' | translate }}</div>

                  <div class="fr-section-head">
                    <span class="fr-section-label">{{ 'featureRollout.enabledModules' | translate }}</span>
                    <span class="fr-chip-count">{{ enabledModuleKeys.length }}</span>
                  </div>
                  <div class="fr-chip-group">
                    <span class="fr-chip fr-chip--enabled" *ngFor="let key of enabledModuleKeys">
                      <i class="bi bi-check-circle-fill"></i>
                      {{ ('superAdmin.features.modules.' + key + '.name') | translate }}
                    </span>
                  </div>

                  <div class="fr-section-head mt-2">
                    <span class="fr-section-label">{{ 'featureRollout.disabledModules' | translate }}</span>
                    <span class="fr-chip-count">{{ disabledModuleKeys.length }}</span>
                  </div>
                  <div class="fr-chip-group">
                    <span class="fr-chip fr-chip--disabled" *ngFor="let key of disabledModuleKeys">
                      <i class="bi bi-pause-circle-fill"></i>
                      {{ ('superAdmin.features.modules.' + key + '.name') | translate }}
                    </span>
                    <span *ngIf="!disabledModuleKeys.length" class="text-muted small">
                      {{ 'featureRollout.noneDisabled' | translate }}
                    </span>
                  </div>
                </div>
                <div class="fr-feature-rows">
                  <div *ngFor="let key of pagedModuleKeys" class="fr-feature-row">
                    <div>
                      <div style="font-weight: 600;">{{ ('superAdmin.features.modules.' + key + '.name') | translate }}</div>
                      <div style="font-size: 12px; color: var(--clr-text-muted);">
                        {{ ('superAdmin.features.modules.' + key + '.description') | translate }}
                      </div>
                    </div>
                    <label class="fr-toggle mb-0">
                      <input type="checkbox" [ngModel]="schoolFeatureDraft[key]" (ngModelChange)="setSchoolFeature(key, $event)" />
                      <span class="fr-toggle__ui"><span class="fr-toggle__knob"></span></span>
                    </label>
                  </div>
                </div>
                <app-erp-pagination
                  *ngIf="featureModuleCount > featuresPageSize"
                  [totalElements]="featureModuleCount"
                  [pageIndex]="featuresPageIndex"
                  [pageSize]="featuresPageSize"
                  [showSizeChanger]="false"
                  [maxPageButtons]="5"
                  (pageIndexChange)="onFeaturesPageIndexChange($event)"
                />
                <div class="d-flex flex-wrap gap-2 align-items-center mt-3 pt-2" style="border-top: 1px solid var(--clr-border-light);">
                  <button type="button" class="btn-primary-erp" (click)="saveSchoolFeatures()" [disabled]="schoolFeatureSaving">
                    {{ schoolFeatureSaving ? ('superAdmin.features.saving' | translate) : ('superAdmin.features.save' | translate) }}
                  </button>
                  <span *ngIf="hasUnsavedFeatureChanges" class="badge-erp badge-warning">{{ 'featureRollout.unsavedChanges' | translate }}</span>
                  <span *ngIf="schoolFeatureMsg" class="text-success small">{{ schoolFeatureMsg }}</span>
                  <span *ngIf="schoolFeatureErr" class="text-danger small">{{ schoolFeatureErr }}</span>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PlatformFeatureRolloutComponent implements OnInit {
  schools: PlatformSchoolSummary[] = [];
  schoolsTotal = 0;
  schoolsPageIndex = 0;
  schoolsPageSize = DEFAULT_ERP_PAGE_SIZE;
  schoolQuery = '';
  schoolSearchInput = '';
  readonly schoolSearch$ = new Subject<string>();
  selectedSchool: PlatformSchoolSummary | null = null;
  readonly platformModuleKeys: readonly string[] = PLATFORM_TENANT_FEATURE_KEYS;
  /** Fixed page size for module toggles (keeps the right panel compact). */
  readonly featuresPageSize = 6;
  featuresPageIndex = 0;
  schoolFeatureDraft: Record<string, boolean> = {};
  loadedSchoolFeatures: Record<string, boolean> = {};
  schoolFeatureSaving = false;
  schoolFeatureMsg = '';
  schoolFeatureErr = '';
  loading = false;
  private pendingTenantId: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  get featureModuleCount(): number {
    return this.platformModuleKeys.length;
  }

  /** Keys for the current page of the feature matrix (stable order from {@link PLATFORM_TENANT_FEATURE_KEYS}). */
  get pagedModuleKeys(): string[] {
    const start = this.featuresPageIndex * this.featuresPageSize;
    return this.platformModuleKeys.slice(start, start + this.featuresPageSize);
  }

  get enabledModuleKeys(): string[] {
    return this.platformModuleKeys.filter(k => this.schoolFeatureDraft[k] !== false);
  }

  get disabledModuleKeys(): string[] {
    return this.platformModuleKeys.filter(k => this.schoolFeatureDraft[k] === false);
  }

  get hasUnsavedFeatureChanges(): boolean {
    for (const k of this.platformModuleKeys) {
      if (!!this.schoolFeatureDraft[k] !== !!this.loadedSchoolFeatures[k]) {
        return true;
      }
    }
    return false;
  }

  onFeaturesPageIndexChange(idx: number): void {
    this.featuresPageIndex = Math.max(0, idx);
    this.cdr.markForCheck();
  }

  constructor(
    private platformService: PlatformService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(q => {
      const tid = (q['tenantId'] || '').toString().trim();
      this.pendingTenantId = tid || null;
      this.trySelectPendingTenant();
    });
    this.schoolSearch$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(q => {
        this.schoolQuery = (q || '').trim();
        this.schoolsPageIndex = 0;
        this.loadSchoolsPage();
      });
    this.reloadSchools();
  }

  reloadSchools(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.schoolsPageIndex = 0;
    this.platformService.getSchoolsPage(0, this.schoolsPageSize, this.schoolQuery || undefined).subscribe({
      next: page => {
        this.schools = page.content;
        this.schoolsTotal = page.totalElements;
        this.schoolsPageIndex = page.page;
        this.loading = false;
        this.trySelectPendingTenant();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadSchoolsPage(): void {
    this.platformService.getSchoolsPage(this.schoolsPageIndex, this.schoolsPageSize, this.schoolQuery || undefined).subscribe({
      next: page => {
        this.schools = page.content;
        this.schoolsTotal = page.totalElements;
        this.schoolsPageIndex = page.page;
        this.trySelectPendingTenant();
        this.cdr.markForCheck();
      },
    });
  }

  private trySelectPendingTenant(): void {
    if (!this.pendingTenantId || !this.schools.length) {
      return;
    }
    if (this.selectedSchool?.tenantId === this.pendingTenantId) {
      this.pendingTenantId = null;
      return;
    }
    const match = this.schools.find(s => s.tenantId === this.pendingTenantId);
    if (match) {
      this.selectSchool(match);
      this.pendingTenantId = null;
    }
  }

  onSchoolsPageIndexChange(idx: number): void {
    this.schoolsPageIndex = idx;
    this.loadSchoolsPage();
  }

  onSchoolsPageSizeChange(size: number): void {
    this.schoolsPageSize = size;
    this.schoolsPageIndex = 0;
    this.loadSchoolsPage();
  }

  selectSchool(school: PlatformSchoolSummary): void {
    this.selectedSchool = school;
    this.featuresPageIndex = 0;
    this.schoolFeatureMsg = '';
    this.schoolFeatureErr = '';
    const cur = this.route.snapshot.queryParamMap.get('tenantId');
    if (cur !== school.tenantId) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tenantId: school.tenantId },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    this.loadSchoolFeatures();
  }

  setSchoolFeature(key: string, enabled: boolean): void {
    this.schoolFeatureDraft = { ...this.schoolFeatureDraft, [key]: enabled };
    this.schoolFeatureMsg = '';
  }

  private loadSchoolFeatures(): void {
    if (!this.selectedSchool) {
      this.schoolFeatureDraft = {};
      this.loadedSchoolFeatures = {};
      return;
    }
    this.platformService.getSchoolTenantFeatures(this.selectedSchool.tenantId).subscribe({
      next: f => {
        const next: Record<string, boolean> = { ...(f || {}) };
        for (const k of this.platformModuleKeys) {
          if (next[k] === undefined) {
            next[k] = DEFAULT_PLATFORM_TENANT_FEATURES[k as keyof typeof DEFAULT_PLATFORM_TENANT_FEATURES];
          }
        }
        this.schoolFeatureDraft = next;
        this.loadedSchoolFeatures = { ...next };
        this.cdr.markForCheck();
      },
      error: () => {
        this.schoolFeatureErr = this.translate.instant('superAdmin.features.loadErr');
        this.cdr.markForCheck();
      },
    });
  }

  saveSchoolFeatures(): void {
    if (!this.selectedSchool) {
      return;
    }
    this.schoolFeatureSaving = true;
    this.schoolFeatureMsg = '';
    this.schoolFeatureErr = '';
    const patch: Record<string, boolean> = {};
    for (const k of this.platformModuleKeys) {
      patch[k] = !!this.schoolFeatureDraft[k];
    }
    this.platformService.patchSchoolTenantFeatures(this.selectedSchool.tenantId, patch).subscribe({
      next: () => {
        this.schoolFeatureSaving = false;
        this.loadedSchoolFeatures = { ...this.schoolFeatureDraft };
        this.schoolFeatureMsg = this.translate.instant('superAdmin.features.saved');
        this.cdr.markForCheck();
      },
      error: () => {
        this.schoolFeatureSaving = false;
        this.schoolFeatureErr = this.translate.instant('superAdmin.features.saveErr');
        this.cdr.markForCheck();
      },
    });
  }
}
