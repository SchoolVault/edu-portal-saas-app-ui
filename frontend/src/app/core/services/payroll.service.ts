import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  MOCK_PAYROLL_STRUCTURES,
  MOCK_PAYROLL_TEACHER_PAYMENT_DETAILS,
  MOCK_PAYSLIP_GENERATION_TEMPLATES,
} from '../mocks/payroll.mock-data';
import { Payslip, PayrollDisbursementAttempt, PayrollDisbursementSummary, SalaryStructure, TeacherPaymentDetails } from '../models/models';
import { ApiService, PageResp } from './api.service';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';
import { runtimeConfig } from '../config/runtime-config';

export interface SalaryDisburseResult {
  referenceId: string;
  amount: number;
  teacherName: string;
  message?: string;
  paymentMethod?: string;
}

export interface DemoFinanceResetResult {
  archivedFeeStructures: number;
  archivedFeeComponents: number;
  archivedFeePayments: number;
  archivedSalaryStructures: number;
  archivedSalaryComponents: number;
  archivedPayslips: number;
  archivedDisbursementAttempts: number;
  seededFeePayments: number;
  seededPayslips: number;
}

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private mockPayslips: Payslip[] = [];
  private mockDisbursementAttempts: PayrollDisbursementAttempt[] = [];

  constructor(private api: ApiService) {
    this.seedMockDemoData();
  }

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

  getStructuresPage(page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<SalaryStructure>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<SalaryStructure>('/payroll/structures/paged', { page, size }).pipe(
        map(p => ({ ...p, content: p.content.map(s => this.normalizeStructure(s)) }))
      );
    }
    return this.getStructures().pipe(map(all => sliceToPage(all, page, size)));
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

  listPayslipsPage(
    page = 0,
    size = DEFAULT_ERP_PAGE_SIZE,
    year?: number,
    month?: string
  ): Observable<PageResp<Payslip>> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<Payslip>('/payroll/payslips/paged', {
          page,
          size,
          year: year ?? undefined,
          month: month?.trim() || undefined,
        })
        .pipe(map(p => ({ ...p, content: p.content.map(x => this.normalizePayslip(x)) })));
    }
    return this.listPayslips(year, month).pipe(map(all => sliceToPage(all, page, size)));
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

  listMyPayslipsPage(
    page = 0,
    size = DEFAULT_ERP_PAGE_SIZE,
    year?: number,
    month?: string
  ): Observable<PageResp<Payslip>> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<Payslip>('/payroll/payslips/me/paged', {
          page,
          size,
          year: year ?? undefined,
          month: month?.trim() || undefined,
        })
        .pipe(map(p => ({ ...p, content: p.content.map(x => this.normalizePayslip(x)) })));
    }
    return this.listMyPayslips(year, month).pipe(map(all => sliceToPage(all, page, size)));
  }

  initiateDisbursement(
    teacherId: number,
    month: string,
    year: number,
    paymentMethod: string = 'NETBANKING'
  ): Observable<SalaryDisburseResult> {
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
      const pm = (paymentMethod || 'NETBANKING').toUpperCase();
      const attempt: PayrollDisbursementAttempt = {
        id: Date.now(),
        payslipId: Number(ps.id),
        teacherId,
        teacherName: ps.teacherName,
        periodLabel: `${month} ${year}`,
        amount: ps.netSalary,
        paymentMethod: pm,
        referenceId: pm + '-' + Date.now().toString(36).toUpperCase(),
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        lastMessage: 'Submitted to mock bank rail.',
      };
      this.mockDisbursementAttempts = [attempt, ...this.mockDisbursementAttempts];
      return of({
        referenceId: attempt.referenceId,
        amount: ps.netSalary,
        teacherName: ps.teacherName,
        paymentMethod: pm,
        message: 'Submitted to mock bank rail. Mark paid after settlement.'
      });
    }
    return this.api
      .post<any>('/payroll/disburse/initiate', {
        teacherId,
        month,
        year: Number(year),
        paymentMethod: (paymentMethod || 'NETBANKING').toUpperCase()
      })
      .pipe(
        map(r => ({
          referenceId: String(r.referenceId ?? ''),
          amount: Number(r.amount ?? 0),
          teacherName: String(r.teacherName ?? ''),
          message: r.message != null ? String(r.message) : undefined,
          paymentMethod: r.paymentMethod != null ? String(r.paymentMethod) : undefined
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

  getDisbursementAttemptsPage(
    page = 0,
    size = DEFAULT_ERP_PAGE_SIZE,
    status?: string
  ): Observable<PageResp<PayrollDisbursementAttempt>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<PayrollDisbursementAttempt>('/payroll/disburse/attempts/paged', {
        page,
        size,
        status: status?.trim() || undefined,
      }).pipe(map(p => ({ ...p, content: p.content.map(a => this.normalizeAttempt(a as any)) })));
    }
    let rows = [...this.mockDisbursementAttempts];
    if (status?.trim()) {
      const s = status.trim().toUpperCase();
      rows = rows.filter(r => r.status === s);
    }
    return of(sliceToPage(rows, page, size));
  }

  getDisbursementSummary(): Observable<PayrollDisbursementSummary> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<PayrollDisbursementSummary>('/payroll/disburse/summary').pipe(
        map((s: any) => ({
          totalAttempts: Number(s.totalAttempts ?? 0),
          submittedCount: Number(s.submittedCount ?? 0),
          completedCount: Number(s.completedCount ?? 0),
          failedCount: Number(s.failedCount ?? 0),
          submittedAmount: Number(s.submittedAmount ?? 0),
          completedAmount: Number(s.completedAmount ?? 0),
          failedAmount: Number(s.failedAmount ?? 0),
        }))
      );
    }
    const rows = this.mockDisbursementAttempts;
    const sum = (st: string) => rows.filter(r => r.status === st).reduce((t, r) => t + (r.amount || 0), 0);
    return of({
      totalAttempts: rows.length,
      submittedCount: rows.filter(r => r.status === 'SUBMITTED').length,
      completedCount: rows.filter(r => r.status === 'COMPLETED').length,
      failedCount: rows.filter(r => r.status === 'FAILED').length,
      submittedAmount: sum('SUBMITTED'),
      completedAmount: sum('COMPLETED'),
      failedAmount: sum('FAILED'),
    });
  }

  updateDisbursementStatus(attemptId: number, status: 'SUBMITTED' | 'COMPLETED' | 'FAILED', message?: string): Observable<PayrollDisbursementAttempt> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<any>(`/payroll/disburse/attempts/${attemptId}/status`, { status, message: message ?? null })
        .pipe(map(r => this.normalizeAttempt(r)));
    }
    const idx = this.mockDisbursementAttempts.findIndex(a => a.id === attemptId);
    if (idx < 0) {
      return throwError(() => new Error('Disbursement attempt not found'));
    }
    const row = { ...this.mockDisbursementAttempts[idx], status, completedAt: status === 'SUBMITTED' ? undefined : new Date().toISOString(), lastMessage: message || this.mockDisbursementAttempts[idx].lastMessage };
    this.mockDisbursementAttempts[idx] = row;
    const payslip = this.mockPayslips.find(p => Number(p.id) === row.payslipId);
    if (payslip) {
      if (status === 'COMPLETED') {
        payslip.status = 'paid';
        payslip.paymentDate = new Date().toISOString().slice(0, 10);
      } else if (status === 'FAILED') {
        payslip.status = 'generated';
        payslip.paymentDate = undefined;
      }
    }
    return of({ ...row });
  }

  resetDemoFinanceData(): Observable<DemoFinanceResetResult> {
    if (runtimeConfig.useMocks) {
      const previous = {
        archivedFeeStructures: MOCK_PAYROLL_STRUCTURES.length,
        archivedFeeComponents: MOCK_PAYROLL_STRUCTURES.reduce((sum, s) => sum + s.allowances.length + s.deductions.length, 0),
        archivedFeePayments: 0,
        archivedSalaryStructures: MOCK_PAYROLL_STRUCTURES.length,
        archivedSalaryComponents: MOCK_PAYROLL_STRUCTURES.reduce((sum, s) => sum + s.allowances.length + s.deductions.length, 0),
        archivedPayslips: this.mockPayslips.length,
        archivedDisbursementAttempts: this.mockDisbursementAttempts.length,
      };
      this.mockPayslips = [];
      this.mockDisbursementAttempts = [];
      this.seedMockDemoData();
      return of({
        ...previous,
        seededFeePayments: 8,
        seededPayslips: this.mockPayslips.length,
      });
    }
    return this.api.post<DemoFinanceResetResult>('/payroll/demo/reset-finance-data', {});
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

  private normalizeAttempt(a: any): PayrollDisbursementAttempt {
    return {
      id: Number(a.id),
      payslipId: Number(a.payslipId),
      teacherId: Number(a.teacherId),
      teacherName: a.teacherName ?? undefined,
      periodLabel: a.periodLabel ?? undefined,
      amount: Number(a.amount ?? 0),
      paymentMethod: String(a.paymentMethod ?? ''),
      referenceId: String(a.referenceId ?? ''),
      status: String(a.status ?? 'SUBMITTED').toUpperCase() as PayrollDisbursementAttempt['status'],
      createdAt: a.createdAt != null ? String(a.createdAt) : undefined,
      completedAt: a.completedAt != null ? String(a.completedAt) : undefined,
      lastMessage: a.lastMessage != null ? String(a.lastMessage) : undefined,
    };
  }

  private seedMockDemoData(): void {
    if (!runtimeConfig.useMocks || this.mockPayslips.length > 0 || this.mockDisbursementAttempts.length > 0) {
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.toLocaleString('en-US', { month: 'long' });
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = previousMonthDate.toLocaleString('en-US', { month: 'long' });
    const previousYear = previousMonthDate.getFullYear();

    const templates = MOCK_PAYSLIP_GENERATION_TEMPLATES;
    if (templates.length < 2) {
      return;
    }

    this.mockPayslips = templates.map((t, i) => ({
      id: `seed-ps-${i + 1}`,
      teacherId: t.teacherId,
      teacherName: t.teacherName,
      month: i % 2 === 0 ? currentMonth : previousMonth,
      year: i % 2 === 0 ? currentYear : previousYear,
      basicSalary: t.basic,
      totalAllowances: t.allow,
      totalDeductions: t.ded,
      netSalary: t.net,
      status: i === 1 ? 'paid' : 'generated',
      paymentDate: i === 1 ? now.toISOString().slice(0, 10) : undefined,
      tenantId: 't1',
    }));

    this.mockDisbursementAttempts = [
      {
        id: 90001,
        payslipId: Number(this.mockPayslips[0].id.replace(/\D/g, '')) || 1,
        teacherId: this.mockPayslips[0].teacherId,
        teacherName: this.mockPayslips[0].teacherName,
        periodLabel: `${this.mockPayslips[0].month} ${this.mockPayslips[0].year}`,
        amount: this.mockPayslips[0].netSalary,
        paymentMethod: 'NETBANKING',
        referenceId: 'NETBANKING-SEED90001',
        status: 'SUBMITTED',
        createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        lastMessage: 'Submitted to bank rail. Awaiting settlement.',
      },
      {
        id: 90002,
        payslipId: Number(this.mockPayslips[1].id.replace(/\D/g, '')) || 2,
        teacherId: this.mockPayslips[1].teacherId,
        teacherName: this.mockPayslips[1].teacherName,
        periodLabel: `${this.mockPayslips[1].month} ${this.mockPayslips[1].year}`,
        amount: this.mockPayslips[1].netSalary,
        paymentMethod: 'UPI',
        referenceId: 'UPI-SEED90002',
        status: 'FAILED',
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString(),
        lastMessage: 'Bank rejected transfer due to beneficiary account validation.',
      },
      {
        id: 90003,
        payslipId: Number(this.mockPayslips[1].id.replace(/\D/g, '')) || 2,
        teacherId: this.mockPayslips[1].teacherId,
        teacherName: this.mockPayslips[1].teacherName,
        periodLabel: `${this.mockPayslips[1].month} ${this.mockPayslips[1].year}`,
        amount: this.mockPayslips[1].netSalary,
        paymentMethod: 'NEFT',
        referenceId: 'NEFT-SEED90003',
        status: 'COMPLETED',
        createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(now.getTime() - 35 * 60 * 60 * 1000).toISOString(),
        lastMessage: 'Settled successfully.',
      },
    ];
  }
}
