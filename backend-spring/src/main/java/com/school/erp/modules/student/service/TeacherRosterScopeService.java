package com.school.erp.modules.student.service;

import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.entity.SubjectTeacherAssignment;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.academic.repository.SubjectTeacherAssignmentRepository;
import com.school.erp.modules.attendance.entity.AttendanceCoverAssignment;
import com.school.erp.modules.attendance.repository.AttendanceCoverAssignmentRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Roster and attendance policy for teachers within a tenant.
 * <p>
 * Student directory (paged list): school-wide read for linked teachers — {@link #allowedClassIdsForTeacherOnDate}
 * returns empty optional so {@link com.school.erp.modules.student.service.StudentService} does not apply class-id
 * scoping (same visibility as admin for read). Section-level class teacher (per-section homeroom) is a future phase.
 * </p>
 */
@Service
public class TeacherRosterScopeService {

    /**
     * Class and section identifiers for announcement / inbox audience matching (JPQL {@code in} lists).
     */
    public record CommunicationAudienceScope(Set<Long> classIds, Set<Long> sectionIds) {}

    private final TeacherRepository teacherRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final SubjectTeacherAssignmentRepository subjectTeacherAssignmentRepository;
    private final AttendanceCoverAssignmentRepository attendanceCoverAssignmentRepository;

    public TeacherRosterScopeService(
            TeacherRepository teacherRepository,
            SchoolClassRepository schoolClassRepository,
            SectionRepository sectionRepository,
            SubjectTeacherAssignmentRepository subjectTeacherAssignmentRepository,
            AttendanceCoverAssignmentRepository attendanceCoverAssignmentRepository) {
        this.teacherRepository = teacherRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.subjectTeacherAssignmentRepository = subjectTeacherAssignmentRepository;
        this.attendanceCoverAssignmentRepository = attendanceCoverAssignmentRepository;
    }

    /**
     * Used only by {@link com.school.erp.modules.student.service.StudentService#getStudents} to optionally narrow
     * by class for teachers. Returning {@link Optional#empty()} means “no extra class filter” (school-wide roster read).
     *
     * @return {@link Optional#empty()} for non-teachers and for linked teachers (full tenant roster read);
     * {@link Optional#of} an empty set when the account is TEACHER but no teacher profile exists (safe deny).
     */
    @Transactional(readOnly = true)
    public Optional<Set<Long>> allowedClassIdsForTeacherOnDate(LocalDate asOfDate) {
        String role = TenantContext.getUserRole();
        if (role == null || !role.trim().equalsIgnoreCase("TEACHER")) {
            return Optional.empty();
        }
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        if (userId == null) {
            return Optional.of(Set.of());
        }
        Optional<Teacher> t = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId);
        if (t.isEmpty()) {
            return Optional.of(Set.of());
        }
        return Optional.empty();
    }

    @Transactional(readOnly = true)
    public Optional<Set<Long>> allowedClassIdsForCurrentUser() {
        return allowedClassIdsForTeacherOnDate(LocalDate.now());
    }

    /**
     * {@link Optional#empty()} if the caller is not a teacher; otherwise homeroom + teaching assignments + covers,
     * with section ids from homeroom classes (full class) plus explicit section ids from assignments and covers.
     */
    @Transactional(readOnly = true)
    public Optional<CommunicationAudienceScope> communicationAudienceScopeForCurrentUser() {
        String raw = TenantContext.getUserRole();
        if (raw == null) {
            return Optional.empty();
        }
        String r = raw.trim().toUpperCase(Locale.ROOT);
        if (r.startsWith("ROLE_")) {
            r = r.substring(5);
        }
        if (!"TEACHER".equals(r)) {
            return Optional.empty();
        }
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        if (userId == null) {
            return Optional.of(new CommunicationAudienceScope(Set.of(), Set.of()));
        }
        Optional<Teacher> t = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId);
        if (t.isEmpty()) {
            return Optional.of(new CommunicationAudienceScope(Set.of(), Set.of()));
        }
        Long teacherPk = t.get().getId();
        LocalDate asOfDate = LocalDate.now();
        Set<Long> classIds = collectAllowedClassIds(tenantId, teacherPk, asOfDate);
        Set<Long> sectionIds = new HashSet<>();
        for (SchoolClass c : schoolClassRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherPk)) {
            for (Section sec : sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c.getId())) {
                sectionIds.add(sec.getId());
            }
        }
        for (SubjectTeacherAssignment a : subjectTeacherAssignmentRepository.findActiveForTeacher(tenantId, teacherPk, asOfDate)) {
            if (a.getSectionId() != null) {
                sectionIds.add(a.getSectionId());
            }
        }
        for (AttendanceCoverAssignment c : attendanceCoverAssignmentRepository
                .findByTenantIdAndCoverDateAndCoveringTeacherIdAndStatusAndIsDeletedFalse(tenantId, asOfDate, teacherPk, "ACTIVE")) {
            if (c.getSectionId() != null) {
                sectionIds.add(c.getSectionId());
            }
        }
        return Optional.of(new CommunicationAudienceScope(classIds, sectionIds));
    }

    private Set<Long> collectAllowedClassIds(String tenantId, Long teacherPk, LocalDate asOfDate) {
        Set<Long> ids = new HashSet<>();
        for (SchoolClass c : schoolClassRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherPk)) {
            ids.add(c.getId());
        }
        for (SubjectTeacherAssignment a : subjectTeacherAssignmentRepository.findActiveForTeacher(tenantId, teacherPk, asOfDate)) {
            if (a.getClassId() != null) {
                ids.add(a.getClassId());
            }
        }
        for (AttendanceCoverAssignment c : attendanceCoverAssignmentRepository
                .findByTenantIdAndCoverDateAndCoveringTeacherIdAndStatusAndIsDeletedFalse(tenantId, asOfDate, teacherPk, "ACTIVE")) {
            ids.add(c.getClassId());
        }
        return ids;
    }

    @Transactional(readOnly = true)
    public boolean teacherMayAccessStudentClass(Long studentClassId) {
        if (studentClassId == null) {
            return false;
        }
        String role = TenantContext.getUserRole();
        if (role == null || !role.trim().equalsIgnoreCase("TEACHER")) {
            return true;
        }
        String tenantId = TenantContext.getTenantId();
        return schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(studentClassId, tenantId).isPresent();
    }

    /**
     * Teachers may view and mark attendance for any class/section in their school (tenant), validated against
     * persisted class/section rows. UI may warn when acting outside homeroom; audit of “on behalf” marks is a future enhancement.
     */
    @Transactional(readOnly = true)
    public boolean teacherMayMarkAttendance(Long classId, Long sectionId, LocalDate date) {
        String role = TenantContext.getUserRole();
        if (role == null || !role.trim().equalsIgnoreCase("TEACHER")) {
            return true;
        }
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        if (userId == null) {
            return false;
        }
        if (teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId).isEmpty()) {
            return false;
        }
        if (classId == null || schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(classId, tenantId).isEmpty()) {
            return false;
        }
        if (sectionId != null && sectionId != 0L) {
            Optional<Section> sec = sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(sectionId, tenantId);
            return sec.map(s -> classId.equals(s.getClassId())).orElse(false);
        }
        return true;
    }
}
