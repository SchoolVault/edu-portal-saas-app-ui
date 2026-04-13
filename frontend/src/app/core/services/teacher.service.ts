import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Teacher } from '../models/models';
import { MOCK_TEACHERS } from '../mocks/teachers.mock-data';
import { ApiService } from './api.service';
import { AcademicService } from './academic.service';
import { runtimeConfig } from '../config/runtime-config';

function normalizeStringList(raw: unknown): string[] {
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
    private academic: AcademicService
  ) {}

  getTeachers(): Observable<Teacher[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPage<any>('/teachers').pipe(map(p => p.content.map((teacher: any) => this.normalizeTeacher(teacher))));
    }
    return of(this.teachers.map(t => this.withHomeroomFromMockAcademic(t))).pipe(delay(400));
  }

  getTeacherById(id: number): Observable<Teacher | undefined> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any>('/teachers/' + id).pipe(map(teacher => this.normalizeTeacher(teacher)));
    }
    const t = this.teachers.find(x => x.id === id);
    return of(t ? this.withHomeroomFromMockAcademic(t) : undefined).pipe(delay(300));
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
