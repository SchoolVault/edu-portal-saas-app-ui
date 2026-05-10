import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { AiAssistantComponent } from '../features/ai/ai-assistant.component';
import { AuthService } from '../core/services/auth.service';
import { TenantModuleGateService } from '../core/services/tenant-module-gate.service';
import { runtimeConfig } from '../core/config/runtime-config';
import { UiAccessService } from '../core/services/ui-access.service';
import { NAV_ITEMS } from '../core/config/app-constants';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, AiAssistantComponent],
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
        <app-ai-assistant *ngIf="showAiAssistant"></app-ai-assistant>
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
  showAiAssistant = false;
  private navSub?: Subscription;

  constructor(
    private router: Router,
    private auth: AuthService,
    private moduleGate: TenantModuleGateService,
    private uiAccess: UiAccessService
  ) {}

  ngOnInit(): void {
    this.refreshViewport();
    this.refreshAiAssistantVisibility();
    if (!runtimeConfig.useMocks && this.auth.isAuthenticated()) {
      this.auth.syncProfileFromServer().subscribe({ error: () => void 0 });
      this.moduleGate.refresh().subscribe({
        next: () => this.refreshAiAssistantVisibility(),
        error: () => this.refreshAiAssistantVisibility(),
      });
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

  private refreshAiAssistantVisibility(): void {
    const aiNavItem = NAV_ITEMS.find(i => i.route === '/app/ai-assistant');
    this.showAiAssistant = !!aiNavItem && this.uiAccess.isNavItemVisible(aiNavItem);
  }
}
