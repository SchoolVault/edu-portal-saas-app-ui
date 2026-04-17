import { ChangeDetectorRef, Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ProfileSummary, CacheClearResponse, PlatformSchoolSummary, CacheRegionOption } from '../../core/models/models';
import { runtimeConfig } from '../../core/config/runtime-config';
import { ProfilePhotoPickerComponent, ProfilePhotoPickEvent } from '../../shared/profile-photo-picker/profile-photo-picker.component';
import { PlatformService } from '../../core/services/platform.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { UserLocaleService, type UiLanguage } from '../../core/i18n/user-locale.service';

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, ProfilePhotoPickerComponent, FormsModule, TranslateModule],
  template: `
    <div class="platform-settings-root animate-in" data-testid="platform-settings-page">
      <div class="ps-hero erp-card mb-4">
        <div class="ps-hero__grid">
          <div class="ps-hero__titles">
            <div class="badge-erp badge-info mb-2">{{ 'platformSettingsPage.badge' | translate }}</div>
            <h2 class="ps-hero__title">{{ 'platformSettingsPage.title' | translate }}</h2>
            <p class="ps-hero__lead text-muted mb-0">
              {{ 'platformSettingsPage.heroLead' | translate }}
            </p>
          </div>
          <div class="ps-hero__accent" aria-hidden="true"></div>
        </div>
      </div>

      <div class="erp-tabs mb-3 ps-tabs">
        <button type="button" class="erp-tab" [class.active]="tab === 'profile'" (click)="tab = 'profile'">{{ 'platformSettingsPage.tabProfile' | translate }}</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'preferences'" (click)="tab = 'preferences'">{{ 'prefs.tab' | translate }}</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'appearance'" (click)="tab = 'appearance'">{{ 'platformSettingsPage.tabAppearance' | translate }}</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'console'" (click)="tab = 'console'">{{ 'platformSettingsPage.tabConsole' | translate }}</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'system'" (click)="tab = 'system'">{{ 'platformSettingsPage.tabSystem' | translate }}</button>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'profile'">
        <ng-container *ngIf="summary as s">
          <!-- Profile Header -->
          <div class="ps-profile-header">
            <div class="ps-profile-avatar-section">
              <app-profile-photo-picker
                [previewUrl]="profilePreviewUrl"
                [initials]="profileInitials"
                [frameAriaLabel]="'platformSettingsPage.photoAria' | translate"
                size="comfortable"
                statusMode="minimal"
                (photoPicked)="onOperatorPhotoPicked($event)"
                (photoRemoved)="onOperatorPhotoRemoved()"
              />
              <p class="ps-photo-hint">{{ operatorPhotoHint }}</p>
            </div>
            <div class="ps-profile-info">
              <div class="ps-profile-name-row">
                <div class="ps-profile-name-block">
                  <h3 class="ps-profile-name">{{ s.name }}</h3>
                  <p class="ps-profile-role">{{ 'platformSettingsPage.rolePlatformSuperAdmin' | translate }}</p>
                </div>
                <div class="ps-profile-edit-wrap">
                  <button
                    type="button"
                    class="btn-outline-erp btn-sm ps-profile-edit-btn"
                    (click)="toggleProfileEdit()">
                    <i class="bi" [ngClass]="profileEditMode ? 'bi-x-lg' : 'bi-pencil'"></i>
                    {{ profileEditMode ? ('platformSettingsPage.cancel' | translate) : ('platformSettingsPage.editProfile' | translate) }}
                  </button>
                </div>
              </div>
              <div class="ps-profile-badges">
                <span class="ps-badge" *ngIf="s.platformWorkspaceCount != null">
                  <i class="bi bi-buildings"></i>{{ 'platformSettingsPage.workspacesBadge' | translate: { count: s.platformWorkspaceCount } }}
                </span>
                <span class="ps-badge ps-badge--success" *ngIf="s.platformMfaEnabled">
                  <i class="bi bi-shield-check-fill"></i>{{ 'platformSettingsPage.mfaEnabled' | translate }}
                </span>
                <span class="ps-badge" *ngIf="s.platformLastLoginDisplay">
                  <i class="bi bi-clock-history"></i>{{ s.platformLastLoginDisplay }}
                </span>
              </div>
            </div>
          </div>

          <!-- View Mode -->
          <div class="ps-profile-content" *ngIf="!profileEditMode">
            <div class="ps-profile-section">
              <h5 class="ps-section-subtitle">{{ 'platformSettingsPage.personalInfo' | translate }}</h5>
              <div class="ps-info-grid">
                <div class="ps-info-item">
                  <span class="ps-info-label">{{ 'platformSettingsPage.email' | translate }}</span>
                  <span class="ps-info-value">{{ s.email }}</span>
                </div>
                <div class="ps-info-item" *ngIf="s.phone">
                  <span class="ps-info-label">{{ 'platformSettingsPage.phone' | translate }}</span>
                  <span class="ps-info-value">{{ s.phone }}</span>
                </div>
                <div class="ps-info-item" *ngIf="s.platformOperatorSince">
                  <span class="ps-info-label">{{ 'platformSettingsPage.operatorSince' | translate }}</span>
                  <span class="ps-info-value">{{ s.platformOperatorSince }}</span>
                </div>
                <div class="ps-info-item" *ngIf="s.platformTimezone">
                  <span class="ps-info-label">{{ 'platformSettingsPage.timezone' | translate }}</span>
                  <span class="ps-info-value">{{ s.platformTimezone }}</span>
                </div>
              </div>
            </div>

            <div class="ps-profile-section" *ngIf="s.schoolName || s.schoolEmail">
              <h5 class="ps-section-subtitle">
                <i class="bi bi-headset me-2"></i>{{ 'platformSettingsPage.operationsDesk' | translate }}
              </h5>
              <div class="ps-info-grid">
                <div class="ps-info-item" *ngIf="s.schoolName">
                  <span class="ps-info-label">{{ 'platformSettingsPage.deskLabel' | translate }}</span>
                  <span class="ps-info-value">{{ s.schoolName }}</span>
                </div>
                <div class="ps-info-item" *ngIf="s.schoolCode">
                  <span class="ps-info-label">{{ 'platformSettingsPage.deskCode' | translate }}</span>
                  <span class="ps-info-value"><code>{{ s.schoolCode }}</code></span>
                </div>
                <div class="ps-info-item" *ngIf="s.schoolEmail">
                  <span class="ps-info-label">{{ 'platformSettingsPage.deskEmail' | translate }}</span>
                  <span class="ps-info-value">{{ s.schoolEmail }}</span>
                </div>
                <div class="ps-info-item" *ngIf="s.schoolPhone">
                  <span class="ps-info-label">{{ 'platformSettingsPage.deskPhone' | translate }}</span>
                  <span class="ps-info-value">{{ s.schoolPhone }}</span>
                </div>
              </div>
            </div>

            <div class="ps-profile-footer">
              <i class="bi bi-info-circle me-2"></i>
              <span>{{ 'platformSettingsPage.idpFooter' | translate }}</span>
            </div>
          </div>

          <!-- Edit Mode -->
          <div class="ps-profile-content" *ngIf="profileEditMode">
            <form class="ps-profile-form" (ngSubmit)="saveProfileChanges()">
              <div class="ps-profile-section">
                <h5 class="ps-section-subtitle">{{ 'platformSettingsPage.editPersonalInfo' | translate }}</h5>
                <div class="ps-form-grid">
                  <div class="ps-form-field">
                    <label class="ps-form-label">{{ 'platformSettingsPage.fullName' | translate }}</label>
                    <input
                      type="text"
                      class="ps-form-input"
                      [(ngModel)]="profileEditData.name"
                      name="name"
                      required
                    />
                  </div>
                  <div class="ps-form-field">
                    <label class="ps-form-label">{{ 'platformSettingsPage.emailRequired' | translate }}</label>
                    <input
                      type="email"
                      class="ps-form-input"
                      [(ngModel)]="profileEditData.email"
                      name="email"
                      required
                    />
                  </div>
                  <div class="ps-form-field">
                    <label class="ps-form-label">{{ 'platformSettingsPage.phone' | translate }}</label>
                    <input
                      type="tel"
                      class="ps-form-input"
                      [(ngModel)]="profileEditData.phone"
                      name="phone"
                    />
                  </div>
                  <div class="ps-form-field">
                    <label class="ps-form-label">{{ 'platformSettingsPage.timezone' | translate }}</label>
                    <select class="ps-form-input" [(ngModel)]="profileEditData.timezone" name="timezone">
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="ps-profile-actions">
                <button type="button" class="btn-outline-erp" (click)="cancelProfileEdit()">
                  {{ 'platformSettingsPage.cancel' | translate }}
                </button>
                <button
                  type="submit"
                  class="btn-primary-erp"
                  [disabled]="profileSaving">
                  <i class="bi" [ngClass]="profileSaving ? 'bi-arrow-repeat spinner' : 'bi-check-lg'"></i>
                  {{ profileSaving ? ('platformSettingsPage.saving' | translate) : ('platformSettingsPage.saveChanges' | translate) }}
                </button>
              </div>
            </form>
          </div>
        </ng-container>
        <p *ngIf="!summary" class="text-muted text-center py-4">{{ 'platformSettingsPage.loadingProfile' | translate }}</p>
      </div>

      <div class="erp-card mb-4 ps-prefs-card animate-in" *ngIf="tab === 'preferences'">
        <header class="ps-prefs-card__header">
          <h3 class="ps-prefs-card__title">{{ 'prefs.heading' | translate }}</h3>
          <p class="ps-prefs-card__lead">{{ 'prefs.lead' | translate }}</p>
        </header>
        <div class="ps-prefs-card__body">
          <div class="erp-form-group">
            <label class="erp-label" for="platform-ui-lang">{{ 'prefs.fieldLabel' | translate }}</label>
            <select
              id="platform-ui-lang"
              class="erp-select ps-prefs-card__select"
              name="platformPrefsLang"
              [(ngModel)]="prefsLang"
              (ngModelChange)="onPrefsLangDraftChange()"
              [attr.aria-label]="'prefs.fieldLabel' | translate">
              <option *ngFor="let o of userLocale.supported" [value]="o.code">{{ o.nativeLabel }}</option>
            </select>
            <p class="text-muted small mb-0 mt-1">{{ 'prefs.fieldHelp' | translate }}</p>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2 mt-3">
            <button type="button" class="btn-primary-erp" (click)="savePreferences()" [disabled]="prefsSaving">
              {{ prefsSaving ? ('prefs.saving' | translate) : ('prefs.save' | translate) }}
            </button>
            <span *ngIf="prefsSaved" class="text-success small">{{ 'prefs.saved' | translate }}</span>
            <span *ngIf="prefsErr" class="text-danger small">{{ prefsErr }}</span>
          </div>
        </div>
      </div>

      <div class="erp-card mb-4 ps-appearance" *ngIf="tab === 'appearance'">
        <h4 class="ps-section-title">{{ 'platformSettingsPage.appearanceTitle' | translate }}</h4>
        <p class="text-muted small mb-3">
          {{ 'platformSettingsPage.appearanceLead' | translate }}
        </p>
        <div class="d-flex flex-wrap align-items-center gap-2 mb-4">
          <button type="button" class="btn-outline-erp btn-sm" (click)="theme.toggleTheme()">
            <i class="bi" [ngClass]="(theme.getTheme() === 'light') ? 'bi-moon-stars' : 'bi-sun'"></i>
            {{ theme.getTheme() === 'light' ? ('platformSettingsPage.darkMode' | translate) : ('platformSettingsPage.lightMode' | translate) }} {{ 'platformSettingsPage.modeSuffix' | translate }}
          </button>
        </div>

        <h5 class="ps-subtitle">{{ 'platformSettingsPage.consolePresetsTitle' | translate }}</h5>
        <p class="text-muted small mb-3">{{ 'platformSettingsPage.consolePresetsLead' | translate }}</p>
        <div class="ps-preset-row">
          <button
            type="button"
            class="ps-preset"
            *ngFor="let key of consolePresetKeys"
            (click)="applyPreset(key)"
          >
            <span class="ps-preset__sw" [style.background]="presetSwatch(key)"></span>
            <span class="ps-preset__label">{{ themeStatic.CONSOLE_PRESETS[key].label }}</span>
          </button>
        </div>
        <div class="mt-3 pt-3 ps-divider">
          <button type="button" class="btn-outline-erp btn-sm me-2" (click)="resetConsoleOnly()">{{ 'platformSettingsPage.resetConsoleColours' | translate }}</button>
          <button type="button" class="btn-outline-erp btn-xs" (click)="resetAllStoredColours()">{{ 'platformSettingsPage.clearBrandOverride' | translate }}</button>
        </div>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'console'">
        <h4 class="ps-section-title">{{ 'platformSettingsPage.consoleTitle' | translate }}</h4>
        <p class="text-muted small mb-3">{{ 'platformSettingsPage.consoleLead' | translate }}</p>
        <div class="ps-console-grid">
          <a routerLink="/app/super-admin" class="ps-console-item">
            <div class="ps-console-icon">
              <i class="bi bi-speedometer2"></i>
            </div>
            <div class="ps-console-text">
              <div class="ps-console-title">{{ 'platformSettingsPage.consoleOverviewTitle' | translate }}</div>
              <div class="ps-console-desc">{{ 'platformSettingsPage.consoleOverviewDesc' | translate }}</div>
            </div>
          </a>
          <a routerLink="/app/platform-schools" class="ps-console-item">
            <div class="ps-console-icon">
              <i class="bi bi-bank2"></i>
            </div>
            <div class="ps-console-text">
              <div class="ps-console-title">{{ 'platformSettingsPage.consoleSchoolsTitle' | translate }}</div>
              <div class="ps-console-desc">{{ 'platformSettingsPage.consoleSchoolsDesc' | translate }}</div>
            </div>
          </a>
          <a routerLink="/app/chat" class="ps-console-item">
            <div class="ps-console-icon">
              <i class="bi bi-chat-dots"></i>
            </div>
            <div class="ps-console-text">
              <div class="ps-console-title">{{ 'platformSettingsPage.consoleMessagesTitle' | translate }}</div>
              <div class="ps-console-desc">{{ 'platformSettingsPage.consoleMessagesDesc' | translate }}</div>
            </div>
          </a>
          <a routerLink="/app/platform-subscriptions" class="ps-console-item">
            <div class="ps-console-icon">
              <i class="bi bi-receipt"></i>
            </div>
            <div class="ps-console-text">
              <div class="ps-console-title">{{ 'platformSettingsPage.consoleSubsTitle' | translate }}</div>
              <div class="ps-console-desc">{{ 'platformSettingsPage.consoleSubsDesc' | translate }}</div>
            </div>
          </a>
          <a routerLink="/app/platform-broadcasts" class="ps-console-item">
            <div class="ps-console-icon">
              <i class="bi bi-megaphone"></i>
            </div>
            <div class="ps-console-text">
              <div class="ps-console-title">{{ 'platformSettingsPage.consoleBroadcastsTitle' | translate }}</div>
              <div class="ps-console-desc">{{ 'platformSettingsPage.consoleBroadcastsDesc' | translate }}</div>
            </div>
          </a>
          <a routerLink="/app/platform-health" class="ps-console-item">
            <div class="ps-console-icon">
              <i class="bi bi-heart-pulse"></i>
            </div>
            <div class="ps-console-text">
              <div class="ps-console-title">{{ 'platformSettingsPage.consoleHealthTitle' | translate }}</div>
              <div class="ps-console-desc">{{ 'platformSettingsPage.consoleHealthDesc' | translate }}</div>
            </div>
          </a>
        </div>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'system'">
        <h4 class="ps-section-title"><i class="bi bi-gear-wide-connected me-2"></i>{{ 'platformSettingsPage.systemTitle' | translate }}</h4>
        <p class="text-muted small mb-4">
          {{ 'platformSettingsPage.systemLead' | translate }}
        </p>

        <!-- Cache Management Section -->
        <div class="ps-system-section">
          <div class="ps-system-section__header">
            <div class="ps-system-section__icon">
              <i class="bi bi-database"></i>
            </div>
            <div class="ps-system-section__text">
              <h5 class="ps-system-section__title">{{ 'platformSettingsPage.cacheTitle' | translate }}</h5>
              <p class="ps-system-section__desc">
                {{ 'platformSettingsPage.cacheDesc' | translate }}
              </p>
            </div>
          </div>

          <div class="ps-system-section__body">
            <!-- Last Clear Info -->
            <div class="ps-cache-info" *ngIf="lastCacheCleared">
              <div class="ps-cache-info__item">
                <span class="ps-cache-info__label">{{ 'platformSettingsPage.lastCleared' | translate }}</span>
                <span class="ps-cache-info__value">{{ lastCacheCleared.clearedAt | date:'medium' }}</span>
              </div>
              <div class="ps-cache-info__item">
                <span class="ps-cache-info__label">{{ 'platformSettingsPage.scope' | translate }}</span>
                <span class="ps-cache-info__value">{{ lastCacheCleared.targetSchoolName || ('platformSettingsPage.allSchools' | translate) }}</span>
              </div>
              <div class="ps-cache-info__item">
                <span class="ps-cache-info__label">{{ 'platformSettingsPage.regionsClearedLabel' | translate }}</span>
                <span class="ps-cache-info__value">{{ lastCacheCleared.regionsCleared }}</span>
              </div>
              <div class="ps-cache-info__item">
                <span class="ps-cache-info__label">{{ 'platformSettingsPage.clearedBy' | translate }}</span>
                <span class="ps-cache-info__value">{{ lastCacheCleared.clearedBy }}</span>
              </div>
            </div>

            <!-- Cache Controls -->
            <div class="ps-cache-controls">
              <!-- School Selector -->
              <div class="ps-cache-control-group">
                <label class="ps-cache-label">
                  <i class="bi bi-building me-2"></i>{{ 'platformSettingsPage.targetSchool' | translate }}
                  <span class="ps-cache-label-hint">{{ 'platformSettingsPage.targetSchoolHint' | translate }}</span>
                </label>
                <div class="ps-school-selector-wrap">
                  <input
                    type="text"
                    class="ps-school-search"
                    [attr.placeholder]="'platformSettingsPage.searchSchoolsPh' | translate"
                    [(ngModel)]="cacheSchoolSearch"
                    (input)="onCacheSchoolSearchChange()"
                    (focus)="cacheSchoolDropdownOpen = true"
                  />
                  <button
                    type="button"
                    class="ps-school-clear-btn"
                    *ngIf="selectedCacheSchool"
                    (click)="clearCacheSchoolSelection()"
                    [attr.title]="'platformSettingsPage.clearSelectionTitle' | translate">
                    <i class="bi bi-x-lg"></i>
                  </button>
                  <div class="ps-school-dropdown" *ngIf="cacheSchoolDropdownOpen && filteredCacheSchools.length > 0">
                    <button
                      type="button"
                      class="ps-school-option"
                      *ngFor="let school of filteredCacheSchools"
                      (click)="selectCacheSchool(school)">
                      <div class="ps-school-option-main">
                        <span class="ps-school-option-name">{{ school.schoolName }}</span>
                        <span class="ps-school-option-code">{{ school.schoolCode }}</span>
                      </div>
                      <span class="ps-school-option-meta">{{ 'platformSettingsPage.studentsCount' | translate: { count: school.studentCount } }}</span>
                    </button>
                  </div>
                </div>
                <div class="ps-selected-school" *ngIf="selectedCacheSchool">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  <strong>{{ selectedCacheSchool.schoolName }}</strong>
                  <span class="text-muted ms-2">({{ selectedCacheSchool.schoolCode }})</span>
                </div>
              </div>

              <!-- Region Selector -->
              <div class="ps-cache-control-group">
                <label class="ps-cache-label">
                  <i class="bi bi-layers me-2"></i>{{ 'platformSettingsPage.cacheRegions' | translate }}
                  <span class="ps-cache-label-hint">{{ 'platformSettingsPage.cacheRegionsHint' | translate }}</span>
                </label>
                <div class="ps-region-mode-toggle">
                  <button
                    type="button"
                    class="ps-region-mode-btn"
                    [class.active]="cacheRegionMode === 'all'"
                    (click)="cacheRegionMode = 'all'; selectedCacheRegions = []">
                    <i class="bi bi-globe2"></i> {{ 'platformSettingsPage.allRegions' | translate }}
                  </button>
                  <button
                    type="button"
                    class="ps-region-mode-btn"
                    [class.active]="cacheRegionMode === 'specific'"
                    (click)="cacheRegionMode = 'specific'">
                    <i class="bi bi-filter"></i> {{ 'platformSettingsPage.selectSpecific' | translate }}
                  </button>
                </div>

                <div class="ps-region-container" *ngIf="cacheRegionMode === 'specific'">
                  <div class="ps-region-category" *ngFor="let cat of cacheRegionCategories">
                    <button
                      type="button"
                      class="ps-region-category-header"
                      [class.expanded]="isCategoryExpanded(cat)"
                      (click)="toggleCategory(cat)">
                      <i class="bi me-2" [ngClass]="getCategoryIcon(cat)"></i>
                      <span class="ps-region-category-title">{{ getCategoryLabel(cat) }}</span>
                      <span class="ps-region-category-count">({{ getCategorySelectedCount(cat) }}/{{ getCategoryTotalCount(cat) }})</span>
                      <i class="bi ms-auto ps-region-category-toggle" [ngClass]="isCategoryExpanded(cat) ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                    </button>
                    <div class="ps-region-list" *ngIf="isCategoryExpanded(cat)">
                      <label
                        class="ps-region-item"
                        [class.selected]="selectedCacheRegions.includes(region.name)"
                        *ngFor="let region of getVisibleRegionsForCategory(cat)">
                        <div class="ps-region-checkbox-wrapper">
                          <input
                            type="checkbox"
                            [id]="'cache-region-' + region.name"
                            [value]="region.name"
                            [checked]="selectedCacheRegions.includes(region.name)"
                            (change)="toggleCacheRegion(region.name)"
                          />
                          <span class="ps-region-checkbox-custom"></span>
                        </div>
                        <div class="ps-region-item-icon">
                          <i class="bi" [ngClass]="getRegionIcon(region.name)"></i>
                        </div>
                        <div class="ps-region-item-text">
                          <div class="ps-region-item-title">{{ region.label }}</div>
                          <div class="ps-region-item-desc">{{ region.description }}</div>
                        </div>
                        <div class="ps-region-item-check">
                          <i class="bi bi-check-circle-fill"></i>
                        </div>
                      </label>
                      <button
                        type="button"
                        class="ps-region-load-more"
                        *ngIf="hasMoreRegionsInCategory(cat)"
                        (click)="loadMoreRegionsForCategory(cat)">
                        <i class="bi bi-arrow-down-circle me-2"></i>
                        {{ 'platformSettingsPage.showMoreRegions' | translate: { count: getRemainingRegionsCount(cat) } }}
                      </button>
                    </div>
                  </div>
                </div>

                <div class="ps-region-summary" *ngIf="cacheRegionMode === 'specific' && selectedCacheRegions.length > 0">
                  <i class="bi bi-info-circle me-2"></i>
                  {{ 'platformSettingsPage.regionsSelected' | translate: { count: selectedCacheRegions.length } }}
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="ps-cache-actions">
              <button
                type="button"
                class="btn-primary-erp"
                (click)="confirmClearCache()"
                [disabled]="cacheClearing">
                <i class="bi" [ngClass]="cacheClearing ? 'bi-arrow-repeat spinner' : 'bi-trash3'"></i>
                {{ cacheClearing ? ('platformSettingsPage.clearingCache' | translate) : getCacheClearButtonLabel() }}
              </button>
              <span *ngIf="cacheSuccessMsg" class="ps-success-badge animate-in">
                <i class="bi bi-check-circle-fill"></i> {{ cacheSuccessMsg }}
              </span>
              <span *ngIf="cacheErrorMsg" class="text-danger small">
                <i class="bi bi-exclamation-circle-fill"></i> {{ cacheErrorMsg }}
              </span>
            </div>

            <!-- Warning Alert -->
            <div class="alert mb-0 mt-3" [ngClass]="getCacheWarningClass()" role="alert" style="font-size: 12px;">
              <i class="bi me-2" [ngClass]="getCacheWarningIcon()"></i>
              <strong>{{ getCacheWarningTitle() }}</strong> {{ getCacheWarningMessage() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 0;
    }
    .platform-settings-root {
      min-width: 0;
    }
    .ps-hero { padding: 0; overflow: hidden; border: 1px solid var(--clr-border-light); }
    .ps-hero__grid {
      display: grid;
      grid-template-columns: 1fr minmax(120px, 28%);
      gap: 0;
      align-items: stretch;
      min-height: 120px;
    }
    .ps-hero__titles { padding: 22px 24px; }
    .ps-hero__title { font-size: 26px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em; }
    .ps-hero__lead { font-size: 13px; max-width: 42rem; line-height: 1.55; }
    .ps-hero__accent {
      background: linear-gradient(145deg, color-mix(in srgb, var(--clr-primary) 55%, #0f172a), color-mix(in srgb, var(--clr-accent) 70%, #1e293b));
      opacity: 0.92;
    }
    @media (max-width: 640px) {
      .ps-hero__grid {
        grid-template-columns: 1fr;
      }
      .ps-hero__accent {
        min-height: 72px;
      }
      .ps-hero__titles {
        padding: 18px 16px;
      }
    }

    .ps-tabs {
      row-gap: 4px;
    }

    /* Profile Section */
    .ps-profile-header {
      display: flex;
      gap: 20px;
      padding: 24px;
      border-bottom: 1px solid var(--clr-border-light);
      background: var(--clr-surface-alt);
      align-items: flex-start;
      min-width: 0;
    }
    .ps-profile-avatar-section {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .ps-photo-hint {
      font-size: 11px;
      color: var(--clr-text-muted);
      text-align: center;
      max-width: 140px;
      line-height: 1.4;
    }
    .ps-profile-info {
      flex: 1;
      min-width: 0;
    }
    .ps-profile-name-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px 16px;
      margin-bottom: 12px;
      min-width: 0;
    }
    .ps-profile-name-block {
      flex: 1 1 12rem;
      min-width: 0;
      max-width: 100%;
    }
    .ps-profile-edit-wrap {
      flex: 0 1 auto;
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      min-width: 0;
    }
    .ps-profile-edit-btn {
      max-width: 100%;
      white-space: normal;
      text-align: center;
      line-height: 1.25;
    }
    @media (max-width: 576px) {
      .ps-profile-header {
        flex-direction: column;
        align-items: stretch;
        padding: 16px;
      }
      .ps-profile-avatar-section {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: flex-start;
        column-gap: 16px;
      }
      .ps-profile-name-row {
        flex-direction: column;
        align-items: stretch;
      }
      .ps-profile-edit-wrap {
        justify-content: stretch;
        width: 100%;
      }
      .ps-profile-edit-btn {
        width: 100%;
        justify-content: center;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }
    }
    .ps-profile-name {
      font-size: 20px;
      font-weight: 800;
      margin: 0 0 4px;
      letter-spacing: -0.01em;
      color: var(--clr-text);
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .ps-profile-role {
      font-size: 13px;
      font-weight: 600;
      color: var(--clr-text-secondary);
      margin: 0;
    }
    .ps-profile-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .ps-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      background: var(--clr-surface-muted);
      border: 1px solid var(--clr-border-light);
      font-size: 11px;
      font-weight: 600;
      color: var(--clr-text-secondary);
    }
    .ps-badge--success {
      background: color-mix(in srgb, var(--clr-success) 10%, var(--clr-surface));
      border-color: color-mix(in srgb, var(--clr-success) 30%, var(--clr-border-light));
      color: var(--clr-success);
    }

    .ps-profile-content {
      padding: 24px;
      min-width: 0;
    }
    @media (max-width: 576px) {
      .ps-profile-content {
        padding: 16px;
      }
    }
    .ps-profile-section {
      margin-bottom: 28px;
    }
    .ps-profile-section:last-child {
      margin-bottom: 0;
    }
    .ps-section-subtitle {
      font-size: 14px;
      font-weight: 800;
      color: var(--clr-text);
      margin: 0 0 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--clr-border-light);
    }

    .ps-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
      gap: 16px;
    }
    .ps-info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ps-info-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--clr-text-muted);
    }
    .ps-info-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--clr-text);
    }
    .ps-info-value code {
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background: var(--clr-surface-muted);
      font-size: 12px;
    }

    .ps-profile-footer {
      margin-top: 20px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      background: var(--clr-surface-muted);
      font-size: 12px;
      color: var(--clr-text-secondary);
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 8px;
      min-width: 0;
    }

    /* Profile Edit Form */
    .ps-profile-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .ps-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
      gap: 16px;
    }
    .ps-form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ps-form-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--clr-text);
    }
    .ps-form-input {
      padding: 10px 14px;
      border: 1px solid var(--clr-border-light);
      border-radius: var(--radius-md);
      background: var(--clr-surface);
      font-size: 14px;
      color: var(--clr-text);
      transition: border-color 0.15s ease;
    }
    .ps-form-input:focus {
      outline: none;
      border-color: var(--clr-primary);
    }
    .ps-profile-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid var(--clr-border-light);
    }
    @media (max-width: 420px) {
      .ps-profile-actions {
        flex-direction: column;
        align-items: stretch;
      }
      .ps-profile-actions .btn-outline-erp,
      .ps-profile-actions .btn-primary-erp {
        width: 100%;
        justify-content: center;
      }
    }
    .ps-section-title { font-size: 16px; font-weight: 800; margin-bottom: 12px; }
    .ps-subtitle { font-size: 13px; font-weight: 800; margin-bottom: 8px; }
    .ps-prefs-card {
      padding: 22px 24px;
    }
    .ps-prefs-card__header {
      margin-bottom: 1rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--clr-border-light);
    }
    .ps-prefs-card__title {
      font-size: 1.125rem;
      font-weight: 800;
      margin: 0 0 0.4rem;
      color: var(--clr-text);
      letter-spacing: -0.02em;
    }
    .ps-prefs-card__lead {
      margin: 0;
      font-size: 13px;
      font-weight: 500;
      color: var(--clr-text-secondary);
      line-height: 1.55;
    }
    .ps-prefs-card__body {
      max-width: 28rem;
    }
    .ps-prefs-card__select {
      max-width: min(100%, 16rem);
      font-weight: 600;
    }

    .ps-appearance { padding: 22px 24px; }
    .ps-divider { border-top: 1px solid var(--clr-border-light); }
    .ps-preset-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .ps-preset {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 10px 14px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--clr-border-light);
      background: var(--clr-surface-alt);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
      font-size: 13px; font-weight: 600; color: var(--clr-text-secondary);
    }
    .ps-preset:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
      border-color: color-mix(in srgb, var(--clr-accent) 40%, var(--clr-border-light));
    }
    .ps-preset__sw { width: 28px; height: 28px; border-radius: 8px; border: 2px solid var(--clr-surface); box-shadow: 0 0 0 1px var(--clr-border-light); }

    /* Console Grid */
    .ps-console-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
    }
    .ps-console-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border: 1px solid var(--clr-border-light);
      border-radius: var(--radius-md);
      background: var(--clr-surface);
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .ps-console-item:hover {
      border-color: var(--clr-primary);
      background: var(--clr-surface-alt);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
    .ps-console-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: var(--clr-surface-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: var(--clr-primary);
      flex-shrink: 0;
    }
    .ps-console-item:hover .ps-console-icon {
      background: color-mix(in srgb, var(--clr-primary) 15%, var(--clr-surface));
    }
    .ps-console-text {
      flex: 1;
      min-width: 0;
    }
    .ps-console-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--clr-text);
      margin-bottom: 2px;
    }
    .ps-console-desc {
      font-size: 12px;
      color: var(--clr-text-muted);
    }
    .ps-system-section {
      padding: 20px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--clr-border-light);
      background: var(--clr-surface-alt);
      margin-bottom: 20px;
    }
    .ps-system-section__header {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .ps-system-section__icon {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, color-mix(in srgb, var(--clr-primary) 10%, var(--clr-surface)), var(--clr-surface));
      border: 1px solid var(--clr-border-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: var(--clr-primary);
    }
    .ps-system-section__text { flex: 1; min-width: 0; }
    .ps-system-section__title {
      font-size: 15px;
      font-weight: 800;
      margin: 0 0 6px;
      color: var(--clr-text);
    }
    .ps-system-section__desc {
      font-size: 13px;
      line-height: 1.55;
      color: var(--clr-text-secondary);
      margin: 0;
    }
    .ps-system-section__body {
      padding: 16px 20px;
      border-radius: var(--radius-md);
      background: var(--clr-surface);
      border: 1px solid var(--clr-border-light);
    }
    .ps-cache-info {
      display: flex;
      flex-wrap: wrap;
      gap: 16px 24px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--clr-border-light);
    }
    .ps-cache-info__item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ps-cache-info__label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--clr-text-muted);
    }
    .ps-cache-info__value {
      font-size: 14px;
      font-weight: 700;
      color: var(--clr-text);
    }
    .ps-cache-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .ps-success-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--clr-success) 12%, var(--clr-surface));
      border: 1px solid color-mix(in srgb, var(--clr-success) 30%, var(--clr-border-light));
      color: var(--clr-success);
      font-size: 12px;
      font-weight: 700;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .spinner {
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    /* Cache Controls */
    .ps-cache-controls {
      display: flex;
      flex-direction: column;
      gap: 24px;
      margin-bottom: 20px;
    }
    .ps-cache-control-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .ps-cache-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--clr-text);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ps-cache-label-hint {
      font-size: 11px;
      font-weight: 500;
      color: var(--clr-text-muted);
      margin-left: 8px;
    }

    /* School Selector */
    .ps-school-selector-wrap {
      position: relative;
    }
    .ps-school-search {
      width: 100%;
      padding: 10px 40px 10px 14px;
      border: 1px solid var(--clr-border-light);
      border-radius: var(--radius-md);
      background: var(--clr-surface);
      font-size: 14px;
      transition: border-color 0.15s ease;
    }
    .ps-school-search:focus {
      outline: none;
      border-color: var(--clr-primary);
    }
    .ps-school-clear-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      border: none;
      background: var(--clr-surface-muted);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      color: var(--clr-text-muted);
      transition: background 0.15s ease, color 0.15s ease;
    }
    .ps-school-clear-btn:hover {
      background: var(--clr-danger);
      color: #fff;
    }
    .ps-school-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      max-height: 280px;
      overflow-y: auto;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border-light);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 100;
      animation: dropdown-appear 0.15s ease-out;
    }
    .ps-school-option {
      width: 100%;
      padding: 10px 14px;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid var(--clr-border-light);
      transition: background 0.12s ease;
    }
    .ps-school-option:last-child {
      border-bottom: none;
    }
    .ps-school-option:hover {
      background: color-mix(in srgb, var(--clr-primary) 8%, var(--clr-surface));
    }
    .ps-school-option-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ps-school-option-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--clr-text);
    }
    .ps-school-option-code {
      font-size: 11px;
      font-weight: 500;
      color: var(--clr-text-muted);
      font-family: monospace;
    }
    .ps-school-option-meta {
      font-size: 11px;
      color: var(--clr-text-muted);
    }
    .ps-selected-school {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--clr-success) 10%, var(--clr-surface));
      border: 1px solid color-mix(in srgb, var(--clr-success) 30%, var(--clr-border-light));
      font-size: 13px;
    }

    /* Region Selector */
    .ps-region-mode-toggle {
      display: flex;
      gap: 8px;
      padding: 4px;
      background: var(--clr-surface-muted);
      border-radius: var(--radius-md);
      width: fit-content;
    }
    .ps-region-mode-btn {
      padding: 8px 16px;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 600;
      color: var(--clr-text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ps-region-mode-btn:hover {
      color: var(--clr-text);
    }
    .ps-region-mode-btn.active {
      background: var(--clr-surface);
      color: var(--clr-primary);
      box-shadow: var(--shadow-sm);
    }
    .ps-region-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 16px;
    }
    .ps-region-category {
      border: 1px solid var(--clr-border-light);
      border-radius: var(--radius-lg);
      background: var(--clr-surface);
      overflow: hidden;
      transition: box-shadow 0.15s ease;
    }
    .ps-region-category:hover {
      box-shadow: var(--shadow-sm);
    }
    .ps-region-category-header {
      width: 100%;
      padding: 14px 16px;
      background: var(--clr-surface-alt);
      border: none;
      border-bottom: 1px solid var(--clr-border-light);
      font-size: 13px;
      font-weight: 700;
      color: var(--clr-text);
      display: flex;
      align-items: center;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
    }
    .ps-region-category-header:hover {
      background: color-mix(in srgb, var(--clr-primary) 5%, var(--clr-surface-alt));
    }
    .ps-region-category-header.expanded {
      background: color-mix(in srgb, var(--clr-primary) 8%, var(--clr-surface-alt));
    }
    .ps-region-category-title {
      flex: 1;
    }
    .ps-region-category-count {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: var(--clr-surface-muted);
      color: var(--clr-text-muted);
      margin-left: 8px;
    }
    .ps-region-category-toggle {
      font-size: 14px;
      color: var(--clr-text-muted);
      transition: transform 0.2s ease;
    }
    .ps-region-list {
      display: flex;
      flex-direction: column;
    }
    .ps-region-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--clr-border-light);
      cursor: pointer;
      transition: background 0.15s ease;
      position: relative;
    }
    .ps-region-item:last-child {
      border-bottom: none;
    }
    .ps-region-item:hover {
      background: var(--clr-surface-alt);
    }
    .ps-region-item.selected {
      background: color-mix(in srgb, var(--clr-primary) 5%, var(--clr-surface));
    }
    /* Custom Checkbox */
    .ps-region-checkbox-wrapper {
      position: relative;
      flex-shrink: 0;
    }
    .ps-region-checkbox-wrapper input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      width: 20px;
      height: 20px;
      cursor: pointer;
      z-index: 2;
    }
    .ps-region-checkbox-custom {
      display: block;
      width: 20px;
      height: 20px;
      border: 2px solid var(--clr-border-light);
      border-radius: var(--radius-md);
      background: var(--clr-surface);
      transition: all 0.15s ease;
      position: relative;
    }
    .ps-region-checkbox-custom::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 6px;
      width: 5px;
      height: 10px;
      border: solid #fff;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg) scale(0);
      transition: transform 0.15s ease;
    }
    .ps-region-checkbox-wrapper input[type="checkbox"]:checked ~ .ps-region-checkbox-custom {
      background: var(--clr-primary);
      border-color: var(--clr-primary);
    }
    .ps-region-checkbox-wrapper input[type="checkbox"]:checked ~ .ps-region-checkbox-custom::after {
      transform: rotate(45deg) scale(1);
    }
    .ps-region-checkbox-wrapper input[type="checkbox"]:hover ~ .ps-region-checkbox-custom {
      border-color: var(--clr-primary);
    }
    .ps-region-checkbox-wrapper input[type="checkbox"]:focus ~ .ps-region-checkbox-custom {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-primary) 20%, transparent);
    }
    .ps-region-item-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--clr-surface-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: var(--clr-primary);
      flex-shrink: 0;
    }
    .ps-region-item.selected .ps-region-item-icon {
      background: color-mix(in srgb, var(--clr-primary) 15%, var(--clr-surface));
      color: var(--clr-primary);
    }
    .ps-region-item-text {
      flex: 1;
      min-width: 0;
    }
    .ps-region-item-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--clr-text);
      margin-bottom: 2px;
    }
    .ps-region-item-desc {
      font-size: 12px;
      color: var(--clr-text-muted);
      line-height: 1.4;
    }
    .ps-region-item-check {
      font-size: 18px;
      color: var(--clr-success);
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    .ps-region-item.selected .ps-region-item-check {
      opacity: 1;
    }
    .ps-region-summary {
      padding: 12px 16px;
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--clr-primary) 8%, var(--clr-surface));
      border: 1px solid color-mix(in srgb, var(--clr-primary) 25%, var(--clr-border-light));
      font-size: 13px;
      color: var(--clr-text);
      display: flex;
      align-items: center;
      font-weight: 600;
    }
    .ps-region-load-more {
      width: 100%;
      padding: 10px 16px;
      border: none;
      border-top: 1px solid var(--clr-border-light);
      background: var(--clr-surface);
      color: var(--clr-primary);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ps-region-load-more:hover {
      background: var(--clr-surface-alt);
    }

    @keyframes dropdown-appear {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Dark Mode Support */
    :host-context(.dark-mode) .ps-console-icon,
    :host-context(.dark-mode) .ps-region-item-icon {
      background: color-mix(in srgb, var(--clr-primary) 20%, var(--clr-surface-muted));
      color: var(--clr-primary);
    }
    :host-context(.dark-mode) .ps-console-item:hover .ps-console-icon {
      background: color-mix(in srgb, var(--clr-primary) 30%, var(--clr-surface-muted));
    }
    :host-context(.dark-mode) .ps-region-item.selected .ps-region-item-icon {
      background: color-mix(in srgb, var(--clr-primary) 25%, var(--clr-surface-muted));
    }
    :host-context(.dark-mode) .ps-console-desc,
    :host-context(.dark-mode) .ps-region-item-desc,
    :host-context(.dark-mode) .ps-cache-label-hint {
      color: color-mix(in srgb, var(--clr-text-secondary) 85%, #fff);
    }
  `]
})
export class PlatformSettingsComponent implements OnInit, OnDestroy {
  private readonly subs = new Subscription();

  tab: 'profile' | 'preferences' | 'appearance' | 'console' | 'system' = 'profile';
  summary: ProfileSummary | null = null;

  prefsLang: UiLanguage = 'en';
  prefsSaving = false;
  prefsSaved = false;
  prefsErr = '';
  profilePreviewUrl: string | null = null;
  profileInitials = '';
  readonly themeStatic = ThemeService;
  readonly consolePresetKeys: string[] = Object.keys(ThemeService.CONSOLE_PRESETS);

  // Profile edit mode
  profileEditMode = false;
  profileSaving = false;
  profileEditData: any = {};

  // Cache management state
  cacheClearing = false;
  cacheSuccessMsg = '';
  cacheErrorMsg = '';
  lastCacheCleared: { regionsCleared: number; clearedAt: string; clearedBy: string; targetSchoolName?: string | null } | null = null;

  // Cache school selector
  cacheSchoolSearch = '';
  selectedCacheSchool: PlatformSchoolSummary | null = null;
  filteredCacheSchools: PlatformSchoolSummary[] = [];
  allCacheSchools: PlatformSchoolSummary[] = [];
  cacheSchoolDropdownOpen = false;

  // Cache region selector
  cacheRegionMode: 'all' | 'specific' = 'all';
  selectedCacheRegions: string[] = [];
  cacheRegionCategories = ['core', 'academic', 'operations', 'reports'];
  allCacheRegions: CacheRegionOption[] = [];
  expandedCategories: Set<string> = new Set(['core']); // Core expanded by default
  categoryPagination: Record<string, number> = { core: 5, academic: 5, operations: 5, reports: 5 };
  readonly REGIONS_PER_PAGE = 5;

  constructor(
    private auth: AuthService,
    public theme: ThemeService,
    private cdr: ChangeDetectorRef,
    private platformService: PlatformService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    readonly userLocale: UserLocaleService
  ) {}

  get operatorPhotoHint(): string {
    const key = runtimeConfig.useMocks ? 'platformSettingsPage.photoHintMock' : 'platformSettingsPage.photoHintLive';
    return this.translate.instant(key);
  }

  ngOnInit(): void {
    this.subs.add(
      this.translate.onLangChange.subscribe(() => this.cdr.markForCheck())
    );

    this.prefsLang = this.userLocale.readStored();
    const u = this.auth.getCurrentUser();
    if (u?.interfaceLocale === 'hi' || u?.interfaceLocale === 'en') {
      this.prefsLang = u.interfaceLocale === 'hi' ? 'hi' : 'en';
    }

    this.summary = this.auth.getProfileSummarySnapshot();
    this.refreshOperatorPhoto();
    this.subs.add(
      this.auth.fetchProfileSummary().subscribe({
        next: s => {
          this.summary = s;
          if (s.interfaceLocale === 'hi' || s.interfaceLocale === 'en') {
            this.prefsLang = s.interfaceLocale === 'hi' ? 'hi' : 'en';
          }
          this.cdr.markForCheck();
        },
        error: () => { /* keep snapshot */ }
      })
    );

    this.subs.add(
      this.platformService.getSchools().subscribe({
        next: schools => {
          this.allCacheSchools = schools;
          this.filteredCacheSchools = schools;
        },
        error: () => { /* silent fail */ }
      })
    );

    this.allCacheRegions = this.platformService.getCacheRegions();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onPrefsLangDraftChange(): void {
    this.prefsSaved = false;
    this.prefsErr = '';
  }

  savePreferences(): void {
    this.prefsSaving = true;
    this.prefsSaved = false;
    this.prefsErr = '';
    this.cdr.markForCheck();
    this.subs.add(
      this.auth.updateInterfacePreferences(this.prefsLang).subscribe({
        next: () => {
          this.prefsSaving = false;
          this.prefsSaved = true;
          this.cdr.markForCheck();
        },
        error: () => {
          this.prefsSaving = false;
          this.prefsErr = this.translate.instant('prefs.saveFailed');
          this.cdr.markForCheck();
        }
      })
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.ps-school-selector-wrap')) {
      this.cacheSchoolDropdownOpen = false;
    }
  }

  presetSwatch(key: string): string {
    const p = ThemeService.CONSOLE_PRESETS[key];
    if (!p) return '#ccc';
    return `linear-gradient(135deg, ${p.primary}, ${p.accent})`;
  }

  applyPreset(key: string): void {
    this.theme.applyConsolePreset(key);
  }

  resetConsoleOnly(): void {
    this.theme.resetConsolePaletteToDefaults();
  }

  resetAllStoredColours(): void {
    this.theme.resetConsolePaletteToDefaults();
    this.theme.resetBrandingToDefault();
  }

  private refreshOperatorPhoto(): void {
    this.profilePreviewUrl = this.auth.getStoredAvatarDataUrl();
    this.profileInitials = this.auth.getUserInitials();
  }

  onOperatorPhotoPicked(ev: ProfilePhotoPickEvent): void {
    this.auth.setMyProfileAvatarDataUrl(ev.dataUrl);
    this.refreshOperatorPhoto();
    this.cdr.markForCheck();
  }

  onOperatorPhotoRemoved(): void {
    this.auth.clearMyProfileAvatarDataUrl();
    this.refreshOperatorPhoto();
    this.cdr.markForCheck();
  }

  // Profile edit methods
  toggleProfileEdit(): void {
    if (!this.profileEditMode && this.summary) {
      // Entering edit mode - copy current data
      this.profileEditData = {
        name: this.summary.name,
        email: this.summary.email,
        phone: this.summary.phone || '',
        timezone: this.summary.platformTimezone || 'Asia/Kolkata'
      };
    }
    this.profileEditMode = !this.profileEditMode;
  }

  cancelProfileEdit(): void {
    this.profileEditMode = false;
    this.profileEditData = {};
  }

  saveProfileChanges(): void {
    if (!this.profileEditData.name || !this.profileEditData.email) {
      return;
    }

    this.profileSaving = true;
    this.cdr.markForCheck();

    // Simulate API call (replace with actual API when ready)
    setTimeout(() => {
      if (this.summary) {
        this.summary.name = this.profileEditData.name;
        this.summary.email = this.profileEditData.email;
        this.summary.phone = this.profileEditData.phone;
        this.summary.platformTimezone = this.profileEditData.timezone;
      }

      this.profileSaving = false;
      this.profileEditMode = false;
      this.profileEditData = {};
      this.cdr.markForCheck();

      // TODO: Call auth.updateProfile() when API ready
      // this.auth.updateProfile(this.profileEditData).subscribe(...)
    }, 1000);
  }

  // Cache school selector methods
  onCacheSchoolSearchChange(): void {
    const q = this.cacheSchoolSearch.toLowerCase().trim();
    this.filteredCacheSchools = q
      ? this.allCacheSchools.filter(s =>
          s.schoolName.toLowerCase().includes(q) || s.schoolCode.toLowerCase().includes(q)
        )
      : this.allCacheSchools;
    this.cacheSchoolDropdownOpen = true;
  }

  selectCacheSchool(school: PlatformSchoolSummary): void {
    this.selectedCacheSchool = school;
    this.cacheSchoolSearch = school.schoolName;
    this.cacheSchoolDropdownOpen = false;
    this.cdr.markForCheck();
  }

  clearCacheSchoolSelection(): void {
    this.selectedCacheSchool = null;
    this.cacheSchoolSearch = '';
    this.filteredCacheSchools = this.allCacheSchools;
    this.cdr.markForCheck();
  }

  // Cache region methods
  getCacheRegionsByCategory(category: string): CacheRegionOption[] {
    return this.allCacheRegions.filter(r => r.category === category);
  }

  toggleCacheRegion(regionName: string): void {
    const idx = this.selectedCacheRegions.indexOf(regionName);
    if (idx > -1) {
      this.selectedCacheRegions.splice(idx, 1);
    } else {
      this.selectedCacheRegions.push(regionName);
    }
  }

  // Category collapse/expand
  isCategoryExpanded(category: string): boolean {
    return this.expandedCategories.has(category);
  }

  toggleCategory(category: string): void {
    if (this.expandedCategories.has(category)) {
      this.expandedCategories.delete(category);
    } else {
      this.expandedCategories.add(category);
    }
  }

  // Category pagination
  getVisibleRegionsForCategory(category: string): CacheRegionOption[] {
    const all = this.getCacheRegionsByCategory(category);
    const limit = this.categoryPagination[category] || this.REGIONS_PER_PAGE;
    return all.slice(0, limit);
  }

  hasMoreRegionsInCategory(category: string): boolean {
    const all = this.getCacheRegionsByCategory(category);
    const shown = this.categoryPagination[category] || this.REGIONS_PER_PAGE;
    return all.length > shown;
  }

  getRemainingRegionsCount(category: string): number {
    const all = this.getCacheRegionsByCategory(category);
    const shown = this.categoryPagination[category] || this.REGIONS_PER_PAGE;
    return Math.max(0, all.length - shown);
  }

  loadMoreRegionsForCategory(category: string): void {
    const current = this.categoryPagination[category] || this.REGIONS_PER_PAGE;
    this.categoryPagination[category] = current + this.REGIONS_PER_PAGE;
  }

  getCategoryTotalCount(category: string): number {
    return this.getCacheRegionsByCategory(category).length;
  }

  getCategorySelectedCount(category: string): number {
    const categoryRegions = this.getCacheRegionsByCategory(category);
    return categoryRegions.filter(r => this.selectedCacheRegions.includes(r.name)).length;
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      core: 'platformSettingsPage.catCore',
      academic: 'platformSettingsPage.catAcademic',
      operations: 'platformSettingsPage.catOperations',
      reports: 'platformSettingsPage.catReports'
    };
    const k = map[category];
    return k ? this.translate.instant(k) : category;
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      core: 'bi-gear-fill',
      academic: 'bi-book-fill',
      operations: 'bi-clipboard-check-fill',
      reports: 'bi-graph-up'
    };
    return icons[category] || 'bi-box';
  }

  getRegionIcon(regionName: string): string {
    const icons: Record<string, string> = {
      referenceData: 'bi-database-fill',
      permissions: 'bi-shield-lock-fill',
      tenantConfig: 'bi-sliders',
      settingsSnapshot: 'bi-camera-fill',
      academicCatalog: 'bi-journal-text',
      studentDirectory: 'bi-people-fill',
      teacherDirectory: 'bi-person-badge-fill',
      timetableGrid: 'bi-calendar3',
      transportRoutes: 'bi-bus-front-fill',
      announcementPreviews: 'bi-megaphone-fill',
      libraryCatalog: 'bi-book-half',
      libraryIssues: 'bi-bookmark-check-fill',
      feesCatalog: 'bi-currency-dollar',
      reportResults: 'bi-file-earmark-bar-graph-fill',
      dashboardSnapshots: 'bi-speedometer2',
      payrollStructures: 'bi-wallet2'
    };
    return icons[regionName] || 'bi-box-seam';
  }

  getCacheClearButtonLabel(): string {
    const isGlobal = !this.selectedCacheSchool;
    const isAllRegions = this.cacheRegionMode === 'all' || this.selectedCacheRegions.length === 0;
    const n = this.selectedCacheRegions.length;
    const code = this.selectedCacheSchool?.schoolCode ?? '';

    if (isGlobal && isAllRegions) {
      return this.translate.instant('platformSettingsPage.cacheClearGlobalAll');
    }
    if (isGlobal) {
      return this.translate.instant('platformSettingsPage.cacheClearGlobalRegions', { regions: n });
    }
    if (isAllRegions) {
      return this.translate.instant('platformSettingsPage.cacheClearSchoolAll', { code });
    }
    return this.translate.instant('platformSettingsPage.cacheClearSchoolRegions', { regions: n, code });
  }

  getCacheWarningClass(): string {
    return !this.selectedCacheSchool ? 'alert-danger' : 'alert-warning';
  }

  getCacheWarningIcon(): string {
    return !this.selectedCacheSchool ? 'bi-exclamation-octagon-fill' : 'bi-exclamation-triangle-fill';
  }

  getCacheWarningTitle(): string {
    return !this.selectedCacheSchool
      ? this.translate.instant('platformSettingsPage.warnGlobalTitle')
      : this.translate.instant('platformSettingsPage.warnSchoolTitle');
  }

  getCacheWarningMessage(): string {
    if (!this.selectedCacheSchool) {
      return this.translate.instant('platformSettingsPage.warnGlobalBody');
    }
    return this.translate.instant('platformSettingsPage.warnSchoolBody', {
      name: this.selectedCacheSchool.schoolName
    });
  }

  confirmClearCache(): void {
    const isGlobal = !this.selectedCacheSchool;
    const regionCount = this.cacheRegionMode === 'specific' && this.selectedCacheRegions.length > 0
      ? this.selectedCacheRegions.length
      : this.allCacheRegions.length;

    const details: string[] = [];
    const t = (k: string, params?: Record<string, string | number>) => this.translate.instant(k, params);

    if (isGlobal) {
      details.push(t('platformSettingsPage.detailGlobalWarning'));
      details.push(t('platformSettingsPage.detailGlobalRegions', { count: regionCount }));
      details.push(t('platformSettingsPage.detailGlobalImpact'));
    } else {
      details.push(
        t('platformSettingsPage.detailSchoolTarget', {
          name: this.selectedCacheSchool!.schoolName,
          code: this.selectedCacheSchool!.schoolCode
        })
      );
      details.push(t('platformSettingsPage.detailSchoolRegions', { count: regionCount }));
      details.push(t('platformSettingsPage.detailSchoolOther'));
    }

    if (this.cacheRegionMode === 'specific' && this.selectedCacheRegions.length > 0) {
      details.push(t('platformSettingsPage.detailRegionsList', { list: this.selectedCacheRegions.join(', ') }));
    } else {
      details.push(t('platformSettingsPage.detailAllRegions'));
    }

    details.push(t('platformSettingsPage.auditLogged'));

    this.subs.add(
      this.confirmDialog.confirm({
        title: isGlobal ? t('platformSettingsPage.confirmGlobalTitle') : t('platformSettingsPage.confirmSchoolTitle'),
        message: isGlobal ? t('platformSettingsPage.confirmGlobalMessage') : t('platformSettingsPage.confirmSchoolMessage'),
        details,
        confirmLabel: isGlobal ? t('platformSettingsPage.confirmGlobalLabel') : t('platformSettingsPage.confirmSchoolLabel'),
        cancelLabel: t('platformSettingsPage.cancel'),
        variant: isGlobal ? 'danger' : 'warning'
      }).subscribe(confirmed => {
        if (confirmed) {
          this.executeCacheClear();
        }
      })
    );
  }

  executeCacheClear(): void {
    this.cacheClearing = true;
    this.cacheSuccessMsg = '';
    this.cacheErrorMsg = '';
    this.cdr.markForCheck();

    const regions = this.cacheRegionMode === 'specific' && this.selectedCacheRegions.length > 0
      ? this.selectedCacheRegions
      : null;

    this.subs.add(
      this.platformService.clearCache({
        tenantId: this.selectedCacheSchool?.tenantId || null,
        regions
      }).subscribe({
      next: (response: CacheClearResponse) => {
        this.cacheClearing = false;

        if (response.statistics) {
          this.lastCacheCleared = {
            regionsCleared: response.statistics.regionsCleared,
            clearedAt: response.statistics.clearedAt,
            clearedBy: response.statistics.clearedBy,
            targetSchoolName: response.statistics.targetSchoolName
          };
        }

        this.cacheSuccessMsg = response.message || this.translate.instant('platformSettingsPage.cacheClearOk');

        setTimeout(() => {
          this.cacheSuccessMsg = '';
          this.cdr.markForCheck();
        }, 6000);

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cacheClearing = false;
        this.cacheErrorMsg = err?.error?.message || this.translate.instant('platformSettingsPage.cacheClearFailed');
        setTimeout(() => {
          this.cacheErrorMsg = '';
          this.cdr.markForCheck();
        }, 8000);
        this.cdr.markForCheck();
      }
    })
    );
  }
}
