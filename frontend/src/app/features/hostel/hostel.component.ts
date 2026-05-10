import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HostelBillingProfile, HostelBookingRequest, HostelGatePass, HostelBuilding, HostelIncident, HostelPortalProfile, HostelRoom, HostelVisitorEntry, Student } from '../../core/models/models';
import { HostelService, HostelStats, HostelAnalyticsSnapshot } from '../../core/services/hostel.service';
import { StudentService } from '../../core/services/student.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { AuthService } from '../../core/services/auth.service';
import { ParentService } from '../../core/services/parent.service';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { sliceToPage } from '../../core/utils/paginate';
import { runtimeConfig } from '../../core/config/runtime-config';

@Component({
  selector: 'app-hostel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ErpPaginationComponent, ErpI18nPhDirective, ErpDatePickerComponent],
  styles: [`
    .triage-status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid var(--clr-border-light);
      background: var(--clr-surface-alt);
      color: var(--clr-text);
      text-transform: capitalize;
    }
    .triage-status-chip::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.85;
    }
    .triage-status-chip--pending {
      color: #b45309;
      background: color-mix(in srgb, #f59e0b 14%, var(--clr-surface));
      border-color: color-mix(in srgb, #f59e0b 35%, var(--clr-border-light));
    }
    .triage-status-chip--approved {
      color: #047857;
      background: color-mix(in srgb, #10b981 14%, var(--clr-surface));
      border-color: color-mix(in srgb, #10b981 35%, var(--clr-border-light));
    }
    .triage-status-chip--rejected {
      color: #b91c1c;
      background: color-mix(in srgb, #ef4444 14%, var(--clr-surface));
      border-color: color-mix(in srgb, #ef4444 35%, var(--clr-border-light));
    }
    .triage-toolbar {
      border: 1px solid var(--clr-border-light);
      border-radius: var(--radius-md);
      background: var(--clr-surface-alt);
      padding: 10px;
    }
    .room-actions-inline {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .room-actions-inline .erp-select {
      min-width: 170px;
      max-width: 220px;
      height: 32px;
      font-size: 12px;
      padding-top: 4px;
      padding-bottom: 4px;
    }
  `],
  template: `
    <div data-testid="hostel-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'hostel.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'hostel.lead' | translate }}</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reload()"><i class="bi bi-arrow-clockwise"></i> {{ 'hostel.refresh' | translate }}</button>
          <button *ngIf="isAdmin" class="btn-primary-erp btn-sm" data-testid="add-room-btn" (click)="openRoomModal()"><i class="bi bi-plus-lg"></i> {{ 'hostel.addRoom' | translate }}</button>
        </div>
      </div>
      <div class="erp-card mb-4 animate-in" *ngIf="buildings.length">
        <h4 class="erp-card-title mb-3">{{ 'hostel.buildingsTitle' | translate }}</h4>
        <p class="text-muted small mb-3">{{ 'hostel.buildingsLead' | translate }}</p>
        <div class="row g-3">
          <div class="col-md-4" *ngFor="let b of buildings">
            <div class="p-3 rounded-3" style="border: 1px solid var(--clr-border); background: var(--clr-surface-muted);">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <strong>{{ b.name }}</strong>
                  <div class="small text-muted">{{ b.code }} <span *ngIf="b.genderScope">· {{ b.genderScope }}</span></div>
                </div>
                <span class="badge-erp badge-success">{{ 'hostel.freeBeds' | translate: { n: b.availableBeds } }}</span>
              </div>
              <div class="small text-muted mt-2">{{ 'hostel.roomsCount' | translate: { n: b.roomCount } }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4 animate-in animate-in-delay-1">
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(27,58,48,0.1); color: #1B3A30;"><i class="bi bi-house-fill"></i></div><div class="stat-value">{{ stats.totalRooms }}</div><div class="stat-label">{{ 'hostel.statRooms' | translate }}</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(5,150,105,0.1); color: #059669;"><i class="bi bi-check-circle-fill"></i></div><div class="stat-value">{{ stats.totalOccupancy }}</div><div class="stat-label">{{ 'hostel.statOccupied' | translate }}</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(217,119,6,0.1); color: #D97706;"><i class="bi bi-door-open-fill"></i></div><div class="stat-value">{{ stats.availableBeds }}</div><div class="stat-label">{{ 'hostel.statAvailable' | translate }}</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(2,132,199,0.1); color: #0284C7;"><i class="bi bi-building"></i></div><div class="stat-value">{{ stats.blocks }}</div><div class="stat-label">{{ 'hostel.statBlocks' | translate }}</div></div>
        </div>
      </div>
      <div class="erp-card mb-4 animate-in animate-in-delay-1" *ngIf="isAdmin || canHostelApprovalWrite">
        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <h4 class="erp-card-title mb-0">Hostel Analytics</h4>
          <div class="d-flex gap-2 flex-wrap">
            <button type="button" class="btn-outline-erp btn-sm" (click)="reloadHostelAnalytics()">Refresh</button>
            <button type="button" class="btn-outline-erp btn-sm" (click)="downloadHostelAnalytics('csv')">Export CSV</button>
            <button type="button" class="btn-outline-erp btn-sm" (click)="downloadHostelAnalytics('pdf')">Export PDF</button>
          </div>
        </div>
        <div class="row g-3 mb-3">
          <div class="col-md-2"><div class="small text-muted">Occupancy %</div><div class="h5 mb-0">{{ hostelAnalytics.occupancyPct }}</div></div>
          <div class="col-md-2"><div class="small text-muted">Full rooms</div><div class="h5 mb-0">{{ hostelAnalytics.overcrowdedRooms }}</div></div>
          <div class="col-md-2"><div class="small text-muted">Almost full</div><div class="h5 mb-0">{{ hostelAnalytics.nearCapacityRooms }}</div></div>
          <div class="col-md-2"><div class="small text-muted">Open issues</div><div class="h5 mb-0">{{ hostelAnalytics.openIncidents }}</div></div>
          <div class="col-md-2"><div class="small text-muted">Escalated issues</div><div class="h5 mb-0">{{ hostelAnalytics.escalatedIncidents }}</div></div>
          <div class="col-md-2"><div class="small text-muted">Avg response time (min)</div><div class="h5 mb-0">{{ hostelAnalytics.avgIncidentSlaMinutes }}</div></div>
        </div>
        <h5 class="mb-2">Room move suggestions</h5>
        <table class="erp-table mb-0">
          <thead><tr><th>From room</th><th>To room</th><th>Load gap</th><th>Why this helps</th></tr></thead>
          <tbody>
            <tr *ngFor="let rec of occupancyRecommendations">
              <td>{{ rec.fromRoomNumber }}</td>
              <td>{{ rec.toRoomNumber }}</td>
              <td>{{ rec.occupancyPressureDiff }}</td>
              <td>{{ rec.rationale }}</td>
            </tr>
            <tr *ngIf="!occupancyRecommendations.length"><td colspan="4" class="text-muted">No room move suggestions right now.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="erp-card animate-in animate-in-delay-2">
        <table class="erp-table" data-testid="hostel-rooms-table">
          <thead><tr><th>{{ 'hostel.thHostel' | translate }}</th><th>{{ 'hostel.thRoom' | translate }}</th><th>{{ 'hostel.thBlock' | translate }}</th><th>{{ 'hostel.thFloor' | translate }}</th><th>{{ 'hostel.thTypeCap' | translate }}</th><th>{{ 'hostel.thOccupancy' | translate }}</th><th>{{ 'hostel.thResidents' | translate }}</th><th *ngIf="isAdmin">{{ 'hostel.thActions' | translate }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let room of pagedRooms">
              <td><span class="badge-erp badge-neutral">{{ room.hostelName || ('transport.dash' | translate) }}</span></td>
              <td><strong>{{ room.roomNumber }}</strong></td>
              <td>{{ room.block }}</td>
              <td>{{ floorLabel(room.floor) }}</td>
              <td style="text-transform: capitalize;">{{ typeCapacityLabel(room) }}</td>
              <td>{{ room.occupancy }}/{{ room.capacity }}</td>
              <td>
                <span *ngFor="let r of room.residents" class="badge-erp badge-neutral me-1">{{ r.studentName }}</span>
                <span *ngIf="!room.residents?.length" class="text-muted">{{ 'transport.dash' | translate }}</span>
              </td>
              <td *ngIf="isAdmin">
                <div class="room-actions-inline">
                  <select
                    class="erp-select"
                    [ngModel]="roomActionSelection[room.id] || ''"
                    (ngModelChange)="roomActionSelection[room.id] = $event"
                  >
                    <option value="">Choose action</option>
                    <option value="edit">{{ 'hostel.edit' | translate }}</option>
                    <option value="allocate" [disabled]="room.occupancy >= room.capacity">{{ 'hostel.bookAllocate' | translate }}</option>
                    <option value="transfer" [disabled]="!room.residents?.length">{{ 'hostel.transfer' | translate }}</option>
                    <option value="vacate" [disabled]="!room.residents?.length">{{ 'hostel.vacate' | translate }}</option>
                  </select>
                  <button
                    type="button"
                    class="btn-outline-erp btn-xs"
                    [disabled]="!roomActionSelection[room.id]"
                    (click)="applyRoomAction(room)"
                  >
                    Go
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <app-erp-pagination
          *ngIf="roomsTotal > 0"
          [totalElements]="roomsTotal"
          [pageIndex]="roomsPageIndex"
          [pageSize]="roomsPageSize"
          (pageIndexChange)="onRoomsPageIndexChange($event)"
          (pageSizeChange)="onRoomsPageSizeChange($event)"
        />
      </div>

      <div class="erp-card mt-4 animate-in" *ngIf="canHostelBillingRead">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h4 class="erp-card-title mb-0">Hostel Billing</h4>
          <button class="btn-outline-erp btn-sm" type="button" (click)="reloadBilling()">Refresh</button>
        </div>
        <p class="text-muted small mb-3">Link students with fee plans and run billing when needed.</p>
        <div class="row g-2 mb-3" *ngIf="canHostelBillingWrite">
          <div class="col-md-3">
            <select class="erp-select" [(ngModel)]="billingForm.studentId" (ngModelChange)="syncBillingStudentName()">
              <option [ngValue]="null">Select student</option>
              <option *ngFor="let s of students" [ngValue]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
            </select>
          </div>
          <div class="col-md-2"><input class="erp-input" type="number" [(ngModel)]="billingForm.feeStructureId" placeholder="Fee plan ID" /></div>
          <div class="col-md-2">
            <select class="erp-select" [(ngModel)]="billingForm.billingCadence">
              <option value="MONTHLY">Monthly</option>
              <option value="TERM">Term</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>
          <div class="col-md-2">
            <app-erp-date-picker [(ngModel)]="billingForm.nextDueDate" placeholder="Next due date" />
          </div>
          <div class="col-md-3 d-flex gap-2">
            <button class="btn-primary-erp btn-sm" type="button" (click)="saveBillingProfile()">Save mapping</button>
            <button class="btn-outline-erp btn-sm" type="button" (click)="runBillingHook()">Run billing now</button>
          </div>
        </div>
        <div class="small text-muted mb-2" *ngIf="billingRunInfo">{{ billingRunInfo }}</div>
        <table class="erp-table">
          <thead><tr><th>Student</th><th>Fee Structure</th><th>Cadence</th><th>Next Due</th><th>Auto</th></tr></thead>
          <tbody>
            <tr *ngFor="let p of billingProfiles">
              <td>{{ p.studentName || p.studentId }}</td>
              <td>{{ p.feeStructureId }}</td>
              <td>{{ p.billingCadence }}</td>
              <td>{{ p.nextDueDate || '-' }}</td>
              <td>{{ p.autoInvoiceEnabled ? 'Yes' : 'No' }}</td>
            </tr>
            <tr *ngIf="!billingProfiles.length"><td colspan="5" class="text-muted">No billing setup yet.</td></tr>
          </tbody>
        </table>
      </div>

      <div class="erp-card mt-4 animate-in" *ngIf="canHostelDailyOps">
        <h4 class="erp-card-title mb-2">Daily Desk: Gate Pass and Visitors</h4>
        <p class="text-muted small mb-3">Create and approve student gate pass and visitor entry requests.</p>
        <div class="row g-2 mb-3" *ngIf="isAdmin">
          <div class="col-md-3">
            <select class="erp-select" [(ngModel)]="gatePassForm.studentId" (ngModelChange)="syncGatePassStudentName()">
              <option [ngValue]="null">Select student</option>
              <option *ngFor="let s of students" [ngValue]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="erp-select" [(ngModel)]="gatePassForm.requestType">
              <option value="LEAVE_OUT">Leave out</option>
              <option value="GATE_PASS">Gate pass</option>
            </select>
          </div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="gatePassForm.reason" placeholder="Reason" /></div>
          <div class="col-md-2">
            <app-erp-date-picker
              [(ngModel)]="gatePassForm.outAt"
              mode="datetime"
              placeholder="Out date and time"
            />
          </div>
          <div class="col-md-2"><button class="btn-primary-erp btn-sm" type="button" (click)="createGatePass()">Create request</button></div>
        </div>
        <table class="erp-table mb-3">
          <thead><tr><th>Student</th><th>Type</th><th>Status</th><th>Out</th><th *ngIf="canHostelApprovalWrite">Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let gp of gatePasses">
              <td>{{ gp.studentName || gp.studentId }}</td>
              <td>{{ gp.requestType }}</td>
              <td>{{ gp.status }}</td>
              <td>{{ gp.outAt || '-' }}</td>
              <td *ngIf="canHostelApprovalWrite">
                <button class="btn-outline-erp btn-xs" *ngIf="gp.status === 'PENDING'" (click)="approveGatePass(gp.id)">Approve</button>
                <button class="btn-outline-erp btn-xs ms-1" *ngIf="gp.status === 'PENDING'" (click)="rejectGatePass(gp.id)">Reject</button>
                <button class="btn-outline-erp btn-xs ms-1" *ngIf="gp.status === 'APPROVED'" (click)="returnGatePass(gp.id)">Return</button>
              </td>
            </tr>
            <tr *ngIf="!gatePasses.length"><td colspan="5" class="text-muted">No gate pass requests.</td></tr>
          </tbody>
        </table>

        <div class="row g-2 mb-3" *ngIf="canHostelVisitorWrite">
          <div class="col-md-3">
            <select class="erp-select" [(ngModel)]="visitorForm.studentId" (ngModelChange)="syncVisitorStudentName()">
              <option [ngValue]="null">Select student</option>
              <option *ngFor="let s of students" [ngValue]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
            </select>
          </div>
          <div class="col-md-2"><input class="erp-input" [(ngModel)]="visitorForm.visitorName" placeholder="Visitor name" /></div>
          <div class="col-md-2"><input class="erp-input" [(ngModel)]="visitorForm.relationLabel" placeholder="Relation" /></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="visitorForm.purpose" placeholder="Purpose" /></div>
          <div class="col-md-2"><button class="btn-primary-erp btn-sm" type="button" (click)="createVisitor()">Check-in</button></div>
        </div>
        <table class="erp-table">
          <thead><tr><th>Visitor</th><th>Student</th><th>Status</th><th>Check-in</th><th *ngIf="canHostelApprovalWrite || canHostelVisitorWrite">Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of visitorEntries">
              <td>{{ v.visitorName || '-' }}</td>
              <td>{{ v.studentName || v.studentId }}</td>
              <td>{{ v.status }}</td>
              <td>{{ v.checkInAt || '-' }}</td>
              <td *ngIf="canHostelApprovalWrite || canHostelVisitorWrite">
                <button class="btn-outline-erp btn-xs" *ngIf="canHostelApprovalWrite && v.status === 'PENDING'" (click)="approveVisitor(v.id)">Approve</button>
                <button class="btn-outline-erp btn-xs ms-1" *ngIf="canHostelApprovalWrite && v.status === 'PENDING'" (click)="rejectVisitor(v.id)">Reject</button>
                <button class="btn-outline-erp btn-xs ms-1" *ngIf="canHostelVisitorWrite && v.status === 'APPROVED'" (click)="checkoutVisitor(v.id)">Check out</button>
              </td>
            </tr>
            <tr *ngIf="!visitorEntries.length"><td colspan="5" class="text-muted">No visitor entries.</td></tr>
          </tbody>
        </table>
      </div>

      <div class="erp-card mt-4 animate-in" *ngIf="canHostelApprovalWrite">
        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <h4 class="erp-card-title mb-0">Room Request Review</h4>
          <button class="btn-outline-erp btn-sm" type="button" (click)="reloadBookingTriage()">Refresh</button>
        </div>
        <div class="row g-2 mb-3 triage-toolbar">
          <div class="col-md-2">
            <select class="erp-select" [(ngModel)]="bookingFilterStatus" (ngModelChange)="applyBookingFilters()">
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="erp-select" [(ngModel)]="bookingFilterStudentId" (ngModelChange)="applyBookingFilters()">
              <option [ngValue]="null">All students</option>
              <option *ngFor="let s of students" [ngValue]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <input class="erp-input" [(ngModel)]="bookingFilterQuery" placeholder="Search student/room type/note" />
          </div>
          <div class="col-md-3 d-flex gap-2">
            <button class="btn-primary-erp btn-sm" type="button" (click)="applyBookingFilters()">Apply</button>
            <button class="btn-outline-erp btn-sm" type="button" (click)="bookingFilterQuery=''; bookingFilterStatus=''; bookingFilterStudentId=null; applyBookingFilters();">Clear</button>
          </div>
          <div class="col-md-6 d-flex gap-2 align-items-center flex-wrap">
            <input class="erp-input" style="max-width: 240px;" [(ngModel)]="bookingPresetName" placeholder="Preset name (for your account)" />
            <button class="btn-outline-erp btn-sm" type="button" (click)="saveBookingPreset()">Save preset</button>
            <select class="erp-select" style="max-width: 240px;" [(ngModel)]="bookingSelectedPresetKey" (ngModelChange)="loadBookingPreset($event)">
              <option value="">Load saved filter</option>
              <option *ngFor="let p of bookingFilterPresets" [value]="p.key">{{ p.name }}</option>
            </select>
            <button class="btn-outline-erp btn-sm" type="button" [disabled]="!bookingSelectedPresetKey" (click)="deleteBookingPreset()">Delete</button>
          </div>
        </div>
        <table class="erp-table">
          <thead><tr><th>Student</th><th>Preference</th><th>Status</th><th>Requested</th><th>Decision</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let b of bookingRequests">
              <td>{{ b.studentName || b.studentId }}</td>
              <td>{{ b.preferredHostelId || '-' }} / {{ b.preferredRoomType || '-' }}</td>
              <td>
                <span class="triage-status-chip" [ngClass]="bookingStatusChipClass(b.status)">
                  {{ bookingStatusLabel(b.status) }}
                </span>
              </td>
              <td>{{ b.createdAt || '-' }}</td>
              <td>{{ b.decisionNote || '-' }}</td>
              <td>
                <button
                  type="button"
                  class="btn-primary-erp btn-xs"
                  *ngIf="(b.status || '').toUpperCase() === 'PENDING'"
                  (click)="openBookingDecision(b, 'approve')"
                >
                  Approve
                </button>
                <button
                  type="button"
                  class="btn-outline-erp btn-xs ms-1"
                  *ngIf="(b.status || '').toUpperCase() === 'PENDING'"
                  (click)="openBookingDecision(b, 'reject')"
                >
                  Reject
                </button>
                <span *ngIf="(b.status || '').toUpperCase() !== 'PENDING'" class="text-muted small">Done</span>
              </td>
            </tr>
            <tr *ngIf="!bookingRequests.length"><td colspan="6" class="text-muted">No booking requests found.</td></tr>
          </tbody>
        </table>
        <app-erp-pagination
          *ngIf="bookingTotal > 0"
          [totalElements]="bookingTotal"
          [pageIndex]="bookingPageIndex"
          [pageSize]="bookingPageSize"
          (pageIndexChange)="onBookingPageIndexChange($event)"
          (pageSizeChange)="onBookingPageSizeChange($event)"
        />
      </div>

      <div class="erp-card mt-4 animate-in" *ngIf="canHostelIncidentWrite">
        <h4 class="erp-card-title mb-2">Student Safety Log</h4>
        <div class="row g-2 mb-3">
          <div class="col-md-3">
            <select class="erp-select" [(ngModel)]="incidentForm.studentId" (ngModelChange)="syncIncidentStudentName()">
              <option [ngValue]="null">Select student</option>
              <option *ngFor="let s of students" [ngValue]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="erp-select" [(ngModel)]="incidentForm.severity">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div class="col-md-2"><input class="erp-input" [(ngModel)]="incidentForm.incidentType" placeholder="Type" /></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="incidentForm.summary" placeholder="Summary" /></div>
          <div class="col-md-2"><button class="btn-primary-erp btn-sm" (click)="createIncident()">Save issue</button></div>
        </div>
        <div class="row g-2 mb-3">
          <div class="col-md-3">
            <select class="erp-select" [(ngModel)]="incidentResolveReason">
              <option *ngFor="let rr of incidentResolutionReasons" [value]="rr">{{ rr }}</option>
            </select>
          </div>
          <div class="col-md-6">
            <input class="erp-input" [(ngModel)]="incidentResolveNote" placeholder="Resolution note (optional)" />
          </div>
        </div>
        <table class="erp-table">
          <thead><tr><th>Student</th><th>Type</th><th>Severity</th><th>Status</th><th>When</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let i of incidents">
              <td>{{ i.studentName || i.studentId || '-' }}</td>
              <td>{{ i.incidentType || '-' }}</td>
              <td>{{ i.severity || '-' }}</td>
              <td>{{ i.status || '-' }}</td>
              <td>{{ i.occurredAt || '-' }}</td>
              <td>
                <button class="btn-outline-erp btn-xs" *ngIf="i.status === 'OPEN'" (click)="escalateIncident(i.id)">Escalate</button>
                <button class="btn-outline-erp btn-xs ms-1" *ngIf="i.status !== 'RESOLVED'" (click)="resolveIncident(i.id)">Resolve</button>
              </td>
            </tr>
            <tr *ngIf="!incidents.length"><td colspan="6" class="text-muted">No incident logs.</td></tr>
          </tbody>
        </table>
        <div class="mt-3" *ngIf="canHostelApprovalWrite">
          <h5 class="mb-2">Issue response policy</h5>
          <div class="row g-2 mb-2">
            <div class="col-md-3"><input class="erp-input" [(ngModel)]="incidentPolicyForm.incidentType" placeholder="Issue type e.g. MEDICAL" /></div>
            <div class="col-md-2">
              <select class="erp-select" [(ngModel)]="incidentPolicyForm.severity">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div class="col-md-2"><input class="erp-input" type="number" [(ngModel)]="incidentPolicyForm.slaMinutes" placeholder="Response mins" /></div>
            <div class="col-md-3"><input class="erp-input" type="number" [(ngModel)]="incidentPolicyForm.escalationAfterMinutes" placeholder="Escalate after mins" /></div>
            <div class="col-md-2"><button class="btn-primary-erp btn-sm w-100" (click)="saveIncidentPolicy()">Save policy</button></div>
          </div>
          <table class="erp-table">
            <thead><tr><th>Issue Type</th><th>Severity</th><th>Response Mins</th><th>Escalate After Mins</th></tr></thead>
            <tbody>
              <tr *ngFor="let p of incidentPolicies">
                <td>{{ p.incidentType }}</td>
                <td>{{ p.severity }}</td>
                <td>{{ p.slaMinutes }}</td>
                <td>{{ p.escalationAfterMinutes }}</td>
              </tr>
              <tr *ngIf="!incidentPolicies.length"><td colspan="4" class="text-muted">No custom policy yet. Default timing is active.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="erp-card mt-4 animate-in" *ngIf="portalReadOnlyVisible">
        <h4 class="erp-card-title mb-2">My Hostel Profile</h4>
        <div class="row g-2 mb-3" *ngIf="portalRole === 'parent'">
          <div class="col-md-4">
            <select class="erp-select" [(ngModel)]="portalSelectedChildId" (ngModelChange)="loadParentPortalProfile()">
              <option [ngValue]="null">Select child</option>
              <option *ngFor="let c of portalChildren" [ngValue]="c.id">{{ c.firstName }} {{ c.lastName }}</option>
            </select>
          </div>
        </div>
        <div *ngIf="portalProfile as p" class="small">
          <div><strong>Student:</strong> {{ p.studentName }}</div>
          <div><strong>Hostel:</strong> {{ p.hostelName || '-' }}</div>
          <div><strong>Room:</strong> {{ p.roomNumber || '-' }} <span *ngIf="p.roomType">({{ p.roomType }})</span></div>
          <div><strong>Occupancy:</strong> {{ p.occupancyLabel || '-' }}</div>
          <div><strong>Billing:</strong> {{ p.billingCadence || '-' }} | Next Due: {{ p.nextDueDate || '-' }}</div>
          <div><strong>Gate Pass:</strong> {{ p.activeGatePassStatus || 'None active' }}</div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="roomModal" (click)="roomModal = false">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'hostel.modalAddTitle' | translate }}</h3><button class="btn-icon" (click)="roomModal = false"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <label class="erp-label">{{ 'hostel.labelHostelBuilding' | translate }}</label>
          <select class="erp-select mb-2" [(ngModel)]="roomForm.hostelId">
            <option value="">{{ 'hostel.selectHostel' | translate }}</option>
            <option *ngFor="let b of buildings" [value]="b.id">{{ 'hostel.hostelOption' | translate: { name: b.name, n: b.availableBeds } }}</option>
          </select>
          <label class="erp-label">{{ 'hostel.labelRoomNumber' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="roomForm.roomNumber">
          <label class="erp-label">{{ 'hostel.labelBlock' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="roomForm.block">
          <label class="erp-label">{{ 'hostel.labelFloor' | translate }}</label>
          <input class="erp-input mb-2" type="number" [(ngModel)]="roomForm.floor">
          <label class="erp-label">{{ 'hostel.labelCapacity' | translate }}</label>
          <select class="erp-select mb-2" [(ngModel)]="roomForm.capacity">
            <option [ngValue]="1">{{ 'hostel.cap1' | translate }}</option>
            <option [ngValue]="2">{{ 'hostel.cap2' | translate }}</option>
            <option [ngValue]="3">{{ 'hostel.cap3' | translate }}</option>
            <option [ngValue]="4">{{ 'hostel.cap4' | translate }}</option>
          </select>
          <label class="erp-label">{{ 'hostel.labelRoomType' | translate }}</label>
          <input class="erp-input" [(ngModel)]="roomForm.roomType" erpI18nPh="hostel.phRoomType">
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="roomModal = false">{{ 'hostel.cancel' | translate }}</button>
          <button class="btn-primary-erp" (click)="saveRoom()">{{ 'hostel.create' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="vacateCtx" (click)="vacateCtx = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'hostel.modalVacateTitle' | translate }}</h3><button class="btn-icon" (click)="vacateCtx = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="mb-2">{{ 'hostel.vacateMessage' | translate: { student: vacateCtx.studentName, room: vacateCtx.roomNumber, hostelPart: vacateHostelPart(vacateCtx) } }}</p>
          <p class="small text-muted mb-0">{{ 'hostel.vacateHint' | translate }}</p>
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" type="button" (click)="vacateCtx = null">{{ 'hostel.cancel' | translate }}</button>
          <button class="btn-primary-erp" type="button" (click)="confirmVacate()">{{ 'hostel.vacateBed' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="editRoom" (click)="editRoom = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'hostel.modalEditTitle' | translate }}</h3><button class="btn-icon" (click)="editRoom = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2" *ngIf="editRoom as er">{{ 'hostel.capacityBelowOccupancy' | translate: { n: er.occupancy } }}</p>
          <label class="erp-label">{{ 'hostel.labelHostelBuilding' | translate }}</label>
          <select class="erp-select mb-2" [(ngModel)]="editForm.hostelId">
            <option value="">{{ 'hostel.selectHostel' | translate }}</option>
            <option *ngFor="let b of buildings" [value]="b.id">{{ b.name }}</option>
          </select>
          <label class="erp-label">{{ 'hostel.labelRoomNumber' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="editForm.roomNumber">
          <label class="erp-label">{{ 'hostel.labelBlock' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="editForm.block">
          <label class="erp-label">{{ 'hostel.labelFloor' | translate }}</label>
          <input class="erp-input mb-2" type="number" [(ngModel)]="editForm.floor">
          <label class="erp-label">{{ 'hostel.labelCapacity' | translate }}</label>
          <select class="erp-select mb-2" [(ngModel)]="editForm.capacity">
            <option [ngValue]="1">{{ 'hostel.cap1' | translate }}</option>
            <option [ngValue]="2">{{ 'hostel.cap2' | translate }}</option>
            <option [ngValue]="3">{{ 'hostel.cap3' | translate }}</option>
            <option [ngValue]="4">{{ 'hostel.cap4' | translate }}</option>
          </select>
          <label class="erp-label">{{ 'hostel.labelRoomType' | translate }}</label>
          <input class="erp-input" [(ngModel)]="editForm.roomType" erpI18nPh="hostel.phRoomType">
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="editRoom = null">{{ 'hostel.cancel' | translate }}</button>
          <button class="btn-primary-erp" (click)="saveEditRoom()">{{ 'hostel.save' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="transferCtx" (click)="transferCtx = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'hostel.transfer' | translate }}</h3><button class="btn-icon" (click)="transferCtx = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2">
            {{ 'hostel.transferFrom' | translate }} <strong>{{ transferCtx.fromRoomNumber }}</strong> · {{ transferCtx.studentName }}
          </p>
          <label class="erp-label">{{ 'hostel.targetRoom' | translate }}</label>
          <select class="erp-select mb-2" [(ngModel)]="transferForm.targetRoomId">
            <option [ngValue]="null">{{ 'hostel.select' | translate }}</option>
            <option *ngFor="let room of transferTargets" [ngValue]="room.id">
              {{ room.roomNumber }} ({{ room.occupancy }}/{{ room.capacity }}) - {{ room.hostelName || room.block }}
            </option>
          </select>
          <label class="erp-label">{{ 'hostel.transferReason' | translate }}</label>
          <input class="erp-input" [(ngModel)]="transferForm.reason" erpI18nPh="hostel.transferReason">
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" type="button" (click)="transferCtx = null">{{ 'hostel.cancel' | translate }}</button>
          <button class="btn-primary-erp" type="button" (click)="confirmTransfer()">{{ 'hostel.transfer' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="residentActionPicker" (click)="residentActionPicker = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ residentActionPicker.action === 'transfer' ? ('hostel.transfer' | translate) : ('hostel.vacate' | translate) }}</h3>
          <button class="btn-icon" (click)="residentActionPicker = null"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2">
            Room: <strong>{{ residentActionPicker.room.roomNumber }}</strong>
          </p>
          <label class="erp-label">Select resident</label>
          <select class="erp-select" [(ngModel)]="residentActionSelectedAllocationId">
            <option [ngValue]="null">Select</option>
            <option *ngFor="let r of residentActionPicker.room.residents" [ngValue]="r.allocationId">
              {{ r.studentName }}
            </option>
          </select>
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" type="button" (click)="residentActionPicker = null">{{ 'hostel.cancel' | translate }}</button>
          <button class="btn-primary-erp" type="button" [disabled]="!residentActionSelectedAllocationId" (click)="confirmResidentActionSelection()">Continue</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="allocRoom" (click)="allocRoom = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'hostel.modalAllocateTitle' | translate }}</h3><button class="btn-icon" (click)="allocRoom = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2">{{ 'hostel.allocSummary' | translate: { room: allocRoom.roomNumber, occ: allocRoom.occupancy, cap: allocRoom.capacity } }}</p>
          <label class="erp-label">{{ 'hostel.labelStudent' | translate }}</label>
          <select class="erp-select mb-2" [(ngModel)]="allocForm.studentId" (ngModelChange)="syncAllocName()">
            <option [ngValue]="null">{{ 'hostel.select' | translate }}</option>
            <option *ngFor="let s of students" [ngValue]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
          </select>
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="allocRoom = null">{{ 'hostel.cancel' | translate }}</button>
          <button class="btn-primary-erp" (click)="saveAllocate()">{{ 'hostel.allocate' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="bookingDecisionCtx" (click)="bookingDecisionCtx = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ bookingDecisionCtx.action === 'approve' ? 'Approve booking request' : 'Reject booking request' }}</h3>
          <button class="btn-icon" (click)="bookingDecisionCtx = null"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2">
            Student: <strong>{{ bookingDecisionCtx.request.studentName || bookingDecisionCtx.request.studentId }}</strong>
          </p>
          <p class="small text-muted mb-3">
            Preference: {{ bookingDecisionCtx.request.preferredHostelId || '-' }} / {{ bookingDecisionCtx.request.preferredRoomType || '-' }}
          </p>
          <ng-container *ngIf="bookingDecisionCtx.action === 'approve'">
            <label class="erp-label">Allocate room</label>
            <select class="erp-select mb-2" [(ngModel)]="bookingDecisionForm.roomId">
              <option [ngValue]="null">Select room</option>
              <option *ngFor="let room of bookingApprovalRoomOptions" [ngValue]="room.id">
                {{ room.roomNumber }} ({{ room.occupancy }}/{{ room.capacity }}) - {{ room.hostelName || room.block }}
              </option>
            </select>
          </ng-container>
          <label class="erp-label">{{ bookingDecisionCtx.action === 'approve' ? 'Approval note (optional)' : 'Reason (optional)' }}</label>
          <input class="erp-input" [(ngModel)]="bookingDecisionForm.decisionNote" />
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="bookingDecisionCtx = null">Cancel</button>
          <button
            type="button"
            class="btn-primary-erp"
            [disabled]="bookingDecisionSubmitting || (bookingDecisionCtx.action === 'approve' && !bookingDecisionForm.roomId)"
            (click)="submitBookingDecision()"
          >
            {{ bookingDecisionSubmitting ? 'Saving...' : (bookingDecisionCtx.action === 'approve' ? 'Approve' : 'Reject') }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class HostelComponent implements OnInit {
  readonly useServerPaging = !runtimeConfig.useMocks;

  buildings: HostelBuilding[] = [];
  private roomsFull: HostelRoom[] = [];
  pagedRooms: HostelRoom[] = [];
  roomsTotal = 0;
  roomsPageIndex = 0;
  roomsPageSize = DEFAULT_ERP_PAGE_SIZE;
  students: Student[] = [];
  stats: HostelStats = { totalRooms: 0, totalCapacity: 0, totalOccupancy: 0, availableBeds: 0, blocks: 0 };
  isAdmin = false;
  canHostelBillingRead = false;
  canHostelBillingWrite = false;
  canHostelDailyOps = false;
  canHostelApprovalWrite = false;
  canHostelVisitorWrite = false;
  canHostelIncidentWrite = false;
  canHostelPortalRead = false;
  portalRole: 'parent' | 'student' | 'other' = 'other';
  portalReadOnlyVisible = false;
  roomModal = false;
  roomForm = { hostelId: '', roomNumber: '', block: '', floor: 1, capacity: 2, roomType: 'double' };
  allocRoom: HostelRoom | null = null;
  allocForm = { studentId: null as number | null, studentName: '' };
  vacateCtx: { allocationId: string; studentName: string; roomNumber: string; hostelName?: string } | null = null;
  transferCtx: { allocationId: string; studentName: string; fromRoomId: string; fromRoomNumber: string } | null = null;
  transferForm = { targetRoomId: null as string | null, reason: '' };
  editRoom: HostelRoom | null = null;
  editForm = { hostelId: '', roomNumber: '', block: '', floor: 1, capacity: 2, roomType: 'double' };
  billingProfiles: HostelBillingProfile[] = [];
  billingForm = { studentId: null as number | null, studentName: '', feeStructureId: 0, billingCadence: 'MONTHLY', nextDueDate: '' };
  billingRunInfo = '';
  bookingFilterStatus = '';
  bookingFilterStudentId: number | null = null;
  bookingFilterQuery = '';
  bookingPresetName = '';
  bookingSelectedPresetKey = '';
  bookingFilterPresets: Array<{
    key: string;
    name: string;
    status: string;
    studentId: number | null;
    query: string;
  }> = [];
  bookingRequests: HostelBookingRequest[] = [];
  bookingTotal = 0;
  bookingPageIndex = 0;
  bookingPageSize = DEFAULT_ERP_PAGE_SIZE;
  bookingDecisionCtx: { request: HostelBookingRequest; action: 'approve' | 'reject' } | null = null;
  bookingDecisionForm = { roomId: null as string | null, decisionNote: '' };
  bookingApprovalRoomOptions: HostelRoom[] = [];
  bookingDecisionSubmitting = false;
  roomActionSelection: Record<string, '' | 'edit' | 'allocate' | 'transfer' | 'vacate'> = {};
  residentActionPicker: { room: HostelRoom; action: 'transfer' | 'vacate' } | null = null;
  residentActionSelectedAllocationId: string | null = null;

  gatePasses: HostelGatePass[] = [];
  gatePassForm = { studentId: null as number | null, studentName: '', requestType: 'LEAVE_OUT', reason: '', outAt: '' };
  visitorEntries: HostelVisitorEntry[] = [];
  visitorForm = { studentId: null as number | null, studentName: '', visitorName: '', relationLabel: '', purpose: '' };
  incidents: HostelIncident[] = [];
  incidentForm = { studentId: null as number | null, studentName: '', incidentType: 'GENERAL', severity: 'MEDIUM', summary: '' };
  incidentResolutionReasons: string[] = [];
  incidentResolveReason = 'OTHER';
  incidentResolveNote = '';
  portalChildren: Student[] = [];
  portalSelectedChildId: number | null = null;
  portalProfile: HostelPortalProfile | null = null;
  hostelAnalytics: HostelAnalyticsSnapshot = {
    occupancyPct: 0,
    overcrowdedRooms: 0,
    nearCapacityRooms: 0,
    openIncidents: 0,
    escalatedIncidents: 0,
    avgIncidentSlaMinutes: 0,
  };
  occupancyRecommendations: Array<{ fromRoomNumber: string; toRoomNumber: string; occupancyPressureDiff: number; rationale: string }> = [];
  incidentPolicies: Array<{ incidentType: string; severity: string; slaMinutes: number; escalationAfterMinutes: number }> = [];
  incidentPolicyForm = { incidentType: '', severity: 'MEDIUM', slaMinutes: 120, escalationAfterMinutes: 30 };

  private roomsReqSeq = 0;

  constructor(
    private hostelService: HostelService,
    private studentService: StudentService,
    private uiAccess: UiAccessService,
    private translate: TranslateService,
    private auth: AuthService,
    private parentService: ParentService
  ) {}

  floorLabel(n: number): string {
    return this.translate.instant('hostel.floorLabel', { n });
  }

  typeCapacityLabel(room: HostelRoom): string {
    const beds =
      room.capacity > 1 ? this.translate.instant('hostel.bedPlural') : this.translate.instant('hostel.bedSingular');
    return this.translate.instant('hostel.typeCapacity', { type: room.type, n: room.capacity, beds });
  }

  vacateHostelPart(ctx: { hostelName?: string }): string {
    return ctx.hostelName ? this.translate.instant('hostel.vacateHostelPart', { hostel: ctx.hostelName }) : '';
  }

  ngOnInit(): void {
    this.isAdmin = this.uiAccess.hasHostelDeskWriteAccess();
    this.canHostelBillingRead = this.uiAccess.hasHostelBillingReadAccess();
    this.canHostelBillingWrite = this.uiAccess.hasHostelBillingWriteAccess();
    this.canHostelApprovalWrite = this.uiAccess.hasHostelApprovalWriteAccess();
    this.canHostelVisitorWrite = this.uiAccess.hasHostelVisitorWriteAccess();
    this.canHostelIncidentWrite = this.uiAccess.hasHostelIncidentWriteAccess();
    this.canHostelPortalRead = this.uiAccess.hasHostelPortalReadAccess();
    this.canHostelDailyOps = this.canHostelApprovalWrite || this.canHostelVisitorWrite || this.isAdmin;
    const role = this.auth.getNormalizedRole();
    this.portalRole = role === 'parent' ? 'parent' : role === 'student' ? 'student' : 'other';
    this.portalReadOnlyVisible = this.canHostelPortalRead && (this.portalRole === 'parent' || this.portalRole === 'student');
    this.loadBookingPresets();
    this.reload();
    if (this.canHostelIncidentWrite) {
      this.hostelService.listIncidentResolutionReasons().subscribe(rows => {
        this.incidentResolutionReasons = rows?.length ? rows : ['OTHER'];
        if (!this.incidentResolutionReasons.includes(this.incidentResolveReason)) {
          this.incidentResolveReason = this.incidentResolutionReasons[0] || 'OTHER';
        }
      });
    }
    this.reloadHostelAnalytics();
    if (this.isAdmin || this.canHostelBillingWrite || this.canHostelVisitorWrite || this.canHostelIncidentWrite) {
      this.studentService.getStudents().subscribe(s => (this.students = s));
    }
    if (this.portalRole === 'parent') {
      this.parentService.getChildren().subscribe(rows => {
        this.portalChildren = rows || [];
        if (this.portalChildren.length === 1) {
          this.portalSelectedChildId = this.portalChildren[0].id;
          this.loadParentPortalProfile();
        }
      });
    } else if (this.portalRole === 'student') {
      this.hostelService.getStudentPortalProfile().subscribe(p => (this.portalProfile = p));
    }
  }

  reload(): void {
    this.hostelService.listBuildings().subscribe(b => (this.buildings = b));
    if (this.useServerPaging) {
      this.roomsPageIndex = 0;
      this.fetchRoomsPage();
    } else {
      this.hostelService.listRooms().subscribe(r => {
        this.roomsFull = r || [];
        this.roomsPageIndex = 0;
        this.applyRoomsPage();
      });
    }
    this.hostelService.stats().subscribe(s => (this.stats = s));
    this.reloadBilling();
    this.reloadBookingTriage();
    this.reloadDailyOps();
  }

  reloadBilling(): void {
    if (!this.canHostelBillingRead) return;
    this.hostelService.listBillingProfiles().subscribe(rows => (this.billingProfiles = rows || []));
  }

  reloadDailyOps(): void {
    if (this.canHostelDailyOps) {
      this.hostelService.listGatePasses().subscribe(rows => (this.gatePasses = rows || []));
      this.hostelService.listVisitors().subscribe(rows => (this.visitorEntries = rows || []));
    }
    if (this.canHostelIncidentWrite) {
      this.hostelService.listIncidents().subscribe(rows => (this.incidents = rows || []));
      if (this.canHostelApprovalWrite) {
        this.hostelService.listIncidentPolicies().subscribe(rows => (this.incidentPolicies = rows || []));
      }
    }
  }

  reloadHostelAnalytics(): void {
    if (!(this.isAdmin || this.canHostelApprovalWrite)) return;
    this.hostelService.getAnalyticsSnapshot().subscribe(x => (this.hostelAnalytics = x));
    this.hostelService.listOccupancyRecommendations().subscribe(x => (this.occupancyRecommendations = x || []));
  }

  downloadHostelAnalytics(format: 'csv' | 'pdf'): void {
    const req = format === 'csv'
      ? this.hostelService.exportAnalyticsCsv()
      : this.hostelService.exportAnalyticsPdf();
    req.subscribe(blob => {
      const file = format === 'csv'
        ? `hostel-analytics-${new Date().toISOString().slice(0, 10)}.csv`
        : `hostel-analytics-${new Date().toISOString().slice(0, 10)}.pdf`;
      this.saveBlob(blob, file);
    });
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  reloadBookingTriage(): void {
    if (!this.canHostelApprovalWrite) return;
    this.hostelService.listBookingsPaged({
      status: this.bookingFilterStatus || undefined,
      studentId: this.bookingFilterStudentId ?? undefined,
      query: this.bookingFilterQuery || undefined,
      page: this.bookingPageIndex,
      size: this.bookingPageSize,
    }).subscribe(p => {
      this.bookingRequests = p.content || [];
      this.bookingTotal = p.totalElements || 0;
      this.bookingPageIndex = p.page || 0;
      this.bookingPageSize = p.size || this.bookingPageSize;
    });
  }

  onBookingPageIndexChange(idx: number): void {
    this.bookingPageIndex = idx;
    this.reloadBookingTriage();
  }

  onBookingPageSizeChange(size: number): void {
    this.bookingPageSize = size;
    this.bookingPageIndex = 0;
    this.reloadBookingTriage();
  }

  applyBookingFilters(): void {
    this.bookingPageIndex = 0;
    this.reloadBookingTriage();
  }

  private bookingPresetStorageKey(): string {
    const u = this.auth.getCurrentUser();
    const uid = u?.id ?? 0;
    const tenant = u?.tenantId ?? 'global';
    return `erp_hostel_booking_presets_${tenant}_${uid}`;
  }

  private loadBookingPresets(): void {
    try {
      const raw = localStorage.getItem(this.bookingPresetStorageKey());
      const parsed = raw ? JSON.parse(raw) : [];
      this.bookingFilterPresets = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.bookingFilterPresets = [];
    }
  }

  private persistBookingPresets(): void {
    localStorage.setItem(this.bookingPresetStorageKey(), JSON.stringify(this.bookingFilterPresets));
  }

  saveBookingPreset(): void {
    const name = this.bookingPresetName.trim();
    if (!name) return;
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || String(Date.now());
    const payload = {
      key,
      name,
      status: this.bookingFilterStatus,
      studentId: this.bookingFilterStudentId,
      query: this.bookingFilterQuery,
    };
    this.bookingFilterPresets = [
      payload,
      ...this.bookingFilterPresets.filter(p => p.key !== key),
    ];
    this.bookingSelectedPresetKey = key;
    this.persistBookingPresets();
  }

  loadBookingPreset(key: string): void {
    if (!key) return;
    const preset = this.bookingFilterPresets.find(p => p.key === key);
    if (!preset) return;
    this.bookingFilterStatus = preset.status || '';
    this.bookingFilterStudentId = preset.studentId ?? null;
    this.bookingFilterQuery = preset.query || '';
    this.applyBookingFilters();
  }

  deleteBookingPreset(): void {
    if (!this.bookingSelectedPresetKey) return;
    this.bookingFilterPresets = this.bookingFilterPresets.filter(p => p.key !== this.bookingSelectedPresetKey);
    this.persistBookingPresets();
    this.bookingSelectedPresetKey = '';
  }

  bookingStatusChipClass(status?: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED') return 'triage-status-chip--approved';
    if (s === 'REJECTED') return 'triage-status-chip--rejected';
    return 'triage-status-chip--pending';
  }

  bookingStatusLabel(status?: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED') return 'Approved';
    if (s === 'REJECTED') return 'Rejected';
    if (s === 'PENDING') return 'Pending';
    return status || '-';
  }

  openBookingDecision(request: HostelBookingRequest, action: 'approve' | 'reject'): void {
    this.bookingDecisionCtx = { request, action };
    this.bookingDecisionForm = { roomId: null, decisionNote: '' };
    this.bookingApprovalRoomOptions = [];
    if (action === 'approve') {
      this.hostelService.listRooms().subscribe(rows => {
        this.bookingApprovalRoomOptions = (rows || []).filter(r => r.occupancy < r.capacity);
      });
    }
  }

  submitBookingDecision(): void {
    if (!this.bookingDecisionCtx || this.bookingDecisionSubmitting) return;
    const { request, action } = this.bookingDecisionCtx;
    this.bookingDecisionSubmitting = true;
    const done = () => {
      this.bookingDecisionSubmitting = false;
      this.bookingDecisionCtx = null;
      this.reloadBookingTriage();
      this.reload();
    };
    if (action === 'approve') {
      if (!this.bookingDecisionForm.roomId) {
        this.bookingDecisionSubmitting = false;
        return;
      }
      this.hostelService
        .approveBooking(request.id, {
          roomId: this.bookingDecisionForm.roomId,
          decisionNote: this.bookingDecisionForm.decisionNote || undefined,
        })
        .subscribe(() => done(), () => (this.bookingDecisionSubmitting = false));
      return;
    }
    this.hostelService
      .rejectBooking(request.id, { note: this.bookingDecisionForm.decisionNote || undefined })
      .subscribe(() => done(), () => (this.bookingDecisionSubmitting = false));
  }

  private fetchRoomsPage(): void {
    const seq = ++this.roomsReqSeq;
    this.hostelService.listRoomsPaged({ page: this.roomsPageIndex, size: this.roomsPageSize }).subscribe(p => {
      if (seq !== this.roomsReqSeq) return;
      this.pagedRooms = p.content;
      this.roomsTotal = p.totalElements;
      this.roomsPageIndex = p.page;
      this.roomsPageSize = p.size;
    });
  }

  private applyRoomsPage(): void {
    const slice = sliceToPage(this.roomsFull, this.roomsPageIndex, this.roomsPageSize);
    this.pagedRooms = slice.content;
    this.roomsTotal = slice.totalElements;
    this.roomsPageIndex = slice.page;
  }

  onRoomsPageIndexChange(idx: number): void {
    this.roomsPageIndex = idx;
    if (this.useServerPaging) this.fetchRoomsPage();
    else this.applyRoomsPage();
  }

  onRoomsPageSizeChange(size: number): void {
    this.roomsPageSize = size;
    this.roomsPageIndex = 0;
    if (this.useServerPaging) this.fetchRoomsPage();
    else this.applyRoomsPage();
  }

  openRoomModal(): void {
    this.roomForm = { hostelId: this.buildings[0]?.id ?? '', roomNumber: '', block: '', floor: 1, capacity: 2, roomType: 'double' };
    this.roomModal = true;
  }

  saveRoom(): void {
    if (!this.roomForm.roomNumber.trim() || !this.roomForm.hostelId) return;
    const cap = Number(this.roomForm.capacity);
    const typeLabel = this.roomForm.roomType || (cap === 1 ? 'single' : cap === 2 ? 'double' : cap === 3 ? 'triple' : 'quad');
    this.hostelService
      .createRoom({
        hostelId: this.roomForm.hostelId,
        roomNumber: this.roomForm.roomNumber,
        block: this.roomForm.block || 'Block A',
        floor: Number(this.roomForm.floor),
        capacity: cap,
        roomType: typeLabel
      })
      .subscribe(() => {
        this.roomModal = false;
        this.reload();
      });
  }

  openEditRoom(room: HostelRoom): void {
    this.editRoom = room;
    this.editForm = {
      hostelId: room.hostelId ?? '',
      roomNumber: room.roomNumber,
      block: room.block,
      floor: room.floor,
      capacity: room.capacity,
      roomType: room.type || 'double'
    };
  }

  saveEditRoom(): void {
    if (!this.editRoom || !this.editForm.roomNumber.trim() || !this.editForm.hostelId) return;
    const cap = Number(this.editForm.capacity);
    if (cap < this.editRoom.occupancy) {
      alert(this.translate.instant('hostel.capacityBelowOccupancy', { n: this.editRoom.occupancy }));
      return;
    }
    this.hostelService
      .updateRoom(this.editRoom.id, {
        hostelId: this.editForm.hostelId,
        roomNumber: this.editForm.roomNumber,
        block: this.editForm.block,
        floor: Number(this.editForm.floor),
        capacity: cap,
        roomType: this.editForm.roomType || (cap === 1 ? 'single' : cap === 2 ? 'double' : 'dormitory')
      })
      .subscribe(() => {
        this.editRoom = null;
        this.reload();
      });
  }

  openAllocate(room: HostelRoom): void {
    this.allocRoom = room;
    this.allocForm = { studentId: null, studentName: '' };
  }

  applyRoomAction(room: HostelRoom): void {
    const action = this.roomActionSelection[room.id];
    this.roomActionSelection[room.id] = '';
    if (!action) return;
    if (action === 'edit') {
      this.openEditRoom(room);
      return;
    }
    if (action === 'allocate') {
      if (room.occupancy < room.capacity) this.openAllocate(room);
      return;
    }
    if (!room.residents?.length) return;
    if (room.residents.length === 1) {
      const resident = room.residents[0];
      if (action === 'transfer') this.openTransfer(room, resident);
      else this.openVacate(room, resident);
      return;
    }
    this.residentActionPicker = { room, action };
    this.residentActionSelectedAllocationId = null;
  }

  confirmResidentActionSelection(): void {
    const picker = this.residentActionPicker;
    const allocationId = this.residentActionSelectedAllocationId;
    if (!picker || !allocationId) return;
    const resident = (picker.room.residents ?? []).find(r => r.allocationId === allocationId);
    if (!resident) return;
    this.residentActionPicker = null;
    this.residentActionSelectedAllocationId = null;
    if (picker.action === 'transfer') this.openTransfer(picker.room, resident);
    else this.openVacate(picker.room, resident);
  }

  syncAllocName(): void {
    const s = this.students.find(x => x.id === this.allocForm.studentId);
    this.allocForm.studentName = s ? `${s.firstName} ${s.lastName}`.trim() : '';
  }

  saveAllocate(): void {
    if (!this.allocRoom || this.allocForm.studentId == null) return;
    this.hostelService
      .allocate({
        roomId: this.allocRoom.id,
        studentId: this.allocForm.studentId,
        studentName: this.allocForm.studentName
      })
      .subscribe(() => {
        this.allocRoom = null;
        this.reload();
      });
  }

  openVacate(
    room: HostelRoom,
    r: { allocationId: string; studentName: string }
  ): void {
    this.vacateCtx = {
      allocationId: r.allocationId,
      studentName: r.studentName,
      roomNumber: room.roomNumber,
      hostelName: room.hostelName || undefined
    };
  }

  confirmVacate(): void {
    if (!this.vacateCtx) return;
    this.hostelService.vacate(this.vacateCtx.allocationId).subscribe(() => {
      this.vacateCtx = null;
      this.reload();
    });
  }

  get transferTargets(): HostelRoom[] {
    if (!this.transferCtx) return [];
    return (this.useServerPaging ? this.pagedRooms : this.roomsFull).filter(
      room => room.id !== this.transferCtx!.fromRoomId && room.occupancy < room.capacity
    );
  }

  openTransfer(room: HostelRoom, r: { allocationId: string; studentName: string }): void {
    this.transferCtx = {
      allocationId: r.allocationId,
      studentName: r.studentName,
      fromRoomId: room.id,
      fromRoomNumber: room.roomNumber,
    };
    this.transferForm = { targetRoomId: null, reason: '' };
  }

  confirmTransfer(): void {
    if (!this.transferCtx || !this.transferForm.targetRoomId) return;
    this.hostelService
      .transfer(this.transferCtx.allocationId, {
        targetRoomId: this.transferForm.targetRoomId,
        reason: this.transferForm.reason || undefined,
      })
      .subscribe(() => {
        this.transferCtx = null;
        this.reload();
      });
  }

  syncBillingStudentName(): void {
    const s = this.students.find(x => x.id === this.billingForm.studentId);
    this.billingForm.studentName = s ? `${s.firstName} ${s.lastName}`.trim() : '';
  }

  saveBillingProfile(): void {
    if (!this.canHostelBillingWrite || this.billingForm.studentId == null || !this.billingForm.feeStructureId) return;
    this.hostelService.upsertBillingProfile({
      studentId: this.billingForm.studentId,
      studentName: this.billingForm.studentName,
      feeStructureId: Number(this.billingForm.feeStructureId),
      billingCadence: this.billingForm.billingCadence,
      nextDueDate: this.billingForm.nextDueDate || null,
      autoInvoiceEnabled: true,
    }).subscribe(() => this.reloadBilling());
  }

  runBillingHook(): void {
    if (!this.canHostelBillingWrite) return;
    this.hostelService.triggerBillingRun({
      dueDate: this.billingForm.nextDueDate || undefined,
      note: 'Manual trigger from hostel console',
    }).subscribe(res => {
      this.billingRunInfo = `Run ${res.runRef}: queued ${res.queuedProfiles} profiles for ${res.dueDate}`;
      this.reloadBilling();
    });
  }

  syncGatePassStudentName(): void {
    const s = this.students.find(x => x.id === this.gatePassForm.studentId);
    this.gatePassForm.studentName = s ? `${s.firstName} ${s.lastName}`.trim() : '';
  }

  createGatePass(): void {
    if (!this.isAdmin || this.gatePassForm.studentId == null) return;
    this.hostelService.createGatePass({
      studentId: this.gatePassForm.studentId,
      studentName: this.gatePassForm.studentName,
      requestType: this.gatePassForm.requestType,
      reason: this.gatePassForm.reason,
      outAt: this.gatePassForm.outAt || undefined,
    }).subscribe(() => {
      this.gatePassForm.reason = '';
      this.reloadDailyOps();
    });
  }

  approveGatePass(id: string): void {
    this.hostelService.approveGatePass(id).subscribe(() => this.reloadDailyOps());
  }

  rejectGatePass(id: string): void {
    this.hostelService.rejectGatePass(id).subscribe(() => this.reloadDailyOps());
  }

  returnGatePass(id: string): void {
    this.hostelService.returnGatePass(id).subscribe(() => this.reloadDailyOps());
  }

  syncVisitorStudentName(): void {
    const s = this.students.find(x => x.id === this.visitorForm.studentId);
    this.visitorForm.studentName = s ? `${s.firstName} ${s.lastName}`.trim() : '';
  }

  createVisitor(): void {
    if (!this.canHostelVisitorWrite || this.visitorForm.studentId == null) return;
    this.hostelService.createVisitor({
      studentId: this.visitorForm.studentId,
      studentName: this.visitorForm.studentName,
      visitorName: this.visitorForm.visitorName,
      relationLabel: this.visitorForm.relationLabel,
      purpose: this.visitorForm.purpose,
    }).subscribe(() => {
      this.visitorForm.visitorName = '';
      this.visitorForm.relationLabel = '';
      this.visitorForm.purpose = '';
      this.reloadDailyOps();
    });
  }

  approveVisitor(id: string): void {
    this.hostelService.approveVisitor(id).subscribe(() => this.reloadDailyOps());
  }

  rejectVisitor(id: string): void {
    this.hostelService.rejectVisitor(id).subscribe(() => this.reloadDailyOps());
  }

  checkoutVisitor(id: string): void {
    this.hostelService.checkoutVisitor(id).subscribe(() => this.reloadDailyOps());
  }

  syncIncidentStudentName(): void {
    const s = this.students.find(x => x.id === this.incidentForm.studentId);
    this.incidentForm.studentName = s ? `${s.firstName} ${s.lastName}`.trim() : '';
  }

  createIncident(): void {
    if (!this.canHostelIncidentWrite) return;
    this.hostelService.createIncident({
      studentId: this.incidentForm.studentId ?? undefined,
      studentName: this.incidentForm.studentName || undefined,
      incidentType: this.incidentForm.incidentType || undefined,
      severity: this.incidentForm.severity || undefined,
      summary: this.incidentForm.summary || undefined,
    }).subscribe(() => {
      this.incidentForm.summary = '';
      this.reloadDailyOps();
    });
  }

  escalateIncident(id: string): void {
    this.hostelService.escalateIncident(id, { escalationLevel: 'LEVEL_1', note: 'Escalated from hostel desk' })
      .subscribe(() => this.reloadDailyOps());
  }

  resolveIncident(id: string): void {
    if (!this.canHostelIncidentWrite) return;
    this.hostelService.resolveIncident(id, {
      resolutionReason: this.incidentResolveReason || 'OTHER',
      note: this.incidentResolveNote || undefined,
    }).subscribe(() => {
      this.incidentResolveNote = '';
      this.reloadDailyOps();
      this.reloadHostelAnalytics();
    });
  }

  saveIncidentPolicy(): void {
    if (!this.canHostelApprovalWrite || !this.incidentPolicyForm.incidentType.trim()) return;
    this.hostelService.upsertIncidentPolicy({
      incidentType: this.incidentPolicyForm.incidentType.trim().toUpperCase(),
      severity: this.incidentPolicyForm.severity,
      slaMinutes: Number(this.incidentPolicyForm.slaMinutes),
      escalationAfterMinutes: Number(this.incidentPolicyForm.escalationAfterMinutes),
    }).subscribe(() => {
      this.incidentPolicyForm.incidentType = '';
      this.reloadDailyOps();
    });
  }

  loadParentPortalProfile(): void {
    if (this.portalSelectedChildId == null) return;
    this.hostelService.getParentPortalProfile(this.portalSelectedChildId).subscribe(p => (this.portalProfile = p));
  }
}
