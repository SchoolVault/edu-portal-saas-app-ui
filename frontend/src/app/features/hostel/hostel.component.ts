import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HostelBuilding, HostelRoom, Student } from '../../core/models/models';
import { HostelService, HostelStats } from '../../core/services/hostel.service';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-hostel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="hostel-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Hostel</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Rooms by capacity (1–4 beds), live occupancy, allocations</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reload()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
          <button *ngIf="isAdmin" class="btn-primary-erp btn-sm" data-testid="add-room-btn" (click)="openRoomModal()"><i class="bi bi-plus-lg"></i> Add room</button>
        </div>
      </div>
      <div class="erp-card mb-4 animate-in" *ngIf="buildings.length">
        <h4 class="erp-card-title mb-3">Hostel buildings</h4>
        <p class="text-muted small mb-3">Real-time free beds per building. Add rooms against the correct hostel so capacity stays accurate.</p>
        <div class="row g-3">
          <div class="col-md-4" *ngFor="let b of buildings">
            <div class="p-3 rounded-3" style="border: 1px solid var(--clr-border); background: var(--clr-surface-muted);">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <strong>{{ b.name }}</strong>
                  <div class="small text-muted">{{ b.code }} <span *ngIf="b.genderScope">· {{ b.genderScope }}</span></div>
                </div>
                <span class="badge-erp badge-success">{{ b.availableBeds }} free beds</span>
              </div>
              <div class="small text-muted mt-2">{{ b.roomCount }} rooms</div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4 animate-in animate-in-delay-1">
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(27,58,48,0.1); color: #1B3A30;"><i class="bi bi-house-fill"></i></div><div class="stat-value">{{ stats.totalRooms }}</div><div class="stat-label">Rooms</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(5,150,105,0.1); color: #059669;"><i class="bi bi-check-circle-fill"></i></div><div class="stat-value">{{ stats.totalOccupancy }}</div><div class="stat-label">Occupied beds</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(217,119,6,0.1); color: #D97706;"><i class="bi bi-door-open-fill"></i></div><div class="stat-value">{{ stats.availableBeds }}</div><div class="stat-label">Available beds</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(2,132,199,0.1); color: #0284C7;"><i class="bi bi-building"></i></div><div class="stat-value">{{ stats.blocks }}</div><div class="stat-label">Blocks</div></div>
        </div>
      </div>
      <div class="erp-card animate-in animate-in-delay-2">
        <table class="erp-table" data-testid="hostel-rooms-table">
          <thead><tr><th>Hostel</th><th>Room</th><th>Block</th><th>Floor</th><th>Type / capacity</th><th>Occupancy</th><th>Residents</th><th *ngIf="isAdmin">Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let room of rooms">
              <td><span class="badge-erp badge-neutral">{{ room.hostelName || '—' }}</span></td>
              <td><strong>{{ room.roomNumber }}</strong></td>
              <td>{{ room.block }}</td>
              <td>Floor {{ room.floor }}</td>
              <td style="text-transform: capitalize;">{{ room.type }} ({{ room.capacity }} bed{{ room.capacity > 1 ? 's' : '' }})</td>
              <td>{{ room.occupancy }}/{{ room.capacity }}</td>
              <td>
                <span *ngFor="let r of room.residents" class="badge-erp badge-neutral me-1">{{ r.studentName }}</span>
                <span *ngIf="!room.residents?.length" class="text-muted">—</span>
              </td>
              <td *ngIf="isAdmin">
                <button type="button" class="btn-outline-erp btn-xs" (click)="openEditRoom(room)">Edit</button>
                <button *ngIf="room.occupancy < room.capacity" type="button" class="btn-outline-erp btn-xs ms-1" (click)="openAllocate(room)">Book / allocate</button>
                <ng-container *ngFor="let r of room.residents">
                  <button type="button" class="btn-outline-erp btn-xs ms-1" (click)="openVacate(room, r)">Vacate</button>
                </ng-container>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="roomModal" (click)="roomModal = false">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>Add room</h3><button class="btn-icon" (click)="roomModal = false"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <label class="erp-label">Hostel building</label>
          <select class="erp-select mb-2" [(ngModel)]="roomForm.hostelId">
            <option value="">Select hostel</option>
            <option *ngFor="let b of buildings" [value]="b.id">{{ b.name }} ({{ b.availableBeds }} beds free)</option>
          </select>
          <label class="erp-label">Room number</label>
          <input class="erp-input mb-2" [(ngModel)]="roomForm.roomNumber">
          <label class="erp-label">Block</label>
          <input class="erp-input mb-2" [(ngModel)]="roomForm.block">
          <label class="erp-label">Floor</label>
          <input class="erp-input mb-2" type="number" [(ngModel)]="roomForm.floor">
          <label class="erp-label">Capacity (beds)</label>
          <select class="erp-select mb-2" [(ngModel)]="roomForm.capacity">
            <option [ngValue]="1">1 (single)</option>
            <option [ngValue]="2">2 (double)</option>
            <option [ngValue]="3">3 (triple)</option>
            <option [ngValue]="4">4 (quad)</option>
          </select>
          <label class="erp-label">Room type label</label>
          <input class="erp-input" [(ngModel)]="roomForm.roomType" placeholder="single, double, ...">
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="roomModal = false">Cancel</button>
          <button class="btn-primary-erp" (click)="saveRoom()">Create</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="vacateCtx" (click)="vacateCtx = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>Confirm vacate</h3><button class="btn-icon" (click)="vacateCtx = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="mb-2"><strong>{{ vacateCtx.studentName }}</strong> will be removed from <strong>Room {{ vacateCtx.roomNumber }}</strong><span *ngIf="vacateCtx.hostelName"> · {{ vacateCtx.hostelName }}</span>.</p>
          <p class="small text-muted mb-0">This frees one bed for new allocations, same as the allocate flow.</p>
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" type="button" (click)="vacateCtx = null">Cancel</button>
          <button class="btn-primary-erp" type="button" (click)="confirmVacate()">Vacate bed</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="editRoom" (click)="editRoom = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>Edit room</h3><button class="btn-icon" (click)="editRoom = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2" *ngIf="editRoom as er">Capacity cannot be set below current occupancy ({{ er.occupancy }}).</p>
          <label class="erp-label">Hostel building</label>
          <select class="erp-select mb-2" [(ngModel)]="editForm.hostelId">
            <option value="">Select hostel</option>
            <option *ngFor="let b of buildings" [value]="b.id">{{ b.name }}</option>
          </select>
          <label class="erp-label">Room number</label>
          <input class="erp-input mb-2" [(ngModel)]="editForm.roomNumber">
          <label class="erp-label">Block</label>
          <input class="erp-input mb-2" [(ngModel)]="editForm.block">
          <label class="erp-label">Floor</label>
          <input class="erp-input mb-2" type="number" [(ngModel)]="editForm.floor">
          <label class="erp-label">Capacity (beds)</label>
          <select class="erp-select mb-2" [(ngModel)]="editForm.capacity">
            <option [ngValue]="1">1 (single)</option>
            <option [ngValue]="2">2 (double)</option>
            <option [ngValue]="3">3 (triple)</option>
            <option [ngValue]="4">4 (quad)</option>
          </select>
          <label class="erp-label">Room type label</label>
          <input class="erp-input" [(ngModel)]="editForm.roomType" placeholder="single, double, …">
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="editRoom = null">Cancel</button>
          <button class="btn-primary-erp" (click)="saveEditRoom()">Save</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="allocRoom" (click)="allocRoom = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>Allocate student</h3><button class="btn-icon" (click)="allocRoom = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <p class="small text-muted mb-2">Room {{ allocRoom.roomNumber }} · {{ allocRoom.occupancy }}/{{ allocRoom.capacity }} occupied</p>
          <label class="erp-label">Student</label>
          <select class="erp-select mb-2" [(ngModel)]="allocForm.studentId" (ngModelChange)="syncAllocName()">
            <option [ngValue]="null">Select</option>
            <option *ngFor="let s of students" [ngValue]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
          </select>
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="allocRoom = null">Cancel</button>
          <button class="btn-primary-erp" (click)="saveAllocate()">Allocate</button>
        </div>
      </div>
    </div>
  `
})
export class HostelComponent implements OnInit {
  buildings: HostelBuilding[] = [];
  rooms: HostelRoom[] = [];
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

  constructor(
    private hostelService: HostelService,
    private studentService: StudentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = (this.authService.getCurrentUser()?.role ?? '').toLowerCase() === 'admin';
    this.reload();
    this.studentService.getStudents().subscribe(s => this.students = s);
  }

  reload(): void {
    this.hostelService.listBuildings().subscribe(b => (this.buildings = b));
    this.hostelService.listRooms().subscribe(r => this.rooms = r);
    this.hostelService.stats().subscribe(s => this.stats = s);
  }

  openRoomModal(): void {
    this.roomForm = { hostelId: this.buildings[0]?.id ?? '', roomNumber: '', block: '', floor: 1, capacity: 2, roomType: 'double' };
    this.roomModal = true;
  }

  saveRoom(): void {
    if (!this.roomForm.roomNumber.trim() || !this.roomForm.hostelId) return;
    const cap = Number(this.roomForm.capacity);
    const typeLabel = this.roomForm.roomType || (cap === 1 ? 'single' : cap === 2 ? 'double' : cap === 3 ? 'triple' : 'quad');
    this.hostelService.createRoom({
      hostelId: this.roomForm.hostelId,
      roomNumber: this.roomForm.roomNumber,
      block: this.roomForm.block || 'Block A',
      floor: Number(this.roomForm.floor),
      capacity: cap,
      roomType: typeLabel
    }).subscribe(() => {
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
      alert(`Capacity must be at least ${this.editRoom.occupancy} (current occupancy).`);
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
    this.hostelService.allocate({
      roomId: this.allocRoom.id,
      studentId: this.allocForm.studentId,
      studentName: this.allocForm.studentName
    }).subscribe(() => {
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
