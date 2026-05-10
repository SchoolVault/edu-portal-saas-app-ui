import type { Student } from '../models/models';
import { MOCK_SCHOOL_CLASSES } from './academic.mock-data';
import { MOCK_STUDENTS } from './students.mock-data';
import { MOCK_TIMETABLE_ENTRIES } from './timetable.mock-data';

/** Active roster — same filter semantics as production list APIs. */
export function mockActiveStudents(): Student[] {
  return MOCK_STUDENTS.filter(s => s.status === 'active');
}

export function mockActiveStudentCount(): number {
  return mockActiveStudents().length;
}

export function mockStudentsInSection(classId: number, sectionId: number): Student[] {
  return mockActiveStudents().filter(s => s.classId === classId && s.sectionId === sectionId);
}

export function mockStudentsInClass(classId: number): Student[] {
  return mockActiveStudents().filter(s => s.classId === classId);
}

/**
 * Homeroom rows for a teacher record id: whole-class slots ({@link SchoolClass.classTeacherId}) and
 * per-section slots ({@link Section.classTeacherId}).
 */
export function mockHomeroomRowsForTeacherRecordId(teacherRecordId: number) {
  const rows: {
    classId: number;
    className: string;
    sectionId?: number;
    sectionName?: string;
    totalStudents: number;
  }[] = [];
  for (const sc of MOCK_SCHOOL_CLASSES) {
    if (!sc.sections?.length) {
      if (sc.classTeacherId === teacherRecordId) {
        rows.push({
          classId: sc.id,
          className: sc.name,
          sectionId: undefined,
          sectionName: undefined,
          totalStudents: mockStudentsInClass(sc.id).length,
        });
      }
      continue;
    }
    for (const sec of sc.sections) {
      if (sec.classTeacherId === teacherRecordId) {
        rows.push({
          classId: sc.id,
          className: sc.name,
          sectionId: sec.id,
          sectionName: sec.name,
          totalStudents: mockStudentsInSection(sc.id, sec.id).length,
        });
      }
    }
  }
  return rows;
}

/** Classes with no homeroom teacher on any section (or whole-class) — id 0 = pre-primary shell. */
export function mockClassesWithoutHomeroomTeacher() {
  return MOCK_SCHOOL_CLASSES.filter(c => {
    if (c.id <= 0) return false;
    if (!c.sections?.length) {
      return c.classTeacherId == null;
    }
    return c.sections.every(s => s.classTeacherId == null);
  }).map(c => ({
    classId: c.id,
    className: c.name,
    grade: c.grade,
  }));
}

/** Distinct class/section pairs from recurring timetable for a teacher record ({@code TimetableEntry.teacherId}). */
export function mockTeacherAssignedSlots(teacherRecordId: number): { classId: number; sectionId: number }[] {
  const keys = new Set<string>();
  for (const e of MOCK_TIMETABLE_ENTRIES) {
    if (e.teacherId === teacherRecordId) {
      keys.add(`${e.classId}|${e.sectionId}`);
    }
  }
  return [...keys].map(k => {
    const [classId, sectionId] = k.split('|').map(Number);
    return { classId, sectionId };
  });
}

/** Headcount of active students in those slots — aligns with teacher dashboard “Students assigned”. */
export function mockTeacherAssignedStudentCountFromTimetable(teacherRecordId: number): number {
  const ids = new Set<number>();
  for (const { classId, sectionId } of mockTeacherAssignedSlots(teacherRecordId)) {
    mockStudentsInSection(classId, sectionId).forEach(s => ids.add(s.id));
  }
  return ids.size;
}
