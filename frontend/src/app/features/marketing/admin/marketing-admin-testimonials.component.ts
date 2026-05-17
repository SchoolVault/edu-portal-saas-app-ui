import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketingService, MarketingTestimonial, MarketingTestimonialUpsertRequest } from '../../../core/services/marketing.service';

@Component({
  selector: 'app-marketing-admin-testimonials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">Marketing Testimonials</h3>
        <button class="btn btn-outline-primary" (click)="resetForm()">New Testimonial</button>
      </div>
      <div class="row g-3">
        <div class="col-lg-4">
          <form class="card card-body marketing-page-card" (ngSubmit)="save()">
            <input class="form-control mt-2" placeholder="Name" name="name" [(ngModel)]="form.name" required />
            <input class="form-control mt-2" placeholder="Designation" name="designation" [(ngModel)]="form.designation" />
            <input class="form-control mt-2" placeholder="Institution" name="institution" [(ngModel)]="form.institution" />
            <textarea class="form-control mt-2" rows="3" placeholder="Quote" name="quote" [(ngModel)]="form.quote" required></textarea>
            <input class="form-control mt-2" type="number" min="1" max="5" placeholder="Rating" name="rating" [(ngModel)]="form.rating" required />
            <input class="form-control mt-2" type="number" placeholder="Display order" name="displayOrder" [(ngModel)]="form.displayOrder" required />
            <input class="form-control mt-2" placeholder="Avatar URL" name="avatarUrl" [(ngModel)]="form.avatarUrl" />
            <div class="form-check mt-2">
              <input id="tFeatured" class="form-check-input" type="checkbox" name="featured" [(ngModel)]="form.featured" />
              <label class="form-check-label" for="tFeatured">Featured</label>
            </div>
            <div class="form-check mt-1">
              <input id="tPublished" class="form-check-input" type="checkbox" name="published" [(ngModel)]="form.published" />
              <label class="form-check-label" for="tPublished">Published</label>
            </div>
            <button class="btn btn-primary mt-3" type="submit">{{ editingId() ? 'Update' : 'Create' }}</button>
          </form>
        </div>
        <div class="col-lg-8">
          <div class="card marketing-page-card">
            <div class="card-body table-responsive">
              <table class="table table-sm align-middle">
                <thead><tr><th>Name</th><th>Quote</th><th>Rating</th><th></th></tr></thead>
                <tbody>
                  <tr *ngFor="let t of testimonials()">
                    <td><strong>{{ t.name }}</strong><div><small class="text-secondary">{{ t.designation }} · {{ t.institution }}</small></div></td>
                    <td class="text-secondary">{{ t.quote }}</td>
                    <td>{{ t.rating }}/5</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-primary me-1" (click)="edit(t)">Edit</button>
                      <button class="btn btn-sm btn-outline-danger" (click)="remove(t)">Delete</button>
                    </td>
                  </tr>
                  <tr *ngIf="testimonials().length === 0"><td colspan="4" class="text-center text-secondary py-4">No testimonials found.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class MarketingAdminTestimonialsComponent implements OnInit {
  readonly testimonials = signal<MarketingTestimonial[]>([]);
  readonly editingId = signal<string | null>(null);
  form: MarketingTestimonialUpsertRequest = this.empty();

  constructor(private readonly marketing: MarketingService) {}

  ngOnInit(): void {
    this.reload();
  }

  edit(item: MarketingTestimonial): void {
    this.editingId.set(item.id);
    this.form = {
      name: item.name,
      designation: item.designation ?? '',
      institution: item.institution ?? '',
      quote: item.quote,
      rating: item.rating,
      avatarUrl: item.avatarUrl ?? '',
      featured: item.featured,
      published: Boolean(item.published),
      displayOrder: Number(item.displayOrder ?? 10)
    };
  }

  save(): void {
    const id = this.editingId();
    const req$ = id
      ? this.marketing.updateAdminTestimonial(id, this.form)
      : this.marketing.createAdminTestimonial(this.form);
    req$.subscribe({
      next: () => {
        this.resetForm();
        this.reload();
      }
    });
  }

  remove(item: MarketingTestimonial): void {
    if (!confirm(`Delete testimonial from "${item.name}"?`)) {
      return;
    }
    this.marketing.deleteAdminTestimonial(item.id).subscribe({ next: () => this.reload() });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form = this.empty();
  }

  private reload(): void {
    this.marketing.listAdminTestimonials().subscribe({
      next: rows => this.testimonials.set(rows),
      error: () => this.testimonials.set([])
    });
  }

  private empty(): MarketingTestimonialUpsertRequest {
    return {
      name: '',
      designation: '',
      institution: '',
      quote: '',
      rating: 5,
      avatarUrl: '',
      featured: true,
      published: true,
      displayOrder: 10
    };
  }
}
