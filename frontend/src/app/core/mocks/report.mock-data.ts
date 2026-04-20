import type {
  AttendanceSummaryRow,
  ClassSummaryRow,
  ReportCard,
  SectionSummaryRow,
  StudentPerformanceRow,
  TeacherWorkloadRow,
} from '../models/models';
import { MOCK_SCHOOL_CLASSES } from './academic.mock-data';
import { buildMockReportAttendanceSummaryForClassMonth } from './attendance.mock-data';
import { MOCK_EXAM_MARKS_SEED, MOCK_EXAMS_SEED } from './exam.mock-data';
import { MOCK_FEE_PAYMENTS_SEED } from './fee.mock-data';
import { mockStudentsInClass, mockStudentsInSection } from './mock-aggregates';
import { MOCK_STUDENTS } from './students.mock-data';
import { MOCK_TEACHERS } from './teachers.mock-data';
import { examAppliesToStudent } from '../utils/exam-scope';

function gradeLetter(pct: number): string {
  if (pct >= 90) {
    return 'A+';
  }
  if (pct >= 80) {
    return 'A';
  }
  if (pct >= 70) {
    return 'B+';
  }
  if (pct >= 60) {
    return 'B';
  }
  if (pct >= 50) {
    return 'C';
  }
  return 'D';
}

function currentMonthYm(): string {
  return new Date().toISOString().slice(0, 7);
}

export function buildMockStudentPerformance(classId: number, examId: number): StudentPerformanceRow[] {
  const exam = MOCK_EXAMS_SEED.find(e => e.id === examId);
  const studs = mockStudentsInClass(classId);
  const rows: StudentPerformanceRow[] = [];
  for (const student of studs) {
    if (exam && !examAppliesToStudent(exam, student)) {
      continue;
    }
    const marks = MOCK_EXAM_MARKS_SEED.filter(m => m.examId === examId && m.studentId === student.id);
    if (!marks.length) {
      continue;
    }
    const subjects: Record<string, number> = {};
    marks.forEach(m => {
      subjects[m.subjectName] = m.marksObtained;
    });
    const totalMarks = marks.reduce((a, m) => a + m.marksObtained, 0);
    const totalMax = marks.reduce((a, m) => a + m.maxMarks, 0);
    const pct = totalMax ? Math.round((totalMarks / totalMax) * 1000) / 10 : 0;
    rows.push({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      subjects,
      totalMarks,
      totalMax,
      percentage: pct,
      grade: gradeLetter(pct),
      rank: 0,
    });
  }
  rows.sort((a, b) => b.percentage - a.percentage);
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });
  return rows;
}

export function buildMockReportAttendanceSummary(classId: number, monthYm: string): AttendanceSummaryRow[] {
  return buildMockReportAttendanceSummaryForClassMonth(classId, monthYm).map(r => ({ ...r }));
}

function feeCollectionPctForClass(classId: number): number {
  const ids = new Set(mockStudentsInClass(classId).map(s => s.id));
  const pays = MOCK_FEE_PAYMENTS_SEED.filter(p => ids.has(p.studentId));
  if (!pays.length) {
    return 0;
  }
  const tot = pays.reduce((a, p) => a + (p.amount ?? 0), 0);
  const paid = pays.reduce((a, p) => a + (p.paidAmount ?? 0), 0);
  return tot ? Math.round((paid / tot) * 1000) / 10 : 0;
}

function performancePctForClass(classId: number): number {
  const rows = buildMockStudentPerformance(classId, 2);
  if (!rows.length) {
    return 0;
  }
  return Math.round((rows.reduce((a, r) => a + r.percentage, 0) / rows.length) * 10) / 10;
}

export function buildMockClassSummary(): ClassSummaryRow[] {
  const ym = currentMonthYm();
  return MOCK_SCHOOL_CLASSES.filter(c => c.id > 0).map(c => {
    const studs = mockStudentsInClass(c.id);
    const attRows = buildMockReportAttendanceSummaryForClassMonth(c.id, ym);
    const avgAtt = attRows.length ? attRows.reduce((a, r) => a + r.attendancePercentage, 0) / attRows.length : 0;
    return {
      classId: c.id,
      className: c.name,
      grade: c.grade,
      sections: c.sections?.length ?? 0,
      totalStudents: studs.length,
      attendancePercentage: Math.round(avgAtt * 10) / 10,
      performancePercentage: performancePctForClass(c.id),
      feeCollectionPercentage: feeCollectionPctForClass(c.id),
      overdueAccounts: MOCK_FEE_PAYMENTS_SEED.filter(p => studs.some(s => s.id === p.studentId) && String(p.status).toUpperCase() === 'OVERDUE').length,
    };
  });
}

export function buildMockSectionSummary(): SectionSummaryRow[] {
  return MOCK_SCHOOL_CLASSES.filter(c => c.id > 0).flatMap(c =>
    (c.sections ?? []).map(sec => ({
      sectionId: sec.id,
      sectionName: sec.name,
      classId: c.id,
      className: c.name,
      studentCount: mockStudentsInSection(c.id, sec.id).length,
      classTeacherName: sec.classTeacherName || c.classTeacherName || '-',
    }))
  );
}

export function buildMockTeacherWorkload(): TeacherWorkloadRow[] {
  return MOCK_TEACHERS.filter(t => t.status === 'active').map(t => ({
    teacherId: t.id,
    teacherName: `${t.firstName} ${t.lastName}`.trim(),
    specialization: t.specialization ?? '',
    subjects: [...t.subjects],
    homeroomClasses: '-',
    assignedClasses: 0,
    weeklyPeriods: 0,
    status: 'ACTIVE',
  }));
}

export function buildMockFeeCollectionSummary(): {
  totalCollected: number;
  totalPending: number;
  overdueCount: number;
  totalStudents: number;
  collectionRate: number;
} {
  const totalCollected = MOCK_FEE_PAYMENTS_SEED.reduce((a, p) => a + (p.paidAmount ?? 0), 0);
  const totalPending = MOCK_FEE_PAYMENTS_SEED.reduce((a, p) => a + (p.dueAmount ?? 0), 0);
  const base = totalCollected + totalPending;
  const overdueCount = MOCK_FEE_PAYMENTS_SEED.filter(p => p.status === 'overdue').length;
  const totalStudents = MOCK_STUDENTS.filter(s => s.status === 'active').length;
  const collectionRate = base ? Math.round((totalCollected / base) * 100) : 0;
  return {
    totalCollected,
    totalPending,
    overdueCount,
    totalStudents,
    collectionRate,
  };
}

export function buildMockReportCard(studentId: number, examId: number): ReportCard {
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  const marks = MOCK_EXAM_MARKS_SEED.filter(m => m.examId === examId && m.studentId === studentId).map(m => ({ ...m }));
  const totalMarks = marks.reduce((a, m) => a + m.marksObtained, 0);
  const totalMax = marks.reduce((a, m) => a + m.maxMarks, 0);
  const pct = totalMax ? Math.round((totalMarks / totalMax) * 1000) / 10 : 0;
  return {
    studentId,
    studentName: student ? `${student.firstName} ${student.lastName}`.trim() : 'Student',
    subjects: marks,
    totalMarks,
    totalMaxMarks: totalMax,
    overallPercentage: pct,
    overallGrade: gradeLetter(pct),
  };
}
