import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketingLeadAdmin, MarketingService } from '../../../core/services/marketing.service';

@Component({
  selector: 'app-marketing-admin-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="container-fluid py-4">
      <h3 class="mb-3">Marketing Leads</h3>
      <div class="card marketing-page-card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let lead of leads()">
                  <td>
                    <strong>{{ lead.fullName }}</strong>
                    <div><small class="text-secondary">{{ lead.workEmail }} · {{ lead.phone || 'n/a' }}</small></div>
                  </td>
                  <td>{{ lead.source }}</td>
                  <td>
                    <select class="form-select form-select-sm" [ngModel]="lead.status" (ngModelChange)="onStatusChange(lead, $event)">
                      <option>NEW</option>
                      <option>QUALIFIED</option>
                      <option>CONTACTED</option>
                      <option>CLOSED</option>
                    </select>
                  </td>
                  <td>{{ lead.createdAt | date:'medium' }}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary" (click)="saveStatus(lead)">Save</button>
                  </td>
                </tr>
                <tr *ngIf="leads().length === 0"><td colspan="5" class="text-center text-secondary py-4">No leads found.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `
})
export class MarketingAdminLeadsComponent implements OnInit {
  readonly leads = signal<MarketingLeadAdmin[]>([]);
  private readonly pendingStatus = new Map<string, string>();

  constructor(private readonly marketing: MarketingService) {}

  ngOnInit(): void {
    this.reload();
  }

  onStatusChange(lead: MarketingLeadAdmin, status: string): void {
    this.pendingStatus.set(lead.id, status);
  }

  saveStatus(lead: MarketingLeadAdmin): void {
    const status = this.pendingStatus.get(lead.id) ?? lead.status;
    this.marketing.updateLeadStatus(lead.id, status).subscribe({
      next: () => {
        lead.status = status;
        this.pendingStatus.delete(lead.id);
      }
    });
  }

  private reload(): void {
    this.marketing.listAdminLeads().subscribe({
      next: data => this.leads.set(data.content ?? []),
      error: () => this.leads.set([])
    });
  }
}
