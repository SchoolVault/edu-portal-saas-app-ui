import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketingFeature, MarketingFeatureUpsertRequest, MarketingService } from '../../../core/services/marketing.service';

@Component({
  selector: 'app-marketing-admin-features',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">Marketing Features</h3>
        <button class="btn btn-outline-primary" (click)="resetForm()">New Feature</button>
      </div>
      <div class="row g-3">
        <div class="col-lg-4">
          <form class="card card-body marketing-page-card" (ngSubmit)="save()">
            <input class="form-control mt-2" placeholder="Slug" name="slug" [(ngModel)]="form.slug" required />
            <input class="form-control mt-2" placeholder="Name" name="name" [(ngModel)]="form.name" required />
            <input class="form-control mt-2" placeholder="Category" name="category" [(ngModel)]="form.category" required />
            <textarea class="form-control mt-2" rows="2" placeholder="Short description" name="shortDescription" [(ngModel)]="form.shortDescription" required></textarea>
            <textarea class="form-control mt-2" rows="2" placeholder="Detailed description" name="detailedDescription" [(ngModel)]="form.detailedDescription"></textarea>
            <input class="form-control mt-2" placeholder="Highlights (pipe separated)" name="highlights" [(ngModel)]="form.highlights" />
            <input class="form-control mt-2" type="number" placeholder="Sort order" name="sortOrder" [(ngModel)]="form.sortOrder" required />
            <select class="form-select mt-2" name="status" [(ngModel)]="form.status"><option>LIVE</option><option>DRAFT</option><option>DISABLED</option></select>
            <div class="form-check mt-2">
              <input id="featureEnabled" class="form-check-input" type="checkbox" name="enabledForMarketing" [(ngModel)]="form.enabledForMarketing" />
              <label class="form-check-label" for="featureEnabled">Enabled for marketing</label>
            </div>
            <button class="btn btn-primary mt-3" type="submit">{{ editingId() ? 'Update' : 'Create' }}</button>
          </form>
        </div>
        <div class="col-lg-8">
          <div class="card marketing-page-card">
            <div class="card-body table-responsive">
              <table class="table table-sm align-middle">
                <thead><tr><th>Name</th><th>Category</th><th>Status</th><th>Order</th><th></th></tr></thead>
                <tbody>
                  <tr *ngFor="let f of features()">
                    <td><strong>{{ f.name }}</strong><div><small class="text-secondary">{{ f.slug }}</small></div></td>
                    <td>{{ f.category }}</td>
                    <td>{{ f.status || 'LIVE' }}</td>
                    <td>{{ f.sortOrder }}</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-primary me-1" (click)="edit(f)">Edit</button>
                      <button class="btn btn-sm btn-outline-danger" (click)="remove(f)">Delete</button>
                    </td>
                  </tr>
                  <tr *ngIf="features().length === 0"><td colspan="5" class="text-center text-secondary py-4">No features found.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class MarketingAdminFeaturesComponent implements OnInit {
  readonly features = signal<MarketingFeature[]>([]);
  readonly editingId = signal<string | null>(null);
  form: MarketingFeatureUpsertRequest = this.empty();

  constructor(private readonly marketing: MarketingService) {}

  ngOnInit(): void {
    this.reload();
  }

  edit(item: MarketingFeature): void {
    this.editingId.set(item.id ?? null);
    this.form = {
      slug: item.slug,
      name: item.name,
      category: item.category,
      shortDescription: item.shortDescription,
      detailedDescription: item.detailedDescription ?? '',
      highlights: (item.highlights ?? []).join('|'),
      enabledForMarketing: true,
      sortOrder: Number(item.sortOrder ?? 10),
      status: item.status ?? 'LIVE'
    };
  }

  save(): void {
    const id = this.editingId();
    const req$ = id
      ? this.marketing.updateAdminFeature(id, this.form)
      : this.marketing.createAdminFeature(this.form);
    req$.subscribe({
      next: () => {
        this.resetForm();
        this.reload();
      }
    });
  }

  remove(item: MarketingFeature): void {
    if (!item.id || !confirm(`Delete feature "${item.name}"?`)) {
      return;
    }
    this.marketing.deleteAdminFeature(item.id).subscribe({ next: () => this.reload() });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form = this.empty();
  }

  private reload(): void {
    this.marketing.listAdminFeatures().subscribe({
      next: rows => this.features.set(rows),
      error: () => this.features.set([])
    });
  }

  private empty(): MarketingFeatureUpsertRequest {
    return {
      slug: '',
      name: '',
      category: '',
      shortDescription: '',
      detailedDescription: '',
      highlights: '',
      enabledForMarketing: true,
      sortOrder: 10,
      status: 'LIVE'
    };
  }
}
