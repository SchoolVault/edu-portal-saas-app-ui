import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketingService, MarketingVideo, MarketingVideoUpsertRequest } from '../../../core/services/marketing.service';

@Component({
  selector: 'app-marketing-admin-videos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 class="mb-0">Marketing Video Admin</h3>
          <small class="text-secondary">Manage landing-site video library from EduPortal admin.</small>
        </div>
        <button class="btn btn-outline-primary" (click)="resetForm()">New Video</button>
      </div>

      <div class="row g-3">
        <div class="col-lg-4">
          <form class="card card-body" (ngSubmit)="save()">
            <h6>{{ editingId() ? 'Edit Video' : 'Create Video' }}</h6>
            <input class="form-control mt-2" placeholder="Slug" name="slug" [(ngModel)]="form.slug" required />
            <input class="form-control mt-2" placeholder="Title" name="title" [(ngModel)]="form.title" required />
            <textarea class="form-control mt-2" rows="3" placeholder="Summary" name="summary" [(ngModel)]="form.summary"></textarea>
            <input class="form-control mt-2" placeholder="YouTube URL" name="youtubeUrl" [(ngModel)]="form.youtubeUrl" required />
            <input class="form-control mt-2" placeholder="Thumbnail URL" name="thumbnailUrl" [(ngModel)]="form.thumbnailUrl" />
            <input class="form-control mt-2" placeholder="Category" name="category" [(ngModel)]="form.category" />
            <input class="form-control mt-2" placeholder="Tags (comma separated)" name="tags" [(ngModel)]="form.tags" />
            <input class="form-control mt-2" type="number" placeholder="Display order" name="displayOrder" [(ngModel)]="form.displayOrder" required />
            <div class="form-check mt-2">
              <input id="featured" class="form-check-input" type="checkbox" name="featured" [(ngModel)]="form.featured" />
              <label class="form-check-label" for="featured">Featured</label>
            </div>
            <div class="form-check mt-1">
              <input id="published" class="form-check-input" type="checkbox" name="published" [(ngModel)]="form.published" />
              <label class="form-check-label" for="published">Published</label>
            </div>
            <button class="btn btn-primary mt-3" type="submit">{{ editingId() ? 'Update' : 'Create' }}</button>
          </form>
        </div>

        <div class="col-lg-8">
          <div class="card">
            <div class="card-body">
              <div class="d-flex gap-2 mb-3">
                <input class="form-control" placeholder="Search title/slug" [(ngModel)]="q" (keyup.enter)="reload()" />
                <button class="btn btn-outline-secondary" (click)="reload()">Search</button>
              </div>
              <div class="table-responsive">
                <table class="table table-sm align-middle">
                  <thead>
                    <tr><th>Title</th><th>Status</th><th>Order</th><th></th></tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let v of videos()">
                      <td>
                        <strong>{{ v.title }}</strong>
                        <div><small class="text-secondary">{{ v.slug }}</small></div>
                      </td>
                      <td>
                        <span class="badge text-bg-success" *ngIf="v.published">Published</span>
                        <span class="badge text-bg-secondary" *ngIf="!v.published">Draft</span>
                      </td>
                      <td>{{ v.displayOrder }}</td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary me-1" (click)="edit(v)">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" (click)="remove(v)">Delete</button>
                      </td>
                    </tr>
                    <tr *ngIf="videos().length === 0"><td colspan="4" class="text-center text-secondary py-4">No videos found.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class MarketingAdminVideosComponent implements OnInit {
  readonly videos = signal<MarketingVideo[]>([]);
  readonly editingId = signal<string | null>(null);
  q = '';
  form: MarketingVideoUpsertRequest = this.empty();

  constructor(private readonly marketing: MarketingService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.marketing.listAdminVideos({ q: this.q || undefined, page: 0, size: 50, sort: 'displayOrder,asc' }).subscribe({
      next: page => this.videos.set(page.content),
      error: () => this.videos.set([])
    });
  }

  edit(v: MarketingVideo): void {
    this.editingId.set(v.id);
    this.form = {
      slug: v.slug,
      title: v.title,
      summary: v.summary ?? '',
      youtubeUrl: v.youtubeUrl,
      thumbnailUrl: v.thumbnailUrl ?? '',
      category: v.category ?? '',
      tags: (v.tags ?? []).join(', '),
      featured: v.featured,
      published: v.published,
      displayOrder: v.displayOrder
    };
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form = this.empty();
  }

  save(): void {
    const payload: MarketingVideoUpsertRequest = { ...this.form, slug: this.form.slug.trim().toLowerCase() };
    const id = this.editingId();
    const req$ = id ? this.marketing.updateAdminVideo(id, payload) : this.marketing.createAdminVideo(payload);
    req$.subscribe({
      next: () => {
        this.resetForm();
        this.reload();
      }
    });
  }

  remove(v: MarketingVideo): void {
    if (!confirm(`Delete "${v.title}"?`)) {
      return;
    }
    this.marketing.deleteAdminVideo(v.id).subscribe({ next: () => this.reload() });
  }

  private empty(): MarketingVideoUpsertRequest {
    return {
      slug: '',
      title: '',
      summary: '',
      youtubeUrl: '',
      thumbnailUrl: '',
      category: '',
      tags: '',
      featured: false,
      published: true,
      displayOrder: 10
    };
  }
}
