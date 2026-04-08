import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HostelRoom } from '../../core/models/models';

@Component({
  selector: 'app-hostel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div data-testid="hostel-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div><h2 style="font-size: 24px; font-weight: 800;">Hostel Management</h2><p class="text-muted mb-0" style="font-size: 13px;">Room allocation and student management</p></div>
        <button class="btn-primary-erp btn-sm" data-testid="add-room-btn"><i class="bi bi-plus-lg"></i> Add Room</button>
      </div>
      <div class="row g-4 mb-4 animate-in animate-in-delay-1">
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(27,58,48,0.1); color: #1B3A30;"><i class="bi bi-house-fill"></i></div><div class="stat-value">{{ rooms.length }}</div><div class="stat-label">Total Rooms</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(5,150,105,0.1); color: #059669;"><i class="bi bi-check-circle-fill"></i></div><div class="stat-value">{{ totalOccupancy }}</div><div class="stat-label">Students Housed</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(217,119,6,0.1); color: #D97706;"><i class="bi bi-door-open-fill"></i></div><div class="stat-value">{{ totalCapacity - totalOccupancy }}</div><div class="stat-label">Available Beds</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(2,132,199,0.1); color: #0284C7;"><i class="bi bi-building"></i></div><div class="stat-value">{{ blocks.length }}</div><div class="stat-label">Blocks</div></div>
        </div>
      </div>
      <div class="erp-card animate-in animate-in-delay-2">
        <table class="erp-table" data-testid="hostel-rooms-table">
          <thead><tr><th>Room</th><th>Block</th><th>Floor</th><th>Type</th><th>Occupancy</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let room of rooms">
              <td><strong>{{ room.roomNumber }}</strong></td>
              <td>{{ room.block }}</td>
              <td>Floor {{ room.floor }}</td>
              <td style="text-transform: capitalize;">{{ room.type }}</td>
              <td>{{ room.occupancy }}/{{ room.capacity }}</td>
              <td><span class="badge-erp" [ngClass]="room.occupancy >= room.capacity ? 'badge-danger' : room.occupancy > 0 ? 'badge-warning' : 'badge-success'">
                {{ room.occupancy >= room.capacity ? 'Full' : room.occupancy > 0 ? 'Partial' : 'Empty' }}
              </span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class HostelComponent {
  rooms: HostelRoom[] = [
    { id: 'hr1', roomNumber: 'A-101', block: 'Block A', floor: 1, capacity: 4, occupancy: 4, type: 'dormitory', tenantId: 't1' },
    { id: 'hr2', roomNumber: 'A-102', block: 'Block A', floor: 1, capacity: 4, occupancy: 3, type: 'dormitory', tenantId: 't1' },
    { id: 'hr3', roomNumber: 'A-201', block: 'Block A', floor: 2, capacity: 2, occupancy: 2, type: 'double', tenantId: 't1' },
    { id: 'hr4', roomNumber: 'B-101', block: 'Block B', floor: 1, capacity: 1, occupancy: 1, type: 'single', tenantId: 't1' },
    { id: 'hr5', roomNumber: 'B-102', block: 'Block B', floor: 1, capacity: 2, occupancy: 0, type: 'double', tenantId: 't1' },
    { id: 'hr6', roomNumber: 'B-201', block: 'Block B', floor: 2, capacity: 3, occupancy: 2, type: 'triple', tenantId: 't1' },
  ];

  get totalCapacity(): number { return this.rooms.reduce((sum, r) => sum + r.capacity, 0); }
  get totalOccupancy(): number { return this.rooms.reduce((sum, r) => sum + r.occupancy, 0); }
  get blocks(): string[] { return [...new Set(this.rooms.map(r => r.block))]; }
}
