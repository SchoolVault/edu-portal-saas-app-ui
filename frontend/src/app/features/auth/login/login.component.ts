import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-container" data-testid="login-page">
      <div class="login-left">
        <div class="login-form-wrapper animate-in">
          <div class="login-logo">
            <img src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/327dafae8a43bdee0145f51e32a05747aa82374ad2bb3b35ccfdb8cc1130bd22.png" alt="SchoolVault">
            <h1>SchoolVault</h1>
          </div>
          <h2 class="login-title">Welcome back</h2>
          <p class="login-subtitle">Sign in to your school management portal</p>

          <div class="login-error" *ngIf="error" data-testid="login-error">
            <i class="bi bi-exclamation-circle"></i>
            {{ error }}
          </div>

          <form (ngSubmit)="onLogin()" data-testid="login-form">
            <div class="erp-form-group">
              <label class="erp-label">School Code</label>
              <input type="text" class="erp-input" [(ngModel)]="schoolCode" name="schoolCode"
                     placeholder="Enter school code (e.g., SCH001)" required data-testid="login-school-code">
            </div>
            <div class="erp-form-group">
              <label class="erp-label">Email Address</label>
              <input type="email" class="erp-input" [(ngModel)]="email" name="email"
                     placeholder="Enter your email" required data-testid="login-email">
            </div>
            <div class="erp-form-group">
              <label class="erp-label">Password</label>
              <div style="position: relative;">
                <input [type]="showPassword ? 'text' : 'password'" class="erp-input" [(ngModel)]="password" name="password"
                       placeholder="Enter your password" required style="padding-right: 44px;" data-testid="login-password">
                <button type="button" class="btn-icon" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%);"
                        (click)="showPassword = !showPassword">
                  <i class="bi" [ngClass]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
            </div>
            <button type="submit" class="btn-primary-erp" style="width: 100%; justify-content: center; padding: 12px;"
                    [disabled]="loading" data-testid="login-submit-button">
              <span class="spinner" *ngIf="loading"></span>
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <div class="demo-credentials" data-testid="demo-credentials">
            <h4>Demo Credentials</h4>
            <p>
              <strong>School Code:</strong> SCH001<br>
              <strong>Admin:</strong> admin&#64;school.com / admin123<br>
              <strong>Teacher:</strong> teacher&#64;school.com / teacher123<br>
              <strong>Parent:</strong> parent&#64;school.com / parent123<br>
              <strong>Super Admin:</strong> superadmin&#64;schoolvault.com / super123 / PLATFORM
            </p>
          </div>
          <p style="margin-top: 16px; font-size: 13px;">
            New school?
            <a routerLink="/signup">Create a workspace</a>
          </p>
        </div>
      </div>
      <div class="login-right">
        <img src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/39ade40298c502bd4785354a93143be5e368f4457b5f0aee6cbf5d84e82fe503.png" alt="">
        <div class="login-right-overlay">
          <div class="login-right-text">
            <h2>Enterprise School Management</h2>
            <p>Manage admissions, academics, fees, attendance and more - all from one unified platform designed for modern educational institutions.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  schoolCode = '';
  error = '';
  loading = false;
  showPassword = false;

  constructor(private authService: AuthService, private router: Router, private themeService: ThemeService) {
    if (this.authService.isAuthenticated()) {
      const role = this.authService.getRole();
      this.router.navigate([role === 'parent' ? '/app/parent' : role === 'super_admin' ? '/app/super-admin' : '/app/dashboard']);
    }
  }

  onLogin(): void {
    if (!this.email || !this.password || !this.schoolCode) {
      this.error = 'Please fill in all fields';
      return;
    }
    this.error = '';
    this.loading = true;
    this.authService.login({ email: this.email, password: this.password, schoolCode: this.schoolCode }).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigate([
          response.user.role === 'parent'
            ? '/app/parent'
            : response.user.role === 'super_admin'
              ? '/app/super-admin'
              : '/app/dashboard'
        ]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'Login failed. Please check your credentials.';
      }
    });
  }
}
