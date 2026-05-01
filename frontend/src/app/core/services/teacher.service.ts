import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, of } from 'rxjs';
import { delay, expand, map, reduce } from 'rxjs/operators';
import { Teacher } from '../models/models';
import { MOCK_TEACHERS } from '../mocks/teachers.mock-data';
import { ApiService, PageResp } from './api.service';
import { AcademicService } from './academic.service';
import { AuthService } from './auth.service';
import { runtimeConfig } from '../config/runtime-config';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sanitizeTeacherForColleaguePeerView, shouldApplyTeacherColleagueVisibility } from '../people/teacher-colleague-visibility';
import { sliceToPage } from '../utils/paginate';
import { subjectCatalogNamesEqual } from '../utils/subject-catalog-name';

function normalizeStringList(raw: unknown): string[] {
  if (typeof raw === 'string') {
    return raw
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
  if (!Array.isArray(raw)) return [];
  return raw.map((x: unknown) => String(x).trim()).filter(s => s.length > 0);
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private teachers: Teacher[] = MOCK_TEACHERS.map(t => ({
    ...t,
    subjects: [...t.subjects],
    classIds: [...(t.classIds ?? [])],
    homeroomClassNames: [...(t.homeroomClassNames ?? [])],
  }));

  private teachersSubject = new BehaviorSubject<Teacher[]>(this.teachers);

  constructor(
    private api: ApiService,
    private academic: AcademicService,
    private auth: AuthService
  ) {}

  /**
   * Paged teachers aligned with {@code GET /api/v1/teachers}.
   */
  getTeachersPage(opts: { page?: number; size?: number; search?: string; status?: string; subject?: string }): Observable<PageResp<Teacher>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    const q = opts.search?.trim() || '';
    const status = opts.status?.trim() || '';
    const subject = opts.subject?.trim() || '';
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<any>('/teachers', {
          page,
          size,
          search: q || undefined,
          status: status || undefined,
          subject: subject || undefined,
        })
        .pipe(
          map(p => ({
            ...p,
            content: p.content.map((t: any) => this.withAudienceVisibility(this.normalizeTeacher(t))),
          }))
        );
    }
    let rows = this.teachers.map(t => this.withHomeroomFromMockAcademic(t));
    if (q) {
      const ql = q.toLowerCase();
      rows = rows.filter(
        t =>
          `${t.firstName} ${t.lastName}`.toLowerCase().includes(ql) || (t.specialization || '').toLowerCase().includes(ql)
      );
    }
    if (status) {
      const statusNeedle = status.toLowerCase();
      rows = rows.filter(t => (t.status || '').toLowerCase() === statusNeedle);
    }
    if (subject) {
      rows = rows.filter(t => (t.subjects ?? []).some(s => subjectCatalogNamesEqual(s, subject)));
    }
    rows.sort((a, b) => a.firstName.localeCompare(b.firstName));
    return of(sliceToPage(rows, page, size)).pipe(
      map(p => ({ ...p, content: p.content.map(t => this.withAudienceVisibility(t)) })),
      delay(250)
    );
  }

  getStaffPage(opts: { page?: number; size?: number; search?: string; status?: string }): Observable<PageResp<Teacher>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    const q = opts.search?.trim() || '';
    const status = opts.status?.trim() || '';
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<any>('/teachers/staff', {
          page,
          size,
          search: q || undefined,
          status: status || undefined,
        })
        .pipe(
          map(p => ({
            ...p,
            content: p.content.map((t: any) => this.withAudienceVisibility(this.normalizeTeacher(t))),
          }))
        );
    }
    return this.getTeachersPage({ page, size, search: q }).pipe(
      map(p => ({
        ...p,
        content: p.content.filter(t => !!t.libraryStaffRole || (t.specialization || '').toLowerCase().includes('staff')),
      }))
    );
  }

  /** Full list for dropdowns; real API loads all pages in sequence. */
  getTeachers(): Observable<Teacher[]> {
    if (!runtimeConfig.useMocks) {
      return this.fetchAllTeachersFromApi(100);
    }
    return of(this.teachers.map(t => this.withAudienceVisibility(this.withHomeroomFromMockAcademic(t)))).pipe(delay(400));
  }

  private fetchAllTeachersFromApi(chunkSize: number): Observable<Teacher[]> {
    return this.getTeachersPage({ page: 0, size: chunkSize }).pipe(
      expand(resp =>
        resp.last || resp.content.length === 0 ? EMPTY : this.getTeachersPage({ page: resp.page + 1, size: chunkSize })
      ),
      reduce((acc, resp) => [...acc, ...resp.content], [] as Teacher[])
    );
  }

  getTeacherById(id: number): Observable<Teacher | undefined> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .get<any>('/teachers/' + id)
        .pipe(map(teacher => this.withAudienceVisibility(this.normalizeTeacher(teacher))));
    }
    const t = this.teachers.find(x => x.id === id);
    return of(t ? this.withAudienceVisibility(this.withHomeroomFromMockAcademic(t)) : undefined).pipe(delay(300));
  }

  addTeacher(teacher: Omit<Teacher, 'id'>): Observable<Teacher> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .post<Teacher>('/teachers', {
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          phone: teacher.phone,
          qualification: teacher.qualification,
          specialization: teacher.specialization,
          joinDate: teacher.joinDate,
          salary: teacher.salary,
          subjects: teacher.subjects
        })
        .pipe(map(created => this.normalizeTeacher(created)));
    }
    const nextId = this.teachers.reduce((m, t) => Math.max(m, t.id), 0) + 1;
    const newTeacher: Teacher = {
      ...(teacher as Teacher),
      id: nextId,
      classIds: [],
      homeroomClassNames: [],
    };
    this.teachers = [newTeacher, ...this.teachers];
    this.teachersSubject.next(this.teachers);
    return of(this.withHomeroomFromMockAcademic(newTeacher)).pipe(delay(500));
  }

  updateTeacher(id: number, data: Partial<Teacher>): Observable<Teacher> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .put<Teacher>('/teachers/' + id, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          qualification: data.qualification,
          specialization: data.specialization,
          joinDate: data.joinDate,
          salary: data.salary,
          subjects: data.subjects
        })
        .pipe(map(updated => this.normalizeTeacher(updated)));
    }
    const idx = this.teachers.findIndex(t => t.id === id);
    if (idx !== -1) {
      const { homeroomClassNames: _ignore, ...rest } = data as Partial<Teacher> & { homeroomClassNames?: string[] };
      this.teachers[idx] = { ...this.teachers[idx], ...rest };
      this.teachersSubject.next(this.teachers);
      return of(this.withHomeroomFromMockAcademic(this.teachers[idx])).pipe(delay(400));
    }
    return of(this.teachers[0]).pipe(delay(400));
  }

  deleteTeacher(id: number): Observable<boolean> {
    if (!runtimeConfig.useMocks) {
      return this.api.delete<any>('/teachers/' + id).pipe(map(() => true));
    }
    this.teachers = this.teachers.filter(t => t.id !== id);
    this.teachersSubject.next(this.teachers);
    return of(true).pipe(delay(300));
  }

  updateTeacherStatus(id: number, status: 'active' | 'inactive'): Observable<Teacher> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .patch<Teacher>(`/teachers/${id}/status?status=${encodeURIComponent(status)}`, {})
        .pipe(map(updated => this.normalizeTeacher(updated)));
    }
    const idx = this.teachers.findIndex(t => t.id === id);
    if (idx >= 0) {
      this.teachers[idx] = { ...this.teachers[idx], status };
      this.teachersSubject.next(this.teachers);
      return of(this.withHomeroomFromMockAcademic(this.teachers[idx])).pipe(delay(200));
    }
    return of(this.teachers[0]).pipe(delay(200));
  }

  private withAudienceVisibility(t: Teacher): Teacher {
    if (shouldApplyTeacherColleagueVisibility(this.auth.getNormalizedRole())) {
      return sanitizeTeacherForColleaguePeerView(t, this.auth.getCurrentUser()?.id);
    }
    return t;
  }

  /** Mock: homeroom labels always mirror in-memory school classes (class teacher assignment). */
  private withHomeroomFromMockAcademic(t: Teacher): Teacher {
    return {
      ...t,
      homeroomClassNames: this.academic.homeroomClassNamesForTeacher(t.id),
    };
  }

  private normalizeTeacher(teacher: any): Teacher {
    const lib = teacher.libraryStaffRole ?? teacher.library_staff_role;
    const libNorm =
      lib != null ? (String(lib).toLowerCase() as Teacher['libraryStaffRole']) : undefined;
    return {
      ...teacher,
      id: Number(teacher.id),
      tenantId: teacher.tenantId ?? '',
      phone: teacher.phone ?? '',
      qualification: teacher.qualification ?? '',
      specialization: teacher.specialization ?? '',
      joinDate: teacher.joinDate ?? '',
      subjects: teacher.subjects ?? [],
      classIds: (teacher.classIds ?? []).map((x: any) => Number(x)),
      homeroomClassNames: normalizeStringList(teacher.homeroomClassNames ?? teacher.homeroom_class_names),
      salary: Number(teacher.salary ?? 0),
      status: (teacher.status ?? 'active') as Teacher['status'],
      userId: teacher.userId != null ? Number(teacher.userId) : undefined,
      libraryStaffRole: libNorm && ['assistant', 'librarian', 'head'].includes(libNorm) ? libNorm : undefined
    };
  }
}
