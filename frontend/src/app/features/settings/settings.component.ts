import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="settings-page">
      <div class="mb-4 animate-in">
        <h2 style="font-size: 24px; font-weight: 800;">Settings</h2>
        <p class="text-muted mb-0" style="font-size: 13px;">School configuration and preferences</p>
      </div>
      <div class="erp-tabs animate-in">
        <button class="erp-tab" [class.active]="tab === 'general'" (click)="tab = 'general'">General</button>
        <button class="erp-tab" [class.active]="tab === 'branding'" (click)="tab = 'branding'">Branding</button>
        <button class="erp-tab" [class.active]="tab === 'roles'" (click)="tab = 'roles'">Roles & Permissions</button>
        <button class="erp-tab" [class.active]="tab === 'features'" (click)="tab = 'features'">Feature Toggles</button>
      </div>

      <div *ngIf="tab === 'general'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">School Information</h4>
        <div class="row g-3">
          <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">School Name</label><input type="text" class="erp-input" [(ngModel)]="schoolName" data-testid="school-name-input"></div></div>
          <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">School Code</label><input type="text" class="erp-input" value="SCH001" disabled></div></div>
          <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">Email</label><input type="email" class="erp-input" [(ngModel)]="schoolEmail"></div></div>
          <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">Phone</label><input type="text" class="erp-input" [(ngModel)]="schoolPhone"></div></div>
          <div class="col-12"><div class="erp-form-group"><label class="erp-label">Address</label><textarea class="erp-input erp-textarea" [(ngModel)]="schoolAddress" style="min-height: 80px;"></textarea></div></div>
        </div>
        <div class="d-flex justify-content-end mt-3"><button class="btn-primary-erp" data-testid="save-settings-btn">Save Changes</button></div>
      </div>

      <div *ngIf="tab === 'branding'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">Theme & Branding</h4>
        <div class="row g-3">
          <div class="col-md-6">
            <div class="erp-form-group"><label class="erp-label">Primary Color</label>
              <div class="d-flex gap-2 align-items-center">
                <input type="color" [(ngModel)]="primaryColor" style="width: 50px; height: 40px; border: 1px solid var(--clr-border); border-radius: var(--radius-md); cursor: pointer;">
                <input type="text" class="erp-input" [(ngModel)]="primaryColor" style="flex: 1;">
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="erp-form-group"><label class="erp-label">Accent Color</label>
              <div class="d-flex gap-2 align-items-center">
                <input type="color" [(ngModel)]="accentColor" style="width: 50px; height: 40px; border: 1px solid var(--clr-border); border-radius: var(--radius-md); cursor: pointer;">
                <input type="text" class="erp-input" [(ngModel)]="accentColor" style="flex: 1;">
              </div>
            </div>
          </div>
        </div>
        <div class="d-flex justify-content-end mt-3"><button class="btn-primary-erp">Apply Branding</button></div>
      </div>

      <div *ngIf="tab === 'roles'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">Roles & Permissions</h4>
        <table class="erp-table">
          <thead><tr><th>Role</th><th>Description</th><th>Users</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td><strong>Admin</strong></td><td>Full system access</td><td>1</td><td><span class="badge-erp badge-success">Active</span></td></tr>
            <tr><td><strong>Teacher</strong></td><td>Academics, attendance, grades</td><td>8</td><td><span class="badge-erp badge-success">Active</span></td></tr>
            <tr><td><strong>Parent</strong></td><td>View child info, fees, communication</td><td>12</td><td><span class="badge-erp badge-success">Active</span></td></tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="tab === 'features'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">Feature Toggles</h4>
        <p style="font-size: 13px; color: var(--clr-text-muted); margin-bottom: 20px;">Enable or disable modules for your school</p>
        <div *ngFor="let feat of features" class="d-flex justify-content-between align-items-center py-3" style="border-bottom: 1px solid var(--clr-border-light);">
          <div>
            <div style="font-weight: 600;">{{ feat.name }}</div>
            <div style="font-size: 12px; color: var(--clr-text-muted);">{{ feat.description }}</div>
          </div>
          <label style="position: relative; display: inline-block; width: 48px; height: 26px; cursor: pointer;">
            <input type="checkbox" [(ngModel)]="feat.enabled" style="opacity: 0; width: 0; height: 0;">
            <span style="position: absolute; inset: 0; background: var(--clr-border); border-radius: 13px; transition: 0.3s;" [style.background]="feat.enabled ? 'var(--clr-success)' : 'var(--clr-border)'">
              <span style="position: absolute; left: 3px; top: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: 0.3s;" [style.transform]="feat.enabled ? 'translateX(22px)' : 'translateX(0)'"></span>
            </span>
          </label>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
  tab = 'general';
  schoolName = 'SchoolVault Academy';
  schoolEmail = 'info@schoolvault.edu';
  schoolPhone = '+1-555-0100';
  schoolAddress = '123 Education Lane, Knowledge City, KS 12345';
  primaryColor = '#1B3A30';
  accentColor = '#C05C3D';
  features = [
    { name: 'Transport Module', description: 'Manage school transport routes and vehicles', enabled: true },
    { name: 'Library Module', description: 'Book catalog and circulation management', enabled: true },
    { name: 'Hostel Module', description: 'Hostel room allocation and management', enabled: true },
    { name: 'Payroll Module', description: 'Teacher salary and payslip management', enabled: true },
    { name: 'Document Management', description: 'Upload and manage school documents', enabled: true },
    { name: 'Audit Trail', description: 'Track all system actions and changes', enabled: true },
    { name: 'SMS Notifications', description: 'Send SMS alerts to parents', enabled: false },
    { name: 'Online Payments', description: 'Accept fee payments online', enabled: false },
  ];
}
