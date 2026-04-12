package com.school.erp.modules.exams.policy;

import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.academic.entity.ClassTeacherAssignment;
import com.school.erp.modules.academic.entity.SubjectTeacherAssignment;
import com.school.erp.modules.academic.repository.ClassTeacherAssignmentRepository;
import com.school.erp.modules.academic.repository.SubjectTeacherAssignmentRepository;
import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.exams.dto.ExamScopeDtos;
import com.school.erp.modules.exams.entity.Exam;
import com.school.erp.modules.exams.entity.MarkRecord;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Object-level rules for marks entry and viewing (teacher subject assignments, parent/guardian linkage).
 */
@Component
public class ExamMarkingAccessPolicy {

    private final SubjectTeacherAssignmentRepository subjectTeacherAssignmentRepository;
    private final ClassTeacherAssignmentRepository classTeacherAssignmentRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final GuardianService guardianService;

    public ExamMarkingAccessPolicy(
            SubjectTeacherAssignmentRepository subjectTeacherAssignmentRepository,
            ClassTeacherAssignmentRepository classTeacherAssignmentRepository,
            TeacherRepository teacherRepository,
            StudentRepository studentRepository,
            GuardianService guardianService) {
        this.subjectTeacherAssignmentRepository = subjectTeacherAssignmentRepository;
        this.classTeacherAssignmentRepository = classTeacherAssignmentRepository;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.guardianService = guardianService;
    }

    public void assertMaySaveMarks(Exam exam, List<ExamDTOs.MarkEntry> marks) {
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            return;
        }
        String role = normalizeRole(TenantContext.getUserRole());
        if ("ADMIN".equals(role) || "SUPER_ADMIN".equals(role)) {
            return;
        }
        if (!"TEACHER".equals(role)) {
            throw new UnauthorizedException("Only teachers or admins may enter marks.");
        }
        Long userId = TenantContext.getUserId();
        Teacher teacher = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(TenantContext.getTenantId(), userId)
                .orElseThrow(() -> new UnauthorizedException("No teacher profile linked to this account."));
        LocalDate onDate = exam.getStartDate() != null ? exam.getStartDate() : LocalDate.now();
        for (ExamDTOs.MarkEntry m : marks) {
            Student st = studentRepository.findByIdAndTenantIdAndIsDeletedFalse(m.getStudentId(), TenantContext.getTenantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student", m.getStudentId()));
            if (m.getClassId() != null && st.getClassId() != null && !m.getClassId().equals(st.getClassId())) {
                throw new UnauthorizedException("Mark row class does not match the student's class.");
            }
            if (!teacherTeachesSubjectForStudent(teacher.getId(), exam.getAcademicYearId(), st, m.getSubjectName(), onDate)) {
                throw new UnauthorizedException("You are not assigned to enter marks for subject "
                        + m.getSubjectName() + " for this class.");
            }
        }
    }

    /**
     * Rows the current teacher may enter marks for on this exam (for UI scaffolding).
     */
    public List<ExamScopeDtos.MarksEntryScopeRow> marksEntryScopeForTeacher(Long examId, Exam exam) {
        String role = normalizeRole(TenantContext.getUserRole());
        if (!"TEACHER".equals(role) || TenantQueryPolicy.isPlatformSuperAdmin()) {
            return List.of();
        }
        Long userId = TenantContext.getUserId();
        Teacher teacher = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(TenantContext.getTenantId(), userId).orElse(null);
        if (teacher == null) {
            return List.of();
        }
        LocalDate onDate = exam.getStartDate() != null ? exam.getStartDate() : LocalDate.now();
        List<SubjectTeacherAssignment> assigns = subjectTeacherAssignmentRepository.findActiveForTeacher(
                TenantContext.getTenantId(), teacher.getId(), onDate);
        Long yearId = exam.getAcademicYearId();
        Set<String> seen = new LinkedHashSet<>();
        List<ExamScopeDtos.MarksEntryScopeRow> out = new ArrayList<>();
        for (SubjectTeacherAssignment a : assigns) {
            if (yearId != null && a.getAcademicYearId() != null && !yearId.equals(a.getAcademicYearId())) {
                continue;
            }
            String key = a.getClassId() + "|" + (a.getSectionId() != null ? a.getSectionId() : "") + "|" + normSubject(a.getSubjectName());
            if (!seen.add(key)) {
                continue;
            }
            ExamScopeDtos.MarksEntryScopeRow row = new ExamScopeDtos.MarksEntryScopeRow();
            row.setExamId(examId);
            row.setClassId(a.getClassId());
            row.setSectionId(a.getSectionId());
            row.setSubjectName(a.getSubjectName());
            out.add(row);
        }
        return out;
    }

    public void assertMayViewStudentMarks(Long studentId) {
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            return;
        }
        String role = normalizeRole(TenantContext.getUserRole());
        if ("ADMIN".equals(role) || "SUPER_ADMIN".equals(role)) {
            return;
        }
        String t = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        Student s = studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, t)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        if ("PARENT".equals(role)) {
            if (uid != null && (uid.equals(s.getParentId()) || guardianService.guardianUserHasAccessToStudent(t, uid, studentId))) {
                return;
            }
            throw new UnauthorizedException("You cannot view marks for this student.");
        }
        if ("TEACHER".equals(role)) {
            Teacher th = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(t, uid)
                    .orElseThrow(() -> new UnauthorizedException("No teacher profile linked to this account."));
            if (teacherHasAcademicAccessToStudent(th.getId(), s, LocalDate.now())) {
                return;
            }
            throw new UnauthorizedException("You cannot view marks for this student.");
        }
        throw new UnauthorizedException("You cannot view marks for this student.");
    }

    public List<MarkRecord> filterMarksForViewer(String role, Exam exam, List<MarkRecord> rows) {
        String nr = normalizeRole(role);
        if (TenantQueryPolicy.isPlatformSuperAdmin() || "ADMIN".equals(nr) || "SUPER_ADMIN".equals(nr)) {
            return rows;
        }
        if (!"TEACHER".equals(nr)) {
            return rows;
        }
        Long uid = TenantContext.getUserId();
        Teacher th = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(TenantContext.getTenantId(), uid).orElse(null);
        if (th == null) {
            return List.of();
        }
        LocalDate onDate = exam.getStartDate() != null ? exam.getStartDate() : LocalDate.now();
        return rows.stream()
                .filter(m -> teacherTeachesSubjectForClass(th.getId(), exam.getAcademicYearId(), m.getClassId(), null, m.getSubjectName(), onDate))
                .collect(Collectors.toList());
    }

    private boolean teacherHasAcademicAccessToStudent(Long teacherPk, Student s, LocalDate onDate) {
        if (s.getClassId() == null) {
            return false;
        }
        List<ClassTeacherAssignment> ct = classTeacherAssignmentRepository.findActiveForTeacher(TenantContext.getTenantId(), teacherPk, onDate);
        for (ClassTeacherAssignment a : ct) {
            if (s.getClassId().equals(a.getClassId()) && sectionMatches(a.getSectionId(), s.getSectionId())) {
                return true;
            }
        }
        List<SubjectTeacherAssignment> st = subjectTeacherAssignmentRepository.findActiveForTeacher(TenantContext.getTenantId(), teacherPk, onDate);
        for (SubjectTeacherAssignment a : st) {
            if (s.getClassId().equals(a.getClassId()) && sectionMatches(a.getSectionId(), s.getSectionId())) {
                return true;
            }
        }
        return false;
    }

    private boolean teacherTeachesSubjectForStudent(Long teacherPk, Long academicYearId, Student s, String subjectName, LocalDate onDate) {
        if (s.getClassId() == null) {
            return false;
        }
        return teacherTeachesSubjectForClass(teacherPk, academicYearId, s.getClassId(), s.getSectionId(), subjectName, onDate);
    }

    private boolean teacherTeachesSubjectForClass(
            Long teacherPk,
            Long academicYearId,
            Long classId,
            Long studentSectionId,
            String subjectName,
            LocalDate onDate) {
        List<SubjectTeacherAssignment> list = subjectTeacherAssignmentRepository.findActiveForTeacher(TenantContext.getTenantId(), teacherPk, onDate);
        String want = normSubject(subjectName);
        for (SubjectTeacherAssignment a : list) {
            if (!classId.equals(a.getClassId())) {
                continue;
            }
            if (academicYearId != null && a.getAcademicYearId() != null && !academicYearId.equals(a.getAcademicYearId())) {
                continue;
            }
            if (!sectionMatches(a.getSectionId(), studentSectionId)) {
                continue;
            }
            if (normSubject(a.getSubjectName()).equals(want)) {
                return true;
            }
        }
        return false;
    }

    private static boolean sectionMatches(Long assignmentSectionId, Long studentSectionId) {
        if (assignmentSectionId == null) {
            return true;
        }
        return studentSectionId != null && assignmentSectionId.equals(studentSectionId);
    }

    private static String normSubject(String s) {
        if (s == null) {
            return "";
        }
        return s.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private static String normalizeRole(String r) {
        if (r == null) {
            return "";
        }
        return r.trim().toUpperCase(Locale.ROOT);
    }
}
