import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { ParentService } from '../../core/services/parent.service';
import { SchoolBranch, Student } from '../../core/models/models';
import { runtimeConfig } from '../../core/config/runtime-config';
import { ProfilePhotoPickerComponent, ProfilePhotoPickEvent } from '../../shared/profile-photo-picker/profile-photo-picker.component';
import { UserLocaleService, type UiLanguage } from '../../core/i18n/user-locale.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ProfilePhotoPickerComponent],
  template: `
    <div data-testid="settings-page">
      <div class="mb-4 animate-in d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'settings.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">
            <ng-container *ngIf="isTenantAdmin">{{ 'settings.leadAdmin' | translate }}</ng-container>
            <ng-container *ngIf="!isTenantAdmin">{{ 'settings.leadUser' | translate }}</ng-container>
          </p>
        </div>
        <button type="button" class="btn-outline-erp btn-sm align-self-center" (click)="reloadSettings()" [disabled]="settingsRefreshing">
          <i class="bi bi-arrow-clockwise"></i> {{ settingsRefreshing ? ('settings.refreshing' | translate) : ('settings.refresh' | translate) }}
        </button>
      </div>
      <div class="erp-tabs animate-in">
        <button type="button" class="erp-tab" [class.active]="tab === 'general'" (click)="tab = 'general'">{{ isTenantAdmin ? ('settings.tabGeneralAdmin' | translate) : ('settings.tabGeneralUser' | translate) }}</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'preferences'" (click)="tab = 'preferences'">{{ 'prefs.tab' | translate }}</button>
        <button type="button" *ngIf="isTenantAdmin" class="erp-tab" [class.active]="tab === 'branding'" (click)="tab = 'branding'">{{ 'settings.tabBranding' | translate }}</button>
        <button type="button" *ngIf="isTenantAdmin" class="erp-tab" [class.active]="tab === 'roles'" (click)="tab = 'roles'">{{ 'settings.tabRoles' | translate }}</button>
        <button type="button" *ngIf="isTenantAdmin" class="erp-tab" [class.active]="tab === 'features'" (click)="tab = 'features'">{{ 'settings.tabFeatures' | translate }}</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'profile'" (click)="tab = 'profile'">{{ 'settings.tabProfile' | translate }}</button>
      </div>

      <div *ngIf="tab === 'preferences'" class="erp-card animate-in settings-prefs-card">
        <header class="settings-prefs-card__header">
          <h3 class="settings-prefs-card__title">{{ 'prefs.heading' | translate }}</h3>
          <p class="settings-prefs-card__lead">{{ 'prefs.lead' | translate }}</p>
        </header>
        <div class="settings-prefs-card__body">
          <div class="erp-form-group">
            <label class="erp-label" for="settings-ui-lang">{{ 'prefs.fieldLabel' | translate }}</label>
            <select
              id="settings-ui-lang"
              class="erp-select settings-prefs-card__select"
              name="prefsLang"
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

      <div *ngIf="tab === 'profile'" class="erp-card animate-in settings-profile-root">
        <header class="settings-profile-root__header">
          <h3 class="settings-profile-root__title">{{ 'settings.profileTitle' | translate }}</h3>
          <p class="settings-profile-root__lead">
            {{ 'settings.profileLead' | translate }}
          </p>
        </header>

        <div class="settings-profile-shell">
          <!-- Editable portrait: single focal avatar (picker) + account details — no duplicate image -->
          <section
            *ngIf="canEditOwnPhoto && profileUser as u"
            class="settings-profile-unified"
            [attr.data-role]="profileVisualRole"
            [attr.aria-label]="'settings.ariaProfilePhoto' | translate"
          >
            <div class="settings-profile-hero">
              <div class="settings-profile-hero__visual">
                <app-profile-photo-picker
                  [previewUrl]="profilePreviewUrl"
                  [initials]="profileInitials"
                  [frameAriaLabel]="'settings.uploadPhotoAria' | translate"
                  size="hero"
                  layout="stacked"
                  statusMode="none"
                  (photoPicked)="onOwnPhotoPicked($event)"
                  (photoRemoved)="onOwnPhotoRemoved()"
                />
              </div>
              <div class="settings-profile-hero__details">
                <div class="settings-profile-hero__titleblock">
                  <div class="settings-profile-hero__name">{{ u.name }}</div>
                  <div class="settings-profile-hero__email">{{ u.email }}</div>
                  <div class="settings-profile-hero__badges">
                    <span class="settings-profile-role">{{ roleDisplayLabel }}</span>
                  </div>
                </div>
                <dl class="settings-profile-hero__meta">
                  <div class="settings-profile-hero__meta-row">
                    <dt>{{ 'settings.labelSchool' | translate }}</dt>
                    <dd>{{ schoolName || ('exams.dash' | translate) }}</dd>
                  </div>
                  <div class="settings-profile-hero__meta-row" *ngIf="schoolCode">
                    <dt>{{ 'settings.labelCode' | translate }}</dt>
                    <dd><code class="settings-profile-code">{{ schoolCode }}</code></dd>
                  </div>
                </dl>
                <p class="settings-profile-hero__hint">{{ photoHintLine }}</p>
              </div>
            </div>
          </section>

          <!-- Parent: read-only identity (one avatar) + linked children note -->
          <section
            *ngIf="!canEditOwnPhoto && isParentOnlyChildren && profileUser as u"
            class="settings-profile-unified"
            [attr.data-role]="profileVisualRole"
            [attr.aria-label]="'settings.ariaAccount' | translate"
          >
            <div class="settings-profile-hero settings-profile-hero--readonly">
              <div class="settings-profile-hero__visual">
                <div *ngIf="!profilePreviewUrl" class="settings-profile-hero__avatar-fallback" aria-hidden="true">{{ profileInitials }}</div>
                <img
                  *ngIf="profilePreviewUrl"
                  [src]="profilePreviewUrl"
                  alt=""
                  class="settings-profile-hero__avatar-img"
                />
              </div>
              <div class="settings-profile-hero__details">
                <div class="settings-profile-hero__titleblock">
                  <div class="settings-profile-hero__name">{{ u.name }}</div>
                  <div class="settings-profile-hero__email">{{ u.email }}</div>
                  <div class="settings-profile-hero__badges">
                    <span class="settings-profile-role">{{ roleDisplayLabel }}</span>
                  </div>
                </div>
                <dl class="settings-profile-hero__meta">
                  <div class="settings-profile-hero__meta-row">
                    <dt>{{ 'settings.labelSchool' | translate }}</dt>
                    <dd>{{ schoolName || ('exams.dash' | translate) }}</dd>
                  </div>
                  <div class="settings-profile-hero__meta-row" *ngIf="schoolCode">
                    <dt>{{ 'settings.labelCode' | translate }}</dt>
                    <dd><code class="settings-profile-code">{{ schoolCode }}</code></dd>
                  </div>
                </dl>
                <p class="settings-profile-footnote mb-0" *ngIf="myChildren.length">
                  <i class="bi bi-people me-1"></i>{{ myChildren.length === 1 ? ('settings.linkedChildrenOne' | translate: { n: myChildren.length }) : ('settings.linkedChildrenMany' | translate: { n: myChildren.length }) }}
                </p>
              </div>
            </div>
          </section>

          <!-- Roles without self-serve photo: identity + directory policy -->
          <ng-container *ngIf="!canEditOwnPhoto && !isParentOnlyChildren && profileUser as u">
            <section class="settings-profile-unified" [attr.data-role]="profileVisualRole" [attr.aria-label]="'settings.ariaProfileReadonly' | translate">
              <div class="settings-profile-hero settings-profile-hero--readonly">
                <div class="settings-profile-hero__visual">
                  <div *ngIf="!profilePreviewUrl" class="settings-profile-hero__avatar-fallback" aria-hidden="true">{{ profileInitials }}</div>
                  <img
                    *ngIf="profilePreviewUrl"
                    [src]="profilePreviewUrl"
                    alt=""
                    class="settings-profile-hero__avatar-img"
                  />
                </div>
                <div class="settings-profile-hero__details">
                  <div class="settings-profile-hero__titleblock">
                    <div class="settings-profile-hero__name">{{ u.name }}</div>
                    <div class="settings-profile-hero__email">{{ u.email }}</div>
                    <div class="settings-profile-hero__badges">
                      <span class="settings-profile-role">{{ roleDisplayLabel }}</span>
                    </div>
                  </div>
                  <dl class="settings-profile-hero__meta">
                    <div class="settings-profile-hero__meta-row">
                      <dt>{{ 'settings.labelSchool' | translate }}</dt>
                      <dd>{{ schoolName || ('exams.dash' | translate) }}</dd>
                    </div>
                    <div class="settings-profile-hero__meta-row" *ngIf="schoolCode">
                      <dt>{{ 'settings.labelCode' | translate }}</dt>
                      <dd><code class="settings-profile-code">{{ schoolCode }}</code></dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>
            <section class="settings-profile-panel settings-profile-panel--note settings-profile-follow" aria-labelledby="settings-profile-dir-h">
              <div class="settings-profile-panel__head" id="settings-profile-dir-h">
                <span class="settings-profile-panel__icon"><i class="bi bi-info-circle"></i></span>
                <span class="settings-profile-panel__head-text">{{ 'settings.directoryPhotoHeading' | translate }}</span>
              </div>
              <div class="settings-profile-panel__body">
                <p class="settings-profile-hint mb-2">{{ 'settings.photoHintManaged' | translate }}</p>
                <ul class="settings-profile-bullets">
                  <li>{{ 'settings.directoryPhotoBullet1' | translate }}</li>
                  <li>{{ 'settings.directoryPhotoBullet2' | translate }}</li>
                </ul>
              </div>
            </section>
          </ng-container>

          <!-- Parent: school record + optional portal-only photo -->
          <section
            *ngIf="isParentOnlyChildren"
            class="settings-profile-panel settings-profile-child-section"
            aria-labelledby="settings-profile-child-h"
          >
            <div class="settings-profile-panel__head" id="settings-profile-child-h">
              <span class="settings-profile-panel__icon"><i class="bi bi-person-hearts"></i></span>
              <span class="settings-profile-panel__head-text">{{ 'settings.linkedChildrenHeading' | translate }}</span>
            </div>
            <div class="settings-profile-panel__body">
              <p class="settings-profile-hint">{{ 'settings.linkedChildrenHintLong' | translate }}</p>
              <label class="erp-label d-block mb-2">{{ 'settings.labelChildSelect' | translate }}</label>
              <select class="erp-select mb-3" [(ngModel)]="childPhotoTargetId" (ngModelChange)="syncChildPhotoPreview()">
                <option [ngValue]="null">{{ 'settings.selectChildOption' | translate }}</option>
                <option *ngFor="let s of myChildren" [ngValue]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
              </select>

              <div *ngIf="selectedChildForProfile as ch" class="settings-child-school-card mb-4">
                <div class="settings-child-school-card__title">{{ 'settings.schoolRecordTitle' | translate }}</div>
                <dl class="settings-child-school-card__grid">
                  <div><dt>{{ 'settings.dtClassSection' | translate }}</dt><dd>{{ ch.className }} · {{ 'settings.sectionLabel' | translate: { name: ch.sectionName } }}</dd></div>
                  <div><dt>{{ 'settings.dtRollAdmission' | translate }}</dt><dd>{{ ch.rollNumber }} · {{ ch.admissionNumber }}</dd></div>
                  <div><dt>{{ 'settings.dtAdmissionDate' | translate }}</dt><dd>{{ ch.admissionDate || ('exams.dash' | translate) }}</dd></div>
                  <div><dt>{{ 'settings.dtStatus' | translate }}</dt><dd class="text-capitalize">{{ ch.status }}</dd></div>
                  <div><dt>{{ 'settings.dtHomeroomTeacher' | translate }}</dt><dd>{{ ch.homeroomTeacherName || ('exams.dash' | translate) }}</dd></div>
                  <div><dt>{{ 'settings.labelSchoolEmail' | translate }}</dt><dd>{{ ch.email || ('exams.dash' | translate) }}</dd></div>
                </dl>
              </div>

              <p *ngIf="!childPhotoTargetId" class="settings-profile-placeholder mb-3">{{ 'settings.selectChildForDetails' | translate }}</p>

              <div *ngIf="childPhotoTargetId" class="settings-child-photo-block">
                <label class="erp-label d-block mb-2">{{ 'settings.optionalPortalPhoto' | translate }}</label>
                <p class="settings-profile-hint small mb-2">{{ 'settings.optionalPortalPhotoHint' | translate }}</p>
                <app-profile-photo-picker
                  [previewUrl]="childPhotoPreview"
                  [initials]="childPhotoInitials"
                  [frameAriaLabel]="'settings.frameAriaOptionalChildPhoto' | translate"
                  size="comfortable"
                  statusMode="minimal"
                  (photoPicked)="onChildPhotoPicked($event)"
                  (photoRemoved)="onChildPhotoRemoved()"
                />
              </div>
              <p class="settings-profile-footnote settings-profile-footnote--below mb-0">{{ 'settings.directoryPhotosUpdatedByStaff' | translate }}</p>
            </div>
          </section>
        </div>
      </div>

      <div *ngIf="tab === 'general'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">{{ 'settings.schoolInfoTitle' | translate }}</h4>
        <ng-container *ngIf="isTenantAdmin">
          <div class="row g-3">
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelSchoolName' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="schoolName" data-testid="school-name-input"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelSchoolCode' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="schoolCode" disabled [title]="'settings.schoolCodeTitle' | translate"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelEmail' | translate }}</label><input type="email" class="erp-input" [(ngModel)]="schoolEmail"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelPhone' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="schoolPhone"></div></div>
            <div class="col-12"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelAddress' | translate }}</label><textarea class="erp-input erp-textarea" [(ngModel)]="schoolAddress" style="min-height: 80px;"></textarea></div></div>
          </div>
          <div class="d-flex justify-content-end align-items-center flex-wrap gap-2 mt-3">
            <span *ngIf="generalSaveMsg" class="text-success small">{{ generalSaveMsg }}</span>
            <span *ngIf="generalSaveError" class="text-danger small">{{ generalSaveError }}</span>
            <button class="btn-primary-erp" data-testid="save-settings-btn" type="button" (click)="saveGeneral()" [disabled]="saving">{{ saving ? ('settings.savingEllipsis' | translate) : ('settings.saveChanges' | translate) }}</button>
          </div>
        </ng-container>
        <ng-container *ngIf="!isTenantAdmin">
          <p class="text-muted small mb-3">{{ 'settings.contactOfficeForUpdates' | translate }}</p>
          <dl class="settings-readonly-grid row g-3 mb-0">
            <div class="col-md-6"><dt class="erp-label">{{ 'settings.labelSchoolName' | translate }}</dt><dd class="settings-ro-value">{{ schoolName }}</dd></div>
            <div class="col-md-6"><dt class="erp-label">{{ 'settings.labelSchoolCode' | translate }}</dt><dd class="settings-ro-value"><code class="settings-profile-code">{{ schoolCode }}</code></dd></div>
            <div class="col-md-6"><dt class="erp-label">{{ 'settings.labelEmail' | translate }}</dt><dd class="settings-ro-value">{{ schoolEmail || ('exams.dash' | translate) }}</dd></div>
            <div class="col-md-6"><dt class="erp-label">{{ 'settings.labelPhone' | translate }}</dt><dd class="settings-ro-value">{{ schoolPhone || ('exams.dash' | translate) }}</dd></div>
            <div class="col-12"><dt class="erp-label">{{ 'settings.labelAddress' | translate }}</dt><dd class="settings-ro-value" style="white-space: pre-wrap;">{{ schoolAddress || ('exams.dash' | translate) }}</dd></div>
          </dl>
        </ng-container>

        <div *ngIf="isTenantAdmin" class="mt-4 pt-4" style="border-top: 1px solid var(--clr-border-light);">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <div>
              <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">{{ 'settings.branchesHeading' | translate }}</h4>
              <p class="text-muted small mb-0">{{ 'settings.branchesLead' | translate }}</p>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="loadBranches()" [disabled]="branchesLoading">
              {{ branchesLoading ? ('settings.loadingEllipsis' | translate) : ('settings.fetchBranches' | translate) }}
            </button>
          </div>
          <div *ngIf="branchesError" class="alert alert-danger py-2 small">{{ branchesError }}</div>
          <div *ngIf="branches.length" class="row g-3">
            <div class="col-md-6 col-lg-4" *ngFor="let br of branches">
              <div class="p-3 rounded-3 h-100" style="border: 1px solid var(--clr-border); background: var(--clr-surface-muted);">
                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <strong style="font-size: 14px;">{{ br.schoolName }}</strong>
                  <span *ngIf="br.currentTenant" class="badge-erp badge-success">{{ 'settings.youAreHere' | translate }}</span>
                </div>
                <div class="small text-muted mb-1"><i class="bi bi-hash me-1"></i>{{ br.schoolCode }}</div>
                <div class="small mb-1" *ngIf="br.address"><i class="bi bi-geo-alt me-1 text-muted"></i>{{ br.address }}</div>
                <div class="small mb-1" *ngIf="br.phone"><i class="bi bi-telephone me-1 text-muted"></i>{{ br.phone }}</div>
                <div class="small" *ngIf="br.email"><i class="bi bi-envelope me-1 text-muted"></i>{{ br.email }}</div>
              </div>
            </div>
          </div>
          <p *ngIf="!branches.length && !branchesLoading && branchesFetched" class="text-muted small mb-0">{{ 'settings.noOtherBranches' | translate }}</p>
        </div>
      </div>

      <div *ngIf="tab === 'branding'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">{{ 'settings.themeBrandingHeading' | translate }}</h4>
        <div class="row g-3">
          <div class="col-md-6">
            <div class="erp-form-group"><label class="erp-label">{{ 'settings.labelPrimaryColor' | translate }}</label>
              <div class="d-flex gap-2 align-items-center">
                <input type="color" [(ngModel)]="primaryColor" style="width: 50px; height: 40px; border: 1px solid var(--clr-border); border-radius: var(--radius-md); cursor: pointer;">
                <input type="text" class="erp-input" [(ngModel)]="primaryColor" style="flex: 1;">
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="erp-form-group"><label class="erp-label">{{ 'settings.labelAccentColor' | translate }}</label>
              <div class="d-flex gap-2 align-items-center">
                <input type="color" [(ngModel)]="accentColor" style="width: 50px; height: 40px; border: 1px solid var(--clr-border); border-radius: var(--radius-md); cursor: pointer;">
                <input type="text" class="erp-input" [(ngModel)]="accentColor" style="flex: 1;">
              </div>
            </div>
          </div>
        </div>
        <div class="d-flex justify-content-end mt-3 gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp" (click)="resetBranding()">{{ 'settings.resetBranding' | translate }}</button>
          <button type="button" class="btn-primary-erp" (click)="applyBranding()">{{ 'settings.applyBranding' | translate }}</button>
        </div>
        <p class="text-muted small mt-2 mb-0">{{ 'settings.brandingPersistNote' | translate }}</p>
      </div>

      <div *ngIf="tab === 'roles'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">{{ 'settings.rolesHeading' | translate }}</h4>
        <table class="erp-table">
          <thead><tr><th>{{ 'settings.thRole' | translate }}</th><th>{{ 'settings.thDescription' | translate }}</th><th>{{ 'settings.thUsers' | translate }}</th><th>{{ 'settings.thStatus' | translate }}</th></tr></thead>
          <tbody>
            <tr><td><strong>{{ 'settings.roleAdminLabel' | translate }}</strong></td><td>{{ 'settings.roleAdminDesc' | translate }}</td><td>1</td><td><span class="badge-erp badge-success">{{ 'settings.statusActive' | translate }}</span></td></tr>
            <tr><td><strong>{{ 'settings.roleTeacherLabel' | translate }}</strong></td><td>{{ 'settings.roleTeacherDesc' | translate }}</td><td>8</td><td><span class="badge-erp badge-success">{{ 'settings.statusActive' | translate }}</span></td></tr>
            <tr><td><strong>{{ 'settings.roleParentLabel' | translate }}</strong></td><td>{{ 'settings.roleParentDesc' | translate }}</td><td>12</td><td><span class="badge-erp badge-success">{{ 'settings.statusActive' | translate }}</span></td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="tab === 'features'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">{{ 'settings.featureTogglesHeading' | translate }}</h4>
        <p class="text-muted small mb-3" style="font-size: 13px;" [innerHTML]="'settings.featureTogglesLeadHtml' | translate"></p>
        <div *ngFor="let feat of features" class="d-flex justify-content-between align-items-center py-3" style="border-bottom: 1px solid var(--clr-border-light);">
          <div>
            <div style="font-weight: 600;">{{ featureToggleName(feat) }}</div>
            <div style="font-size: 12px; color: var(--clr-text-muted);">{{ featureToggleDescription(feat) }}</div>
          </div>
          <label style="position: relative; display: inline-block; width: 48px; height: 26px; cursor: pointer;">
            <input type="checkbox" [(ngModel)]="feat.enabled" style="opacity: 0; width: 0; height: 0;">
            <span style="position: absolute; inset: 0; background: var(--clr-border); border-radius: 13px; transition: 0.3s;" [style.background]="feat.enabled ? 'var(--clr-success)' : 'var(--clr-border)'">
              <span style="position: absolute; left: 3px; top: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: 0.3s;" [style.transform]="feat.enabled ? 'translateX(22px)' : 'translateX(0)'"></span>
            </span>
          </label>
        </div>
        <div class="d-flex flex-wrap gap-2 align-items-center mt-3 pt-2" style="border-top: 1px solid var(--clr-border-light);">
          <button type="button" class="btn-primary-erp" (click)="saveFeatureFlags()" [disabled]="featureFlagsSaving">{{ featureFlagsSaving ? ('settings.savingEllipsis' | translate) : ('settings.saveFeatureToggles' | translate) }}</button>
          <span *ngIf="featureFlagsMsg" class="text-success small">{{ featureFlagsMsg }}</span>
          <span *ngIf="featureFlagsErr" class="text-danger small">{{ featureFlagsErr }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .settings-profile-root__header {
        margin-bottom: 1rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid var(--clr-border-light, #e8eef0);
      }
      .settings-profile-root__title {
        font-size: 1.125rem;
        font-weight: 800;
        margin: 0 0 0.4rem;
        color: var(--clr-text-primary, #0f172a);
        letter-spacing: -0.02em;
      }
      .settings-profile-root__lead {
        margin: 0;
        font-size: 13px;
        font-weight: 500;
        color: var(--clr-text-secondary, #475569);
        line-height: 1.55;
        max-width: none;
      }
      .settings-profile-shell {
        width: 100%;
      }
      .settings-profile-unified {
        position: relative;
        border-radius: var(--radius-lg, 12px);
        border: 1px solid var(--clr-border-light, #e8eef0);
        background: linear-gradient(
          152deg,
          color-mix(in srgb, var(--clr-primary, #1b3a30) 10%, var(--clr-surface-muted, #f1f5f9)) 0%,
          var(--clr-surface, #fff) 42%,
          var(--clr-surface, #fff) 100%
        );
        padding: 1.1rem 1.2rem 1.2rem;
        margin: 0;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.045);
      }
      .settings-profile-unified[data-role='admin'] {
        border-left: 4px solid var(--clr-primary, #1b3a30);
      }
      .settings-profile-unified[data-role='teacher'] {
        border-left: 4px solid color-mix(in srgb, var(--clr-primary, #1b3a30) 55%, var(--clr-accent, #c05c3d) 45%);
      }
      .settings-profile-unified[data-role='parent'] {
        border-left: 4px solid var(--clr-accent, #c05c3d);
      }
      .settings-profile-unified[data-role='super_admin'] {
        border-left: 4px solid var(--clr-accent, #0ea5e9);
      }
      .settings-profile-unified[data-role='student'] {
        border-left: 4px solid #6366f1;
      }
      .settings-profile-unified[data-role='other'] {
        border-left: 4px solid var(--clr-border, #cbd5e1);
      }
      .settings-profile-hero {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem 1.35rem;
        align-items: center;
        padding: 0;
      }
      .settings-profile-hero--readonly {
        align-items: center;
      }
      @media (max-width: 599.98px) {
        .settings-profile-hero {
          grid-template-columns: 1fr;
          justify-items: start;
          gap: 1rem;
        }
        .settings-profile-hero--readonly {
          align-items: start;
        }
      }
      .settings-profile-hero__visual {
        min-width: 0;
      }
      .settings-profile-hero__details {
        min-width: 0;
      }
      .settings-profile-hero__titleblock {
        margin-bottom: 0.5rem;
      }
      .settings-profile-hero__name {
        font-size: clamp(1.2rem, 2.2vw, 1.4rem);
        font-weight: 800;
        color: var(--clr-text-primary, #0f172a);
        line-height: 1.2;
        letter-spacing: -0.02em;
      }
      .settings-profile-hero__email {
        font-size: 13px;
        font-weight: 500;
        color: var(--clr-text-secondary, #475569);
        margin-top: 5px;
        word-break: break-word;
      }
      .settings-profile-hero__badges {
        margin-top: 8px;
      }
      .settings-profile-hero__meta {
        margin: 0.65rem 0 0;
        padding: 0.65rem 0 0;
        border-top: 1px solid color-mix(in srgb, var(--clr-border, #e2e8f0) 85%, transparent);
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1.25rem;
      }
      .settings-profile-hero__meta-row {
        display: inline-flex;
        gap: 0.45rem;
        align-items: baseline;
        margin: 0;
        padding: 0;
        font-size: 13px;
      }
      .settings-profile-hero__meta-row dt {
        margin: 0;
        color: var(--clr-text-secondary, #475569);
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .settings-profile-hero__meta-row dt::after {
        content: ':';
        margin-left: 1px;
        font-weight: 600;
      }
      .settings-profile-hero__meta-row dd {
        margin: 0;
        color: var(--clr-text-primary, #1e293b);
        font-weight: 600;
      }
      .settings-profile-hero__hint {
        font-size: 12px;
        font-weight: 500;
        color: var(--clr-text-secondary, #475569);
        margin: 12px 0 0;
        line-height: 1.55;
        max-width: 36rem;
      }
      .settings-profile-hero__avatar-fallback {
        width: 128px;
        height: 128px;
        border-radius: 50%;
        border: 2px solid color-mix(in srgb, var(--clr-border, #e2e8f0) 90%, var(--clr-primary, #1b3a30) 10%);
        background: var(--clr-surface-muted, #f1f5f9);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 36px;
        color: var(--clr-text-secondary, #475569);
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
      }
      .settings-profile-hero__avatar-img {
        width: 128px;
        height: 128px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid color-mix(in srgb, var(--clr-border, #e2e8f0) 85%, var(--clr-primary, #1b3a30) 15%);
        display: block;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
      }
      .settings-profile-follow {
        margin-top: 1.1rem;
      }
      .settings-profile-child-section {
        margin-top: 1.25rem;
      }
      .settings-child-school-card {
        border: 1px solid var(--clr-border-light, #e8eef0);
        border-radius: var(--radius-md, 10px);
        padding: 14px 16px;
        background: var(--clr-surface-alt, #f8fafc);
      }
      .settings-child-school-card__title {
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--clr-text-muted, #64748b);
        margin-bottom: 12px;
      }
      .settings-child-school-card__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px 20px;
        margin: 0;
      }
      .settings-child-school-card__grid dt {
        font-size: 11px;
        font-weight: 700;
        color: var(--clr-text-muted, #64748b);
        margin: 0 0 2px;
      }
      .settings-child-school-card__grid dd {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--clr-text, #0f172a);
      }
      .settings-child-photo-block {
        padding-top: 8px;
        border-top: 1px dashed var(--clr-border-light, #e8eef0);
      }
      .settings-profile-panel {
        border: 1px solid var(--clr-border, #e2e8f0);
        border-radius: var(--radius-lg, 12px);
        background: var(--clr-surface, #fff);
        overflow: hidden;
      }
      .settings-profile-panel--emphasis {
        border-color: color-mix(in srgb, var(--clr-primary, #1b3a30) 22%, var(--clr-border, #e2e8f0));
        box-shadow: 0 1px 0 color-mix(in srgb, var(--clr-primary, #1b3a30) 8%, transparent);
      }
      .settings-profile-panel--note {
        background: var(--clr-surface-muted, #f8fafc);
        border-style: dashed;
      }
      .settings-profile-panel__head {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: var(--clr-surface-muted, #f8fafc);
        border-bottom: 1px solid var(--clr-border-light, #e8eef0);
        font-size: 13px;
        font-weight: 700;
        color: var(--clr-text-secondary, #475569);
      }
      .settings-profile-panel__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: color-mix(in srgb, var(--clr-primary, #1b3a30) 10%, transparent);
        color: var(--clr-primary, #1b3a30);
        font-size: 16px;
      }
      .settings-profile-panel--note .settings-profile-panel__icon {
        background: color-mix(in srgb, var(--clr-accent, #c05c3d) 12%, transparent);
        color: var(--clr-accent, #c05c3d);
      }
      .settings-profile-panel__body {
        padding: 16px;
      }
      .settings-profile-role {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        background: color-mix(in srgb, var(--clr-primary, #1b3a30) 12%, transparent);
        color: var(--clr-primary, #1b3a30);
      }
      .settings-profile-code {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 6px;
        background: var(--clr-surface-muted, #f1f5f9);
        color: var(--clr-text-secondary, #475569);
      }
      .settings-profile-hint {
        font-size: 12px;
        font-weight: 500;
        color: var(--clr-text-secondary, #475569);
        margin: 0 0 14px;
        line-height: 1.5;
      }
      .settings-profile-placeholder {
        font-size: 13px;
        color: var(--clr-text-secondary, #64748b);
        font-style: italic;
      }
      .settings-profile-footnote {
        font-size: 11px;
        font-weight: 500;
        color: var(--clr-text-secondary, #64748b);
        margin: 12px 0 0;
        line-height: 1.45;
      }
      .settings-profile-footnote--below {
        margin-top: 1rem;
        margin-bottom: 0;
      }
      .settings-profile-bullets {
        margin: 0;
        padding-left: 1.15rem;
        font-size: 12px;
        color: var(--clr-text-secondary, #475569);
        line-height: 1.55;
      }
      .settings-profile-bullets li + li {
        margin-top: 0.35rem;
      }
      .settings-readonly-grid dt {
        margin-bottom: 4px;
      }
      .settings-readonly-grid dd {
        margin: 0 0 12px;
      }
      .settings-ro-value {
        font-size: 14px;
        color: var(--clr-text-primary, #0f172a);
        font-weight: 500;
        line-height: 1.45;
      }
      .settings-prefs-card__header {
        margin-bottom: 1rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid var(--clr-border-light, #e8eef0);
      }
      .settings-prefs-card__title {
        font-size: 1.125rem;
        font-weight: 800;
        margin: 0 0 0.4rem;
        color: var(--clr-text-primary, #0f172a);
        letter-spacing: -0.02em;
      }
      .settings-prefs-card__lead {
        margin: 0;
        font-size: 13px;
        font-weight: 500;
        color: var(--clr-text-secondary, #475569);
        line-height: 1.55;
      }
      .settings-prefs-card__body {
        max-width: 28rem;
      }
      .settings-prefs-card__select {
        max-width: 16rem;
        font-weight: 600;
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  tab = 'general';
  schoolName = 'SchoolVault Academy';
  schoolCode = 'SCH001';
  schoolEmail = 'info@schoolvault.edu';
  schoolPhone = '+1-555-0100';
  schoolAddress = '123 Education Lane, Knowledge City, KS 12345';
  primaryColor = '#1B3A30';
  accentColor = '#C05C3D';
  saving = false;
  generalSaveMsg = '';
  generalSaveError = '';
  tenantId = '';
  branches: SchoolBranch[] = [];
  branchesLoading = false;
  branchesError = '';
  branchesFetched = false;
  profilePreviewUrl: string | null = null;
  profileInitials = '';
  myChildren: Student[] = [];
  childPhotoTargetId: number | null = null;
  childPhotoPreview: string | null = null;
  childPhotoInitials = '';
  settingsRefreshing = false;

  featureFlagsSaving = false;
  featureFlagsMsg = '';
  featureFlagsErr = '';

  prefsLang: UiLanguage = 'en';
  prefsSaving = false;
  prefsSaved = false;
  prefsErr = '';

  /** Feature toggles: labels come from `settings.features.<persistKey>.{name,description}` for i18n. */
  features: Array<{ enabled: boolean; persistKey: string }> = [
    { enabled: false, persistKey: 'feeReminderAutomation' },
    { enabled: true, persistKey: 'transport' },
    { enabled: true, persistKey: 'library' },
    { enabled: true, persistKey: 'hostel' },
    { enabled: true, persistKey: 'payroll' },
    { enabled: true, persistKey: 'documents' },
    { enabled: true, persistKey: 'audit' },
    { enabled: false, persistKey: 'smsNotifications' },
    { enabled: false, persistKey: 'onlinePayments' },
  ];

  constructor(
    private settingsService: SettingsService,
    private themeService: ThemeService,
    private auth: AuthService,
    private parentService: ParentService,
    private cdr: ChangeDetectorRef,
    readonly userLocale: UserLocaleService,
    private translate: TranslateService
  ) {}

  /** School tenant administrator — only this role may change tenant config, branding, roles, and feature toggles. */
  get isTenantAdmin(): boolean {
    return (this.auth.getRole() || '').toLowerCase() === 'admin';
  }

  /** Normalized role for profile card accent (CSS `data-role`). */
  get profileVisualRole(): string {
    let r = (this.auth.getRole() || '').toLowerCase().trim();
    if (r.startsWith('role_')) {
      r = r.slice(5);
    }
    if (['admin', 'teacher', 'parent', 'super_admin', 'student'].includes(r)) {
      return r;
    }
    return 'other';
  }

  get canEditOwnPhoto(): boolean {
    const r = this.auth.getRole();
    return r === 'admin' || r === 'teacher' || r === 'super_admin' || r === 'student' || r === 'parent';
  }

  get isParentOnlyChildren(): boolean {
    return this.auth.getRole() === 'parent';
  }

  /** Selected child in the parent settings dropdown — school roster fields for read-only summary. */
  get selectedChildForProfile(): Student | null {
    if (this.childPhotoTargetId == null) {
      return null;
    }
    return this.myChildren.find(s => s.id === this.childPhotoTargetId) ?? null;
  }

  get profileUser() {
    return this.auth.getCurrentUser();
  }

  get roleDisplayLabel(): string {
    const r = (this.auth.getRole() || '').toLowerCase();
    const key =
      r === 'super_admin'
        ? 'header.role.superAdmin'
        : r === 'library_staff'
          ? 'header.role.libraryStaff'
          : r === 'admin'
            ? 'header.role.admin'
            : r === 'teacher'
              ? 'header.role.teacher'
              : r === 'parent'
                ? 'header.role.parent'
                : r === 'student'
                  ? 'header.role.student'
                  : '';
    if (key) {
      const t = this.translate.instant(key);
      if (t !== key) return t;
    }
    return r ? r.replace(/_/g, ' ') : this.translate.instant('header.role.user');
  }

  get photoHintLine(): string {
    return this.translate.instant(runtimeConfig.useMocks ? 'settings.photoHintMock' : 'settings.photoHintLive');
  }

  featureToggleName(feat: { persistKey: string }): string {
    return this.translate.instant(`settings.features.${feat.persistKey}.name`);
  }

  featureToggleDescription(feat: { persistKey: string }): string {
    return this.translate.instant(`settings.features.${feat.persistKey}.description`);
  }

  ngOnInit(): void {
    if (!this.isTenantAdmin) {
      this.tab = 'profile';
    }
    this.prefsLang = this.userLocale.readStored();
    const u = this.auth.getCurrentUser();
    if (u?.interfaceLocale === 'hi' || u?.interfaceLocale === 'en') {
      this.prefsLang = u.interfaceLocale === 'hi' ? 'hi' : 'en';
    }
    this.refreshProfilePreview();
    this.reloadSettings();
  }

  onPrefsLangDraftChange(): void {
    this.prefsSaved = false;
    this.prefsErr = '';
  }

  savePreferences(): void {
    this.prefsSaving = true;
    this.prefsSaved = false;
    this.prefsErr = '';
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
      },
    });
  }

  private applyFeatureFlagsFromServer(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.settingsService.getFeatures().subscribe({
      next: flags => {
        for (const f of this.features) {
          if (f.persistKey != null && flags[f.persistKey] !== undefined) {
            f.enabled = !!flags[f.persistKey];
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        /* non-fatal */
      },
    });
  }

  saveFeatureFlags(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.featureFlagsSaving = true;
    this.featureFlagsMsg = '';
    this.featureFlagsErr = '';
    this.settingsService.getFeatures().subscribe({
      next: flags => {
        const merged = { ...flags };
        for (const f of this.features) {
          if (f.persistKey) {
            merged[f.persistKey] = f.enabled;
          }
        }
        this.settingsService.updateFeatures(merged).subscribe({
          next: () => {
            this.featureFlagsSaving = false;
            this.featureFlagsMsg = this.translate.instant(
              runtimeConfig.useMocks ? 'settings.featureFlagsSavedMock' : 'settings.featureFlagsSaved'
            );
            this.cdr.markForCheck();
          },
          error: () => {
            this.featureFlagsSaving = false;
            this.featureFlagsErr = this.translate.instant('settings.featureFlagsSaveErr');
            this.cdr.markForCheck();
          },
        });
      },
      error: () => {
        this.featureFlagsSaving = false;
        this.featureFlagsErr = this.translate.instant('settings.featureFlagsLoadErr');
        this.cdr.markForCheck();
      },
    });
  }

  reloadSettings(): void {
    this.settingsRefreshing = true;
    if (this.isParentOnlyChildren) {
      this.parentService.getChildren().subscribe(list => {
        this.myChildren = list ?? [];
        this.syncChildPhotoPreview();
        this.cdr.markForCheck();
      });
    }
    this.settingsService.get().subscribe({
      next: cfg => {
        this.schoolName = cfg.schoolName ?? this.schoolName;
        this.schoolCode = cfg.schoolCode ?? this.schoolCode;
        this.schoolEmail = cfg.email ?? this.schoolEmail;
        this.schoolPhone = cfg.phone ?? this.schoolPhone;
        this.schoolAddress = cfg.address ?? this.schoolAddress;
        this.primaryColor = cfg.primaryColor || this.primaryColor;
        this.accentColor = cfg.secondaryColor || this.accentColor;
        this.tenantId = cfg.tenantId ?? '';
        const td = this.auth.readTenantDisplayOverrides();
        if (td.schoolName) this.schoolName = td.schoolName;
        if (td.schoolEmail) this.schoolEmail = td.schoolEmail;
        if (td.schoolPhone) this.schoolPhone = td.schoolPhone;
        if (td.schoolAddress) this.schoolAddress = td.schoolAddress;
        this.settingsRefreshing = false;
        this.applyFeatureFlagsFromServer();
      },
      error: () => {
        this.settingsRefreshing = false;
      }
    });
    this.refreshProfilePreview();
  }

  private refreshProfilePreview(): void {
    const url = this.auth.getStoredAvatarDataUrl();
    this.profilePreviewUrl = url;
    this.profileInitials = this.auth.getUserInitials();
  }

  onOwnPhotoPicked(ev: ProfilePhotoPickEvent): void {
    this.auth.setMyProfileAvatarDataUrl(ev.dataUrl);
    this.refreshProfilePreview();
    this.cdr.markForCheck();
  }

  onOwnPhotoRemoved(): void {
    this.auth.clearMyProfileAvatarDataUrl();
    this.refreshProfilePreview();
    this.cdr.markForCheck();
  }

  syncChildPhotoPreview(): void {
    if (this.childPhotoTargetId == null) {
      this.childPhotoPreview = null;
      this.childPhotoInitials = '';
      return;
    }
    const s = this.myChildren.find(x => x.id === this.childPhotoTargetId);
    this.childPhotoInitials = s ? (s.firstName[0] + s.lastName[0]).toUpperCase() : '';
    this.childPhotoPreview = this.auth.getChildAvatarDataUrl(this.childPhotoTargetId);
  }

  onChildPhotoPicked(ev: ProfilePhotoPickEvent): void {
    if (this.childPhotoTargetId == null) return;
    this.auth.setChildAvatarDataUrl(this.childPhotoTargetId, ev.dataUrl);
    this.syncChildPhotoPreview();
    this.cdr.markForCheck();
  }

  onChildPhotoRemoved(): void {
    if (this.childPhotoTargetId == null) return;
    this.auth.clearChildAvatarDataUrl(this.childPhotoTargetId);
    this.syncChildPhotoPreview();
    this.cdr.markForCheck();
  }

  loadBranches(): void {
    this.branchesError = '';
    this.branchesLoading = true;
    this.branchesFetched = true;
    this.settingsService.listBranches(this.schoolCode).subscribe({
      next: list => {
        this.branches = list ?? [];
        this.branchesLoading = false;
      },
      error: () => {
        this.branchesLoading = false;
        this.branchesError = 'Could not load branches. Try again or check your connection.';
      }
    });
  }

  saveGeneral(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.generalSaveMsg = '';
    this.generalSaveError = '';
    this.auth.saveTenantDisplay({
      schoolName: this.schoolName,
      schoolEmail: this.schoolEmail,
      schoolPhone: this.schoolPhone,
      schoolAddress: this.schoolAddress
    });
    const payload = {
      schoolName: this.schoolName,
      email: this.schoolEmail,
      phone: this.schoolPhone,
      address: this.schoolAddress,
      primaryColor: this.primaryColor,
      secondaryColor: this.accentColor,
      tenantId: this.tenantId,
      schoolCode: this.schoolCode
    };
    this.saving = true;
    this.settingsService.update(payload).subscribe({
      next: () => {
        this.saving = false;
        this.generalSaveMsg = runtimeConfig.useMocks
          ? 'Saved on this device (mock). Same fields will sync from API when mocks are off.'
          : 'School information updated.';
        this.auth.fetchProfileSummary().subscribe();
      },
      error: () => {
        this.saving = false;
        this.generalSaveError = 'Save failed. Please try again.';
      }
    });
    this.themeService.applySchoolBranding(this.primaryColor, this.accentColor);
  }

  applyBranding(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.themeService.applySchoolBranding(this.primaryColor, this.accentColor);
    if (!runtimeConfig.useMocks) {
      this.settingsService.update({
        primaryColor: this.primaryColor,
        secondaryColor: this.accentColor,
        tenantId: this.tenantId
      }).subscribe();
    }
  }

  resetBranding(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.primaryColor = ThemeService.DEFAULT_PRIMARY;
    this.accentColor = ThemeService.DEFAULT_ACCENT;
    this.themeService.resetBrandingToDefault();
    if (!runtimeConfig.useMocks && this.tenantId) {
      this.settingsService
        .update({
          primaryColor: this.primaryColor,
          secondaryColor: this.accentColor,
          tenantId: this.tenantId
        })
        .subscribe();
    }
  }
}
