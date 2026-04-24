import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { AuthService } from '../core/services/auth.service';
import { runtimeConfig } from '../core/config/runtime-config';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-layout">
      <div
        class="sidebar-backdrop"
        *ngIf="isMobileViewport && mobileNavOpen"
        (click)="closeMobileNav()"
        aria-hidden="true"></div>
      <app-sidebar
        [collapsed]="sidebarCollapsed"
        [mobileOpen]="isMobileViewport && mobileNavOpen"
        (toggle)="onSidebarToggle()"
        (navigateRequest)="closeMobileNav()"
        data-testid="app-sidebar">
      </app-sidebar>
      <div class="main-wrapper" [class.collapsed]="sidebarCollapsed && !isMobileViewport">
        <app-header
          [collapsed]="sidebarCollapsed && !isMobileViewport"
          (toggleSidebar)="onSidebarToggle()"
          data-testid="app-header">
        </app-header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebarCollapsed = false;
  mobileNavOpen = false;
  isMobileViewport = false;
  private navSub?: Subscription;

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.refreshViewport();
    if (!runtimeConfig.useMocks && this.auth.isAuthenticated()) {
      this.auth.syncProfileFromServer().subscribe({ error: () => void 0 });
    }
    this.navSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      if (this.isMobileViewport) {
        this.mobileNavOpen = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.refreshViewport();
  }

  private refreshViewport(): void {
    const next = typeof window !== 'undefined' && window.innerWidth <= 768;
    if (!next && this.isMobileViewport) {
      this.mobileNavOpen = false;
    }
    this.isMobileViewport = next;
  }

  onSidebarToggle(): void {
    if (this.isMobileViewport) {
      this.mobileNavOpen = !this.mobileNavOpen;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }
}
