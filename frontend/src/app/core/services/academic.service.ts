import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { AcademicYear, PromotionPreview, PromotionResult, PromotionSplitPreview, SchoolClass, SubjectCatalogItem } from '../models/models';
import { ApiService } from './api.service';
import { StudentService } from './student.service';
import { runtimeConfig } from '../config/runtime-config';

/** Mirrors POST /academic/classes body (IDs as strings in UI; API uses numbers). */
export interface CreateClassPayload {
  name: string;
  grade: number;
  academicYearId: string;
  classTeacherId?: string | null;
  classTeacherName?: string | null;
  /** Omit or empty = whole-class (no section rows). */
  sectionNames?: string[];
  sectionCapacity?: number;
}

@Injectable({ providedIn: 'root' })
export class AcademicService {
  private academicYears: AcademicYear[] = [
    { id: 'ay1', name: '2025-2026', startDate: '2025-06-01', endDate: '2026-05-31', isCurrent: true, tenantId: 't1' },
    { id: 'ay2', name: '2024-2025', startDate: '2024-06-01', endDate: '2025-05-31', isCurrent: false, tenantId: 't1' },
  ];

  /** Same defaults as backend AcademicService.DEFAULT_SUBJECT_CATALOG (mock path). */
  private mockSubjectCatalog: SubjectCatalogItem[] = [
    { id: null, code: 'MATH', name: 'Mathematics', category: 'STEM' },
    { id: null, code: 'PHY', name: 'Physics', category: 'STEM' },
    { id: null, code: 'CHEM', name: 'Chemistry', category: 'STEM' },
    { id: null, code: 'BIO', name: 'Biology', category: 'STEM' },
    { id: null, code: 'CS', name: 'Computer Science', category: 'STEM' },
    { id: null, code: 'ENG', name: 'English', category: 'Languages' },
    { id: null, code: 'HIST', name: 'History', category: 'Social' },
    { id: null, code: 'GEO', name: 'Geography', category: 'Social' },
    { id: null, code: 'PE', name: 'Physical Education', category: 'Arts' },
  ];

  private classes: SchoolClass[] = [
    { id: 'c0', name: 'Pre-Primary (whole class)', grade: 0, sections: [], academicYearId: 'ay1', tenantId: 't1' },
    { id: 'c1', name: 'Class 1', grade: 1, sections: [{ id: 'sec1a', name: 'A', classId: 'c1', capacity: 40, studentCount: 35 }, { id: 'sec1b', name: 'B', classId: 'c1', capacity: 40, studentCount: 38 }], classTeacherId: 't7', classTeacherName: 'Aisha Khan', academicYearId: 'ay1', tenantId: 't1' },
    { id: 'c2', name: 'Class 2', grade: 2, sections: [{ id: 'sec2a', name: 'A', classId: 'c2', capacity: 40, studentCount: 36 }], academicYearId: 'ay1', tenantId: 't1' },
    { id: 'c3', name: 'Class 3', grade: 3, sections: [{ id: 'sec3a', name: 'A', classId: 'c3', capacity: 40, studentCount: 34 }, { id: 'sec3b', name: 'B', classId: 'c3', capacity: 40, studentCount: 37 }], academicYearId: 'ay1', tenantId: 't1' },
    { id: 'c4', name: 'Class 4', grade: 4, sections: [{ id: 'sec4a', name: 'A', classId: 'c4', capacity: 40, studentCount: 39 }], academicYearId: 'ay1', tenantId: 't1' },
    { id: 'c5', name: 'Class 5', grade: 5, sections: [{ id: 'sec5a', name: 'A', classId: 'c5', capacity: 40, studentCount: 38 }, { id: 'sec5b', name: 'B', classId: 'c5', capacity: 40, studentCount: 36 }], classTeacherId: 't2', classTeacherName: "James O'Brien", academicYearId: 'ay1', tenantId: 't1' },
    { id: 'c6', name: 'Class 6', grade: 6, sections: [{ id: 'sec6a', name: 'A', classId: 'c6', capacity: 40, studentCount: 37 }, { id: 'sec6b', name: 'B', classId: 'c6', capacity: 40, studentCount: 35 }], classTeacherId: 't4', classTeacherName: 'Robert Kim', academicYearId: 'ay1', tenantId: 't1' },
    { id: 'c7', name: 'Class 7', grade: 7, sections: [{ id: 'sec7a', name: 'A', classId: 'c7', capacity: 40, studentCount: 36 }, { id: 'sec7b', name: 'B', classId: 'c7', capacity: 40, studentCount: 34 }, { id: 'sec7c', name: 'C', classId: 'c7', capacity: 40, studentCount: 32 }], academicYearId: 'ay1', tenantId: 't1' },
    { id: 'c8', name: 'Class 8', grade: 8, sections: [{ id: 'sec8a', name: 'A', classId: 'c8', capacity: 40, studentCount: 38 }, { id: 'sec8b', name: 'B', classId: 'c8', capacity: 40, studentCount: 37 }], classTeacherId: 't1', classTeacherName: 'Sarah Mitchell', academicYearId: 'ay1', tenantId: 't1' },
    { id: 'c9', name: 'Class 9', grade: 9, sections: [{ id: 'sec9a', name: 'A', classId: 'c9', capacity: 40, studentCount: 35 }, { id: 'sec9b', name: 'B', classId: 'c9', capacity: 40, studentCount: 33 }], classTeacherId: 't3', classTeacherName: 'Priya Sharma', academicYearId: 'ay1', tenantId: 't1' },
    { id: 'c10', name: 'Class 10', grade: 10, sections: [{ id: 'sec10a', name: 'A', classId: 'c10', capacity: 40, studentCount: 36 }, { id: 'sec10b', name: 'B', classId: 'c10', capacity: 40, studentCount: 34 }], classTeacherId: 't5', classTeacherName: 'Maria Torres', academicYearId: 'ay1', tenantId: 't1' },
    { id: 'c11', name: 'Class 11', grade: 11, sections: [{ id: 'sec11a', name: 'A', classId: 'c11', capacity: 35, studentCount: 30 }], classTeacherId: 't8', classTeacherName: 'Thomas Lee', academicYearId: 'ay1', tenantId: 't1' },
    { id: 'c12', name: 'Class 12', grade: 12, sections: [{ id: 'sec12a', name: 'A', classId: 'c12', capacity: 35, studentCount: 28 }], academicYearId: 'ay1', tenantId: 't1' },
  ];

  getAcademicYears(): Observable<AcademicYear[]> {
    if (!runtimeConfig.useMocks) { return this.api.get<AcademicYear[]>('/academic/years'); }
    return of([...this.academicYears]).pipe(delay(300));
  }

  /** Subject master list for dropdowns; persisted teacher skills still use subject display names in API. */
  getSubjectCatalog(): Observable<SubjectCatalogItem[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>('/academic/subjects/catalog').pipe(
        map(rows =>
          (rows ?? []).map((r: any) => ({
            id: r.id != null ? String(r.id) : null,
            code: r.code ?? null,
            name: String(r.name ?? ''),
            category: r.category ?? null,
          }))
        )
      );
    }
    return of(this.mockSubjectCatalog.map(s => ({ ...s }))).pipe(delay(200));
  }
  getClasses(): Observable<SchoolClass[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>('/academic/classes').pipe(map(list => list.map((c: any) => this.normalizeClass(c))));
    }
    return of([...this.classes]).pipe(delay(400));
  }
  getClassById(id: string): Observable<SchoolClass | undefined> {
    if (!runtimeConfig.useMocks) { return this.api.get<any>('/academic/classes/' + id).pipe(map((c: any) => this.normalizeClass(c))); }
    return of(this.classes.find(c => c.id === id)).pipe(delay(200));
  }

  constructor(
    private api: ApiService,
    private studentService: StudentService
  ) {}

  createClass(payload: CreateClassPayload): Observable<SchoolClass> {
    if (!runtimeConfig.useMocks) {
      const names = (payload.sectionNames ?? []).map(s => s.trim()).filter(Boolean);
      return this.api
        .post<any>('/academic/classes', {
          name: payload.name,
          grade: payload.grade,
          academicYearId: Number(payload.academicYearId),
          classTeacherId: payload.classTeacherId ? Number(payload.classTeacherId) : null,
          classTeacherName: payload.classTeacherName ?? null,
          sectionNames: names.length ? names : null,
          sectionCapacity: payload.sectionCapacity ?? 40,
        })
        .pipe(map((c: any) => this.normalizeClass(c)));
    }
    const id = 'c' + Date.now();
    const cap = payload.sectionCapacity ?? 40;
    const names = (payload.sectionNames ?? []).map(s => s.trim()).filter(Boolean);
    const sections = names.map((n, i) => ({
      id: `sec_${id}_${i}`,
      name: n,
      classId: id,
      capacity: cap,
      studentCount: 0,
    }));
    const t = payload.classTeacherId
      ? {
          classTeacherId: payload.classTeacherId,
          classTeacherName: payload.classTeacherName ?? undefined,
        }
      : {};
    const cls: SchoolClass = {
      id,
      name: payload.name,
      grade: payload.grade,
      sections,
      academicYearId: payload.academicYearId,
      tenantId: 't1',
      ...t,
    };
    this.classes = [...this.classes, cls].sort((a, b) => a.grade - b.grade);
    return of({ ...cls }).pipe(delay(350));
  }

  updateClass(classId: string, name: string, grade: number): Observable<SchoolClass> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .put<any>(`/academic/classes/${classId}`, { name, grade })
        .pipe(map((c: any) => this.normalizeClass(c)));
    }
    const i = this.classes.findIndex(c => c.id === classId);
    if (i === -1) return of(this.classes[0]).pipe(delay(200));
    this.classes[i] = { ...this.classes[i], name, grade };
    return of({ ...this.classes[i] }).pipe(delay(250));
  }

  addSectionToClass(classId: string, name: string, capacity: number): Observable<SchoolClass> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .post<any>('/academic/sections', { classId: Number(classId), name, capacity })
        .pipe(switchMap(() => this.getClassById(classId).pipe(map(c => c!))));
    }
    const ci = this.classes.findIndex(c => c.id === classId);
    if (ci === -1) return of(this.classes[0]).pipe(delay(200));
    const secId = 'sec' + Date.now();
    const sec = { id: secId, name: name.trim(), classId, capacity, studentCount: 0 };
    this.classes[ci] = { ...this.classes[ci], sections: [...this.classes[ci].sections, sec] };
    return of({ ...this.classes[ci] }).pipe(delay(300));
  }

  updateSection(classId: string, sectionId: string, name: string, capacity: number): Observable<SchoolClass> {
    if (!runtimeConfig.useMocks) {
      return this.api.put<any>(`/academic/sections/${sectionId}`, { name, capacity }).pipe(
        switchMap(() => this.getClassById(classId).pipe(map(c => c!)))
      );
    }
    const ci = this.classes.findIndex(c => c.id === classId);
    if (ci === -1) return of(this.classes[0]).pipe(delay(200));
    const si = this.classes[ci].sections.findIndex(s => s.id === sectionId);
    if (si === -1) return of(this.classes[ci]).pipe(delay(200));
    const next = [...this.classes[ci].sections];
    next[si] = { ...next[si], name: name.trim(), capacity };
    this.classes[ci] = { ...this.classes[ci], sections: next };
    return of({ ...this.classes[ci] }).pipe(delay(250));
  }

  deleteSection(classId: string, sectionId: string): Observable<SchoolClass | void> {
    if (!runtimeConfig.useMocks) {
      return this.api.delete<void>(`/academic/sections/${sectionId}`).pipe(
        switchMap(() => this.getClassById(classId).pipe(map(c => c!)))
      );
    }
    const ci = this.classes.findIndex(c => c.id === classId);
    if (ci === -1) return of(undefined).pipe(delay(200));
    const sec = this.classes[ci].sections.find(s => s.id === sectionId);
    if (!sec || sec.studentCount > 0) return of(undefined).pipe(delay(200));
    this.classes[ci] = {
      ...this.classes[ci],
      sections: this.classes[ci].sections.filter(s => s.id !== sectionId),
    };
    return of({ ...this.classes[ci] }).pipe(delay(250));
  }

  addAcademicYear(ay: AcademicYear): Observable<AcademicYear> {
    if (!runtimeConfig.useMocks) { return this.api.post<AcademicYear>('/academic/years', ay); }
    this.academicYears.push(ay);
    return of(ay).pipe(delay(400));
  }

  previewPromotion(fromClassId: string): Observable<PromotionPreview> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any>(`/academic/promotion/preview?fromClassId=${fromClassId}`).pipe(
        map(preview => ({
          sourceClassId: String(preview.sourceClassId),
          sourceClassName: preview.sourceClassName,
          targetClassId: String(preview.targetClassId),
          targetClassName: preview.targetClassName,
          defaultSectionId: preview.defaultSectionId != null ? String(preview.defaultSectionId) : undefined,
          defaultSectionName: preview.defaultSectionName,
          targetSections: (preview.targetSections ?? []).map((s: any) => ({
            id: String(s.id),
            name: s.name ?? '',
            capacity: s.capacity != null ? Number(s.capacity) : undefined,
          })),
          sectionPlacementNote: preview.sectionPlacementNote ?? undefined,
          students: (preview.students ?? []).map((student: any) => ({
            studentId: String(student.studentId),
            firstName: student.firstName,
            lastName: student.lastName,
            rollNumber: student.rollNumber ?? '',
            currentClassName: student.currentClassName ?? '',
            averageScore: Number(student.averageScore ?? 0),
            eligible: !!student.eligible,
            selected: !!student.eligible
          }))
        }))
      );
    }
    const source = this.classes.find(c => c.id === fromClassId);
    const target = source ? this.classes.find(c => c.grade === source.grade + 1) : undefined;
    return this.studentService.getStudents().pipe(
      switchMap(students => {
        const inSource = students.filter(s => s.classId === fromClassId && s.status === 'active');
        const sortedSecs = target?.sections?.length
          ? [...target.sections].sort((a, b) => a.name.localeCompare(b.name))
          : [];
        const defaultSec = sortedSecs[0];
        return of({
          sourceClassId: fromClassId,
          sourceClassName: source?.name ?? '',
          targetClassId: target?.id ?? '',
          targetClassName: target?.name ?? '',
          defaultSectionId: defaultSec?.id,
          defaultSectionName: defaultSec?.name,
          targetSections: sortedSecs.map(sec => ({ id: sec.id, name: sec.name, capacity: sec.capacity })),
          sectionPlacementNote:
            sortedSecs.length === 0
              ? 'Target class has no sections in mock data; add sections in Academic.'
              : source && source.sections.length > sortedSecs.length
                ? 'Target has fewer sections than source in this mock; pick a section per batch.'
                : undefined,
          students: inSource.map(s => ({
            studentId: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            rollNumber: s.rollNumber ?? '',
            currentClassName: source?.name ?? '',
            averageScore: 72,
            eligible: true,
            selected: true,
          })),
        } as PromotionPreview);
      }),
      delay(300)
    );
  }

  executePromotion(sourceClassId: string, targetClassId: string, studentIds: string[], targetSectionId?: string): Observable<PromotionResult> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<PromotionResult>('/academic/promotion/execute', {
        sourceClassId: Number(sourceClassId),
        targetClassId: Number(targetClassId),
        targetSectionId: targetSectionId ? Number(targetSectionId) : null,
        studentIds: studentIds.map(id => Number(id))
      });
    }
    const tgt = this.classes.find(c => c.id === targetClassId);
    let secName = '';
    let secId: string | null | undefined = targetSectionId;
    if (tgt) {
      if (targetSectionId) {
        const sec = tgt.sections.find(s => s.id === targetSectionId);
        secName = sec?.name ?? '';
      } else if (tgt.sections.length) {
        const first = [...tgt.sections].sort((a, b) => a.name.localeCompare(b.name))[0];
        secId = first.id;
        secName = first.name;
      }
    }
    return this.studentService.applyPromotionInMemory(
      sourceClassId,
      targetClassId,
      studentIds,
      secId || null,
      tgt?.name ?? '',
      secName
    );
  }

  promotionSplitPreview(fromClassId: string, toClassId: string): Observable<PromotionSplitPreview> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .get<any>(
          `/academic/promotion/split-preview?fromClassId=${encodeURIComponent(fromClassId)}&toClassId=${encodeURIComponent(toClassId)}`
        )
        .pipe(
          map((p: any) => ({
            fromClassId: String(p.fromClassId),
            toClassId: String(p.toClassId),
            eligibleStudentCount: Number(p.eligibleStudentCount ?? 0),
            hint: p.hint,
            sections: (p.sections ?? []).map((s: any) => ({
              sectionId: String(s.sectionId),
              sectionName: s.sectionName ?? '',
              capacity: s.capacity != null ? Number(s.capacity) : undefined,
              suggestedAssignCount: Number(s.suggestedAssignCount ?? 0),
            })),
          }))
        );
    }
    const source = this.classes.find(c => c.id === fromClassId);
    const target = this.classes.find(c => c.id === toClassId);
    return this.studentService.getStudents().pipe(
      switchMap(students => {
        const elig = students.filter(s => s.classId === fromClassId && s.status === 'active').length;
        const secs = target?.sections?.length ? [...target.sections].sort((a, b) => a.name.localeCompare(b.name)) : [];
        if (!secs.length) {
          return of({
            fromClassId,
            toClassId,
            eligibleStudentCount: elig,
            hint: 'Create sections on the target class before using split suggestions.',
            sections: [],
          } as PromotionSplitPreview);
        }
        const ordered = [...secs].sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0));
        const m = ordered.length;
        const counts = new Array(m).fill(0);
        for (let i = 0; i < elig; i++) {
          counts[i % m]++;
        }
        return of({
          fromClassId,
          toClassId,
          eligibleStudentCount: elig,
          hint: 'Suggested counts are heuristic (round-robin).',
          sections: ordered.map((s, i) => ({
            sectionId: s.id,
            sectionName: s.name,
            capacity: s.capacity,
            suggestedAssignCount: counts[i],
          })),
        } as PromotionSplitPreview);
      }),
      delay(200)
    );
  }

  assignClassTeacher(classId: string, teacherId: string | null, teacherName?: string): Observable<SchoolClass> {
    if (!runtimeConfig.useMocks) {
      return this.api.put<any>(`/academic/classes/${classId}/teacher`, {
        teacherId: teacherId ? Number(teacherId) : null,
        teacherName: teacherName ?? null
      }).pipe(map((cls: any) => this.normalizeClass(cls)));
    }
    const idx = this.classes.findIndex(c => c.id === classId);
    if (idx === -1) return of(this.classes[0]).pipe(delay(200));
    if (teacherId) {
      this.classes = this.classes.map(c =>
        c.id !== classId && c.classTeacherId === teacherId
          ? { ...c, classTeacherId: undefined, classTeacherName: undefined }
          : c
      );
    }
    const i = this.classes.findIndex(c => c.id === classId);
    this.classes[i] = {
      ...this.classes[i],
      classTeacherId: teacherId || undefined,
      classTeacherName: teacherName || undefined
    };
    return of(this.classes[i]).pipe(delay(300));
  }

  private normalizeClass(raw: any): SchoolClass {
    const sections = (raw.sections ?? []).map((section: any) => ({
      id: String(section.id),
      name: section.name,
      classId: String(section.classId ?? raw.id),
      capacity: section.capacity,
      studentCount: section.studentCount ?? 0,
    }));
    const sum = sections.reduce((s: number, x: { studentCount: number }) => s + (x.studentCount ?? 0), 0);
    const total = raw.totalStudents != null ? Number(raw.totalStudents) : sum;
    return {
      id: String(raw.id),
      name: raw.name,
      grade: raw.grade,
      classTeacherId: raw.classTeacherId != null ? String(raw.classTeacherId) : undefined,
      classTeacherName: raw.classTeacherName,
      academicYearId: String(raw.academicYearId),
      tenantId: raw.tenantId ?? '',
      sections,
      totalStudents: total,
    };
  }
}
