import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MOCK_RBAC_AUDIT_LOGS } from '../../core/mocks/audit-rbac-seed';
import { AuditLog } from '../../core/models/models';
import { RbacService } from '../../core/services/rbac.service';
import { AuditLogsService } from '../../core/services/audit-logs.service';
import { AuthService } from '../../core/services/auth.service';
import { runtimeConfig } from '../../core/config/runtime-config';
import type {
  CreateCustomSchoolRoleRequest,
  CreatePermissionGroupRequest,
  PermissionGroupRow,
  RbacStaffUserRow,
  SchoolRoleRow,
  UpdateCustomSchoolRoleRequest,
  UpdatePermissionGroupRequest,
} from '../../core/models/rbac.model';

type EditMode = 'create' | 'edit' | null;
type PackEditMode = 'create' | 'edit' | null;
type ComposeMode = 'direct' | 'groups';

@Component({
  selector: 'app-settings-rbac-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  template: `
    <div class="settings-rbac" data-testid="settings-rbac-panel">
      <p class="settings-rbac__lead">{{ 'settings.rbac.lead' | translate }}</p>
      <p class="settings-rbac__lead-sub small text-muted">{{ 'settings.rbac.leadSub' | translate }}</p>
      <p *ngIf="usesMocks" class="settings-rbac__banner">
        {{ 'settings.rbac.mockBanner' | translate }}
      </p>

      <section class="settings-rbac__section" [attr.aria-label]="'settings.rbac.recentAuditTitle' | translate">
        <div class="settings-rbac__section-head">
          <h4 class="settings-rbac__h m-0">{{ 'settings.rbac.recentAuditTitle' | translate }}</h4>
          <a
            class="settings-rbac__text-link"
            routerLink="/app/audit"
            [queryParams]="{ module: 'RBAC' }"
            [attr.aria-label]="'settings.rbac.openFullAudit' | translate">
            {{ 'settings.rbac.openFullAudit' | translate }}
            <span class="settings-rbac__text-link-ico" aria-hidden="true">→</span>
          </a>
        </div>
        <p *ngIf="auditStripErr" class="text-danger small mb-2 mt-0">{{ auditStripErr }}</p>
        <div class="settings-rbac__table-wrap table-responsive" *ngIf="recentRbacLogs.length > 0">
          <table class="erp-table mb-0">
            <thead>
              <tr>
                <th>{{ 'audit.thAction' | translate }}</th>
                <th>{{ 'audit.thDescription' | translate }}</th>
                <th>{{ 'audit.thUser' | translate }}</th>
                <th>{{ 'audit.thTimestamp' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of recentRbacLogs">
                <td class="text-capitalize small">{{ l.action }}</td>
                <td class="small">{{ l.description }}</td>
                <td class="small">{{ l.userName }}</td>
                <td class="small text-muted">{{ l.timestamp | date : 'yyyy-MM-dd HH:mm' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p *ngIf="!auditStripLoading && recentRbacLogs.length === 0" class="settings-rbac__empty">
          {{ 'settings.rbac.recentAuditEmpty' | translate }}
        </p>
        <p *ngIf="auditStripLoading" class="settings-rbac__empty">{{ 'settings.rbac.recentAuditLoading' | translate }}</p>
      </section>

      <section class="settings-rbac__section" [attr.aria-label]="'settings.rbac.packsTitle' | translate">
        <div class="settings-rbac__section-head settings-rbac__catalog-head">
          <div class="settings-rbac__catalog-head-text">
            <h4 class="settings-rbac__h m-0">{{ 'settings.rbac.packsTitle' | translate }}</h4>
            <p class="settings-rbac__catalog-hint small text-muted mb-0 mt-1">{{ 'settings.rbac.packsHint' | translate }}</p>
          </div>
          <button
            type="button"
            class="btn-secondary-erp btn-sm"
            (click)="openPackCreate()"
            [disabled]="loading || permLoading || packSaving">
            <i class="bi bi-collection me-1" aria-hidden="true"></i>{{ 'settings.rbac.addPack' | translate }}
          </button>
        </div>
        <p *ngIf="packListErr" class="text-danger small mb-2">{{ packListErr }}</p>
        <div class="settings-rbac__table-wrap table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th scope="col">{{ 'settings.rbac.thPackCode' | translate }}</th>
                <th scope="col">{{ 'settings.rbac.thPackName' | translate }}</th>
                <th scope="col">{{ 'settings.rbac.thPackKind' | translate }}</th>
                <th scope="col">{{ 'settings.rbac.thPackPerms' | translate }}</th>
                <th scope="col" class="text-end">{{ 'settings.rbac.thPackActions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let g of permissionGroups">
                <td><code class="erp-code">{{ g.code }}</code></td>
                <td>
                  <strong class="settings-rbac__name">{{ g.name }}</strong>
                  <div class="settings-rbac__desc" *ngIf="g.description">{{ g.description }}</div>
                </td>
                <td>
                  <span class="settings-rbac__tag" [class.settings-rbac__tag--custom]="!g.systemTemplate">
                    {{ (g.systemTemplate ? 'settings.rbac.packKindSystem' : 'settings.rbac.packKindCustom') | translate }}
                  </span>
                </td>
                <td class="small">
                  <span *ngIf="g.permissions?.length">{{ 'settings.rbac.accessCount' | translate: { n: g.permissions.length } }}</span>
                  <span *ngIf="!g.permissions?.length" class="text-muted">—</span>
                </td>
                <td class="text-end text-nowrap">
                  <ng-container *ngIf="!g.systemTemplate; else packNoAct">
                    <button type="button" class="btn-outline-erp btn-sm" (click)="openPackEdit(g)">
                      {{ 'settings.rbac.actionEdit' | translate }}
                    </button>
                    <button type="button" class="btn-outline-erp btn-sm ms-1 settings-rbac__btn-danger" (click)="onDeletePack(g)">
                      {{ 'settings.rbac.actionDelete' | translate }}
                    </button>
                  </ng-container>
                  <ng-template #packNoAct><span class="text-muted">—</span></ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="settings-rbac__section" [attr.aria-label]="'settings.rbac.staffLabel' | translate">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-lg-6">
            <label class="erp-label" for="rbac-staff-pick">{{ 'settings.rbac.staffLabel' | translate }}</label>
            <select
              id="rbac-staff-pick"
              class="erp-select w-100"
              [(ngModel)]="selectedStaffId"
              (ngModelChange)="onStaffChange()"
              [disabled]="loading || staff.length === 0">
              <option [ngValue]="null">{{ 'settings.rbac.selectStaff' | translate }}</option>
              <option *ngFor="let s of staff" [ngValue]="s.id">{{ s.name }} ({{ portalRoleLabel(s.portalRole) }})</option>
            </select>
          </div>
          <div class="col-12 col-lg-6 d-flex flex-wrap gap-2 align-items-end">
            <button
              type="button"
              class="btn-primary-erp"
              (click)="openAssignModal()"
              [disabled]="!selectedStaffId || loading || staff.length === 0">
              <i class="bi bi-sliders me-1" aria-hidden="true"></i>{{ 'settings.rbac.assignOpenCta' | translate }}
            </button>
            <span *ngIf="saveOk" class="text-success small align-self-center">{{ 'settings.rbac.saved' | translate }}</span>
            <span *ngIf="errMsg" class="text-danger small align-self-center">{{ errMsg }}</span>
          </div>
        </div>
        <div *ngIf="selectedStaffId" class="settings-rbac__assign-summary mt-3">
          <div class="settings-rbac__assign-summary-text">
            <div class="fw-semibold small text-uppercase text-muted mb-1">{{ 'settings.rbac.assignTitle' | translate }}</div>
            <p class="mb-0 small text-muted">{{ 'settings.rbac.assignSummaryHint' | translate }}</p>
            <p class="mb-0 small fw-semibold mt-2 text-body" *ngIf="selectedRoleIds.length === 0">
              {{ 'settings.rbac.assignSummaryNone' | translate }}
            </p>
            <p class="mb-0 small fw-semibold mt-2 text-body" *ngIf="selectedRoleIds.length > 0">
              {{ 'settings.rbac.assignSummaryCount' | translate: { n: selectedRoleIds.length } }}
            </p>
          </div>
        </div>
      </section>

      <div class="settings-rbac__section-head settings-rbac__section-head--rule settings-rbac__catalog-head">
        <div class="settings-rbac__catalog-head-text">
          <h4 class="settings-rbac__h m-0">{{ 'settings.rbac.catalogTitle' | translate }}</h4>
          <p class="settings-rbac__catalog-hint small text-muted mb-0 mt-1">{{ 'settings.rbac.catalogHint' | translate }}</p>
        </div>
        <button
          type="button"
          class="btn-secondary-erp btn-sm"
          (click)="openCreate()"
          [disabled]="loading || permLoading">
          <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>{{ 'settings.rbac.addCustom' | translate }}
        </button>
      </div>
      <div class="settings-rbac__table-wrap table-responsive">
        <table class="erp-table">
          <thead>
            <tr>
              <th scope="col">{{ 'settings.rbac.thCode' | translate }}</th>
              <th scope="col">{{ 'settings.rbac.thName' | translate }}</th>
              <th scope="col">{{ 'settings.rbac.thKind' | translate }}</th>
              <th scope="col">{{ 'settings.rbac.thPerms' | translate }}</th>
              <th *ngIf="hasCustomRows" scope="col" class="text-end">{{ 'settings.rbac.thActions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of catalog">
              <td><code class="erp-code">{{ r.code }}</code></td>
              <td>
                <strong class="settings-rbac__name">{{ r.name }}</strong>
                <div class="settings-rbac__desc" *ngIf="r.description">{{ r.description }}</div>
              </td>
              <td>
                <span class="settings-rbac__tag" [class.settings-rbac__tag--custom]="!r.systemRole">
                  {{ (r.systemRole ? 'settings.rbac.kindSystem' : 'settings.rbac.kindCustom') | translate }}
                </span>
              </td>
              <td class="small settings-rbac__access-td">
                <div class="settings-rbac__access-line">{{ accessSummaryLine(r.permissions) }}</div>
                <div class="settings-rbac__access-foot text-muted small" *ngIf="r.permissions.length">
                  {{ 'settings.rbac.accessCount' | translate: { n: r.permissions.length } }}
                </div>
              </td>
              <td *ngIf="hasCustomRows" class="text-end text-nowrap">
                <ng-container *ngIf="!r.systemRole; else noAct">
                  <button type="button" class="btn-outline-erp btn-sm" (click)="openEdit(r)">
                    {{ 'settings.rbac.actionEdit' | translate }}
                  </button>
                  <button type="button" class="btn-outline-erp btn-sm ms-1 settings-rbac__btn-danger" (click)="onDelete(r)">
                    {{ 'settings.rbac.actionDelete' | translate }}
                  </button>
                </ng-container>
                <ng-template #noAct><span class="text-muted">—</span></ng-template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

      <div
      *ngIf="editMode"
      class="settings-rbac__modal-backdrop modal-overlay-viewport"
      (click)="$event.target === $event.currentTarget && closeEditor()"
      role="dialog"
      aria-modal="true">
      <div class="settings-rbac__modal settings-rbac__modal--editor" (click)="$event.stopPropagation()">
        <div class="settings-rbac__modal-head">
          <h5 class="mb-0">
            {{ editMode === 'create' ? ('settings.rbac.createTitle' | translate) : ('settings.rbac.editTitle' | translate) }}
          </h5>
        </div>
        <div class="settings-rbac__modal-body">
          <div class="mb-2" *ngIf="editMode === 'create'">
            <label class="erp-label" for="cr-code">{{ 'settings.rbac.fieldCode' | translate }}</label>
            <input
              id="cr-code"
              class="erp-input w-100"
              [disabled]="savingForm"
              [(ngModel)]="formCode"
              autocomplete="off"
              [attr.placeholder]="'settings.rbac.codePlaceholder' | translate" />
          </div>
          <div class="mb-2">
            <label class="erp-label" for="cr-name">{{ 'settings.rbac.fieldName' | translate }}</label>
            <input id="cr-name" class="erp-input w-100" [disabled]="savingForm" [(ngModel)]="formName" />
          </div>
          <div class="mb-2">
            <label class="erp-label" for="cr-desc">{{ 'settings.rbac.fieldDescription' | translate }}</label>
            <textarea id="cr-desc" class="erp-input w-100" rows="2" [disabled]="savingForm" [(ngModel)]="formDesc"></textarea>
          </div>
          <div class="mb-2">
            <label class="erp-label" for="cr-sort">{{ 'settings.rbac.fieldSort' | translate }}</label>
            <input id="cr-sort" type="number" class="erp-input" [disabled]="savingForm" [(ngModel)]="formSort" />
          </div>
          <div class="mb-2">
            <div class="fw-semibold small mb-1">{{ 'settings.rbac.composeLabel' | translate }}</div>
            <label class="settings-rbac__check small d-block">
              <input
                type="radio"
                name="rbac-compose"
                value="direct"
                [disabled]="savingForm"
                [(ngModel)]="formComposeMode"
                (ngModelChange)="onComposeModeChange()" />
              <span class="settings-rbac__check-text">{{ 'settings.rbac.composeDirect' | translate }}</span>
            </label>
            <label class="settings-rbac__check small d-block">
              <input
                type="radio"
                name="rbac-compose"
                value="groups"
                [disabled]="savingForm"
                [(ngModel)]="formComposeMode"
                (ngModelChange)="onComposeModeChange()" />
              <span class="settings-rbac__check-text">{{ 'settings.rbac.composeGroups' | translate }}</span>
            </label>
          </div>
          <ng-container *ngIf="formComposeMode === 'groups'">
            <p class="small text-muted mb-1">{{ 'settings.rbac.groupsPickerHint' | translate }}</p>
            <div class="settings-rbac__perm-grid">
              <label *ngFor="let g of permissionGroups" class="settings-rbac__perm-row small">
                <input
                  type="checkbox"
                  [disabled]="savingForm"
                  [checked]="formGroupIds.includes(g.id)"
                  (change)="togglePackForRole(g.id, $any($event.target).checked)" />
                <span class="settings-rbac__perm-lbl">{{ g.name }}</span>
                <code class="erp-code settings-rbac__perm-code">{{ g.code }}</code>
              </label>
            </div>
          </ng-container>
          <ng-container *ngIf="formComposeMode === 'direct'">
            <p class="small text-muted mb-1">{{ 'settings.rbac.permsLabel' | translate }}</p>
            <div class="settings-rbac__perm-grid">
              <label *ngFor="let p of permCatalog" class="settings-rbac__perm-row small">
                <input
                  type="checkbox"
                  [disabled]="savingForm"
                  [checked]="formPermsSet.has(p)"
                  (change)="togglePerm(p, $any($event.target).checked)" />
                <span class="settings-rbac__perm-lbl">{{ permLabel(p) }}</span>
                <code class="erp-code settings-rbac__perm-code">{{ p }}</code>
              </label>
            </div>
          </ng-container>
          <p *ngIf="formErr" class="text-danger small mt-2 mb-0">{{ formErr }}</p>
        </div>
        <div class="settings-rbac__modal-footer">
          <button type="button" class="btn-outline-erp" [disabled]="savingForm" (click)="closeEditor()">
            {{ 'settings.rbac.actionCancel' | translate }}
          </button>
          <button type="button" class="btn-primary-erp" [disabled]="savingForm || !canSubmitCustom" (click)="submitCustom()">
            {{ savingForm ? ('settings.rbac.savingForm' | translate) : ('settings.rbac.actionSave' | translate) }}
          </button>
        </div>
      </div>
    </div>

    <div
      *ngIf="assignModalOpen"
      class="settings-rbac__modal-backdrop modal-overlay-viewport"
      (click)="$event.target === $event.currentTarget && closeAssignModal()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rbac-assign-dialog-title">
      <div class="settings-rbac__modal settings-rbac__modal--assign" (click)="$event.stopPropagation()">
        <div class="settings-rbac__modal-head">
          <h5 id="rbac-assign-dialog-title" class="mb-2">
            {{ 'settings.rbac.assignModalTitle' | translate: { name: selectedStaffDisplayName() } }}
          </h5>
          <p class="small text-muted mb-0">{{ 'settings.rbac.assignModalSubtitle' | translate }}</p>
        </div>
        <div class="settings-rbac__modal-body">
          <div class="settings-rbac__assign-list">
            <label *ngFor="let r of catalog" class="settings-rbac__assign-row">
              <input
                type="checkbox"
                [checked]="draftRoleSelected(r.id)"
                (change)="toggleDraftRole(r.id, $any($event.target).checked)" />
              <div class="settings-rbac__assign-row-body">
                <div class="settings-rbac__assign-row-head">
                  <strong class="settings-rbac__name">{{ r.name }}</strong>
                  <code class="erp-code settings-rbac__assign-code">{{ r.code }}</code>
                </div>
                <div class="settings-rbac__assign-row-desc" *ngIf="r.description">{{ r.description }}</div>
                <div class="settings-rbac__assign-row-foot" *ngIf="r.permissions?.length">
                  <span class="settings-rbac__perm-preview">{{ accessSummaryLine(r.permissions) }}</span>
                  <span class="text-muted"> · </span>
                  <span class="text-muted">{{ 'settings.rbac.accessCount' | translate: { n: r.permissions.length } }}</span>
                </div>
              </div>
            </label>
          </div>
        </div>
        <div class="settings-rbac__modal-footer">
          <button type="button" class="btn-outline-erp" (click)="closeAssignModal()" [disabled]="saving">
            {{ 'settings.rbac.actionCancel' | translate }}
          </button>
          <button type="button" class="btn-primary-erp" (click)="saveAssignModal()" [disabled]="saving">
            {{ saving ? ('settings.rbac.saving' | translate) : ('settings.rbac.assignModalSave' | translate) }}
          </button>
        </div>
      </div>
    </div>

    <div
      *ngIf="packEditMode"
      class="settings-rbac__modal-backdrop modal-overlay-viewport"
      (click)="$event.target === $event.currentTarget && closePackEditor()"
      role="dialog"
      aria-modal="true">
      <div class="settings-rbac__modal settings-rbac__modal--editor" (click)="$event.stopPropagation()">
        <div class="settings-rbac__modal-head">
          <h5 class="mb-0">
            {{ packEditMode === 'create' ? ('settings.rbac.packCreateTitle' | translate) : ('settings.rbac.packEditTitle' | translate) }}
          </h5>
        </div>
        <div class="settings-rbac__modal-body">
          <div class="mb-2" *ngIf="packEditMode === 'create'">
            <label class="erp-label" for="pk-code">{{ 'settings.rbac.fieldPackCode' | translate }}</label>
            <input
              id="pk-code"
              class="erp-input w-100"
              [disabled]="packSaving"
              [(ngModel)]="packFormCode"
              autocomplete="off"
              [attr.placeholder]="'settings.rbac.codePlaceholder' | translate" />
          </div>
          <div class="mb-2">
            <label class="erp-label" for="pk-name">{{ 'settings.rbac.fieldName' | translate }}</label>
            <input id="pk-name" class="erp-input w-100" [disabled]="packSaving" [(ngModel)]="packFormName" />
          </div>
          <div class="mb-2">
            <label class="erp-label" for="pk-desc">{{ 'settings.rbac.fieldDescription' | translate }}</label>
            <textarea id="pk-desc" class="erp-input w-100" rows="2" [disabled]="packSaving" [(ngModel)]="packFormDesc"></textarea>
          </div>
          <div class="mb-2">
            <label class="erp-label" for="pk-sort">{{ 'settings.rbac.fieldSort' | translate }}</label>
            <input id="pk-sort" type="number" class="erp-input" [disabled]="packSaving" [(ngModel)]="packFormSort" />
          </div>
          <p class="small text-muted mb-1">{{ 'settings.rbac.packPermsLabel' | translate }}</p>
          <div class="settings-rbac__perm-grid">
            <label *ngFor="let p of permCatalog" class="settings-rbac__perm-row small">
              <input
                type="checkbox"
                [disabled]="packSaving"
                [checked]="packFormPermsSet.has(p)"
                (change)="togglePackPerm(p, $any($event.target).checked)" />
              <span class="settings-rbac__perm-lbl">{{ permLabel(p) }}</span>
              <code class="erp-code settings-rbac__perm-code">{{ p }}</code>
            </label>
          </div>
          <p *ngIf="packFormErr" class="text-danger small mt-2 mb-0">{{ packFormErr }}</p>
        </div>
        <div class="settings-rbac__modal-footer">
          <button type="button" class="btn-outline-erp" [disabled]="packSaving" (click)="closePackEditor()">
            {{ 'settings.rbac.actionCancel' | translate }}
          </button>
          <button type="button" class="btn-primary-erp" [disabled]="packSaving || !canSubmitPack" (click)="submitPack()">
            {{ packSaving ? ('settings.rbac.savingForm' | translate) : ('settings.rbac.actionSave' | translate) }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .settings-rbac {
        color: var(--clr-text);
        font-size: 14px;
      }
      .settings-rbac__lead {
        line-height: 1.55;
        max-width: 52rem;
        margin: 0 0 0.5rem;
        font-size: 13px;
        font-weight: 500;
        color: var(--clr-text-secondary);
      }
      .settings-rbac__lead-sub {
        line-height: 1.5;
        max-width: 52rem;
        margin: 0 0 1rem;
        font-size: 12.5px;
      }
      .settings-rbac__banner {
        padding: 0.5rem 0.85rem;
        border-radius: var(--radius-md);
        border: 1px solid color-mix(in srgb, var(--clr-primary) 18%, var(--clr-border));
        background: color-mix(in srgb, var(--clr-primary) 6%, var(--clr-surface));
        color: var(--clr-text-secondary);
        font-size: 12.5px;
        margin: 0 0 1rem;
      }
      .settings-rbac__section {
        background: var(--clr-surface-alt);
        border: 1px solid var(--clr-border);
        border-radius: var(--radius-lg);
        padding: 1rem 1.15rem 1.1rem;
        margin-bottom: 1.25rem;
        box-shadow: var(--shadow-sm);
      }
      .settings-rbac__section--tight {
        margin-top: 0.25rem;
      }
      .settings-rbac__section-head {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.75rem 1rem;
        margin-bottom: 0.75rem;
      }
      .settings-rbac__section-head--rule {
        margin-bottom: 0.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--clr-border);
        align-items: center;
      }
      .settings-rbac__catalog-head {
        align-items: flex-start !important;
        gap: 0.75rem 1rem;
      }
      .settings-rbac__catalog-head .btn-secondary-erp,
      .settings-rbac__catalog-head .btn {
        flex-shrink: 0;
        align-self: flex-start;
        margin-top: 0.15rem;
      }
      .settings-rbac__catalog-hint {
        max-width: 40rem;
        line-height: 1.5;
        font-size: 12.5px;
      }
      .settings-rbac__access-line {
        line-height: 1.45;
        color: var(--clr-text-secondary);
        font-size: 13px;
      }
      .settings-rbac__access-foot {
        margin-top: 0.2rem;
        font-size: 12px;
      }
      .settings-rbac__check-meta {
        display: block;
        margin-top: 0.2rem;
      }
      .settings-rbac__perm-row {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.35rem 0.5rem;
        cursor: pointer;
        padding: 0.15rem 0;
        border-bottom: 1px solid color-mix(in srgb, var(--clr-border) 55%, transparent);
      }
      .settings-rbac__perm-row:last-child {
        border-bottom: none;
      }
      .settings-rbac__perm-lbl {
        flex: 1;
        min-width: 10rem;
        color: var(--clr-text);
      }
      .settings-rbac__perm-code {
        font-size: 10.5px !important;
        font-weight: 600;
      }
      .settings-rbac__h {
        font-size: 0.9375rem;
        font-weight: 800;
        margin: 0 0 0.75rem;
        color: var(--clr-text-primary);
        font-family: var(--font-heading);
        letter-spacing: -0.02em;
      }
      .settings-rbac__text-link {
        color: var(--clr-primary);
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        border-bottom: 1px solid color-mix(in srgb, var(--clr-primary) 35%, transparent);
        padding-bottom: 1px;
        transition: color 0.15s ease, border-color 0.15s ease;
      }
      .settings-rbac__text-link:hover {
        color: var(--clr-primary-light);
        border-bottom-color: var(--clr-primary-light);
      }
      .settings-rbac__text-link-ico {
        font-weight: 400;
      }
      [data-theme='dark'] .settings-rbac__text-link {
        color: var(--clr-primary-light);
      }
      [data-theme='dark'] .settings-rbac__text-link:hover {
        color: var(--clr-primary);
      }
      .settings-rbac__empty {
        font-size: 12.5px;
        color: var(--clr-text-muted);
        margin: 0;
      }
      .settings-rbac__table-wrap {
        border-radius: var(--radius-md);
        border: 1px solid var(--clr-border);
        background: var(--clr-surface);
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
      }
      .settings-rbac__table-wrap .erp-table {
        background: var(--clr-surface);
      }
      .settings-rbac__name {
        color: var(--clr-text-primary);
        font-weight: 700;
      }
      .settings-rbac__desc {
        font-size: 12px;
        line-height: 1.4;
        color: var(--clr-text-muted);
        margin-top: 0.2rem;
        max-width: 32rem;
      }
      .settings-rbac__perm-preview {
        font-weight: 600;
        color: var(--clr-text-secondary);
      }
      .settings-rbac__tag {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-sm);
        background: color-mix(in srgb, var(--clr-primary) 10%, var(--clr-surface));
        color: var(--clr-text-secondary);
        border: 1px solid color-mix(in srgb, var(--clr-primary) 18%, var(--clr-border));
      }
      .settings-rbac__tag--custom {
        background: color-mix(in srgb, var(--clr-info) 10%, var(--clr-surface));
        border-color: color-mix(in srgb, var(--clr-info) 28%, var(--clr-border));
        color: var(--clr-text-secondary);
      }
      .settings-rbac__checks {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        max-width: 40rem;
      }
      .settings-rbac__check {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
        padding: 0.4rem 0.5rem;
        margin: 0;
        border-radius: var(--radius-md);
        cursor: pointer;
        border: 1px solid transparent;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .settings-rbac__check:hover {
        background: var(--clr-hover);
        border-color: var(--clr-border);
      }
      .settings-rbac__check input {
        margin-top: 0.2rem;
        flex-shrink: 0;
        accent-color: var(--clr-primary);
      }
      .settings-rbac__check-text {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem 0.5rem;
      }
      .settings-rbac__code-inline {
        font-size: 11px;
        font-weight: 600;
      }
      .settings-rbac__modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 4000;
        display: grid;
        place-items: center;
        align-content: center;
        padding: max(16px, env(safe-area-inset-top, 0px))
          max(20px, env(safe-area-inset-right, 0px))
          max(16px, env(safe-area-inset-bottom, 0px))
          max(20px, env(safe-area-inset-left, 0px));
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        box-sizing: border-box;
        background: color-mix(in srgb, var(--clr-bg) 20%, rgba(8, 12, 20, 0.72));
      }
      .settings-rbac__modal {
        width: min(36rem, 100%);
        max-width: 100%;
        max-height: min(88dvh, calc(100dvh - 32px));
        margin: auto;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 0;
        border: 1px solid var(--clr-border);
        border-radius: var(--radius-xl);
        background: var(--clr-surface);
        box-shadow: var(--shadow-lg);
        color: var(--clr-text);
      }
      .settings-rbac__modal-head {
        flex-shrink: 0;
        padding: 1.1rem 1.35rem 0.85rem;
        border-bottom: 1px solid var(--clr-border-light);
      }
      .settings-rbac__modal-body {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 1rem 1.35rem;
      }
      .settings-rbac__modal-footer {
        flex-shrink: 0;
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.85rem 1.35rem 1.1rem;
        border-top: 1px solid var(--clr-border);
        background: var(--clr-surface);
      }
      .settings-rbac__modal h5 {
        font-size: 1.05rem;
        font-weight: 800;
        color: var(--clr-text-primary);
        font-family: var(--font-heading);
      }
      .settings-rbac__perm-grid {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        max-height: 12rem;
        overflow: auto;
        padding: 0.5rem 0.6rem;
        border: 1px solid var(--clr-border);
        border-radius: var(--radius-md);
        background: var(--clr-surface-muted);
      }
      .settings-rbac__perm-grid code {
        font-size: 11.5px;
        background: transparent;
        border: none;
        padding: 0;
        color: var(--clr-text-secondary);
        font-weight: 600;
      }
      .settings-rbac__btn-danger {
        color: var(--clr-danger);
        border-color: color-mix(in srgb, var(--clr-danger) 32%, var(--surface-ring));
      }
      .settings-rbac__btn-danger:hover:not(:disabled) {
        background: color-mix(in srgb, var(--clr-danger) 10%, var(--clr-surface));
        border-color: color-mix(in srgb, var(--clr-danger) 45%, var(--clr-border));
      }
      .settings-rbac__table-wrap .erp-table {
        min-width: 520px;
      }
      .settings-rbac__assign-summary {
        padding: 12px 14px;
        border-radius: var(--radius-md);
        border: 1px solid var(--clr-border);
        background: color-mix(in srgb, var(--clr-surface-muted) 75%, var(--clr-surface) 25%);
      }
      .settings-rbac__assign-summary-text {
        min-width: 0;
      }
      .settings-rbac__modal--assign {
        width: min(34rem, 100%);
      }
      .settings-rbac__modal--editor .settings-rbac__perm-grid {
        max-height: none;
      }
      .settings-rbac__modal-body .settings-rbac__assign-list {
        max-height: none;
        margin-top: 0;
      }
      .settings-rbac__assign-list {
        overflow: visible;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 2px 2px 4px;
      }
      .settings-rbac__assign-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 12px 14px;
        border: 1px solid var(--clr-border);
        border-radius: var(--radius-md);
        background: var(--clr-surface);
        cursor: pointer;
        margin: 0;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .settings-rbac__assign-row:hover {
        border-color: color-mix(in srgb, var(--clr-primary) 28%, var(--clr-border));
        box-shadow: var(--shadow-sm);
      }
      .settings-rbac__assign-row input {
        margin-top: 4px;
        flex-shrink: 0;
        accent-color: var(--clr-primary);
      }
      .settings-rbac__assign-row-body {
        flex: 1;
        min-width: 0;
      }
      .settings-rbac__assign-row-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 10px;
        margin-bottom: 4px;
      }
      .settings-rbac__assign-code {
        font-size: 10.5px !important;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        background: color-mix(in srgb, var(--clr-info) 10%, var(--clr-surface));
        border: 1px solid color-mix(in srgb, var(--clr-info) 28%, var(--clr-border));
      }
      .settings-rbac__assign-row-desc {
        font-size: 12.5px;
        color: var(--clr-text-secondary);
        line-height: 1.45;
        margin-bottom: 4px;
      }
      .settings-rbac__assign-row-foot {
        font-size: 11.5px;
        line-height: 1.45;
        color: var(--clr-text-muted);
      }
      @media (max-width: 576px) {
        .settings-rbac__modal-backdrop {
          padding: max(10px, env(safe-area-inset-top, 0px)) 12px max(14px, env(safe-area-inset-bottom, 0px));
        }
        .settings-rbac__modal {
          width: min(100%, calc(100vw - 24px));
          max-height: min(90dvh, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 28px));
        }
        .settings-rbac__modal--assign {
          width: min(100%, calc(100vw - 24px));
        }
        .settings-rbac__desc {
          max-width: none;
        }
      }
    `,
  ],
})
export class SettingsRbacPanelComponent implements OnInit, OnDestroy {
  protected usesMocks = runtimeConfig.useRbacMocks;
  protected loading = true;
  protected permLoading = true;
  protected saving = false;
  protected errMsg = '';
  protected saveOk = false;
  protected catalog: SchoolRoleRow[] = [];
  protected staff: RbacStaffUserRow[] = [];
  protected permCatalog: string[] = [];
  protected selectedStaffId: number | null = null;
  protected selectedRoleIds: number[] = [];
  protected assignModalOpen = false;
  protected draftRoleIds: number[] = [];
  protected editMode: EditMode = null;
  protected savingForm = false;
  protected formErr = '';
  protected formCode = '';
  protected formName = '';
  protected formDesc = '';
  protected formSort = 1000;
  protected formPerms: string[] = [];
  protected formPermsSet = new Set<string>();
  protected formComposeMode: ComposeMode = 'direct';
  protected formGroupIds: number[] = [];
  protected permissionGroups: PermissionGroupRow[] = [];
  protected packListErr = '';
  protected packEditMode: PackEditMode = null;
  protected packSaving = false;
  protected packFormErr = '';
  protected packFormCode = '';
  protected packFormName = '';
  protected packFormDesc = '';
  protected packFormSort = 1000;
  protected packFormPermsSet = new Set<string>();
  private packEditingId: number | null = null;
  private editingId: number | null = null;
  protected recentRbacLogs: AuditLog[] = [];
  protected auditStripLoading = false;
  protected auditStripErr = '';

  private destroy$ = new Subject<void>();

  constructor(
    private rbac: RbacService,
    private auditLogs: AuditLogsService,
    private translate: TranslateService,
    private auth: AuthService
  ) {}

  /** Plain-language line for the “What they can access” column. */
  protected accessSummaryLine(permissions: string[]): string {
    if (!permissions?.length) {
      return this.translate.instant('settings.rbac.accessNone');
    }
    const parts = permissions.slice(0, 3).map(p => this.permLabel(p));
    let s = parts.join(' · ');
    if (permissions.length > 3) {
      s += ' ' + this.translate.instant('settings.rbac.accessAndMore', { n: permissions.length - 3 });
    }
    return s;
  }

  /** Short label for a single permission code (i18n, falls back to code). */
  protected permLabel(code: string): string {
    const k = 'settings.rbac.permShort.' + code;
    const t = this.translate.instant(k);
    return t === k ? code : t;
  }

  /** Staff directory role (admin / teacher / library) in plain language. */
  protected portalRoleLabel(portal: string | undefined): string {
    if (portal == null || portal === '') {
      return '';
    }
    const k = 'settings.rbac.portal.' + portal;
    const t = this.translate.instant(k);
    return t === k ? portal : t;
  }

  get hasCustomRows(): boolean {
    return this.catalog.some(r => !r.systemRole);
  }

  get canSubmitCustom(): boolean {
    if (!this.formName?.trim()) {
      return false;
    }
    const hasDirect = this.formComposeMode === 'direct' && (this.formPerms?.length ?? 0) > 0;
    const hasGroups = this.formComposeMode === 'groups' && (this.formGroupIds?.length ?? 0) > 0;
    if (!hasDirect && !hasGroups) {
      return false;
    }
    if (this.editMode === 'create') {
      return /^[A-Z][A-Z0-9_]+$/.test((this.formCode || '').trim()) && (this.formCode || '').trim().length >= 2;
    }
    return true;
  }

  get canSubmitPack(): boolean {
    if (!this.packFormName?.trim() || (this.packFormPermsSet?.size ?? 0) < 1) {
      return false;
    }
    if (this.packEditMode === 'create') {
      return /^[A-Z][A-Z0-9_]+$/.test((this.packFormCode || '').trim()) && (this.packFormCode || '').trim().length >= 2;
    }
    return true;
  }

  ngOnInit(): void {
    this.loading = true;
    this.permLoading = true;
    forkJoin([
      this.rbac.listSchoolRoleCatalog(),
      this.rbac.listStaffUsers(),
      this.rbac.getPermissionCatalog(),
      this.rbac.listPermissionGroups(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([rows, s, perms, packs]) => {
          this.catalog = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
          this.staff = s;
          this.permCatalog = perms;
          this.permissionGroups = [...packs].sort((a, b) => a.sortOrder - b.sortOrder);
          this.packListErr = '';
          this.loading = false;
          this.permLoading = false;
          this.loadRecentRbacStrip();
        },
        error: e => {
          this.errMsg = (e as Error)?.message ?? 'load';
          this.packListErr = (e as Error)?.message ?? 'load';
          this.loading = false;
          this.permLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onStaffChange(): void {
    this.assignModalOpen = false;
    this.saveOk = false;
    this.errMsg = '';
    if (this.selectedStaffId == null) {
      this.selectedRoleIds = [];
      return;
    }
    this.loading = true;
    this.rbac
      .getUserAssignments(this.selectedStaffId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: a => {
          this.selectedRoleIds = [...(a.schoolRoleIds ?? [])];
          this.loading = false;
        },
        error: e => {
          this.errMsg = (e as Error)?.message ?? 'load';
          this.loading = false;
        },
      });
  }

  protected selectedStaffDisplayName(): string {
    if (this.selectedStaffId == null) {
      return '';
    }
    return this.staff.find(s => s.id === this.selectedStaffId)?.name ?? '';
  }

  protected openAssignModal(): void {
    if (this.selectedStaffId == null || this.loading) {
      return;
    }
    this.draftRoleIds = [...this.selectedRoleIds];
    this.saveOk = false;
    this.errMsg = '';
    this.assignModalOpen = true;
  }

  protected closeAssignModal(): void {
    this.assignModalOpen = false;
  }

  protected draftRoleSelected(id: number): boolean {
    return this.draftRoleIds.includes(id);
  }

  protected toggleDraftRole(id: number, on: boolean): void {
    if (on) {
      if (!this.draftRoleIds.includes(id)) {
        this.draftRoleIds = [...this.draftRoleIds, id].sort((a, b) => a - b);
      }
    } else {
      this.draftRoleIds = this.draftRoleIds.filter(x => x !== id);
    }
  }

  protected saveAssignModal(): void {
    if (this.selectedStaffId == null) {
      return;
    }
    this.saving = true;
    this.saveOk = false;
    this.errMsg = '';
    this.rbac
      .replaceUserAssignments(this.selectedStaffId, this.draftRoleIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedRoleIds = [...this.draftRoleIds];
          this.saveOk = true;
          this.saving = false;
          this.assignModalOpen = false;
          this.loadRecentRbacStrip();
          const cur = this.auth.getCurrentUser();
          if (cur && this.selectedStaffId === cur.id && !runtimeConfig.useMocks) {
            this.auth.syncProfileFromServer().subscribe({ error: () => void 0 });
          }
        },
        error: e => {
          this.errMsg = (e as Error)?.message ?? 'save';
          this.saving = false;
        },
      });
  }

  protected openCreate(): void {
    this.assignModalOpen = false;
    this.editMode = 'create';
    this.editingId = null;
    this.formCode = 'CUST_';
    this.formName = '';
    this.formDesc = '';
    this.formSort = 1000;
    this.formPerms = [];
    this.formPermsSet = new Set();
    this.formComposeMode = 'direct';
    this.formGroupIds = [];
    this.formErr = '';
  }

  protected openEdit(r: SchoolRoleRow): void {
    this.assignModalOpen = false;
    this.editMode = 'edit';
    this.editingId = r.id;
    this.formCode = r.code;
    this.formName = r.name;
    this.formDesc = r.description ?? '';
    this.formSort = r.sortOrder;
    this.formErr = '';
    if (this.usesSyntheticInlineOnly(r)) {
      this.formComposeMode = 'direct';
      this.formPerms = [...r.permissions];
      this.formPermsSet = new Set(r.permissions);
      this.formGroupIds = [];
    } else {
      this.formComposeMode = 'groups';
      this.formGroupIds = [...(r.permissionGroupIds ?? [])].sort((a, b) => a - b);
      this.formPerms = [...r.permissions];
      this.formPermsSet = new Set(r.permissions);
    }
  }

  /** Synthetic auto-pack {@code BNDL_R<id>} is treated as “direct matrix” in the editor. */
  protected usesSyntheticInlineOnly(r: SchoolRoleRow): boolean {
    const g = r.permissionGroups ?? [];
    if (g.length === 0) {
      return true;
    }
    return g.length === 1 && (g[0].code ?? '').startsWith('BNDL_R');
  }

  protected onComposeModeChange(): void {
    if (this.formComposeMode === 'direct') {
      this.formGroupIds = [];
    } else {
      this.formPerms = [];
      this.formPermsSet = new Set();
    }
  }

  protected togglePackForRole(id: number, on: boolean): void {
    if (on) {
      if (!this.formGroupIds.includes(id)) {
        this.formGroupIds = [...this.formGroupIds, id].sort((a, b) => a - b);
      }
    } else {
      this.formGroupIds = this.formGroupIds.filter(x => x !== id);
    }
  }

  protected closeEditor(): void {
    this.editMode = null;
    this.savingForm = false;
  }

  protected togglePerm(p: string, on: boolean): void {
    if (on) {
      this.formPermsSet.add(p);
    } else {
      this.formPermsSet.delete(p);
    }
    this.formPerms = Array.from(this.formPermsSet).sort();
  }

  protected submitCustom(): void {
    this.formErr = '';
    this.savingForm = true;
    if (this.editMode === 'create') {
      const body: CreateCustomSchoolRoleRequest = {
        code: this.formCode.trim().toUpperCase(),
        name: this.formName.trim(),
        description: this.formDesc?.trim() || undefined,
        sortOrder: this.formSort,
        ...(this.formComposeMode === 'groups'
          ? { permissionGroupIds: [...this.formGroupIds] }
          : { permissions: [...this.formPerms] }),
      };
      this.rbac
        .createCustomSchoolRole(body)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
        next: () => {
          this.reloadCatalogAndPacks();
          this.closeEditor();
          this.savingForm = false;
          this.loadRecentRbacStrip();
        },
        error: e => {
          this.formErr = (e as Error)?.message ?? 'save';
          this.savingForm = false;
        },
      });
      return;
    }
    if (this.editingId == null) {
      this.savingForm = false;
      return;
    }
    const body: UpdateCustomSchoolRoleRequest = {
      name: this.formName.trim(),
      description: this.formDesc?.trim() || undefined,
      sortOrder: this.formSort,
      ...(this.formComposeMode === 'groups'
        ? { permissionGroupIds: [...this.formGroupIds] }
        : { permissions: [...this.formPerms] }),
    };
    this.rbac
      .updateCustomSchoolRole(this.editingId, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.reloadCatalogAndPacks();
          this.closeEditor();
          this.savingForm = false;
          this.loadRecentRbacStrip();
        },
        error: e => {
          this.formErr = (e as Error)?.message ?? 'save';
          this.savingForm = false;
        },
      });
  }

  protected openPackCreate(): void {
    this.editMode = null;
    this.packEditMode = 'create';
    this.packEditingId = null;
    this.packFormCode = 'PACK_';
    this.packFormName = '';
    this.packFormDesc = '';
    this.packFormSort = 1000;
    this.packFormPermsSet = new Set();
    this.packFormErr = '';
  }

  protected openPackEdit(g: PermissionGroupRow): void {
    this.editMode = null;
    this.packEditMode = 'edit';
    this.packEditingId = g.id;
    this.packFormCode = g.code;
    this.packFormName = g.name;
    this.packFormDesc = g.description ?? '';
    this.packFormSort = g.sortOrder;
    this.packFormPermsSet = new Set(g.permissions ?? []);
    this.packFormErr = '';
  }

  protected closePackEditor(): void {
    this.packEditMode = null;
    this.packSaving = false;
  }

  protected togglePackPerm(p: string, on: boolean): void {
    if (on) {
      this.packFormPermsSet.add(p);
    } else {
      this.packFormPermsSet.delete(p);
    }
  }

  protected submitPack(): void {
    this.packFormErr = '';
    this.packSaving = true;
    if (this.packEditMode === 'create') {
      const body: CreatePermissionGroupRequest = {
        code: this.packFormCode.trim().toUpperCase(),
        name: this.packFormName.trim(),
        description: this.packFormDesc?.trim() || undefined,
        sortOrder: this.packFormSort,
        permissions: Array.from(this.packFormPermsSet).sort(),
      };
      this.rbac
        .createPermissionGroup(body)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.reloadCatalogAndPacks();
            this.closePackEditor();
            this.loadRecentRbacStrip();
          },
          error: e => {
            this.packFormErr = (e as Error)?.message ?? 'save';
            this.packSaving = false;
          },
        });
      return;
    }
    if (this.packEditingId == null) {
      this.packSaving = false;
      return;
    }
    const body: UpdatePermissionGroupRequest = {
      name: this.packFormName.trim(),
      description: this.packFormDesc?.trim() || undefined,
      sortOrder: this.packFormSort,
      permissions: Array.from(this.packFormPermsSet).sort(),
    };
    this.rbac
      .updatePermissionGroup(this.packEditingId, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.reloadCatalogAndPacks();
          this.closePackEditor();
          this.loadRecentRbacStrip();
        },
        error: e => {
          this.packFormErr = (e as Error)?.message ?? 'save';
          this.packSaving = false;
        },
      });
  }

  protected onDeletePack(g: PermissionGroupRow): void {
    if (g.systemTemplate) {
      return;
    }
    if (!window.confirm(this.translate.instant('settings.rbac.deletePackConfirm'))) {
      return;
    }
    this.errMsg = '';
    this.rbac
      .deletePermissionGroup(g.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.reloadCatalogAndPacks();
          this.loadRecentRbacStrip();
        },
        error: e => (this.errMsg = (e as Error)?.message ?? 'delete'),
      });
  }

  protected onDelete(r: SchoolRoleRow): void {
    if (r.systemRole) {
      return;
    }
    if (!window.confirm(this.translate.instant('settings.rbac.deleteConfirm'))) {
      return;
    }
    this.errMsg = '';
    this.rbac
      .deleteCustomSchoolRole(r.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.reloadCatalogAndPacks();
          this.loadRecentRbacStrip();
          if (this.selectedStaffId != null) {
            this.onStaffChange();
          }
        },
        error: e => (this.errMsg = (e as Error)?.message ?? 'delete'),
      });
  }

  private reloadCatalogAndPacks(): void {
    forkJoin([this.rbac.listSchoolRoleCatalog(), this.rbac.listPermissionGroups()])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([rows, packs]) => {
          this.catalog = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
          this.permissionGroups = [...packs].sort((a, b) => a.sortOrder - b.sortOrder);
          this.packListErr = '';
        },
        error: e => {
          this.errMsg = (e as Error)?.message ?? 'load';
          this.packListErr = (e as Error)?.message ?? 'load';
        },
      });
  }

  private loadRecentRbacStrip(): void {
    this.auditStripLoading = true;
    this.auditStripErr = '';
    const { from, to } = this.monthBoundsNow();
    this.auditLogs
      .getPage(
        { page: 0, size: 5, module: 'RBAC', from, to },
        runtimeConfig.useMocks ? MOCK_RBAC_AUDIT_LOGS : []
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: p => {
          this.recentRbacLogs = p.content;
          this.auditStripLoading = false;
        },
        error: e => {
          this.auditStripErr = (e as Error)?.message ?? 'audit';
          this.recentRbacLogs = [];
          this.auditStripLoading = false;
        },
      });
  }

  private monthBoundsNow(): { from: string; to: string } {
    const d = new Date();
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const from = `${y}-${String(mo).padStart(2, '0')}-01`;
    const last = new Date(y, mo, 0).getDate();
    const to = `${y}-${String(mo).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
    return { from, to };
  }
}
