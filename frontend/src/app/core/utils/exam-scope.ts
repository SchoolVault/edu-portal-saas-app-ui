import type { Exam, Student } from '../models/models';

/** Whether an exam’s declared audience includes the student’s class (and section when narrowed). */
export function examAppliesToStudent(exam: Exam, student: Student): boolean {
  if (exam.classScopes?.length) {
    return exam.classScopes.some(
      cs => cs.classId === student.classId && (cs.sectionId == null || cs.sectionId === student.sectionId)
    );
  }
  return (exam.classIds ?? []).includes(student.classId);
}
