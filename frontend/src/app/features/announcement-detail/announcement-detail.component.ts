import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommunicationService } from '../../core/services/communication.service';
import { Announcement } from '../../core/models/models';

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-in p-4" style="max-width: 720px; margin: 0 auto;">
      <a routerLink="/app/inbox" class="text-decoration-none small mb-3 d-inline-block">&larr; Back to announcements</a>
      <div class="erp-card" *ngIf="ann">
        <div class="d-flex align-items-start gap-3 mb-3">
          <i class="bi bi-megaphone-fill" style="font-size: 28px; color: var(--clr-primary);"></i>
          <div class="flex-grow-1 min-w-0">
            <h2 style="font-size: 20px; font-weight: 800;">{{ ann.title }}</h2>
            <div class="text-muted small d-flex flex-wrap gap-2 align-items-center">
              <span><i class="bi bi-person me-1"></i>{{ ann.author || 'School' }}<span *ngIf="ann.authorRole"> ({{ ann.authorRole }})</span></span>
              <span><i class="bi bi-clock me-1"></i>{{ ann.createdAt | date: 'medium' }}</span>
            </div>
          </div>
        </div>
        <div style="font-size: 15px; line-height: 1.7; white-space: pre-wrap;">{{ ann.content }}</div>
      </div>
      <div class="erp-card text-muted" *ngIf="!loading && !ann">This notice was not found or is no longer available.</div>
      <div class="text-muted small py-4 text-center" *ngIf="loading">Loading…</div>
    </div>
  `
})
export class AnnouncementDetailComponent implements OnInit {
  ann: Announcement | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private comm: CommunicationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    this.comm.getAnnouncement(id).subscribe({
      next: a => {
        this.ann = a ? this.normalize(a) : null;
        this.loading = false;
      },
      error: () => {
        this.ann = null;
        this.loading = false;
      }
    });
  }

  private normalize(a: any): Announcement {
    return {
      id: String(a.id ?? ''),
      title: a.title ?? '',
      content: a.content ?? '',
      author: a.author ?? '',
      authorRole: a.authorRole ?? '',
      targetAudience: (a.targetAudience ?? 'ALL').toString().toLowerCase(),
      createdAt: a.createdAt ?? a.created_at ?? new Date().toISOString(),
      tenantId: String(a.tenantId ?? a.tenant_id ?? '')
    };
  }
}
