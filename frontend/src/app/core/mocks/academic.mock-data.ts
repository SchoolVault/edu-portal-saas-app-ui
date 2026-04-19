import type { AcademicYear, SchoolClass, SubjectCatalogItem } from '../models/models';

export const MOCK_ACADEMIC_YEARS: AcademicYear[] = [
  { id: 1, name: '2025-2026', startDate: '2025-06-01', endDate: '2026-05-31', isCurrent: true, tenantId: 't1' },
  { id: 2, name: '2024-2025', startDate: '2024-06-01', endDate: '2025-05-31', isCurrent: false, tenantId: 't1' },
];

export const MOCK_SUBJECT_CATALOG: SubjectCatalogItem[] = [
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

export const MOCK_SCHOOL_CLASSES: SchoolClass[] = [
{ id: 0, name: 'Pre-Primary (whole class)', grade: 0, sections: [], academicYearId: 1, tenantId: 't1' },
{ id: 1, name: 'Class 1', grade: 1, sections: [{ id: 101, name: 'A', classId: 1, capacity: 40, studentCount: 3 }, { id: 102, name: 'B', classId: 1, capacity: 40, studentCount: 3 }], classTeacherId: 7, classTeacherName: 'Aisha Khan', academicYearId: 1, tenantId: 't1' },
{ id: 2, name: 'Class 2', grade: 2, sections: [{ id: 201, name: 'A', classId: 2, capacity: 40, studentCount: 3 }], classTeacherId: 6, classTeacherName: 'David Anderson', academicYearId: 1, tenantId: 't1' },
{ id: 3, name: 'Class 3', grade: 3, sections: [{ id: 301, name: 'A', classId: 3, capacity: 40, studentCount: 3 }, { id: 302, name: 'B', classId: 3, capacity: 40, studentCount: 3 }], classTeacherId: 7, classTeacherName: 'Aisha Khan', academicYearId: 1, tenantId: 't1' },
{ id: 4, name: 'Class 4', grade: 4, sections: [{ id: 401, name: 'A', classId: 4, capacity: 40, studentCount: 3 }], classTeacherId: 8, classTeacherName: 'Thomas Lee', academicYearId: 1, tenantId: 't1' },
{ id: 5, name: 'Class 5', grade: 5, sections: [{ id: 501, name: 'A', classId: 5, capacity: 40, studentCount: 38 }, { id: 502, name: 'B', classId: 5, capacity: 40, studentCount: 36 }], classTeacherId: 2, classTeacherName: "James O'Brien", academicYearId: 1, tenantId: 't1' },
{ id: 6, name: 'Class 6', grade: 6, sections: [{ id: 601, name: 'A', classId: 6, capacity: 40, studentCount: 38 }, { id: 602, name: 'B', classId: 6, capacity: 40, studentCount: 36 }], classTeacherId: 4, classTeacherName: 'Robert Kim', academicYearId: 1, tenantId: 't1' },
{ id: 7, name: 'Class 7', grade: 7, sections: [{ id: 701, name: 'A', classId: 7, capacity: 40, studentCount: 1 }, { id: 702, name: 'B', classId: 7, capacity: 40, studentCount: 1 }, { id: 703, name: 'C', classId: 7, capacity: 40, studentCount: 2 }], classTeacherId: 4, classTeacherName: 'Robert Kim', academicYearId: 1, tenantId: 't1' },
{ id: 8, name: 'Class 8', grade: 8, sections: [{ id: 801, name: 'A', classId: 8, capacity: 40, studentCount: 38 }, { id: 802, name: 'B', classId: 8, capacity: 40, studentCount: 37 }], classTeacherId: 1, classTeacherName: 'Sarah Mitchell', academicYearId: 1, tenantId: 't1' },
{ id: 9, name: 'Class 9', grade: 9, sections: [{ id: 901, name: 'A', classId: 9, capacity: 40, studentCount: 35 }, { id: 902, name: 'B', classId: 9, capacity: 40, studentCount: 35 }], classTeacherId: 3, classTeacherName: 'Priya Sharma', academicYearId: 1, tenantId: 't1' },
{ id: 10, name: 'Class 10', grade: 10, sections: [{ id: 1001, name: 'A', classId: 10, capacity: 40, studentCount: 36 }, { id: 1002, name: 'B', classId: 10, capacity: 40, studentCount: 35 }], classTeacherId: 5, classTeacherName: 'Maria Torres', academicYearId: 1, tenantId: 't1' },
{ id: 11, name: 'Class 11', grade: 11, sections: [{ id: 1101, name: 'A', classId: 11, capacity: 35, studentCount: 33 }, { id: 1102, name: 'B', classId: 11, capacity: 35, studentCount: 32 }], classTeacherId: 8, classTeacherName: 'Thomas Lee', academicYearId: 1, tenantId: 't1' },
{ id: 12, name: 'Class 12', grade: 12, sections: [{ id: 1201, name: 'A', classId: 12, capacity: 35, studentCount: 31 }, { id: 1202, name: 'B', classId: 12, capacity: 35, studentCount: 28 }], classTeacherId: 1, classTeacherName: 'Sarah Mitchell', academicYearId: 1, tenantId: 't1' },
];
