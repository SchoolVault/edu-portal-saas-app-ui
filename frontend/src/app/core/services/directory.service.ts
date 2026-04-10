import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AcademicService } from './academic.service';
import { StudentService } from './student.service';
import { TeacherService } from './teacher.service';
import { runtimeConfig } from '../config/runtime-config';

export interface DirectoryEntry {
  kind: string;
  id: number;
  displayName: string;
  subtitle?: string;
  email?: string;
  phone?: string;
  deepLink?: string;
  /** ERP user id to open a direct chat (parent, teacher, admin user, …). */
  chatUserId?: string;
  chatTargetRole?: string;
  /** e.g. student id for parent-context threads */
  contextType?: string;
  contextId?: string;
}

export interface DirectorySearchResponse {
  query: string;
  results: DirectoryEntry[];
}

@Injectable({ providedIn: 'root' })
export class DirectoryService {
  constructor(
    private api: ApiService,
    private studentService: StudentService,
    private teacherService: TeacherService,
    private academicService: AcademicService
  ) {}

  search(q: string, kinds?: string): Observable<DirectorySearchResponse> {
    const term = (q || '').trim();
    if (term.length < 2) {
      return of({ query: term, results: [] });
    }
    if (!runtimeConfig.useMocks) {
      const params = kinds ? `?q=${encodeURIComponent(term)}&kinds=${encodeURIComponent(kinds)}` : `?q=${encodeURIComponent(term)}`;
      return this.api.get<DirectorySearchResponse>(`/directory/search${params}`);
    }
    return forkJoin({
      students: this.studentService.getStudents(),
      teachers: this.teacherService.getTeachers(),
      classes: this.academicService.getClasses(),
    }).pipe(
      map(({ students, teachers, classes }) => this.mergeMockDirectory(term, students, teachers, classes)),
      delay(220)
    );
  }

  private mergeMockDirectory(
    term: string,
    students: import('../models/models').Student[],
    teachers: import('../models/models').Teacher[],
    classes: import('../models/models').SchoolClass[]
  ): DirectorySearchResponse {
    const t = term.toLowerCase();
    const byKey = new Map<string, DirectoryEntry>();
    const push = (e: DirectoryEntry) => byKey.set(`${e.kind}-${e.id}`, e);

    const staticPool: DirectoryEntry[] = [
      { kind: 'staff', id: 501, displayName: 'Ravi Transport', subtitle: 'TRANSPORT', phone: '+91-9000000501', deepLink: '/app/operations' },
      { kind: 'user', id: 2, displayName: 'John Anderson', subtitle: 'ADMIN · admin@school.com', email: 'admin@school.com', deepLink: '/app/settings' },
    ];
    for (const p of staticPool) {
      if (this.blob(p).includes(t)) {
        push(p);
      }
    }

    for (const s of students) {
      const blob = `${s.firstName} ${s.lastName} ${s.email} ${s.admissionNumber} ${s.className} ${s.sectionName}`.toLowerCase();
      if (!blob.includes(t)) {
        continue;
      }
      const idNum = parseInt(String(s.id).replace(/^s/i, ''), 10) || Math.abs(this.hashCode(s.id));
      const parentChat =
        s.parentUserId ||
        (typeof s.parentId === 'string' && /^u\d+$/i.test(s.parentId) ? s.parentId : undefined);
      push({
        kind: 'student',
        id: idNum,
        displayName: `${s.firstName} ${s.lastName}`,
        subtitle: `${s.className}${s.sectionName ? ' · Sec ' + s.sectionName : ''} · ${s.admissionNumber} · Parent: ${s.parentName}`,
        email: s.email,
        phone: s.phone,
        deepLink: `/app/students/${s.id}`,
        chatUserId: parentChat,
        chatTargetRole: parentChat ? 'PARENT' : undefined,
        contextType: parentChat ? 'student' : undefined,
        contextId: parentChat ? s.id : undefined,
      });
    }

    for (const te of teachers) {
      const blob = `${te.firstName} ${te.lastName} ${te.email} ${te.specialization}`.toLowerCase();
      if (!blob.includes(t)) {
        continue;
      }
      const idNum = parseInt(String(te.id).replace(/^t/i, ''), 10) || Math.abs(this.hashCode(te.id));
      const homeroomClass = classes.find(c => c.classTeacherId === te.id);
      const homeroom = homeroomClass
        ? `Homeroom: ${homeroomClass.name}`
        : te.classIds?.length
          ? `Teaching ${te.classIds.length} class(es)`
          : 'Teacher';
      push({
        kind: 'teacher',
        id: idNum,
        displayName: `${te.firstName} ${te.lastName}`,
        subtitle: `${te.specialization || 'Teacher'} · ${homeroom}`,
        email: te.email,
        phone: te.phone,
        deepLink: `/app/teachers/${te.id}`,
        chatUserId: te.userId,
        chatTargetRole: te.userId ? 'TEACHER' : undefined,
      });
    }

    const results = Array.from(byKey.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
    return { query: term, results: results.slice(0, 60) };
  }

  private blob(e: DirectoryEntry): string {
    return `${e.displayName} ${e.subtitle || ''} ${e.email || ''} ${e.phone || ''}`.toLowerCase();
  }

  private hashCode(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    }
    return h;
  }
}
