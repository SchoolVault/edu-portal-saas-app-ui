import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HostelBuilding, HostelRoom, Student } from '../../core/models/models';
import { HostelService, HostelStats } from '../../core/services/hostel.service';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { sliceToPage } from '../../core/utils/paginate';
import { runtimeConfig } from '../../core/config/runtime-config';

@Component({
  selector: 'app-hostel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ErpPaginationComponent, ErpI18nPhDirective],
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
                <button type="button" class="btn-outline-erp btn-xs" (click)="openEditRoom(room)">{{ 'hostel.edit' | translate }}</button>
                <button *ngIf="room.occupancy < room.capacity" type="button" class="btn-outline-erp btn-xs ms-1" (click)="openAllocate(room)">{{ 'hostel.bookAllocate' | translate }}</button>
                <ng-container *ngFor="let r of room.residents">
                  <button type="button" class="btn-outline-erp btn-xs ms-1" (click)="openVacate(room, r)">{{ 'hostel.vacate' | translate }}</button>
                </ng-container>
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
  roomModal = false;
  roomForm = { hostelId: '', roomNumber: '', block: '', floor: 1, capacity: 2, roomType: 'double' };
  allocRoom: HostelRoom | null = null;
  allocForm = { studentId: null as number | null, studentName: '' };
  vacateCtx: { allocationId: string; studentName: string; roomNumber: string; hostelName?: string } | null = null;
  editRoom: HostelRoom | null = null;
  editForm = { hostelId: '', roomNumber: '', block: '', floor: 1, capacity: 2, roomType: 'double' };

  private roomsReqSeq = 0;

  constructor(
    private hostelService: HostelService,
    private studentService: StudentService,
    private authService: AuthService,
    private translate: TranslateService
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
    this.isAdmin = (this.authService.getCurrentUser()?.role ?? '').toLowerCase() === 'admin';
    this.reload();
    this.studentService.getStudents().subscribe(s => (this.students = s));
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
}
