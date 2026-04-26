import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { TenantModuleGateService } from '../../core/services/tenant-module-gate.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { NAV_ITEMS, NavItem } from '../../core/config/app-constants';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed" [class.mobile-open]="mobileOpen" data-testid="sidebar-nav">
      <div class="sidebar-brand">
        <img src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/327dafae8a43bdee0145f51e32a05747aa82374ad2bb3b35ccfdb8cc1130bd22.png" alt="Logo">
        <h2>SchoolVault</h2>
      </div>
      <nav class="sidebar-nav">
        <ng-container *ngFor="let sectionKey of sectionKeys">
          <div class="sidebar-section-label">{{ sectionKey | translate }}</div>
          <a *ngFor="let item of getItemsBySection(sectionKey)"
             [routerLink]="item.route"
             routerLinkActive="active"
             class="nav-item"
             (click)="navigateRequest.emit()"
             [attr.data-testid]="'sidebar-nav-' + item.route.split('/').pop()">
            <i class="bi" [ngClass]="item.icon"></i>
            <span class="nav-label">{{ item.labelKey | translate }}</span>
          </a>
        </ng-container>
      </nav>
      <div style="padding: 12px 8px; border-top: 1px solid var(--clr-border); flex-shrink: 0;">
        <div class="nav-item" style="color: var(--clr-text-muted); font-size: 11px;" *ngIf="!collapsed">
          <i class="bi bi-shield-lock"></i>
          <span class="nav-label">{{ 'nav.footerTagline' | translate }}</span>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  /** When true, drawer is visible on small screens (controlled by layout). */
  @Input() mobileOpen = false;
  @Output() toggle = new EventEmitter<void>();
  @Output() navigateRequest = new EventEmitter<void>();

  filteredItems: NavItem[] = [];
  sectionKeys: string[] = [];

  constructor(
    private authService: AuthService,
    private moduleGate: TenantModuleGateService,
    private uiAccess: UiAccessService
  ) {}

  ngOnInit(): void {
    this.moduleGate.refresh().subscribe(() => this.rebuildNav());
  }

  private rebuildNav(): void {
    this.filteredItems = NAV_ITEMS.filter(item => this.uiAccess.isNavItemVisible(item));
    const sectionSet = new Set(this.filteredItems.map(i => i.sectionKey));
    this.sectionKeys = Array.from(sectionSet);
  }

  getItemsBySection(sectionKey: string): NavItem[] {
    return this.filteredItems.filter(i => i.sectionKey === sectionKey);
  }
}
