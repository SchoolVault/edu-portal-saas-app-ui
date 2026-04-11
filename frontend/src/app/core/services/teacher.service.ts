import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Teacher } from '../models/models';
import { MOCK_TEACHERS } from '../mocks/teachers.mock-data';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private teachers: Teacher[] = MOCK_TEACHERS.map(t => ({ ...t, subjects: [...t.subjects], classIds: [...t.classIds] }));

  private teachersSubject = new BehaviorSubject<Teacher[]>(this.teachers);

  constructor(private api: ApiService) {}

  getTeachers(): Observable<Teacher[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPage<any>('/teachers').pipe(map(p => p.content.map((teacher: any) => this.normalizeTeacher(teacher))));
    }
    return of([...this.teachers]).pipe(delay(400));
  }

  getTeacherById(id: number): Observable<Teacher | undefined> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any>('/teachers/' + id).pipe(map(teacher => this.normalizeTeacher(teacher)));
    }
    return of(this.teachers.find(t => t.id === id)).pipe(delay(300));
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
    const newTeacher: Teacher = { ...teacher, id: nextId };
    this.teachers = [newTeacher, ...this.teachers];
    this.teachersSubject.next(this.teachers);
    return of(newTeacher).pipe(delay(500));
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
      this.teachers[idx] = { ...this.teachers[idx], ...data };
      this.teachersSubject.next(this.teachers);
      return of(this.teachers[idx]).pipe(delay(400));
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

  importTeachersZip(file: File): Observable<Teacher[]> {
    if (!runtimeConfig.useMocks) {
      const formData = new FormData();
      formData.append('file', file);
      return this.api.postFormData<any[]>('/teachers/import', formData).pipe(
        map(teachers => teachers.map(teacher => this.normalizeTeacher(teacher)))
      );
    }
    return of([]).pipe(delay(300));
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
      salary: Number(teacher.salary ?? 0),
      status: (teacher.status ?? 'active') as Teacher['status'],
      userId: teacher.userId != null ? Number(teacher.userId) : undefined,
      libraryStaffRole: libNorm && ['assistant', 'librarian', 'head'].includes(libNorm) ? libNorm : undefined
    };
  }
}
