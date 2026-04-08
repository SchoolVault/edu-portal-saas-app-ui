import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NAV_ITEMS, NavItem } from '../../core/config/app-constants';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed" data-testid="sidebar-nav">
      <div class="sidebar-brand">
        <img src="https://static.prod-images.emergentagent.com/jobs/9a0eef39-d991-4ee9-b692-a0f34292613c/images/327dafae8a43bdee0145f51e32a05747aa82374ad2bb3b35ccfdb8cc1130bd22.png" alt="Logo">
        <h2>SchoolVault</h2>
      </div>
      <nav class="sidebar-nav">
        <ng-container *ngFor="let section of sections">
          <div class="sidebar-section-label">{{ section }}</div>
          <a *ngFor="let item of getItemsBySection(section)"
             [routerLink]="item.route"
             routerLinkActive="active"
             class="nav-item"
             [attr.data-testid]="'sidebar-nav-' + item.label.toLowerCase().replace(' ', '-')">
            <i class="bi" [ngClass]="item.icon"></i>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        </ng-container>
      </nav>
      <div style="padding: 12px 8px; border-top: 1px solid var(--clr-border); flex-shrink: 0;">
        <div class="nav-item" style="color: var(--clr-text-muted); font-size: 11px;" *ngIf="!collapsed">
          <i class="bi bi-shield-lock"></i>
          <span class="nav-label">Multi-Tenant SaaS ERP</span>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  filteredItems: NavItem[] = [];
  sections: string[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const role = this.authService.getRole() || 'admin';
    this.filteredItems = NAV_ITEMS.filter(item => item.roles.includes(role));
    const sectionSet = new Set(this.filteredItems.map(i => i.section || 'General'));
    this.sections = Array.from(sectionSet);
  }

  getItemsBySection(section: string): NavItem[] {
    return this.filteredItems.filter(i => (i.section || 'General') === section);
  }
}
