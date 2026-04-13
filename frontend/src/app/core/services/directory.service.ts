import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AcademicService } from './academic.service';
import { StudentService } from './student.service';
import { TeacherService } from './teacher.service';
import { runtimeConfig } from '../config/runtime-config';
import type { DirectoryEntry, DirectorySearchResponse } from '../models/directory.dto';
import { MOCK_DIRECTORY_STATIC_ENTRIES } from '../mocks/directory.mock-data';

export type { DirectoryEntry, DirectorySearchResponse } from '../models/directory.dto';

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

    for (const p of MOCK_DIRECTORY_STATIC_ENTRIES) {
      if (this.blob(p).includes(t)) {
        push(p);
      }
    }

    for (const s of students) {
      const blob = `${s.firstName} ${s.lastName} ${s.email} ${s.admissionNumber} ${s.className} ${s.sectionName}`.toLowerCase();
      if (!blob.includes(t)) {
        continue;
      }
      const idNum = Number(s.id);
      const parentChat = s.parentUserId;
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
        contextId: parentChat ? String(s.id) : undefined,
      });
    }

    for (const te of teachers) {
      const blob = `${te.firstName} ${te.lastName} ${te.email} ${te.specialization}`.toLowerCase();
      if (!blob.includes(t)) {
        continue;
      }
      const idNum = Number(te.id);
      const homeroomNames = te.homeroomClassNames?.length
        ? te.homeroomClassNames.join(', ')
        : (() => {
            const hc = classes.find(c => c.classTeacherId === te.id);
            return hc ? `Homeroom: ${hc.name}` : '';
          })();
      const homeroom = homeroomNames || 'Teacher';
      push({
        kind: 'teacher',
        id: idNum,
        displayName: `${te.firstName} ${te.lastName}`,
        subtitle: `${te.specialization || 'Teacher'} · ${homeroom}`,
        email: te.email,
        phone: te.phone,
        deepLink: `/app/teachers/${te.id}`,
        chatUserId: te.userId,
        chatTargetRole: te.userId != null ? 'TEACHER' : undefined,
      });
    }

    const results = Array.from(byKey.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
    return { query: term, results: results.slice(0, 60) };
  }

  private blob(e: DirectoryEntry): string {
    return `${e.displayName} ${e.subtitle || ''} ${e.email || ''} ${e.phone || ''}`.toLowerCase();
  }

}
