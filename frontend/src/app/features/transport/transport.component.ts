import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { from, forkJoin, Subject } from 'rxjs';
import { concatMap, debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { runtimeConfig } from '../../core/config/runtime-config';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TransportDriver, TransportRoute, TransportVehicle } from '../../core/models/models';
import { TransportService } from '../../core/services/transport.service';
import { StudentService } from '../../core/services/student.service';
import { Student } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { isValidIndiaMobileTen } from '../../core/validation/phone.validation';

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ErpI18nPhDirective, ErpPaginationComponent],
  template: `
    <div class="transport-page" data-testid="transport-page">
      <div class="erp-filter-toolbar transport-page__toolbar transport-page__toolbar--transport mb-4 animate-in">
        <div class="transport-page__headline">
          <h2 class="transport-page__title">{{ 'transport.pageTitle' | translate }}</h2>
          <p class="transport-page__lead text-muted mb-0">{{ 'transport.lead' | translate }}</p>
        </div>
        <div *ngIf="routesUseServerPaging" class="erp-filter-toolbar__search transport-page__search">
          <label class="erp-label small mb-1">{{ 'transport.listSearch' | translate }}</label>
          <input type="search" class="erp-input" [(ngModel)]="routeSearchInput" (ngModelChange)="routeSearch$.next($event)" [placeholder]="'transport.listSearchPh' | translate" />
        </div>
        <div class="erp-filter-toolbar__actions transport-page__toolbar-actions">
          <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="reload()"><i class="bi bi-arrow-clockwise"></i> {{ 'transport.refresh' | translate }}</button>
          <button *ngIf="canManageRoutes" class="btn-primary-erp btn-sm erp-filter-toolbar__action" data-testid="add-route-btn" (click)="openRouteWizard()"><i class="bi bi-plus-lg"></i> {{ 'transport.addRoute' | translate }}</button>
        </div>
      </div>

      <div class="transport-page__ops-grid mb-4 animate-in animate-in-delay-1">
        <div class="erp-card p-3">
          <div class="small text-muted mb-1">Open issues</div>
          <div class="h4 mb-0">{{ opsSnapshot.openExceptions }}</div>
        </div>
        <div class="erp-card p-3">
          <div class="small text-muted mb-1">Critical issues</div>
          <div class="h4 mb-0 text-danger">{{ opsSnapshot.criticalExceptions }}</div>
        </div>
        <div class="erp-card p-3">
          <div class="small text-muted mb-1">Dead Letter Events</div>
          <div class="h4 mb-0">{{ opsSnapshot.deadLetterEvents }}</div>
        </div>
        <div class="erp-card p-3">
          <div class="small text-muted mb-1">Delayed Routes</div>
          <div class="h4 mb-0">{{ opsSnapshot.delayedRoutes }}</div>
        </div>
      </div>

      <div class="erp-card mb-4 animate-in animate-in-delay-1" *ngIf="opsExceptions.length">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <h4 class="erp-card-title mb-0">Issue list</h4>
          <button type="button" class="btn-outline-erp btn-sm" (click)="refreshOpsPanels()"><i class="bi bi-arrow-clockwise"></i> Refresh Queue</button>
        </div>
        <div class="table-responsive">
          <table class="erp-table table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Route</th>
                <th class="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ex of opsExceptions">
                <td>{{ ex.exceptionCode }}</td>
                <td><span class="badge-erp" [class.badge-danger]="ex.severity === 'CRITICAL'" [class.badge-warning]="ex.severity !== 'CRITICAL'">{{ ex.severity }}</span></td>
                <td>{{ ex.status }}</td>
                <td>{{ ex.routeId ?? '-' }}</td>
                <td class="text-end">
                  <button type="button" class="btn-outline-erp btn-xs" [disabled]="ex.status === 'RESOLVED'" (click)="resolveException(ex.id)">Resolve</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="erp-card mb-4 animate-in animate-in-delay-1" *ngIf="liveRoutes.length && anyLiveLocation">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <h4 class="erp-card-title mb-0">{{ 'transport.liveVehicles' | translate }}</h4>
          <span class="text-muted small">{{ 'transport.liveHint' | translate }}</span>
        </div>
        <div class="transport-page__card-grid transport-page__card-grid--live">
          <div class="transport-page__card-grid-cell" *ngFor="let route of routesWithLive">
            <div class="transport-live-card transport-live-card--panel">
              <div class="transport-live-card__head">
                <strong class="transport-live-card__title text-truncate">{{ route.name }}</strong>
                <button type="button" class="btn-outline-erp btn-xs flex-shrink-0" (click)="mapPanelRoute = route">{{ 'transport.expandMap' | translate }}</button>
              </div>
              <iframe
                class="w-100 rounded-2"
                style="height: 200px; border: 0;"
                loading="lazy"
                [src]="embedUrlForRoute(route)"
                [title]="'transport.mapForRoute' | translate: { name: route.name }"></iframe>
              <p class="small text-muted mb-0 mt-2"><i class="bi bi-clock me-1"></i>{{ route.liveRecordedAt ? (route.liveRecordedAt | date:'medium') : ('transport.noGps' | translate) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="transport-page__card-grid animate-in animate-in-delay-1" *ngIf="routes.length > 0; else transportEmpty">
        <div class="transport-page__card-grid-cell" *ngFor="let route of routes; trackBy: trackRouteId">
          <article class="erp-card transport-route-card" [attr.data-testid]="'route-card-' + route.id">
            <header class="transport-route-card__header">
              <h3 class="transport-route-card__title text-truncate" [title]="route.name">{{ route.name }}</h3>
              <div class="transport-route-card__header-actions">
                <button type="button" class="btn-outline-erp btn-xs" (click)="mapPanelRoute = route">{{ 'transport.routeMap' | translate }}</button>
                <span class="badge-erp badge-info transport-route-card__count-badge">{{ 'transport.studentsCount' | translate: { n: route.assignedStudents } }}</span>
              </div>
            </header>
            <dl class="transport-route-card__meta">
              <div class="transport-route-card__meta-row">
                <dt class="transport-route-card__meta-icon"><i class="bi bi-truck transport-route-card__accent-icon" aria-hidden="true"></i></dt>
                <dd class="transport-route-card__meta-value text-truncate" [title]="route.vehicleNumber || ''">
                  {{ route.vehicleNumber || ('transport.dash' | translate) }}
                  <span *ngIf="route.vehicleType" class="badge-erp badge-neutral ms-1">{{ route.vehicleType }}</span>
                </dd>
              </div>
              <div class="transport-route-card__meta-row">
                <dt class="transport-route-card__meta-icon"><i class="bi bi-person" aria-hidden="true"></i></dt>
                <dd class="transport-route-card__meta-value text-truncate" [title]="route.driverName || ''">{{ route.driverName || ('transport.dash' | translate) }}</dd>
              </div>
              <div class="transport-route-card__meta-row">
                <dt class="transport-route-card__meta-icon"><i class="bi bi-telephone" aria-hidden="true"></i></dt>
                <dd class="transport-route-card__meta-value text-truncate" [title]="route.driverPhone || ''">{{ route.driverPhone || ('transport.dash' | translate) }}</dd>
              </div>
            </dl>
            <div *ngIf="canManageRoutes" class="transport-route-card__actions" role="toolbar" [attr.aria-label]="'transport.routeActionsAria' | translate">
              <button type="button" class="btn-outline-erp btn-xs" (click)="openEditWizard(route)">{{ 'transport.edit' | translate }}</button>
              <button type="button" class="btn-outline-erp btn-xs" (click)="openStopModal(route)">{{ 'transport.addStop' | translate }}</button>
              <button type="button" class="btn-outline-erp btn-xs" (click)="openAssignModal(route)">{{ 'transport.assignStudent' | translate }}</button>
              <button type="button" class="btn-outline-erp btn-xs" (click)="previewOptimization(route)">Optimize</button>
              <button *ngIf="route.vehicleId" type="button" class="btn-outline-erp btn-xs" (click)="simulateGps(route)">{{ 'transport.simulateGps' | translate }}</button>
              <button type="button" class="btn-outline-erp btn-xs btn-outline-erp--danger" (click)="deleteRoute(route)">{{ 'transport.delete' | translate }}</button>
            </div>
            <div *ngIf="optimizationPreview[route.id]" class="small text-muted mb-2">
              Estimated route time after optimize: {{ optimizationPreview[route.id] }} min
            </div>
            <h4 class="transport-route-card__section-label">{{ 'transport.stopsHeading' | translate: { n: route.stops.length } }}</h4>
            <div class="transport-route-card__stops">
              <div
                *ngFor="let stop of route.stops"
                class="transport-route-card__stop-row"
                [class.transport-route-card__stop-row--readonly]="!canManageRoutes || !stop.id"
              >
                <span class="transport-route-card__stop-icon" aria-hidden="true"><i class="bi bi-geo-alt-fill"></i></span>
                <span class="transport-route-card__stop-name text-truncate" [title]="stop.name">{{ stop.name }}</span>
                <span class="transport-route-card__stop-time">{{ stop.time || ('transport.dash' | translate) }}</span>
                <span class="transport-route-card__stop-actions" *ngIf="canManageRoutes && stop.id">
                  <button type="button" class="btn-icon btn-xs" (click)="openEditStop(route, stop)" [title]="'transport.editStopTitle' | translate"><i class="bi bi-pencil"></i></button>
                  <button type="button" class="btn-icon btn-xs" (click)="removeStop(route, stop.id!)" [title]="'transport.removeStopTitle' | translate"><i class="bi bi-x-lg"></i></button>
                </span>
              </div>
            </div>
            <section *ngIf="route.students?.length" class="transport-route-card__assigned" [attr.aria-labelledby]="'assign-' + route.id">
              <h4 class="transport-route-card__section-label" [id]="'assign-' + route.id">{{ 'transport.assignedHeading' | translate }}</h4>
              <div
                class="transport-route-card__assigned-scroll"
                role="region"
                [attr.aria-label]="'transport.assignedScrollRegion' | translate"
              >
                <div
                  *ngFor="let m of route.students"
                  class="transport-route-card__assign-row"
                  [class.transport-route-card__assign-row--readonly]="!canManageRoutes"
                >
                  <span class="transport-route-card__assign-name text-truncate" [title]="m.studentName">{{ m.studentName }}</span>
                  <button *ngIf="canManageRoutes" type="button" class="btn-icon btn-xs" (click)="unassign(m.id)" [title]="'transport.unassignStudentTitle' | translate"><i class="bi bi-person-dash"></i></button>
                </div>
              </div>
            </section>
          </article>
        </div>
      </div>
      <ng-template #transportEmpty>
        <div class="transport-page__empty animate-in animate-in-delay-1">
          <div class="erp-card text-muted text-center py-5">{{ 'transport.emptyRoutes' | translate }}</div>
        </div>
      </ng-template>
      <app-erp-pagination
        *ngIf="routesUseServerPaging && routesTotal > 0"
        class="d-block mt-3"
        [totalElements]="routesTotal"
        [pageIndex]="routePageIndex"
        [pageSize]="routePageSize"
        (pageIndexChange)="onRoutePageIndex($event)"
        (pageSizeChange)="onRoutePageSize($event)"
      />
    </div>

    <!-- Full map overlay -->
    <div class="modal-overlay" *ngIf="mapPanelRoute" (click)="mapPanelRoute = null">
      <div class="modal-content-erp modal-wide-map" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ 'transport.modalMapTitle' | translate: { name: mapPanelRoute.name } }}</h3>
          <button class="btn-icon" type="button" (click)="mapPanelRoute = null"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp p-0">
          <iframe
            class="w-100"
            style="height: 420px; border: 0;"
            [src]="embedUrlForRoute(mapPanelRoute)"
            [title]="'transport.routeMapTitle' | translate"></iframe>
          <p class="small text-muted px-3 py-2 mb-0" *ngIf="mapPanelRoute.liveLatitude == null">{{ 'transport.mapTip' | translate }}</p>
        </div>
      </div>
    </div>

    <!-- Route wizard -->
    <div class="modal-overlay" *ngIf="routeWizard" (click)="closeRouteWizard()">
      <div class="modal-content-erp modal-wide-map" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ (editingRouteId ? 'transport.wizardEditTitle' : 'transport.wizardNewTitle') | translate }}</h3>
          <button class="btn-icon" type="button" (click)="closeRouteWizard()"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <span class="badge-erp" [class.badge-info]="wizardStep === 1" [class.badge-neutral]="wizardStep !== 1">{{ 'transport.stepRoute' | translate }}</span>
            <span class="badge-erp" [class.badge-info]="wizardStep === 2" [class.badge-neutral]="wizardStep !== 2">{{ 'transport.stepVehicle' | translate }}</span>
            <span class="badge-erp" [class.badge-info]="wizardStep === 3" [class.badge-neutral]="wizardStep !== 3">{{ 'transport.stepDriver' | translate }}</span>
          </div>
          <ng-container *ngIf="wizardStep === 1">
            <label class="erp-label">{{ 'transport.labelRouteName' | translate }}</label>
            <input class="erp-input mb-3" [(ngModel)]="routeForm.name" erpI18nPh="transport.phRouteName">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="erp-label mb-0">{{ 'transport.labelStopsOptional' | translate }}</label>
              <button type="button" class="btn-outline-erp btn-xs" (click)="addWizardStop()">{{ 'transport.addStopBtn' | translate }}</button>
            </div>
            <p class="small text-muted mb-2">{{ 'transport.stopsHelp' | translate }}</p>
            <div *ngFor="let s of wizardStops; let i = index" class="row g-2 align-items-end mb-2">
              <div class="col-md-5"><input class="erp-input" [(ngModel)]="s.name" erpI18nPh="transport.phStopName"></div>
              <div class="col-md-2"><input class="erp-input" type="number" [(ngModel)]="s.stopOrder" erpI18nPh="transport.phOrder"></div>
              <div class="col-md-3"><input class="erp-input" [(ngModel)]="s.stopTime" erpI18nPh="transport.phTime"></div>
              <div class="col-md-2"><button type="button" class="btn-outline-erp btn-sm w-100" (click)="removeWizardStop(i)">{{ 'transport.remove' | translate }}</button></div>
            </div>
          </ng-container>
          <ng-container *ngIf="wizardStep === 2">
            <label class="erp-label">{{ 'transport.labelUseVehicle' | translate }}</label>
            <select class="erp-select mb-2" [(ngModel)]="routeForm.vehicleId">
              <option [ngValue]="''">{{ 'transport.selectVehicle' | translate }}</option>
              <option *ngFor="let v of vehicles" [ngValue]="v.id">{{ 'transport.vehicleOption' | translate: { reg: v.registrationNumber, type: v.vehicleType, cap: v.capacity } }}</option>
            </select>
            <p class="small text-muted">{{ 'transport.registerNewVehicle' | translate }}</p>
            <div class="row g-2 mb-2">
              <div class="col-md-4"><input class="erp-input" [(ngModel)]="newVehicle.registrationNumber" erpI18nPh="transport.phReg"></div>
              <div class="col-md-3">
                <select class="erp-select" [(ngModel)]="newVehicle.vehicleType">
                  <option value="BUS">{{ 'transport.vehTypeBus' | translate }}</option>
                  <option value="VAN">{{ 'transport.vehTypeVan' | translate }}</option>
                  <option value="CAR">{{ 'transport.vehTypeCar' | translate }}</option>
                  <option value="OTHER">{{ 'transport.vehTypeOther' | translate }}</option>
                </select>
              </div>
              <div class="col-md-2"><input class="erp-input" type="number" [(ngModel)]="newVehicle.capacity" erpI18nPh="transport.phSeats"></div>
              <div class="col-md-3"><input class="erp-input" [(ngModel)]="newVehicle.model" erpI18nPh="transport.phModel"></div>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="saveNewVehicle()">{{ 'transport.addToFleet' | translate }}</button>
          </ng-container>
          <ng-container *ngIf="wizardStep === 3">
            <label class="erp-label">{{ 'transport.labelAssignDriver' | translate }}</label>
            <select class="erp-select mb-2" [(ngModel)]="routeForm.driverId">
              <option [ngValue]="''">{{ 'transport.selectDriver' | translate }}</option>
              <option *ngFor="let d of drivers" [ngValue]="d.id">{{ 'transport.driverOption' | translate: { name: d.fullName, phone: d.phone } }}</option>
            </select>
            <p class="small text-muted">{{ 'transport.addDriverLead' | translate }}</p>
            <div class="row g-2 mb-2">
              <div class="col-md-5"><input class="erp-input" [(ngModel)]="newDriver.fullName" erpI18nPh="transport.phFullName"></div>
              <div class="col-md-4"><input class="erp-input" [(ngModel)]="newDriver.phone" erpI18nPh="transport.phPhone" inputmode="numeric" maxlength="10" pattern="[0-9]{10}"></div>
              <div class="col-md-3"><input class="erp-input" [(ngModel)]="newDriver.licenseNumber" erpI18nPh="transport.phLicense"></div>
            </div>
            <p class="small text-danger mb-2" *ngIf="routeWizardError">{{ routeWizardError | translate }}</p>
            <button type="button" class="btn-outline-erp btn-sm" (click)="saveNewDriver()">{{ 'transport.addDriverSelect' | translate }}</button>
          </ng-container>
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" type="button" (click)="wizardStep > 1 ? wizardStep = wizardStep - 1 : closeRouteWizard()">{{ wizardStep > 1 ? ('transport.back' | translate) : ('transport.cancel' | translate) }}</button>
          <button class="btn-primary-erp" type="button" *ngIf="wizardStep < 3" (click)="wizardStep = wizardStep + 1" [disabled]="wizardStep === 1 && !routeForm.name.trim()">{{ 'transport.next' | translate }}</button>
          <button class="btn-primary-erp" type="button" *ngIf="wizardStep === 3" (click)="saveRouteFromWizard()">{{ 'transport.saveRoute' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="stopModalRoute" (click)="stopModalRoute = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'transport.modalAddStopTitle' | translate }}</h3><button class="btn-icon" (click)="stopModalRoute = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <label class="erp-label">{{ 'transport.labelStopName' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="stopForm.name">
          <label class="erp-label">{{ 'transport.labelOrder' | translate }}</label>
          <input class="erp-input mb-2" type="number" [(ngModel)]="stopForm.stopOrder">
          <label class="erp-label">{{ 'transport.labelTime' | translate }}</label>
          <input class="erp-input" [(ngModel)]="stopForm.stopTime" placeholder="07:30">
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="stopModalRoute = null">{{ 'transport.cancel' | translate }}</button>
          <button class="btn-primary-erp" (click)="saveStop()">{{ 'transport.add' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="editStopCtx" (click)="editStopCtx = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'transport.modalEditStopTitle' | translate }}</h3><button class="btn-icon" (click)="editStopCtx = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <label class="erp-label">{{ 'transport.labelStopName' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="editStopForm.name">
          <label class="erp-label">{{ 'transport.labelOrder' | translate }}</label>
          <input class="erp-input mb-2" type="number" [(ngModel)]="editStopForm.stopOrder">
          <label class="erp-label">{{ 'transport.labelTime' | translate }}</label>
          <input class="erp-input" [(ngModel)]="editStopForm.stopTime" placeholder="07:30">
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="editStopCtx = null">{{ 'transport.cancel' | translate }}</button>
          <button class="btn-primary-erp" (click)="saveEditStop()">{{ 'transport.save' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="assignModalRoute" (click)="assignModalRoute = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp align-items-start">
          <div class="flex-grow-1 me-3" style="min-width: 0;">
            <h3 class="mb-1">{{ 'transport.modalAssignTitle' | translate }}</h3>
            <p class="small text-muted mb-0">{{ 'transport.assignModalRouteContext' | translate: { name: assignModalRoute.name } }}</p>
          </div>
          <button type="button" class="btn-icon flex-shrink-0 mt-1" (click)="assignModalRoute = null"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <div *ngIf="assignModalRoute.stops.length === 0" class="alert alert-warning py-2 small mb-3">
            <i class="bi bi-exclamation-triangle me-1"></i>{{ 'transport.assignNoStopsWarning' | translate }}
          </div>
          <p class="small text-muted mb-2">{{ 'transport.assignStudentHelp' | translate }}</p>
          <label class="erp-label" for="transport-assign-student-filter">{{ 'transport.assignFilterLabel' | translate }}</label>
          <input
            id="transport-assign-student-filter"
            type="search"
            class="erp-input mb-2"
            [(ngModel)]="assignStudentFilter"
            (ngModelChange)="onAssignStudentFilterChange()"
            [attr.placeholder]="'transport.assignFilterPlaceholder' | translate"
            autocomplete="off"
          />
          <label class="erp-label" for="transport-assign-student">{{ 'transport.labelStudent' | translate }}</label>
          <select
            id="transport-assign-student"
            class="erp-select mb-2"
            [(ngModel)]="assignForm.studentId"
            (ngModelChange)="syncAssignStudentName()"
          >
            <option [ngValue]="null">{{ 'transport.selectStudent' | translate }}</option>
            <option *ngFor="let s of assignEligibleStudents" [ngValue]="s.id">{{ studentAssignOptionLabel(s) }}</option>
          </select>
          <p *ngIf="assignEligibleStudents.length === 0 && students.length" class="small text-warning mb-3">
            {{ 'transport.assignNoEligibleStudents' | translate }}
          </p>
          <label class="erp-label" for="transport-assign-pickup">{{ 'transport.labelPickupStop' | translate }}</label>
          <select id="transport-assign-pickup" class="erp-select mb-2" [(ngModel)]="assignForm.pickupStop" [disabled]="assignModalRoute.stops.length === 0">
            <option value="">{{ 'transport.selectPickupStop' | translate }}</option>
            <option *ngFor="let st of assignModalRoute.stops" [value]="st.name">{{ stopSelectLabel(st) }}</option>
          </select>
          <label class="erp-label" for="transport-assign-drop">{{ 'transport.labelDropStop' | translate }}</label>
          <select id="transport-assign-drop" class="erp-select" [(ngModel)]="assignForm.dropStop" [disabled]="assignModalRoute.stops.length === 0">
            <option value="">{{ 'transport.selectDropStop' | translate }}</option>
            <option *ngFor="let st of assignModalRoute.stops" [value]="st.name">{{ stopSelectLabel(st) }}</option>
          </select>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="assignModalRoute = null">{{ 'transport.cancel' | translate }}</button>
          <button
            type="button"
            class="btn-primary-erp"
            (click)="saveAssign()"
            [disabled]="assignSaveDisabled"
          >{{ 'transport.assign' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        --tp-space-1: 0.25rem;
        --tp-space-2: 0.5rem;
        --tp-space-3: 0.75rem;
        --tp-space-4: 1rem;
        --tp-space-5: 1.25rem;
        --tp-space-6: 1.5rem;
        --tp-radius: var(--radius-lg, 10px);
        --tp-stop-band: 5.5rem;
        --tp-assign-band: 10.5rem;
      }

      .transport-page {
        max-width: 100%;
      }
      .transport-page__ops-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--tp-space-3);
      }

      /* Toolbar: align with global filter bar but fix per-action margin and width balance */
      .transport-page__toolbar--transport.erp-filter-toolbar .erp-filter-toolbar__action {
        margin-left: 0;
      }
      .transport-page__toolbar {
        flex-wrap: wrap;
        align-items: flex-end;
        gap: var(--tp-space-4);
      }
      .transport-page__headline {
        flex: 1 1 14rem;
        min-width: 0;
      }
      .transport-page__title {
        font-size: clamp(1.15rem, 2.2vw, 1.5rem);
        font-weight: 800;
        margin: 0;
        color: var(--clr-text-primary);
        font-family: var(--font-heading);
        letter-spacing: -0.02em;
        line-height: 1.25;
      }
      .transport-page__lead {
        font-size: 0.8125rem;
        margin-top: var(--tp-space-2) !important;
        line-height: 1.5;
      }
      @media (max-width: 991.98px) {
        .transport-page__toolbar {
          flex-direction: column;
          align-items: stretch;
        }
        .transport-page__search,
        .transport-page__toolbar-actions {
          width: 100%;
          max-width: none;
        }
        .transport-page__toolbar-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--tp-space-2);
        }
      }

      /* Responsive card grid — equal track widths, scales like ERP module tiles */
      .transport-page__card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
        gap: var(--tp-space-4);
        align-items: start;
      }
      .transport-page__card-grid--live {
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
        gap: var(--tp-space-4);
        align-items: start;
      }
      .transport-page__card-grid-cell {
        display: flex;
        min-width: 0;
      }
      .transport-page__empty {
        margin-top: var(--tp-space-2);
      }

      .transport-route-card {
        width: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--tp-space-4) !important;
        min-width: 0;
        min-height: 0;
      }

      .transport-route-card__header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--tp-space-3);
        align-items: center;
        margin-bottom: var(--tp-space-3);
        min-height: 2.25rem;
        flex-shrink: 0;
      }
      .transport-route-card__title {
        margin: 0;
        font-size: 1.0625rem;
        font-weight: 700;
        font-family: var(--font-heading);
        color: var(--clr-text-primary);
        line-height: 1.3;
      }
      .transport-route-card__header-actions {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--tp-space-2);
        justify-content: flex-end;
      }
      .transport-route-card__count-badge {
        white-space: nowrap;
        min-width: 4.5rem;
        justify-content: center;
      }

      .transport-route-card__meta {
        margin: 0 0 var(--tp-space-3);
        padding: 0;
        flex-shrink: 0;
      }
      .transport-route-card__meta-row {
        display: grid;
        grid-template-columns: 1.375rem minmax(0, 1fr);
        gap: var(--tp-space-2) var(--tp-space-3);
        align-items: center;
        margin: 0 0 var(--tp-space-2);
        font-size: 0.8125rem;
        line-height: 1.45;
        color: var(--clr-text-secondary);
      }
      .transport-route-card__meta-row:last-child {
        margin-bottom: 0;
      }
      .transport-route-card__meta-icon {
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--clr-text-muted);
      }
      .transport-route-card__meta-value {
        margin: 0;
        min-width: 0;
      }
      .transport-route-card__accent-icon {
        color: var(--clr-accent);
      }

      .transport-route-card__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--tp-space-2);
        margin-bottom: var(--tp-space-3);
        flex-shrink: 0;
      }
      .transport-route-card__actions .btn-xs {
        min-height: 1.875rem;
        padding-inline: var(--tp-space-3);
      }
      .btn-outline-erp--danger {
        color: var(--clr-danger) !important;
        border-color: color-mix(in srgb, var(--clr-danger) 45%, var(--clr-border)) !important;
      }
      .btn-outline-erp--danger:hover {
        background: color-mix(in srgb, var(--clr-danger) 10%, transparent);
      }

      .transport-route-card__section-label {
        margin: 0 0 var(--tp-space-2);
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--clr-text-muted);
        flex-shrink: 0;
      }

      .transport-route-card__stops {
        flex: 0 1 auto;
        min-height: var(--tp-stop-band);
        max-height: 11rem;
        overflow-y: auto;
        overflow-x: hidden;
        margin-bottom: var(--tp-space-3);
        padding: var(--tp-space-2) var(--tp-space-2) var(--tp-space-2) var(--tp-space-2);
        border-radius: var(--tp-radius);
        background: color-mix(in srgb, var(--clr-surface-muted) 85%, transparent);
        border: 1px solid var(--clr-border-light);
        scrollbar-gutter: stable;
      }

      .transport-route-card__stop-row {
        display: grid;
        align-items: center;
        column-gap: var(--tp-space-3);
        row-gap: var(--tp-space-1);
        min-height: 2.25rem;
        padding: var(--tp-space-2) var(--tp-space-3);
        font-size: 0.8125rem;
        line-height: 1.35;
        border-bottom: 1px solid color-mix(in srgb, var(--clr-border) 55%, transparent);
        grid-template-columns: 1.125rem minmax(0, 1fr) 3.375rem auto;
      }
      .transport-route-card__stop-row--readonly {
        grid-template-columns: 1.125rem minmax(0, 1fr) 3.375rem;
      }
      .transport-route-card__stop-row:last-child {
        border-bottom: none;
      }
      .transport-route-card__stop-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--clr-accent);
        font-size: 0.875rem;
      }
      .transport-route-card__stop-name {
        min-width: 0;
        color: var(--clr-text-primary);
      }
      .transport-route-card__stop-time {
        font-variant-numeric: tabular-nums;
        text-align: right;
        color: var(--clr-text-muted);
        font-size: 0.8125rem;
      }
      .transport-route-card__stop-actions {
        display: inline-flex;
        align-items: center;
        gap: 0;
        justify-content: flex-end;
      }

      .transport-route-card__assigned {
        margin-top: auto;
        padding-top: var(--tp-space-3);
        border-top: 1px solid var(--clr-border-light);
        flex-shrink: 0;
        min-height: 0;
      }
      .transport-route-card__assigned .transport-route-card__section-label {
        margin-bottom: var(--tp-space-2);
      }
      .transport-route-card__assigned-scroll {
        max-height: var(--tp-assign-band);
        overflow-y: auto;
        overflow-x: hidden;
        padding: var(--tp-space-2);
        border-radius: var(--tp-radius);
        background: color-mix(in srgb, var(--clr-surface-muted) 85%, transparent);
        border: 1px solid var(--clr-border-light);
        scrollbar-gutter: stable;
      }
      .transport-route-card__assign-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--tp-space-2);
        align-items: center;
        min-height: 1.875rem;
        padding: var(--tp-space-2) var(--tp-space-1);
        font-size: 0.8125rem;
        line-height: 1.4;
        border-bottom: 1px solid color-mix(in srgb, var(--clr-border) 40%, transparent);
      }
      .transport-route-card__assigned-scroll .transport-route-card__assign-row:last-child {
        border-bottom: none;
      }
      .transport-route-card__assign-row--readonly {
        grid-template-columns: minmax(0, 1fr);
      }
      .transport-route-card__assign-name {
        min-width: 0;
        color: var(--clr-text-primary);
      }

      .transport-live-card--panel {
        height: 100%;
        min-width: 0;
        padding: var(--tp-space-4);
        border-radius: var(--radius-xl);
        border: 1px solid var(--clr-border);
        background: var(--clr-surface-muted);
      }
      .transport-live-card__head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--tp-space-3);
        align-items: center;
        margin-bottom: var(--tp-space-3);
      }
      .transport-live-card__title {
        font-size: 0.9375rem;
        font-weight: 700;
        margin: 0;
        min-width: 0;
      }

      .modal-wide-map {
        max-width: 920px;
        width: 100%;
      }
    `
  ]
})
export class TransportComponent implements OnInit {
  routesUseServerPaging = !runtimeConfig.useMocks;
  /** All routes (API) for live GPS strip; same as `routes` when mocks. */
  liveRoutes: TransportRoute[] = [];
  routes: TransportRoute[] = [];
  routesTotal = 0;
  routePageIndex = 0;
  routePageSize = DEFAULT_ERP_PAGE_SIZE;
  routeQuery = '';
  routeSearchInput = '';
  readonly routeSearch$ = new Subject<string>();
  vehicles: TransportVehicle[] = [];
  drivers: TransportDriver[] = [];
  students: Student[] = [];
  canManageRoutes = false;
  routeWizard = false;
  wizardStep = 1;
  editingRouteId: string | null = null;
  routeForm: { name: string; vehicleId: string; driverId: string } = { name: '', vehicleId: '', driverId: '' };
  wizardStops: { name: string; stopOrder: number; stopTime: string }[] = [];
  newVehicle = { registrationNumber: '', vehicleType: 'BUS', capacity: 40, model: '' };
  newDriver = { fullName: '', phone: '', licenseNumber: '' };
  stopModalRoute: TransportRoute | null = null;
  stopForm = { name: '', stopOrder: 1, stopTime: '' };
  assignModalRoute: TransportRoute | null = null;
  assignStudentFilter = '';
  assignForm: { studentId: number | null; studentName: string; pickupStop: string; dropStop: string } = {
    studentId: null,
    studentName: '',
    pickupStop: '',
    dropStop: ''
  };
  mapPanelRoute: TransportRoute | null = null;
  editStopCtx: { route: TransportRoute; stop: { id?: number; name: string; time: string; order: number } } | null = null;
  editStopForm = { name: '', stopOrder: 1, stopTime: '' };
  routeWizardError = '';
  opsSnapshot = { openExceptions: 0, criticalExceptions: 0, deadLetterEvents: 0, delayedRoutes: 0 };
  opsExceptions: Array<{ id: number; exceptionCode: string; severity: string; status: string; routeId?: number }> = [];
  optimizationPreview: Record<string, number> = {};

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private transportService: TransportService,
    private studentService: StudentService,
    private authService: AuthService,
    private uiAccess: UiAccessService,
    private sanitizer: DomSanitizer,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    this.canManageRoutes = this.uiAccess.hasTransportDeskWriteAccess();
    this.routeSearch$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(q => {
        this.routeQuery = (q || '').trim();
        this.routePageIndex = 0;
        if (this.routesUseServerPaging) {
          this.loadRoutesPaged();
        }
      });
    this.reload();
    this.studentService.getStudents().subscribe(s => (this.students = s));
    this.transportService.listVehicles().subscribe(v => (this.vehicles = v));
    this.transportService.listDrivers().subscribe(d => (this.drivers = d));
    this.refreshOpsPanels();
  }

  get routesWithLive(): TransportRoute[] {
    return this.liveRoutes.filter(r => r.liveLatitude != null && r.liveLongitude != null);
  }

  get anyLiveLocation(): boolean {
    return this.routesWithLive.length > 0;
  }

  private routeMapCenter(r: TransportRoute): { lat: number; lng: number } {
    if (r.liveLatitude != null && r.liveLongitude != null) {
      return { lat: r.liveLatitude, lng: r.liveLongitude };
    }
    let h = 0;
    for (let i = 0; i < r.id.length; i++) h += r.id.charCodeAt(i);
    const lat = 28.52 + (h % 180) / 2000;
    const lng = 77.15 + (h % 220) / 2000;
    return { lat, lng };
  }

  embedUrlForRoute(r: TransportRoute): SafeResourceUrl {
    const { lat, lng } = this.routeMapCenter(r);
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  reload(): void {
    if (runtimeConfig.useMocks) {
      this.transportService.listRoutes().subscribe(r => {
        this.routes = r;
        this.liveRoutes = r;
      });
      this.refreshOpsPanels();
      return;
    }
    this.loadRoutesPaged();
    this.refreshOpsPanels();
  }

  private loadRoutesPaged(): void {
    forkJoin({
      live: this.transportService.listRoutes(),
      page: this.transportService.listRoutesPage(this.routePageIndex, this.routePageSize, this.routeQuery || undefined),
    }).subscribe({
      next: ({ live, page }) => {
        this.liveRoutes = live;
        this.routes = page.content;
        this.routesTotal = page.totalElements;
        this.routePageIndex = page.page;
      },
      error: () => {
        this.liveRoutes = [];
        this.routes = [];
        this.routesTotal = 0;
      },
    });
  }

  onRoutePageIndex(i: number): void {
    this.routePageIndex = i;
    if (this.routesUseServerPaging) this.loadRoutesPaged();
  }

  onRoutePageSize(s: number): void {
    this.routePageSize = s;
    this.routePageIndex = 0;
    if (this.routesUseServerPaging) this.loadRoutesPaged();
  }

  trackRouteId(_index: number, route: TransportRoute): string {
    return route.id;
  }

  openRouteWizard(): void {
    this.editingRouteId = null;
    this.wizardStep = 1;
    this.routeForm = { name: '', vehicleId: '', driverId: '' };
    this.wizardStops = [];
    this.newVehicle = { registrationNumber: '', vehicleType: 'BUS', capacity: 40, model: '' };
    this.newDriver = { fullName: '', phone: '', licenseNumber: '' };
    this.routeWizard = true;
    this.routeWizardError = '';
    this.transportService.listVehicles().subscribe(v => (this.vehicles = v));
    this.transportService.listDrivers().subscribe(d => (this.drivers = d));
  }

  openEditWizard(r: TransportRoute): void {
    this.editingRouteId = r.id;
    this.wizardStep = 1;
    this.routeForm = { name: r.name, vehicleId: r.vehicleId ?? '', driverId: r.driverId ?? '' };
    this.wizardStops = [];
    this.routeWizard = true;
    this.routeWizardError = '';
    this.transportService.listVehicles().subscribe(v => (this.vehicles = v));
    this.transportService.listDrivers().subscribe(d => (this.drivers = d));
  }

  closeRouteWizard(): void {
    this.routeWizard = false;
    this.editingRouteId = null;
  }

  saveNewVehicle(): void {
    if (!this.newVehicle.registrationNumber.trim()) return;
    this.transportService
      .createVehicle({
        registrationNumber: this.newVehicle.registrationNumber.trim(),
        vehicleType: this.newVehicle.vehicleType,
        capacity: Number(this.newVehicle.capacity),
        model: this.newVehicle.model || undefined
      })
      .subscribe(v => {
        this.vehicles = [...this.vehicles, v];
        this.routeForm.vehicleId = v.id;
      });
  }

  saveNewDriver(): void {
    if (!this.newDriver.fullName.trim()) return;
    this.newDriver.phone = this.normalizeTenDigitPhone(this.newDriver.phone);
    if (this.newDriver.phone && !this.isValidTenDigitPhone(this.newDriver.phone)) {
      this.routeWizardError = 'transport.errPhoneInvalidTenDigits';
      return;
    }
    this.routeWizardError = '';
    this.transportService
      .createDriver({
        fullName: this.newDriver.fullName.trim(),
        phone: this.newDriver.phone || undefined,
        licenseNumber: this.newDriver.licenseNumber || undefined
      })
      .subscribe(d => {
        this.drivers = [...this.drivers, d];
        this.routeForm.driverId = d.id;
      });
  }

  addWizardStop(): void {
    this.wizardStops = [...this.wizardStops, { name: '', stopOrder: this.wizardStops.length + 1, stopTime: '' }];
  }

  removeWizardStop(ix: number): void {
    this.wizardStops = this.wizardStops.filter((_, i) => i !== ix);
  }

  saveRouteFromWizard(): void {
    if (!this.routeForm.name.trim()) return;
    const body = {
      name: this.routeForm.name.trim(),
      vehicleId: this.routeForm.vehicleId || undefined,
      driverId: this.routeForm.driverId || undefined
    };
    const stops = this.wizardStops.filter(s => s.name.trim());
    const req$ = this.editingRouteId ? this.transportService.updateRoute(this.editingRouteId, body) : this.transportService.createRoute(body);
    req$.subscribe(route => {
      const rid = this.editingRouteId ?? String(route.id);
      if (!stops.length) {
        this.closeRouteWizard();
        this.reload();
        return;
      }
      from(stops)
        .pipe(
          concatMap(s =>
            this.transportService.addStop({
              routeId: rid,
              name: s.name.trim(),
              stopOrder: Number(s.stopOrder),
              stopTime: s.stopTime?.trim() || undefined
            })
          )
        )
        .subscribe({
          complete: () => {
            this.closeRouteWizard();
            this.reload();
          },
          error: () => {
            this.closeRouteWizard();
            this.reload();
          }
        });
    });
  }

  deleteRoute(r: TransportRoute): void {
    const t = this.translate.instant.bind(this.translate);
    this.confirmDialog
      .confirm({
        title: t('transport.confirmDeleteTitle'),
        message: t('transport.confirmDeleteMessage', { name: r.name }),
        details: [
          r.vehicleNumber ? t('transport.detailVehicle', { v: r.vehicleNumber }) : undefined,
          r.driverName ? t('transport.detailDriver', { d: r.driverName }) : undefined,
          t('transport.detailStops', { n: r.stops?.length ?? 0 }),
        ].filter((x): x is string => !!x),
        variant: 'danger',
        confirmLabel: t('transport.confirmDelete'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => this.transportService.deleteRoute(r.id).subscribe(() => this.reload()));
  }

  openStopModal(r: TransportRoute): void {
    this.stopModalRoute = r;
    this.stopForm = { name: '', stopOrder: (r.stops?.length ?? 0) + 1, stopTime: '' };
  }

  saveStop(): void {
    if (!this.stopModalRoute || !this.stopForm.name.trim()) return;
    this.transportService
      .addStop({
        routeId: this.stopModalRoute.id,
        name: this.stopForm.name,
        stopOrder: Number(this.stopForm.stopOrder),
        stopTime: this.stopForm.stopTime || undefined
      })
      .subscribe(() => {
        this.stopModalRoute = null;
        this.reload();
      });
  }

  removeStop(route: TransportRoute, stopId: number): void {
    this.transportService.removeStop(stopId).subscribe(() => this.reload());
  }

  openEditStop(route: TransportRoute, stop: { id?: number; name: string; time: string; order: number }): void {
    this.editStopCtx = { route, stop };
    this.editStopForm = { name: stop.name, stopOrder: stop.order, stopTime: stop.time || '' };
  }

  saveEditStop(): void {
    if (!this.editStopCtx?.stop.id) return;
    this.transportService
      .updateStop(this.editStopCtx.stop.id, {
        name: this.editStopForm.name.trim(),
        stopOrder: Number(this.editStopForm.stopOrder),
        stopTime: this.editStopForm.stopTime || undefined
      })
      .subscribe(() => {
        this.editStopCtx = null;
        this.reload();
      });
  }

  openAssignModal(r: TransportRoute): void {
    this.assignModalRoute = r;
    this.assignStudentFilter = '';
    this.assignForm = { studentId: null, studentName: '', pickupStop: '', dropStop: '' };
  }

  /** Students not already mapped to this route, optionally filtered by name (API-ready shape: same list source as assign payload). */
  get assignEligibleStudents(): Student[] {
    const route = this.assignModalRoute;
    if (!route) return [];
    const assigned = new Set((route.students ?? []).map(m => m.studentId));
    const q = this.assignStudentFilter.trim().toLowerCase();
    return this.students.filter(s => {
      if (assigned.has(s.id)) return false;
      if (!q) return true;
      const hay = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim().toLowerCase();
      return hay.includes(q);
    });
  }

  get assignSaveDisabled(): boolean {
    if (!this.assignModalRoute || this.assignForm.studentId == null) return true;
    if (!this.assignModalRoute.stops.length) return true;
    return false;
  }

  studentAssignOptionLabel(s: Student): string {
    const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
    const cls = s.className?.trim();
    return cls ? `${name} · ${cls}` : name;
  }

  stopSelectLabel(st: { name: string; time: string }): string {
    const t = st.time?.trim();
    return t ? `${st.name} (${t})` : st.name;
  }

  onAssignStudentFilterChange(): void {
    if (this.assignForm.studentId == null) return;
    if (!this.assignEligibleStudents.some(s => s.id === this.assignForm.studentId)) {
      this.assignForm.studentId = null;
      this.assignForm.studentName = '';
    }
  }

  syncAssignStudentName(): void {
    const s = this.students.find(x => x.id === this.assignForm.studentId);
    this.assignForm.studentName = s ? `${s.firstName} ${s.lastName}`.trim() : '';
  }

  saveAssign(): void {
    if (!this.assignModalRoute || this.assignForm.studentId == null || !this.assignModalRoute.stops.length) return;
    this.transportService
      .assignStudent({
        routeId: this.assignModalRoute.id,
        studentId: this.assignForm.studentId,
        studentName: this.assignForm.studentName,
        pickupStop: this.assignForm.pickupStop || undefined,
        dropStop: this.assignForm.dropStop || undefined
      })
      .subscribe(() => {
        this.assignModalRoute = null;
        this.reload();
      });
  }

  unassign(mappingId: number): void {
    this.transportService.removeStudentMapping(mappingId).subscribe(() => this.reload());
  }

  simulateGps(route: TransportRoute): void {
    if (!route.vehicleId) return;
    const lat = (route.liveLatitude ?? 28.6) + (Math.random() - 0.5) * 0.02;
    const lng = (route.liveLongitude ?? 77.2) + (Math.random() - 0.5) * 0.02;
    this.transportService.reportVehicleLocation(route.vehicleId, lat, lng, route.id).subscribe(() => this.reload());
  }

  previewOptimization(route: TransportRoute): void {
    this.transportService.optimizeRoute(route.id).subscribe(res => {
      this.optimizationPreview = { ...this.optimizationPreview, [route.id]: res.estimatedTotalTravelMinutes };
    });
  }

  resolveException(id: number): void {
    this.transportService.resolveOpsException(id, 'Resolved from transport desk').subscribe(() => this.refreshOpsPanels());
  }

  refreshOpsPanels(): void {
    this.transportService.getOpsSnapshot().subscribe(s => (this.opsSnapshot = s));
    this.transportService.listOpsExceptions(0, 8, 'OPEN').subscribe(p => (this.opsExceptions = p.content || []));
  }

  private normalizeTenDigitPhone(value: string | null | undefined): string {
    return (value ?? '').replace(/\D/g, '').slice(0, 10);
  }

  private isValidTenDigitPhone(value: string | null | undefined): boolean {
    return isValidIndiaMobileTen(value);
  }
}
