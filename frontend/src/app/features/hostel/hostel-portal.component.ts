import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HostelBookingRequest, HostelPortalProfile, ParentFeeObligation, Student } from '../../core/models/models';
import { HostelService } from '../../core/services/hostel.service';
import { ParentService } from '../../core/services/parent.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hostel-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="hostel-portal-page" data-testid="hostel-portal-page">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'nav.hostel' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Hostel profile, booking requests, and dues visibility.</p>
        </div>
        <button class="btn-outline-erp btn-sm" type="button" (click)="reload()">Refresh</button>
      </div>

      <div class="erp-card mb-4" *ngIf="role === 'parent'">
        <label class="erp-label mb-1">Select child</label>
        <select class="erp-select" [(ngModel)]="selectedChildId" (ngModelChange)="onChildChange()">
          <option [ngValue]="null">Select</option>
          <option *ngFor="let c of children" [ngValue]="c.id">{{ c.firstName }} {{ c.lastName }}</option>
        </select>
      </div>

      <div class="erp-card mb-4" *ngIf="profile as p">
        <h4 class="erp-card-title mb-3">Hostel Snapshot</h4>
        <div class="row g-3">
          <div class="col-md-4"><strong>Student:</strong> {{ p.studentName }}</div>
          <div class="col-md-4"><strong>Hostel:</strong> {{ p.hostelName || '-' }}</div>
          <div class="col-md-4"><strong>Room:</strong> {{ p.roomNumber || '-' }}</div>
          <div class="col-md-4"><strong>Room Type:</strong> {{ p.roomType || '-' }}</div>
          <div class="col-md-4"><strong>Occupancy:</strong> {{ p.occupancyLabel || '-' }}</div>
          <div class="col-md-4"><strong>Gate pass:</strong> {{ p.activeGatePassStatus || '-' }}</div>
          <div class="col-md-4"><strong>Billing:</strong> {{ p.billingCadence || '-' }}</div>
          <div class="col-md-4"><strong>Next Due:</strong> {{ p.nextDueDate || '-' }}</div>
        </div>
      </div>

      <div class="erp-card mb-4" *ngIf="role === 'parent' && selectedChildId != null">
        <h4 class="erp-card-title mb-3">Book Hostel Room</h4>
        <div class="row g-2">
          <div class="col-md-3">
            <input class="erp-input" type="number" [(ngModel)]="bookingForm.preferredHostelId" placeholder="Preferred hostel id" />
          </div>
          <div class="col-md-3">
            <input class="erp-input" [(ngModel)]="bookingForm.preferredRoomType" placeholder="Preferred room type" />
          </div>
          <div class="col-md-4">
            <input class="erp-input" [(ngModel)]="bookingForm.requestNote" placeholder="Request note" />
          </div>
          <div class="col-md-2">
            <button class="btn-primary-erp btn-sm" type="button" (click)="submitBookingRequest()">Submit</button>
          </div>
        </div>
      </div>

      <div class="erp-card mb-4" *ngIf="role === 'parent'">
        <h4 class="erp-card-title mb-3">Booking Requests</h4>
        <table class="erp-table">
          <thead><tr><th>Student</th><th>Preferred</th><th>Status</th><th>Decision</th></tr></thead>
          <tbody>
            <tr *ngFor="let b of bookings">
              <td>{{ b.studentName || b.studentId }}</td>
              <td>{{ b.preferredHostelId || '-' }} / {{ b.preferredRoomType || '-' }}</td>
              <td>{{ b.status || '-' }}</td>
              <td>{{ b.decisionNote || '-' }}</td>
            </tr>
            <tr *ngIf="!bookings.length"><td colspan="4" class="text-muted">No booking requests yet.</td></tr>
          </tbody>
        </table>
      </div>

      <div class="erp-card" *ngIf="role === 'parent' && selectedChildId != null">
        <h4 class="erp-card-title mb-3">Hostel Fee Dues</h4>
        <table class="erp-table">
          <thead><tr><th>Fee Structure</th><th>Due Date</th><th>Status</th><th>Due</th><th>Action</th></tr></thead>
          <tbody>
            <tr *ngFor="let d of dues">
              <td>{{ d.feeStructureName }}</td>
              <td>{{ d.dueDate }}</td>
              <td>{{ d.status }}</td>
              <td>{{ d.payableNow | number:'1.0-2' }}</td>
              <td>
                <button
                  type="button"
                  class="btn-primary-erp btn-xs"
                  [disabled]="d.payableNow <= 0"
                  (click)="goToFeeCheckout(d)"
                >
                  Pay Now
                </button>
              </td>
            </tr>
            <tr *ngIf="!dues.length"><td colspan="5" class="text-muted">No due records.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class HostelPortalComponent implements OnInit {
  role: 'parent' | 'student' | 'other' = 'other';
  children: Student[] = [];
  selectedChildId: number | null = null;
  profile: HostelPortalProfile | null = null;
  bookings: HostelBookingRequest[] = [];
  dues: ParentFeeObligation[] = [];
  bookingForm = { preferredHostelId: null as number | null, preferredRoomType: '', requestNote: '' };

  constructor(
    private hostelService: HostelService,
    private parentService: ParentService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const r = this.auth.getNormalizedRole();
    this.role = r === 'parent' ? 'parent' : r === 'student' ? 'student' : 'other';
    this.reload();
  }

  reload(): void {
    if (this.role === 'parent') {
      this.parentService.getChildren().subscribe(rows => {
        this.children = rows || [];
        if (this.selectedChildId == null && this.children.length === 1) {
          this.selectedChildId = this.children[0].id;
        }
        this.onChildChange();
      });
      this.hostelService.listMyBookings().subscribe(rows => (this.bookings = rows || []));
      return;
    }
    if (this.role === 'student') {
      this.hostelService.getStudentPortalProfile().subscribe(p => (this.profile = p));
    }
  }

  onChildChange(): void {
    if (this.selectedChildId == null) {
      this.profile = null;
      this.dues = [];
      return;
    }
    this.hostelService.getParentPortalProfile(this.selectedChildId).subscribe(p => (this.profile = p));
    this.parentService.getChildFeeObligations(this.selectedChildId).subscribe(rows => (this.dues = rows || []));
  }

  submitBookingRequest(): void {
    if (this.selectedChildId == null) return;
    this.hostelService
      .createBookingRequest({
        studentId: this.selectedChildId,
        preferredHostelId: this.bookingForm.preferredHostelId ?? undefined,
        preferredRoomType: this.bookingForm.preferredRoomType || undefined,
        requestNote: this.bookingForm.requestNote || undefined,
      })
      .subscribe(() => {
        this.bookingForm = { preferredHostelId: null, preferredRoomType: '', requestNote: '' };
        this.hostelService.listMyBookings().subscribe(rows => (this.bookings = rows || []));
      });
  }

  goToFeeCheckout(due: ParentFeeObligation): void {
    if (this.selectedChildId == null || !due?.paymentId) return;
    this.router.navigate(['/app/parent/children'], {
      queryParams: {
        childId: this.selectedChildId,
        paymentId: due.paymentId,
        source: 'hostel-portal',
      },
    });
  }
}
