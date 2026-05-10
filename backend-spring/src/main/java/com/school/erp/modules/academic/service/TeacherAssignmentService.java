package com.school.erp.modules.academic.service;

import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.academic.dto.TeacherAssignmentDTOs;
import com.school.erp.modules.academic.entity.ClassTeacherAssignment;
import com.school.erp.modules.academic.entity.SubjectTeacherAssignment;
import com.school.erp.modules.academic.repository.ClassTeacherAssignmentRepository;
import com.school.erp.modules.academic.repository.SubjectTeacherAssignmentRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class TeacherAssignmentService {

    private static final Logger log = LoggerFactory.getLogger(TeacherAssignmentService.class);

    private final ClassTeacherAssignmentRepository classTeacherRepo;
    private final SubjectTeacherAssignmentRepository subjectTeacherRepo;
    private final TeacherRepository teacherRepository;

    public TeacherAssignmentService(
            ClassTeacherAssignmentRepository classTeacherRepo,
            SubjectTeacherAssignmentRepository subjectTeacherRepo,
            TeacherRepository teacherRepository) {
        this.classTeacherRepo = classTeacherRepo;
        this.subjectTeacherRepo = subjectTeacherRepo;
        this.teacherRepository = teacherRepository;
    }

    /** Ends active homeroom assignment rows for the exact class / whole-class vs section slot. */
    @Transactional
    public void closeActiveHomeroomSlotAssignments(String tenantId, Long classId, Long sectionId, LocalDate effectiveEnd) {
        LocalDate d = LocalDate.now();
        LocalDate requestedEnd = effectiveEnd != null ? effectiveEnd : d;
        for (ClassTeacherAssignment a : classTeacherRepo.findActiveHomeroomSlot(tenantId, classId, sectionId, d)) {
            LocalDate safeEnd = normalizeEffectiveEnd(a, requestedEnd);
            if (Objects.equals(a.getEffectiveTo(), safeEnd)) {
                continue;
            }
            a.setEffectiveTo(safeEnd);
            classTeacherRepo.save(a);
        }
    }

    /**
     * Keeps assignment date ranges valid when lifecycle actions close a slot on the same day
     * it was opened (or when callers pass a past date).
     */
    private LocalDate normalizeEffectiveEnd(ClassTeacherAssignment assignment, LocalDate requestedEnd) {
        LocalDate start = assignment.getEffectiveFrom();
        if (start == null || !requestedEnd.isBefore(start)) {
            return requestedEnd;
        }
        log.debug(
                "Adjusting assignment close date to avoid invalid range assignmentId={} requestedEnd={} effectiveFrom={}",
                assignment.getId(), requestedEnd, start);
        return start;
    }

    /** Persists a class-teacher assignment row (used when admin assigns class teacher). */
    @Transactional
    public void recordClassTeacherAssignment(
            Long classId, Long sectionId, Long teacherId, Long academicYearId, LocalDate effectiveFrom) {
        String t = TenantContext.getTenantId();
        closeActiveHomeroomSlotAssignments(t, classId, sectionId, LocalDate.now().minusDays(1));
        log.debug("Recording class-teacher assignment classId={} sectionId={} teacherId={} academicYearId={}", classId, sectionId, teacherId, academicYearId);
        ClassTeacherAssignment a = new ClassTeacherAssignment();
        a.setTenantId(t);
        a.setAcademicYearId(academicYearId);
        a.setClassId(classId);
        a.setSectionId(sectionId);
        a.setTeacherId(teacherId);
        a.setEffectiveFrom(effectiveFrom != null ? effectiveFrom : LocalDate.now());
        classTeacherRepo.save(a);
        log.info("Class-teacher assignment recorded classId={} teacherId={}", classId, teacherId);
    }

    @Transactional
    public TeacherAssignmentDTOs.ClassTeacherAssignmentResponse createClassAssignment(
            TeacherAssignmentDTOs.CreateClassTeacherAssignmentRequest req) {
        String t = TenantContext.getTenantId();
        log.info("Creating class-teacher assignment classId={} teacherId={}", req.getClassId(), req.getTeacherId());
        ClassTeacherAssignment a = new ClassTeacherAssignment();
        a.setTenantId(t);
        a.setAcademicYearId(req.getAcademicYearId());
        a.setClassId(req.getClassId());
        a.setSectionId(req.getSectionId());
        a.setTeacherId(req.getTeacherId());
        a.setEffectiveFrom(req.getEffectiveFrom() != null ? req.getEffectiveFrom() : LocalDate.now());
        a.setEffectiveTo(req.getEffectiveTo());
        ClassTeacherAssignment saved = classTeacherRepo.save(a);
        log.info("Class-teacher assignment created id={}", saved.getId());
        return toClassResponse(saved);
    }

    @Transactional
    public TeacherAssignmentDTOs.SubjectTeacherAssignmentResponse createSubjectAssignment(
            TeacherAssignmentDTOs.CreateSubjectTeacherAssignmentRequest req) {
        String t = TenantContext.getTenantId();
        log.info("Creating subject-teacher assignment classId={} subject={} teacherId={}", req.getClassId(), req.getSubjectName(), req.getTeacherId());
        SubjectTeacherAssignment a = new SubjectTeacherAssignment();
        a.setTenantId(t);
        a.setAcademicYearId(req.getAcademicYearId());
        a.setClassId(req.getClassId());
        a.setSectionId(req.getSectionId());
        a.setSubjectName(req.getSubjectName().trim());
        a.setTeacherId(req.getTeacherId());
        a.setEffectiveFrom(req.getEffectiveFrom() != null ? req.getEffectiveFrom() : LocalDate.now());
        a.setEffectiveTo(req.getEffectiveTo());
        SubjectTeacherAssignment saved = subjectTeacherRepo.save(a);
        log.info("Subject-teacher assignment created id={}", saved.getId());
        return toSubjectResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TeacherAssignmentDTOs.ClassTeacherAssignmentResponse> listClassAssignments(Long classId, Long sectionId) {
        String t = TenantContext.getTenantId();
        LocalDate d = LocalDate.now();
        log.debug("Listing class-teacher assignments classId={} sectionId={}", classId, sectionId);
        List<TeacherAssignmentDTOs.ClassTeacherAssignmentResponse> list = classTeacherRepo.findActiveForClass(t, classId, sectionId, d).stream()
                .map(this::toClassResponse)
                .collect(Collectors.toList());
        log.info("Found {} class-teacher assignment(s) classId={}", list.size(), classId);
        return list;
    }

    @Transactional(readOnly = true)
    public List<TeacherAssignmentDTOs.SubjectTeacherAssignmentResponse> listSubjectAssignments(Long classId, Long sectionId) {
        String t = TenantContext.getTenantId();
        LocalDate d = LocalDate.now();
        log.debug("Listing subject-teacher assignments classId={} sectionId={}", classId, sectionId);
        List<TeacherAssignmentDTOs.SubjectTeacherAssignmentResponse> list = subjectTeacherRepo.findActiveForClass(t, classId, sectionId, d).stream()
                .map(this::toSubjectResponse)
                .collect(Collectors.toList());
        log.info("Found {} subject-teacher assignment(s) classId={}", list.size(), classId);
        return list;
    }

    @Transactional(readOnly = true)
    public TeacherAssignmentDTOs.TeacherWorkloadResponse getWorkload(Long teacherId) {
        String t = TenantContext.getTenantId();
        log.debug("Computing teacher workload teacherId={}", teacherId);
        LocalDate d = LocalDate.now();
        Teacher teacher = teacherRepository
                .findByIdAndTenantIdAndIsDeletedFalse(teacherId, t)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", teacherId));
        String name = teacher.getFirstName() + " " + teacher.getLastName();
        int ct = classTeacherRepo.findActiveForTeacher(t, teacherId, d).size();
        int st = subjectTeacherRepo.findActiveForTeacher(t, teacherId, d).size();
        TeacherAssignmentDTOs.TeacherWorkloadResponse r = new TeacherAssignmentDTOs.TeacherWorkloadResponse();
        r.setTeacherId(teacherId);
        r.setTeacherName(name.trim());
        r.setClassTeacherSlots(ct);
        r.setSubjectAssignments(st);
        log.info("Teacher workload teacherId={} classSlots={} subjectSlots={}", teacherId, ct, st);
        return r;
    }

    private TeacherAssignmentDTOs.ClassTeacherAssignmentResponse toClassResponse(ClassTeacherAssignment a) {
        TeacherAssignmentDTOs.ClassTeacherAssignmentResponse r = new TeacherAssignmentDTOs.ClassTeacherAssignmentResponse();
        r.setId(a.getId());
        r.setAcademicYearId(a.getAcademicYearId());
        r.setClassId(a.getClassId());
        r.setSectionId(a.getSectionId());
        r.setTeacherId(a.getTeacherId());
        r.setEffectiveFrom(a.getEffectiveFrom());
        r.setEffectiveTo(a.getEffectiveTo());
        teacherRepository
                .findByIdAndTenantIdAndIsDeletedFalse(a.getTeacherId(), TenantContext.getTenantId())
                .ifPresent(tr -> r.setTeacherName(tr.getFirstName() + " " + tr.getLastName()));
        return r;
    }

    private TeacherAssignmentDTOs.SubjectTeacherAssignmentResponse toSubjectResponse(SubjectTeacherAssignment a) {
        TeacherAssignmentDTOs.SubjectTeacherAssignmentResponse r = new TeacherAssignmentDTOs.SubjectTeacherAssignmentResponse();
        r.setId(a.getId());
        r.setAcademicYearId(a.getAcademicYearId());
        r.setClassId(a.getClassId());
        r.setSectionId(a.getSectionId());
        r.setSubjectName(a.getSubjectName());
        r.setTeacherId(a.getTeacherId());
        r.setEffectiveFrom(a.getEffectiveFrom());
        r.setEffectiveTo(a.getEffectiveTo());
        teacherRepository
                .findByIdAndTenantIdAndIsDeletedFalse(a.getTeacherId(), TenantContext.getTenantId())
                .ifPresent(tr -> r.setTeacherName(tr.getFirstName() + " " + tr.getLastName()));
        return r;
    }
}
