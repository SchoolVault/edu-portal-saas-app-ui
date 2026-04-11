import type {
  AttendanceSummaryRow,
  ClassSummaryRow,
  ReportCard,
  SectionSummaryRow,
  StudentPerformanceRow,
  TeacherWorkloadRow,
} from '../models/models';

export const MOCK_REPORT_STUDENT_PERFORMANCE: StudentPerformanceRow[] = [
  { studentId: 12, studentName: 'Emma Chen', subjects: { Mathematics: 92, Science: 85, English: 88, History: 78 }, totalMarks: 343, totalMax: 400, percentage: 85.8, grade: 'A', rank: 1 },
  { studentId: 4, studentName: 'Sofia Martinez', subjects: { Mathematics: 88, Science: 95, English: 82, History: 90 }, totalMarks: 355, totalMax: 400, percentage: 88.8, grade: 'A+', rank: 2 },
  { studentId: 13, studentName: 'Aiden Murphy', subjects: { Mathematics: 78, Science: 82, English: 85, History: 88 }, totalMarks: 333, totalMax: 400, percentage: 83.3, grade: 'A', rank: 3 },
];

export const MOCK_REPORT_ATTENDANCE_SUMMARY: AttendanceSummaryRow[] = [
  { studentId: 12, studentName: 'Emma Chen', present: 20, absent: 1, late: 1, excused: 0, totalDays: 22, attendancePercentage: 93.2 },
  { studentId: 4, studentName: 'Sofia Martinez', present: 21, absent: 0, late: 1, excused: 0, totalDays: 22, attendancePercentage: 97.7 },
  { studentId: 13, studentName: 'Aiden Murphy', present: 18, absent: 2, late: 2, excused: 0, totalDays: 22, attendancePercentage: 86.4 },
];

export const MOCK_REPORT_CLASS_SUMMARY: ClassSummaryRow[] = [
  { classId: 5, className: 'Class 5', grade: 5, sections: 2, totalStudents: 74, attendancePercentage: 94.1, performancePercentage: 81.2, feeCollectionPercentage: 90.0, classTeacherName: 'James O’Brien' },
  { classId: 8, className: 'Class 8', grade: 8, sections: 2, totalStudents: 75, attendancePercentage: 93.5, performancePercentage: 79.8, feeCollectionPercentage: 91.0, classTeacherName: 'Sarah Mitchell' },
  { classId: 9, className: 'Class 9', grade: 9, sections: 2, totalStudents: 68, attendancePercentage: 88.9, performancePercentage: 72.1, feeCollectionPercentage: 78.0, classTeacherName: 'Priya Sharma' },
];

export const MOCK_REPORT_SECTION_SUMMARY: SectionSummaryRow[] = [
  { sectionId: 501, sectionName: 'A', classId: 5, className: 'Class 5', studentCount: 38 },
  { sectionId: 502, sectionName: 'B', classId: 5, className: 'Class 5', studentCount: 36 },
  { sectionId: 801, sectionName: 'A', classId: 8, className: 'Class 8', studentCount: 40 },
];

export const MOCK_REPORT_TEACHER_WORKLOAD: TeacherWorkloadRow[] = [
  { teacherId: 1, teacherName: 'Sarah Mitchell', specialization: 'Mathematics', subjects: ['Mathematics', 'Physics'], status: 'ACTIVE' },
  { teacherId: 2, teacherName: 'James O’Brien', specialization: 'English', subjects: ['English', 'Literature'], status: 'ACTIVE' },
  { teacherId: 5, teacherName: 'Maria Torres', specialization: 'Computer Science', subjects: ['Computer Science', 'IT'], status: 'ACTIVE' },
];

export const MOCK_REPORT_FEE_COLLECTION_SUMMARY = {
  totalCollected: 284000,
  totalPending: 46300,
  overdueCount: 18,
  totalStudents: 2847,
  collectionRate: 86,
};

export const MOCK_REPORT_CARD_EMMA: ReportCard = {
  studentId: 12,
  studentName: 'Emma Chen',
  subjects: [
    { id: 1, examId: 2, studentId: 12, studentName: 'Emma Chen', subjectName: 'Mathematics', marksObtained: 92, maxMarks: 100, grade: 'A+', classId: 8, tenantId: 't1' },
    { id: 2, examId: 2, studentId: 12, studentName: 'Emma Chen', subjectName: 'Science', marksObtained: 85, maxMarks: 100, grade: 'A', classId: 8, tenantId: 't1' },
    { id: 3, examId: 2, studentId: 12, studentName: 'Emma Chen', subjectName: 'English', marksObtained: 88, maxMarks: 100, grade: 'A', classId: 8, tenantId: 't1' },
    { id: 4, examId: 2, studentId: 12, studentName: 'Emma Chen', subjectName: 'History', marksObtained: 78, maxMarks: 100, grade: 'B+', classId: 8, tenantId: 't1' },
  ],
  totalMarks: 343,
  totalMaxMarks: 400,
  overallPercentage: 85.8,
  overallGrade: 'A',
};
