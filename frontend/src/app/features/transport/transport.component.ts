import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransportRoute } from '../../core/models/models';

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="transport-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div><h2 style="font-size: 24px; font-weight: 800;">Transport</h2><p class="text-muted mb-0" style="font-size: 13px;">Manage transport routes and vehicles</p></div>
        <button class="btn-primary-erp btn-sm" data-testid="add-route-btn"><i class="bi bi-plus-lg"></i> Add Route</button>
      </div>
      <div class="row g-4 animate-in animate-in-delay-1">
        <div class="col-md-6 col-lg-4" *ngFor="let route of routes">
          <div class="erp-card" [attr.data-testid]="'route-card-' + route.id">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h4 style="font-size: 16px; font-weight: 700;">{{ route.name }}</h4>
              <span class="badge-erp badge-info">{{ route.assignedStudents }} students</span>
            </div>
            <div style="font-size: 13px; color: var(--clr-text-secondary); margin-bottom: 12px;">
              <div class="mb-1"><i class="bi bi-truck me-2"></i>{{ route.vehicleNumber }}</div>
              <div class="mb-1"><i class="bi bi-person me-2"></i>{{ route.driverName }}</div>
              <div><i class="bi bi-telephone me-2"></i>{{ route.driverPhone }}</div>
            </div>
            <div style="font-size: 12px; font-weight: 600; color: var(--clr-text-muted); margin-bottom: 8px;">STOPS ({{ route.stops.length }})</div>
            <div *ngFor="let stop of route.stops" class="d-flex align-items-center gap-2 mb-1" style="font-size: 12px;">
              <i class="bi bi-geo-alt-fill" style="color: var(--clr-accent);"></i>
              <span>{{ stop.name }}</span>
              <span class="ms-auto" style="color: var(--clr-text-muted);">{{ stop.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TransportComponent implements OnInit {
  routes: TransportRoute[] = [
    { id: 'tr1', name: 'Route A - North', vehicleNumber: 'BUS-001', driverName: 'Mark Stevens', driverPhone: '+1-555-0401', stops: [{ name: 'Main Gate', time: '7:00 AM', order: 1 }, { name: 'Oak Park', time: '7:15 AM', order: 2 }, { name: 'City Center', time: '7:30 AM', order: 3 }, { name: 'School', time: '7:50 AM', order: 4 }], assignedStudents: 42, tenantId: 't1' },
    { id: 'tr2', name: 'Route B - South', vehicleNumber: 'BUS-002', driverName: 'Paul Walker', driverPhone: '+1-555-0402', stops: [{ name: 'South Gate', time: '7:10 AM', order: 1 }, { name: 'River Road', time: '7:25 AM', order: 2 }, { name: 'Market Area', time: '7:40 AM', order: 3 }, { name: 'School', time: '7:55 AM', order: 4 }], assignedStudents: 38, tenantId: 't1' },
    { id: 'tr3', name: 'Route C - East', vehicleNumber: 'BUS-003', driverName: 'John Peters', driverPhone: '+1-555-0403', stops: [{ name: 'East Block', time: '7:05 AM', order: 1 }, { name: 'Lake View', time: '7:20 AM', order: 2 }, { name: 'School', time: '7:45 AM', order: 3 }], assignedStudents: 35, tenantId: 't1' },
  ];

  ngOnInit(): void {}
}
