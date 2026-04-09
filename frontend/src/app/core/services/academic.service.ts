import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { AcademicYear, PromotionPreview, PromotionResult, SchoolClass } from '../models/models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AcademicService {
  private academicYears: AcademicYear[] = [
    { id: 'ay1', name: '2025-2026', startDate: '2025-06-01', endDate: '2026-05-31', isCurrent: true, tenantId: 't1' },
    { id: 'ay2', name: '2024-2025', startDate: '2024-06-01', endDate: '2025-05-31', isCurrent: false, tenantId: 't1' },
  ];

  private classes: SchoolClass[] = [
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
    if (!environment.useMocks) { return this.api.get<AcademicYear[]>('/academic/years'); }
    return of([...this.academicYears]).pipe(delay(300));
  }
  getClasses(): Observable<SchoolClass[]> {
    if (!environment.useMocks) {
      return this.api.get<any[]>('/academic/classes').pipe(map(list => list.map((c: any) => this.normalizeClass(c))));
    }
    return of([...this.classes]).pipe(delay(400));
  }
  getClassById(id: string): Observable<SchoolClass | undefined> {
    if (!environment.useMocks) { return this.api.get<any>('/academic/classes/' + id).pipe(map((c: any) => this.normalizeClass(c))); }
    return of(this.classes.find(c => c.id === id)).pipe(delay(200));
  }

  constructor(private api: ApiService) {}

  addClass(cls: SchoolClass): Observable<SchoolClass> {
    this.classes.push(cls);
    return of(cls).pipe(delay(400));
  }

  addAcademicYear(ay: AcademicYear): Observable<AcademicYear> {
    if (!environment.useMocks) { return this.api.post<AcademicYear>('/academic/years', ay); }
    this.academicYears.push(ay);
    return of(ay).pipe(delay(400));
  }

  previewPromotion(fromClassId: string): Observable<PromotionPreview> {
    if (!environment.useMocks) {
      return this.api.get<any>(`/academic/promotion/preview?fromClassId=${fromClassId}`).pipe(
        map(preview => ({
          sourceClassId: String(preview.sourceClassId),
          sourceClassName: preview.sourceClassName,
          targetClassId: String(preview.targetClassId),
          targetClassName: preview.targetClassName,
          defaultSectionId: preview.defaultSectionId != null ? String(preview.defaultSectionId) : undefined,
          defaultSectionName: preview.defaultSectionName,
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
    return of({
      sourceClassId: fromClassId,
      sourceClassName: '',
      targetClassId: '',
      targetClassName: '',
      students: []
    }).pipe(delay(300));
  }

  executePromotion(sourceClassId: string, targetClassId: string, studentIds: string[], targetSectionId?: string): Observable<PromotionResult> {
    if (!environment.useMocks) {
      return this.api.post<PromotionResult>('/academic/promotion/execute', {
        sourceClassId: Number(sourceClassId),
        targetClassId: Number(targetClassId),
        targetSectionId: targetSectionId ? Number(targetSectionId) : null,
        studentIds: studentIds.map(id => Number(id))
      });
    }
    return of({ promotedCount: studentIds.length, targetClassName: '', targetSectionName: '' }).pipe(delay(500));
  }

  assignClassTeacher(classId: string, teacherId: string | null, teacherName?: string): Observable<SchoolClass> {
    if (!environment.useMocks) {
      return this.api.put<any>(`/academic/classes/${classId}/teacher`, {
        teacherId: teacherId ? Number(teacherId) : null,
        teacherName: teacherName ?? null
      }).pipe(map((cls: any) => this.normalizeClass(cls)));
    }
    const idx = this.classes.findIndex(c => c.id === classId);
    if (idx === -1) return of(this.classes[0]).pipe(delay(200));
    this.classes[idx] = {
      ...this.classes[idx],
      classTeacherId: teacherId || undefined,
      classTeacherName: teacherName || undefined
    };
    return of(this.classes[idx]).pipe(delay(300));
  }

  private normalizeClass(raw: any): SchoolClass {
    return {
      id: String(raw.id),
      name: raw.name,
      grade: raw.grade,
      classTeacherId: raw.classTeacherId != null ? String(raw.classTeacherId) : undefined,
      classTeacherName: raw.classTeacherName,
      academicYearId: String(raw.academicYearId),
      tenantId: raw.tenantId ?? '',
      sections: (raw.sections ?? []).map((section: any) => ({
        id: String(section.id),
        name: section.name,
        classId: String(section.classId ?? raw.id),
        capacity: section.capacity,
        studentCount: section.studentCount ?? 0
      }))
    };
  }
}
