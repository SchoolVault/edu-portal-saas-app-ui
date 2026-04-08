import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payslip, SalaryStructure } from '../../core/models/models';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div data-testid="payroll-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div><h2 style="font-size: 24px; font-weight: 800;">Payroll</h2><p class="text-muted mb-0" style="font-size: 13px;">Salary structures and payslip generation</p></div>
        <button class="btn-primary-erp btn-sm" data-testid="generate-payslips-btn"><i class="bi bi-file-earmark-text"></i> Generate Payslips</button>
      </div>
      <div class="row g-4 mb-4 animate-in animate-in-delay-1">
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(27,58,48,0.1); color: #1B3A30;"><i class="bi bi-people-fill"></i></div><div class="stat-value">{{ salaryStructures.length }}</div><div class="stat-label">Active Staff</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(5,150,105,0.1); color: #059669;"><i class="bi bi-wallet-fill"></i></div><div class="stat-value">\${{ totalPayroll | number }}</div><div class="stat-label">Monthly Payroll</div></div>
        </div>
      </div>
      <div class="erp-card animate-in animate-in-delay-2">
        <h4 class="erp-card-title mb-3">Salary Structures</h4>
        <table class="erp-table" data-testid="salary-table">
          <thead><tr><th>Teacher</th><th>Basic Salary</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of salaryStructures">
              <td><strong>{{ s.teacherName }}</strong></td>
              <td>\${{ s.basicSalary | number }}</td>
              <td style="color: var(--clr-success);">+\${{ getAllowanceTotal(s) | number }}</td>
              <td style="color: var(--clr-danger);">-\${{ getDeductionTotal(s) | number }}</td>
              <td><strong>\${{ s.netSalary | number }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class PayrollComponent {
  salaryStructures: SalaryStructure[] = [
    { id: 'ss1', teacherId: 't1', teacherName: 'Sarah Mitchell', basicSalary: 45000, allowances: [{ name: 'HRA', amount: 5000 }, { name: 'Transport', amount: 3000 }], deductions: [{ name: 'Tax', amount: 4500 }, { name: 'Insurance', amount: 1500 }], netSalary: 47000, tenantId: 't1' },
    { id: 'ss2', teacherId: 't2', teacherName: "James O'Brien", basicSalary: 42000, allowances: [{ name: 'HRA', amount: 4500 }, { name: 'Transport', amount: 3000 }], deductions: [{ name: 'Tax', amount: 4000 }, { name: 'Insurance', amount: 1500 }], netSalary: 44000, tenantId: 't1' },
    { id: 'ss3', teacherId: 't3', teacherName: 'Priya Sharma', basicSalary: 44000, allowances: [{ name: 'HRA', amount: 5000 }, { name: 'Transport', amount: 3000 }], deductions: [{ name: 'Tax', amount: 4200 }, { name: 'Insurance', amount: 1500 }], netSalary: 46300, tenantId: 't1' },
    { id: 'ss4', teacherId: 't5', teacherName: 'Maria Torres', basicSalary: 48000, allowances: [{ name: 'HRA', amount: 5500 }, { name: 'Transport', amount: 3000 }], deductions: [{ name: 'Tax', amount: 5000 }, { name: 'Insurance', amount: 1500 }], netSalary: 50000, tenantId: 't1' },
    { id: 'ss5', teacherId: 't8', teacherName: 'Thomas Lee', basicSalary: 52000, allowances: [{ name: 'HRA', amount: 6000 }, { name: 'Transport', amount: 3000 }], deductions: [{ name: 'Tax', amount: 5500 }, { name: 'Insurance', amount: 1500 }], netSalary: 54000, tenantId: 't1' },
  ];

  get totalPayroll(): number { return this.salaryStructures.reduce((sum, s) => sum + s.netSalary, 0); }
  getAllowanceTotal(s: SalaryStructure): number { return s.allowances.reduce((sum, a) => sum + a.amount, 0); }
  getDeductionTotal(s: SalaryStructure): number { return s.deductions.reduce((sum, d) => sum + d.amount, 0); }
}
