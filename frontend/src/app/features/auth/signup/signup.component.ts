import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-container">
      <div class="login-left">
        <div class="login-form-wrapper animate-in">
          <div class="login-logo">
            <h1>SchoolVault</h1>
          </div>
          <h2 class="login-title">Launch Your School ERP</h2>
          <p class="login-subtitle">Create a school workspace and provision the first admin account.</p>

          <div class="login-error" *ngIf="error">
            <i class="bi bi-exclamation-circle"></i>
            {{ error }}
          </div>

          <form (ngSubmit)="onSubmit()">
            <div class="erp-form-group">
              <label class="erp-label">School Name</label>
              <input class="erp-input" [(ngModel)]="form.schoolName" name="schoolName" required>
            </div>
            <div class="erp-form-group">
              <label class="erp-label">School Code</label>
              <input class="erp-input" [(ngModel)]="form.schoolCode" name="schoolCode" required>
            </div>
            <div class="erp-form-group">
              <label class="erp-label">Admin Name</label>
              <input class="erp-input" [(ngModel)]="form.adminName" name="adminName" required>
            </div>
            <div class="erp-form-group">
              <label class="erp-label">Admin Email</label>
              <input type="email" class="erp-input" [(ngModel)]="form.adminEmail" name="adminEmail" required>
            </div>
            <div class="erp-form-group">
              <label class="erp-label">Admin Password</label>
              <input type="password" class="erp-input" [(ngModel)]="form.adminPassword" name="adminPassword" required minlength="8">
            </div>
            <div class="erp-form-group">
              <label class="erp-label">Phone</label>
              <input class="erp-input" [(ngModel)]="form.phone" name="phone">
            </div>
            <div class="erp-form-group">
              <label class="erp-label">Address</label>
              <textarea class="erp-input" [(ngModel)]="form.address" name="address" rows="3"></textarea>
            </div>
            <button type="submit" class="btn-primary-erp" style="width: 100%; justify-content: center;" [disabled]="loading">
              <span class="spinner" *ngIf="loading"></span>
              {{ loading ? 'Creating Workspace...' : 'Create School Workspace' }}
            </button>
          </form>

          <p style="margin-top: 16px; font-size: 13px;">
            Already have a workspace?
            <a routerLink="/login">Sign in</a>
          </p>
        </div>
      </div>
      <div class="login-right">
        <div class="login-right-overlay">
          <div class="login-right-text">
            <h2>Multi-tenant onboarding</h2>
            <p>Create the tenant, school profile, and first admin in one controlled flow.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SignupComponent {
  form = {
    schoolName: '',
    schoolCode: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    phone: '',
    address: ''
  };
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router, private themeService: ThemeService) {}

  onSubmit(): void {
    this.error = '';
    this.loading = true;
    this.authService.onboardSchool(this.form).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/app/dashboard']);
      },
      error: err => {
        this.loading = false;
        this.error = err.message || 'Unable to create school workspace.';
      }
    });
  }
}
