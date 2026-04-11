import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { AcademicYear, PromotionPreview, PromotionResult, PromotionSplitPreview, SchoolClass, SubjectCatalogItem } from '../models/models';
import { MOCK_ACADEMIC_YEARS, MOCK_SCHOOL_CLASSES, MOCK_SUBJECT_CATALOG } from '../mocks/academic.mock-data';
import { ApiService } from './api.service';
import { StudentService } from './student.service';
import { runtimeConfig } from '../config/runtime-config';

/** Mirrors POST /academic/classes body (ERP Long ids as JSON numbers). */
export interface CreateClassPayload {
  name: string;
  grade: number;
  academicYearId: number;
  classTeacherId?: number | null;
  classTeacherName?: string | null;
  /** Omit or empty = whole-class (no section rows). */
  sectionNames?: string[];
  sectionCapacity?: number;
}

@Injectable({ providedIn: 'root' })
export class AcademicService {
  private academicYears: AcademicYear[] = MOCK_ACADEMIC_YEARS.map(y => ({ ...y }));

  /** Same defaults as backend AcademicService.DEFAULT_SUBJECT_CATALOG (mock path). */
  private mockSubjectCatalog: SubjectCatalogItem[] = MOCK_SUBJECT_CATALOG.map(s => ({ ...s }));

  private classes: SchoolClass[] = MOCK_SCHOOL_CLASSES.map(c => ({
    ...c,
    sections: c.sections.map(sec => ({ ...sec })),
  }));

  getAcademicYears(): Observable<AcademicYear[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<AcademicYear[]>('/academic/years');
    }
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
  getClassById(id: number): Observable<SchoolClass | undefined> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any>('/academic/classes/' + id).pipe(map((c: any) => this.normalizeClass(c)));
    }
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
          academicYearId: payload.academicYearId,
          classTeacherId: payload.classTeacherId ?? null,
          classTeacherName: payload.classTeacherName ?? null,
          sectionNames: names.length ? names : null,
          sectionCapacity: payload.sectionCapacity ?? 40,
        })
        .pipe(map((c: any) => this.normalizeClass(c)));
    }
    const nextClassId = this.classes.reduce((m, c) => Math.max(m, c.id), 0) + 1;
    const cap = payload.sectionCapacity ?? 40;
    const names = (payload.sectionNames ?? []).map(s => s.trim()).filter(Boolean);
    const sections = names.map((n, i) => ({
      id: nextClassId * 1000 + i + 1,
      name: n,
      classId: nextClassId,
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
      id: nextClassId,
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

  updateClass(classId: number, name: string, grade: number): Observable<SchoolClass> {
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

  addSectionToClass(classId: number, name: string, capacity: number): Observable<SchoolClass> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .post<any>('/academic/sections', { classId, name, capacity })
        .pipe(switchMap(() => this.getClassById(classId).pipe(map(c => c!))));
    }
    const ci = this.classes.findIndex(c => c.id === classId);
    if (ci === -1) return of(this.classes[0]).pipe(delay(200));
    const secId = Date.now();
    const sec = { id: secId, name: name.trim(), classId, capacity, studentCount: 0 };
    this.classes[ci] = { ...this.classes[ci], sections: [...this.classes[ci].sections, sec] };
    return of({ ...this.classes[ci] }).pipe(delay(300));
  }

  updateSection(classId: number, sectionId: number, name: string, capacity: number): Observable<SchoolClass> {
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

  deleteSection(classId: number, sectionId: number): Observable<SchoolClass | void> {
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
    if (!runtimeConfig.useMocks) {
      return this.api.post<AcademicYear>('/academic/years', ay);
    }
    this.academicYears.push(ay);
    return of(ay).pipe(delay(400));
  }

  previewPromotion(fromClassId: number): Observable<PromotionPreview> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any>(`/academic/promotion/preview?fromClassId=${fromClassId}`).pipe(
        map(preview => ({
          sourceClassId: Number(preview.sourceClassId),
          sourceClassName: preview.sourceClassName,
          targetClassId: Number(preview.targetClassId),
          targetClassName: preview.targetClassName,
          defaultSectionId:
            preview.defaultSectionId != null ? Number(preview.defaultSectionId) : undefined,
          defaultSectionName: preview.defaultSectionName,
          targetSections: (preview.targetSections ?? []).map((s: any) => ({
            id: Number(s.id),
            name: s.name ?? '',
            capacity: s.capacity != null ? Number(s.capacity) : undefined,
          })),
          sectionPlacementNote: preview.sectionPlacementNote ?? undefined,
          students: (preview.students ?? []).map((student: any) => ({
            studentId: Number(student.studentId),
            firstName: student.firstName,
            lastName: student.lastName,
            rollNumber: student.rollNumber ?? '',
            currentClassName: student.currentClassName ?? '',
            averageScore: Number(student.averageScore ?? 0),
            eligible: !!student.eligible,
            selected: !!student.eligible,
          })),
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
          targetClassId: target?.id ?? 0,
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

  executePromotion(
    sourceClassId: number,
    targetClassId: number,
    studentIds: number[],
    targetSectionId?: number
  ): Observable<PromotionResult> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<PromotionResult>('/academic/promotion/execute', {
        sourceClassId,
        targetClassId,
        targetSectionId: targetSectionId ?? null,
        studentIds,
      });
    }
    const tgt = this.classes.find(c => c.id === targetClassId);
    let secName = '';
    let secId: number | null | undefined = targetSectionId;
    if (tgt) {
      if (targetSectionId != null) {
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
      secId ?? null,
      tgt?.name ?? '',
      secName
    );
  }

  promotionSplitPreview(fromClassId: number, toClassId: number): Observable<PromotionSplitPreview> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .get<any>(
          `/academic/promotion/split-preview?fromClassId=${encodeURIComponent(String(fromClassId))}&toClassId=${encodeURIComponent(String(toClassId))}`
        )
        .pipe(
          map((p: any) => ({
            fromClassId: Number(p.fromClassId),
            toClassId: Number(p.toClassId),
            eligibleStudentCount: Number(p.eligibleStudentCount ?? 0),
            hint: p.hint,
            sections: (p.sections ?? []).map((s: any) => ({
              sectionId: Number(s.sectionId),
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

  assignClassTeacher(classId: number, teacherId: number | null, teacherName?: string): Observable<SchoolClass> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .put<any>(`/academic/classes/${classId}/teacher`, {
          teacherId: teacherId ?? null,
          teacherName: teacherName ?? null,
        })
        .pipe(map((cls: any) => this.normalizeClass(cls)));
    }
    const idx = this.classes.findIndex(c => c.id === classId);
    if (idx === -1) return of(this.classes[0]).pipe(delay(200));
    if (teacherId != null) {
      this.classes = this.classes.map(c =>
        c.id !== classId && c.classTeacherId === teacherId
          ? { ...c, classTeacherId: undefined, classTeacherName: undefined }
          : c
      );
    }
    const i = this.classes.findIndex(c => c.id === classId);
    this.classes[i] = {
      ...this.classes[i],
      classTeacherId: teacherId ?? undefined,
      classTeacherName: teacherName || undefined,
    };
    return of(this.classes[i]).pipe(delay(300));
  }

  private normalizeClass(raw: any): SchoolClass {
    const sections = (raw.sections ?? []).map((section: any) => ({
      id: Number(section.id),
      name: section.name,
      classId: Number(section.classId ?? raw.id),
      capacity: section.capacity,
      studentCount: section.studentCount ?? 0,
    }));
    const sum = sections.reduce((s: number, x: { studentCount: number }) => s + (x.studentCount ?? 0), 0);
    const total = raw.totalStudents != null ? Number(raw.totalStudents) : sum;
    return {
      id: Number(raw.id),
      name: raw.name,
      grade: raw.grade,
      classTeacherId: raw.classTeacherId != null ? Number(raw.classTeacherId) : undefined,
      classTeacherName: raw.classTeacherName,
      academicYearId: Number(raw.academicYearId),
      tenantId: raw.tenantId ?? '',
      sections,
      totalStudents: total,
    };
  }
}
