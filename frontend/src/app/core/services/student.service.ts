import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, of } from 'rxjs';
import { delay, expand, map, reduce } from 'rxjs/operators';
import { PromotionResult, Student } from '../models/models';
import { MOCK_STUDENTS } from '../mocks/students.mock-data';
import { ApiService, PageResp } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private students: Student[] = MOCK_STUDENTS.map(s => ({ ...s }));

  private studentsSubject = new BehaviorSubject<Student[]>(this.students);

  constructor(private api: ApiService) {}

  /**
   * Paged students aligned with {@code GET /api/v1/students} (filters + totalElements).
   * Mock path returns the same {@link PageResp} shape for UI parity.
   */
  getStudentsPage(opts: {
    page?: number;
    size?: number;
    classId?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    direction?: string;
  }): Observable<PageResp<Student>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<any>('/students', {
          page,
          size,
          classId: opts.classId,
          status: opts.status?.trim() ? opts.status.trim().toUpperCase() : undefined,
          search: opts.search?.trim() || undefined,
          sortBy: opts.sortBy ?? 'firstName',
          direction: opts.direction ?? 'asc',
        })
        .pipe(map(p => ({ ...p, content: p.content.map((s: any) => this.normalizeStudent(s)) })));
    }
    return this.mockStudentsPage(opts, page, size);
  }

  /**
   * Full student list for dropdowns and legacy screens. With real API, loads all pages in sequence (chunked).
   */
  getStudents(): Observable<Student[]> {
    if (!runtimeConfig.useMocks) {
      return this.fetchAllStudentsFromApi(250);
    }
    return of([...this.students]).pipe(delay(400));
  }

  private fetchAllStudentsFromApi(chunkSize: number): Observable<Student[]> {
    return this.getStudentsPage({ page: 0, size: chunkSize, sortBy: 'firstName', direction: 'asc' }).pipe(
      expand(resp =>
        resp.last || resp.content.length === 0 ? EMPTY : this.getStudentsPage({ page: resp.page + 1, size: chunkSize, sortBy: 'firstName', direction: 'asc' })
      ),
      reduce((acc, resp) => [...acc, ...resp.content], [] as Student[])
    );
  }

  private mockStudentsPage(
    opts: { classId?: number; status?: string; search?: string; sortBy?: string; direction?: string },
    page: number,
    size: number
  ): Observable<PageResp<Student>> {
    let rows = [...this.students];
    const q = opts.search?.trim().toLowerCase() || '';
    if (q) {
      rows = rows.filter(
        s =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q) ||
          (s.admissionNumber || '').toLowerCase().includes(q)
      );
    }
    if (opts.classId != null && opts.classId > 0) {
      rows = rows.filter(s => s.classId === opts.classId);
    }
    if (opts.status?.trim()) {
      const st = opts.status.trim().toLowerCase();
      rows = rows.filter(s => s.status === st);
    }
    const field = opts.sortBy === 'classId' || opts.sortBy === 'className' ? 'className' : opts.sortBy || 'firstName';
    const asc = (opts.direction ?? 'asc').toLowerCase() !== 'desc';
    rows.sort((a: any, b: any) => {
      const va = (a[field]?.toLowerCase?.() ?? a[field]) as string;
      const vb = (b[field]?.toLowerCase?.() ?? b[field]) as string;
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });
    return of(sliceToPage(rows, page, size)).pipe(delay(250));
  }

  getStudentById(id: number): Observable<Student | undefined> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any>('/students/' + id).pipe(map(student => this.normalizeStudent(student)));
    }
    return of(this.students.find(s => s.id === id)).pipe(delay(300));
  }

  addStudent(student: Omit<Student, 'id'>): Observable<Student> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<any>('/students', this.toCreatePayload(student)).pipe(map(created => this.normalizeStudent(created)));
    }
    const nextId = Math.max(0, ...this.students.map(s => s.id)) + 1;
    const newStudent: Student = { ...student, id: nextId };
    this.students = [newStudent, ...this.students];
    this.studentsSubject.next(this.students);
    return of(newStudent).pipe(delay(500));
  }

  updateStudent(id: number, data: Partial<Student>): Observable<Student> {
    if (!runtimeConfig.useMocks) {
      return this.api.put<any>('/students/' + id, this.toUpdatePayload(data)).pipe(map(student => this.normalizeStudent(student)));
    }
    const idx = this.students.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.students[idx] = { ...this.students[idx], ...data };
      this.studentsSubject.next(this.students);
      return of(this.students[idx]).pipe(delay(400));
    }
    return of(this.students[0]).pipe(delay(400));
  }

  deleteStudent(id: number): Observable<boolean> {
    if (!runtimeConfig.useMocks) {
      return this.api.delete<any>('/students/' + id).pipe(map(() => true));
    }
    this.students = this.students.filter(s => s.id !== id);
    this.studentsSubject.next(this.students);
    return of(true).pipe(delay(300));
  }

  getStudentsByClass(classId: number): Observable<Student[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>('/students/class/' + classId).pipe(map(students => students.map(student => this.normalizeStudent(student))));
    }
    return of(this.students.filter(s => s.classId === classId)).pipe(delay(300));
  }

  getStudentsByClassAndSection(classId: number, sectionId: number): Observable<Student[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>(`/students/class/${classId}/section/${sectionId}`).pipe(
        map(students => students.map(student => this.normalizeStudent(student)))
      );
    }
    const activeInClass = this.students.filter(s => s.classId === classId && s.status === 'active');
    if (sectionId === 0) {
      const whole = activeInClass.filter(s => !s.sectionId || s.sectionId === 0);
      return of(whole.length ? whole : activeInClass).pipe(delay(300));
    }
    return of(activeInClass.filter(s => s.sectionId === sectionId)).pipe(delay(300));
  }

  /**
   * Mock only: move selected students to target class/section (same shape as academic promotion execute).
   * Keeps roster in sync with {@link AcademicService} preview/execute when useMocks is true.
   */
  applyPromotionInMemory(
    sourceClassId: number,
    targetClassId: number,
    studentIds: number[],
    targetSectionId: number | null | undefined,
    targetClassName: string,
    targetSectionName: string
  ): Observable<PromotionResult> {
    if (!runtimeConfig.useMocks) {
      throw new Error('applyPromotionInMemory is mock-only');
    }
    const idSet = new Set(studentIds);
    let n = 0;
    this.students = this.students.map(s => {
      if (!idSet.has(s.id) || s.classId !== sourceClassId || s.status !== 'active') {
        return s;
      }
      n++;
      return {
        ...s,
        classId: targetClassId,
        className: targetClassName,
        sectionId: targetSectionId ?? 0,
        sectionName: targetSectionId ? targetSectionName : '',
      };
    });
    this.studentsSubject.next(this.students);
    return of({
      promotedCount: n,
      targetClassName,
      targetSectionName: targetSectionName || '',
    }).pipe(delay(400));
  }

  private normalizeStudent(student: any): Student {
    return {
      ...student,
      id: Number(student.id),
      classId: student.classId != null ? Number(student.classId) : 0,
      sectionId: student.sectionId != null ? Number(student.sectionId) : 0,
      parentId: student.parentId != null ? Number(student.parentId) : 0,
      parentUserId: student.parentUserId != null ? Number(student.parentUserId) : undefined,
      tenantId: student.tenantId ?? '',
      status: (student.status ?? 'active') as Student['status'],
      dateOfBirth: student.dateOfBirth ?? '',
      admissionDate: student.admissionDate ?? '',
      email: student.email ?? '',
      phone: student.phone ?? '',
      bloodGroup: student.bloodGroup ?? '',
      address: student.address ?? '',
      className: student.className ?? '',
      sectionName: student.sectionName ?? '',
      rollNumber: student.rollNumber ?? '',
      admissionNumber: student.admissionNumber ?? '',
      parentName: student.parentName ?? '',
      gender: student.gender ?? ''
    };
  }

  private toCreatePayload(student: Partial<Student>): any {
    return {
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email || null,
      phone: student.phone || null,
      dateOfBirth: student.dateOfBirth || null,
      gender: student.gender ? student.gender.toUpperCase() : null,
      classId: student.classId ?? null,
      sectionId: student.sectionId ?? null,
      rollNumber: student.rollNumber || null,
      admissionNumber: student.admissionNumber || null,
      admissionDate: student.admissionDate || null,
      parentId: student.parentId ?? null,
      parentName: student.parentName || null,
      address: student.address || null,
      bloodGroup: student.bloodGroup || null
    };
  }

  private toUpdatePayload(student: Partial<Student>): any {
    return {
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth || null,
      gender: student.gender ? student.gender.toUpperCase() : null,
      classId: student.classId ?? null,
      sectionId: student.sectionId ?? null,
      rollNumber: student.rollNumber,
      parentId: student.parentId ?? null,
      parentName: student.parentName,
      address: student.address,
      bloodGroup: student.bloodGroup,
      status: student.status ? student.status.toUpperCase() : null
    };
  }
}
