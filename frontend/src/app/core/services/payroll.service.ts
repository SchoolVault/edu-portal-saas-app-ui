import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  MOCK_PAYROLL_STRUCTURES,
  MOCK_PAYROLL_TEACHER_PAYMENT_DETAILS,
  MOCK_PAYSLIP_GENERATION_TEMPLATES,
} from '../mocks/payroll.mock-data';
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
      return of(
        MOCK_PAYROLL_STRUCTURES.map(s => ({
          ...s,
          allowances: s.allowances.map(a => ({ ...a })),
          deductions: s.deductions.map(d => ({ ...d })),
        }))
      );
    }
    return this.api.get<any[]>('/payroll/structures').pipe(map(list => list.map(s => this.normalizeStructure(s))));
  }

  getTeacherPaymentDetails(): Observable<TeacherPaymentDetails[]> {
    if (runtimeConfig.useMocks) {
      return of(MOCK_PAYROLL_TEACHER_PAYMENT_DETAILS.map(r => ({ ...r })));
    }
    return this.api.get<any[]>('/payroll/teachers/payment-details').pipe(
      map(list =>
        (list || []).map(r => ({
          teacherId: Number(r.teacherId),
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
      const templates = MOCK_PAYSLIP_GENERATION_TEMPLATES.map(t => ({ ...t }));
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
      let rows = this.mockPayslips.filter(p => p.teacherId === 1 || p.teacherName === 'Sarah Mitchell');
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

  initiateDisbursement(teacherId: number, month: string, year: number): Observable<SalaryDisburseResult> {
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
      .post<any>('/payroll/disburse/initiate', { teacherId, month, year: Number(year) })
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
      id: Number(s.id),
      teacherId: Number(s.teacherId),
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
      teacherId: Number(p.teacherId),
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
