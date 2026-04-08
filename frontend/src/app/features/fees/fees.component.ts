import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeeService } from '../../core/services/fee.service';
import { FeeStructure, FeePayment } from '../../core/models/models';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="fees-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Fee Management</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Manage fee structures and payments</p>
        </div>
      </div>

      <div class="erp-tabs animate-in">
        <button class="erp-tab" [class.active]="tab === 'structures'" (click)="tab = 'structures'" data-testid="tab-structures">Fee Structures</button>
        <button class="erp-tab" [class.active]="tab === 'payments'" (click)="tab = 'payments'" data-testid="tab-payments">Payments</button>
      </div>

      <div *ngIf="tab === 'structures'" class="animate-in">
        <div class="row g-4">
          <div class="col-md-6 col-lg-4" *ngFor="let fs of feeStructures">
            <div class="erp-card" [attr.data-testid]="'fee-structure-' + fs.id">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 style="font-size: 15px; font-weight: 700;">{{ fs.name }}</h4>
                <span style="font-size: 20px; font-weight: 800; color: var(--clr-primary); font-family: var(--font-heading);">\${{ fs.totalAmount | number }}</span>
              </div>
              <div style="font-size: 13px; color: var(--clr-text-secondary); margin-bottom: 12px;">{{ fs.className }}</div>
              <div *ngFor="let comp of fs.components" class="d-flex justify-content-between" style="padding: 6px 0; border-bottom: 1px solid var(--clr-border-light); font-size: 13px;">
                <span style="color: var(--clr-text-secondary);">{{ comp.name }}</span>
                <strong>\${{ comp.amount | number }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'payments'" class="animate-in">
        <div class="erp-card">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex gap-2">
              <select class="erp-select" style="width: 150px;" [(ngModel)]="statusFilter" (change)="filterPayments()">
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <table class="erp-table" data-testid="payments-table">
            <thead>
              <tr><th>Student</th><th>Amount</th><th>Paid</th><th>Due</th><th>Due Date</th><th>Status</th><th>Receipt</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of filteredPayments" [attr.data-testid]="'payment-row-' + p.id">
                <td><strong>{{ p.studentName }}</strong></td>
                <td>\${{ p.amount | number }}</td>
                <td style="color: var(--clr-success);">\${{ p.paidAmount | number }}</td>
                <td [style.color]="p.dueAmount > 0 ? 'var(--clr-danger)' : 'var(--clr-success)'">\${{ p.dueAmount | number }}</td>
                <td>{{ p.dueDate }}</td>
                <td>
                  <span class="badge-erp" [ngClass]="{'badge-success': p.status === 'paid', 'badge-warning': p.status === 'partial', 'badge-danger': p.status === 'overdue', 'badge-neutral': p.status === 'unpaid'}">
                    {{ p.status }}
                  </span>
                </td>
                <td>{{ p.receiptNumber || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class FeesComponent implements OnInit {
  tab = 'structures';
  feeStructures: FeeStructure[] = [];
  payments: FeePayment[] = [];
  filteredPayments: FeePayment[] = [];
  statusFilter = '';

  constructor(private feeService: FeeService) {}

  ngOnInit(): void {
    this.feeService.getFeeStructures().subscribe(fs => this.feeStructures = fs);
    this.feeService.getPayments().subscribe(p => { this.payments = p; this.filteredPayments = p; });
  }

  filterPayments(): void {
    this.filteredPayments = this.statusFilter ? this.payments.filter(p => p.status === this.statusFilter) : [...this.payments];
  }
}
