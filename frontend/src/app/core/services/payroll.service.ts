import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Payslip, SalaryStructure, TeacherPaymentDetails } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

export interface SalaryDisburseResult {
  referenceId: string;
  amount: number;
  teacherName: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private mockPayslips: Payslip[] = [];

  constructor(private api: ApiService) {}

  getStructures(): Observable<SalaryStructure[]> {
    if (runtimeConfig.useMocks) {
      return of([
        {
          id: 'ss1',
          teacherId: 't1',
          teacherName: 'Sarah Mitchell',
          basicSalary: 45000,
          allowances: [{ name: 'HRA', amount: 5000 }],
          deductions: [{ name: 'Tax', amount: 4500 }],
          netSalary: 45500,
          tenantId: 't1'
        },
        {
          id: 'ss2',
          teacherId: 't2',
          teacherName: "James O'Brien",
          basicSalary: 42000,
          allowances: [{ name: 'HRA', amount: 4800 }],
          deductions: [{ name: 'Tax', amount: 4000 }],
          netSalary: 42800,
          tenantId: 't1'
        }
      ]);
    }
    return this.api.get<any[]>('/payroll/structures').pipe(map(list => list.map(s => this.normalizeStructure(s))));
  }

  getTeacherPaymentDetails(): Observable<TeacherPaymentDetails[]> {
    if (runtimeConfig.useMocks) {
      return of([
        {
          teacherId: 't1',
          teacherName: 'Sarah Mitchell',
          monthlyNetSalary: 45500,
          bankAccountHolder: 'Sarah Mitchell',
          bankName: 'State Bank of India',
          bankAccountMasked: '****3210',
          bankIfsc: 'SBIN0001234',
          bankDetailsComplete: true
        },
        {
          teacherId: 't2',
          teacherName: "James O'Brien",
          monthlyNetSalary: 42800,
          bankAccountHolder: "James O'Brien",
          bankName: 'HDFC Bank',
          bankAccountMasked: '****8844',
          bankIfsc: 'HDFC0000999',
          bankDetailsComplete: true
        }
      ]);
    }
    return this.api.get<any[]>('/payroll/teachers/payment-details').pipe(
      map(list =>
        (list || []).map(r => ({
          teacherId: String(r.teacherId),
          teacherName: r.teacherName ?? '',
          monthlyNetSalary: Number(r.monthlyNetSalary ?? 0),
          bankAccountHolder: r.bankAccountHolder ?? undefined,
          bankName: r.bankName ?? undefined,
          bankAccountMasked: r.bankAccountMasked ?? undefined,
          bankIfsc: r.bankIfsc ?? undefined,
          bankDetailsComplete: !!r.bankDetailsComplete
        }))
      )
    );
  }

  generatePayslips(month: string, year: number): Observable<Payslip[]> {
    if (runtimeConfig.useMocks) {
      const m = month.trim();
      const y = Number(year);
      const key = (p: Payslip) => p.year === y && (p.month || '').trim().toLowerCase() === m.toLowerCase();
      const existingForPeriod = this.mockPayslips.filter(key);
      const templates = [
        {
          teacherId: 't1',
          teacherName: 'Sarah Mitchell',
          basic: 45000,
          allow: 5000,
          ded: 4500,
          net: 45500
        },
        {
          teacherId: 't2',
          teacherName: "James O'Brien",
          basic: 42000,
          allow: 4800,
          ded: 4000,
          net: 42800
        }
      ];
      const already = new Set(existingForPeriod.map(p => p.teacherId));
      const toAdd = templates.filter(t => !already.has(t.teacherId));
      if (!toAdd.length) {
        return throwError(() => new Error('Payslips already generated for this month. Refresh or pick another period.'));
      }
      const created: Payslip[] = toAdd.map((t, i) => ({
        id: 'ps' + Date.now() + i,
        teacherId: t.teacherId,
        teacherName: t.teacherName,
        month,
        year: y,
        basicSalary: t.basic,
        totalAllowances: t.allow,
        totalDeductions: t.ded,
        netSalary: t.net,
        status: 'generated',
        tenantId: 't1'
      }));
      this.mockPayslips = [...created, ...this.mockPayslips];
      return of(created);
    }
    return this.api.post<any[]>('/payroll/payslips/generate', { month, year }).pipe(map(list => list.map(p => this.normalizePayslip(p))));
  }

  listPayslips(year?: number, month?: string): Observable<Payslip[]> {
    if (runtimeConfig.useMocks) {
      let rows = [...this.mockPayslips];
      if (year != null) rows = rows.filter(p => p.year === Number(year));
      if (month?.trim()) {
        const m = month.trim().toLowerCase();
        rows = rows.filter(p => (p.month || '').trim().toLowerCase() === m);
      }
      return of(rows);
    }
    let q = '';
    if (year != null) q += `year=${year}`;
    if (month) q += (q ? '&' : '') + `month=${encodeURIComponent(month)}`;
    const path = q ? `/payroll/payslips?${q}` : '/payroll/payslips';
    return this.api.get<any[]>(path).pipe(map(list => list.map(p => this.normalizePayslip(p))));
  }

  listMyPayslips(year?: number, month?: string): Observable<Payslip[]> {
    if (runtimeConfig.useMocks) {
      let rows = this.mockPayslips.filter(p => p.teacherId === 't1' || p.teacherName === 'Sarah Mitchell');
      if (year != null) rows = rows.filter(p => p.year === Number(year));
      if (month?.trim()) {
        const m = month.trim().toLowerCase();
        rows = rows.filter(p => (p.month || '').trim().toLowerCase() === m);
      }
      return of(rows);
    }
    let q = '';
    if (year != null) q += `year=${year}`;
    if (month) q += (q ? '&' : '') + `month=${encodeURIComponent(month)}`;
    const path = q ? `/payroll/payslips/me?${q}` : '/payroll/payslips/me';
    return this.api.get<any[]>(path).pipe(map(list => list.map(p => this.normalizePayslip(p))));
  }

  initiateDisbursement(teacherId: string, month: string, year: number): Observable<SalaryDisburseResult> {
    if (runtimeConfig.useMocks) {
      const m = month.trim().toLowerCase();
      const ps = this.mockPayslips.find(
        p =>
          p.teacherId === teacherId &&
          p.year === Number(year) &&
          (p.month || '').trim().toLowerCase() === m &&
          p.status === 'generated'
      );
      if (!ps) {
        return throwError(
          () => new Error('No generated payslip for this teacher and month. Generate payslips first.')
        );
      }
      return of({
        referenceId: 'NEFT-' + Date.now().toString(36).toUpperCase(),
        amount: ps.netSalary,
        teacherName: ps.teacherName,
        message: 'Submitted to mock bank rail. Mark paid after settlement.'
      });
    }
    return this.api
      .post<any>('/payroll/disburse/initiate', { teacherId: Number(teacherId), month, year: Number(year) })
      .pipe(
        map(r => ({
          referenceId: String(r.referenceId ?? ''),
          amount: Number(r.amount ?? 0),
          teacherName: String(r.teacherName ?? ''),
          message: r.message != null ? String(r.message) : undefined
        }))
      );
  }

  markPayslipPaid(id: string): Observable<Payslip> {
    if (runtimeConfig.useMocks) {
      const p = this.mockPayslips.find(x => x.id === id);
      if (!p) return throwError(() => new Error('Payslip not found'));
      p.status = 'paid';
      p.paymentDate = new Date().toISOString().slice(0, 10);
      return of({ ...p });
    }
    return this.api.post<any>(`/payroll/payslips/${id}/mark-paid`, {}).pipe(map(p => this.normalizePayslip(p)));
  }

  downloadPayslipPdf(id: string): Observable<Blob> {
    if (runtimeConfig.useMocks) {
      return of(new Blob(['Mock payslip PDF for id ' + id], { type: 'application/pdf' }));
    }
    return this.api.getBlob(`/payroll/payslips/${id}/pdf`);
  }

  private normalizeStructure(s: any): SalaryStructure {
    const comps = s.components ?? [];
    const allowances = comps
      .filter((c: any) => String(c.type || '').toUpperCase() === 'ALLOWANCE')
      .map((c: any) => ({ name: c.name ?? 'Allowance', amount: Number(c.amount ?? 0) }));
    const deductions = comps
      .filter((c: any) => String(c.type || '').toUpperCase() === 'DEDUCTION')
      .map((c: any) => ({ name: c.name ?? 'Deduction', amount: Number(c.amount ?? 0) }));
    return {
      id: String(s.id),
      teacherId: String(s.teacherId),
      teacherName: s.teacherName ?? '',
      basicSalary: Number(s.basicSalary ?? 0),
      allowances,
      deductions,
      netSalary: Number(s.netSalary ?? 0),
      tenantId: s.tenantId ?? ''
    };
  }

  private normalizePayslip(p: any): Payslip {
    const st = String(p.status ?? 'GENERATED').toUpperCase();
    return {
      id: String(p.id),
      teacherId: String(p.teacherId),
      teacherName: p.teacherName ?? '',
      month: p.month ?? '',
      year: Number(p.year ?? 0),
      basicSalary: Number(p.basicSalary ?? 0),
      totalAllowances: Number(p.totalAllowances ?? 0),
      totalDeductions: Number(p.totalDeductions ?? 0),
      netSalary: Number(p.netSalary ?? 0),
      status: st === 'PAID' ? 'paid' : 'generated',
      paymentDate: p.paymentDate ? String(p.paymentDate).slice(0, 10) : undefined,
      tenantId: p.tenantId ?? ''
    };
  }
}
