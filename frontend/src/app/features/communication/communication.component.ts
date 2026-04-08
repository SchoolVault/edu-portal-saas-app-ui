import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunicationService } from '../../core/services/communication.service';
import { Announcement } from '../../core/models/models';

@Component({
  selector: 'app-communication',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="communication-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Communication</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Announcements and messaging</p>
        </div>
        <button class="btn-primary-erp btn-sm" (click)="showCreate = true" data-testid="create-announcement-btn">
          <i class="bi bi-plus-lg"></i> New Announcement
        </button>
      </div>

      <div class="animate-in animate-in-delay-1">
        <div *ngFor="let a of announcements" class="erp-card mb-3" [attr.data-testid]="'announcement-' + a.id">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h4 style="font-size: 16px; font-weight: 700;">{{ a.title }}</h4>
            <span class="badge-erp badge-info">{{ a.targetAudience }}</span>
          </div>
          <p style="font-size: 14px; color: var(--clr-text-secondary); line-height: 1.7; margin-bottom: 12px;">{{ a.content }}</p>
          <div class="d-flex justify-content-between" style="font-size: 12px; color: var(--clr-text-muted);">
            <span><i class="bi bi-person me-1"></i>{{ a.author }} ({{ a.authorRole }})</span>
            <span><i class="bi bi-clock me-1"></i>{{ formatDate(a.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showCreate" (click)="showCreate = false">
        <div class="modal-content-erp" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>New Announcement</h3>
            <button class="btn-icon" (click)="showCreate = false"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <div class="erp-form-group"><label class="erp-label">Title</label><input type="text" class="erp-input" [(ngModel)]="newAnnouncement.title" data-testid="announcement-title-input"></div>
            <div class="erp-form-group"><label class="erp-label">Content</label><textarea class="erp-input erp-textarea" [(ngModel)]="newAnnouncement.content" data-testid="announcement-content-input"></textarea></div>
            <div class="erp-form-group">
              <label class="erp-label">Target Audience</label>
              <select class="erp-select" [(ngModel)]="newAnnouncement.targetAudience">
                <option value="all">All</option>
                <option value="teachers">Teachers Only</option>
                <option value="parents">Parents Only</option>
                <option value="class">Specific Class</option>
              </select>
            </div>
          </div>
          <div class="modal-footer-erp">
            <button class="btn-outline-erp" (click)="showCreate = false">Cancel</button>
            <button class="btn-primary-erp" (click)="create()" data-testid="submit-announcement-btn">Publish</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CommunicationComponent implements OnInit {
  announcements: Announcement[] = [];
  showCreate = false;
  newAnnouncement = { title: '', content: '', targetAudience: 'all' };

  constructor(private commService: CommunicationService) {}

  ngOnInit(): void {
    this.commService.getAnnouncements().subscribe(a => this.announcements = a);
  }

  create(): void {
    if (!this.newAnnouncement.title) return;
    const ann: Announcement = {
      id: 'a' + Date.now(), title: this.newAnnouncement.title, content: this.newAnnouncement.content,
      author: 'John Anderson', authorRole: 'Admin', targetAudience: this.newAnnouncement.targetAudience,
      createdAt: new Date().toISOString(), tenantId: 't1'
    };
    this.commService.addAnnouncement(ann).subscribe(a => {
      this.announcements = [a, ...this.announcements];
      this.showCreate = false;
      this.newAnnouncement = { title: '', content: '', targetAudience: 'all' };
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
