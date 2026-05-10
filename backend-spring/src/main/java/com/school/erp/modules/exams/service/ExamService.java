package com.school.erp.modules.exams.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.jpa.EntitySnapshotCollections;
import com.school.erp.cache.CacheService;
import com.school.erp.modules.parent.cache.ParentPortalExamPageCache;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.audit.service.AuditService;
import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.exams.dto.ExamScopeDtos;
import com.school.erp.modules.exams.entity.*;
import com.school.erp.modules.exams.policy.ExamMarkingAccessPolicy;
import com.school.erp.modules.exams.repository.*;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantScopedExecution;
import com.school.erp.tenant.TenantQueryPolicy;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExamService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ExamService.class);
    private final ExamRepository examRepo;
    private final MarkRecordRepository markRepo;
    private final ExamClassScopeRepository scopeRepo;
    private final ExamScheduleSlotRepository scheduleRepo;
    private final SchoolClassRepository classRepo;
    private final SectionRepository sectionRepo;
    private final ExamMarkingAccessPolicy markingAccessPolicy;
    private final StudentRepository studentRepository;
    private final ParentPortalExamPageCache parentPortalExamPageCache;
    private final ExamTemplateRepository templateRepository;
    private final ExamTemplateComponentRepository templateComponentRepository;
    private final ExamPublicationSnapshotRepository publicationSnapshotRepository;
    private final ExamEventLogRepository examEventLogRepository;
    private final ExamNotificationJobRepository examNotificationJobRepository;
    private final ExamBulkOperationLogRepository examBulkOperationLogRepository;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;
    private final ObjectProvider<CacheService> cacheService;

    @Transactional(readOnly = true)
    public List<ExamDTOs.ExamResponse> getExams() {
        String t = TenantContext.getTenantId();
        return examRepo.findByTenantIdAndIsDeletedFalse(t).stream().map(this::toExamResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<ExamDTOs.ExamResponse> getExamsPaged(int page, int size, String q, String status) {
        String t = TenantContext.getTenantId();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("startDate"), Sort.Order.asc("name")));
        Enums.ExamStatus st = null;
        if (status != null && !status.isBlank()) {
            try {
                st = Enums.ExamStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                st = null;
            }
        }
        String qq = q != null && !q.isBlank() ? q.trim() : null;
        Page<Exam> pg;
        if (st != null && qq != null) {
            pg = examRepo.findByTenantIdAndIsDeletedFalseAndStatusAndNameContainingIgnoreCase(t, st, qq, pageable);
        } else if (st != null) {
            pg = examRepo.findByTenantIdAndIsDeletedFalseAndStatus(t, st, pageable);
        } else if (qq != null) {
            pg = examRepo.findByTenantIdAndIsDeletedFalseAndNameContainingIgnoreCase(t, qq, pageable);
        } else {
            pg = examRepo.findByTenantIdAndIsDeletedFalse(t, pageable);
        }
        return PageResponse.fromSpringPage(pg.map(this::toExamResponse));
    }

    @Transactional
    public ExamDTOs.ExamResponse createExam(ExamDTOs.CreateExamRequest req) {
        String tenant = TenantContext.getTenantId();
        String role = normalizeRole(TenantContext.getUserRole());
        List<Long> classIds = resolveClassIdsForCreate(req);
        if (classIds == null || classIds.isEmpty()) {
            throw new BusinessException("At least one class is required");
        }
        Exam exam = Exam.builder()
                .name(req.getName())
                .academicYearId(req.getAcademicYearId())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .classIds(classIds)
                .status(Enums.ExamStatus.UPCOMING)
                .build();
        exam.setGradingConfigJson(buildGradingConfigJson(req));
        exam.setWorkflowState(defaultWorkflowStateForCreatorRole(role));
        exam.setWorkflowNote(null);
        exam.setTenantId(tenant);
        examRepo.save(exam);
        persistClassScopes(tenant, exam.getId(), req, classIds);
        log.info("Exam created: {}", exam.getName());
        auditService.logCreate("EXAMS", "Created exam " + exam.getName() + " (state=" + exam.getWorkflowState() + ")", exam.getId());
        parentPortalExamPageCache.invalidateTenant(tenant);
        refreshReportCaches();
        return toExamResponse(exam);
    }

    @Transactional
    public ExamDTOs.ExamResponse updateExamStatus(Long examId, String status) {
        Exam exam = requireExam(examId);
        exam.setStatus(Enums.ExamStatus.valueOf(status.toUpperCase()));
        examRepo.save(exam);
        parentPortalExamPageCache.invalidateTenant(exam.getTenantId());
        refreshReportCaches();
        return toExamResponse(exam);
    }

    @Transactional
    public ExamDTOs.ExamResponse setResultsPublished(Long examId, boolean published) {
        Exam exam = requireExam(examId);
        exam.setResultsPublished(published);
        if (published) {
            exam.setWorkflowState("PUBLISHED");
            exam.setPublishedAt(java.time.LocalDateTime.now());
        }
        examRepo.save(exam);
        auditService.logUpdate("EXAMS", (published ? "Published" : "Unpublished") + " exam results", examId, null, "resultsPublished=" + published);
        parentPortalExamPageCache.invalidateTenant(exam.getTenantId());
        refreshReportCaches();
        return toExamResponse(exam);
    }

    @Transactional
    public ExamDTOs.ExamResponse submitExamForApproval(Long examId, ExamDTOs.WorkflowActionRequest req) {
        Exam exam = requireExam(examId);
        ensureOneOfStates(exam, "DRAFT", "REJECTED");
        exam.setWorkflowState("PENDING_APPROVAL");
        exam.setWorkflowNote(trimNote(req != null ? req.getNote() : null));
        examRepo.save(exam);
        auditService.logUpdate("EXAMS", "Submitted exam for approval", examId, null, exam.getWorkflowState());
        parentPortalExamPageCache.invalidateTenant(exam.getTenantId());
        refreshReportCaches();
        return toExamResponse(exam);
    }

    @Transactional
    public ExamDTOs.ExamResponse approveExam(Long examId, ExamDTOs.WorkflowActionRequest req) {
        Exam exam = requireExam(examId);
        ensureOneOfStates(exam, "PENDING_APPROVAL");
        boolean publishNow = req != null && Boolean.TRUE.equals(req.getPublishNow());
        exam.setWorkflowState(publishNow ? "PUBLISHED" : "APPROVED");
        exam.setWorkflowNote(trimNote(req != null ? req.getNote() : null));
        if (publishNow) {
            exam.setPublishedAt(java.time.LocalDateTime.now());
        }
        examRepo.save(exam);
        auditService.logUpdate("EXAMS", "Approved exam " + (publishNow ? "and published" : ""), examId, null, exam.getWorkflowState());
        parentPortalExamPageCache.invalidateTenant(exam.getTenantId());
        refreshReportCaches();
        return toExamResponse(exam);
    }

    @Transactional
    public ExamDTOs.ExamResponse rejectExam(Long examId, ExamDTOs.WorkflowActionRequest req) {
        Exam exam = requireExam(examId);
        ensureOneOfStates(exam, "PENDING_APPROVAL");
        exam.setWorkflowState("REJECTED");
        exam.setWorkflowNote(trimNote(req != null ? req.getNote() : null));
        examRepo.save(exam);
        auditService.logUpdate("EXAMS", "Rejected exam", examId, null, exam.getWorkflowState());
        parentPortalExamPageCache.invalidateTenant(exam.getTenantId());
        refreshReportCaches();
        return toExamResponse(exam);
    }

    @Transactional
    public ExamDTOs.ExamResponse setExamPublished(Long examId, boolean published, ExamDTOs.WorkflowActionRequest req) {
        Exam exam = requireExam(examId);
        ensureOneOfStates(exam, "APPROVED", "PUBLISHED");
        exam.setWorkflowState(published ? "PUBLISHED" : "APPROVED");
        exam.setWorkflowNote(trimNote(req != null ? req.getNote() : null));
        if (published) {
            exam.setPublishedAt(java.time.LocalDateTime.now());
        }
        examRepo.save(exam);
        createPublicationSnapshot(exam, "WORKFLOW_PUBLISH", req != null ? req.getNote() : null);
        queuePublicationNotifications(exam, "EXAM_PUBLISHED");
        appendExamEvent(exam.getId(), "WORKFLOW_PUBLISH", Map.of("published", published));
        auditService.logUpdate("EXAMS", (published ? "Published" : "Unpublished") + " exam timetable", examId, null, exam.getWorkflowState());
        parentPortalExamPageCache.invalidateTenant(exam.getTenantId());
        refreshReportCaches();
        return toExamResponse(exam);
    }

    @Transactional
    public ExamDTOs.ExamResponse freezeExam(Long examId, ExamDTOs.WorkflowActionRequest req) {
        Exam exam = requireExam(examId);
        ensureOneOfStates(exam, "APPROVED", "PUBLISHED");
        exam.setWorkflowState("FROZEN");
        exam.setFrozenAt(java.time.LocalDateTime.now());
        exam.setWorkflowNote(trimNote(req != null ? req.getNote() : null));
        examRepo.save(exam);
        auditService.logUpdate("EXAMS", "Froze exam edits", examId, null, "FROZEN");
        parentPortalExamPageCache.invalidateTenant(exam.getTenantId());
        return toExamResponse(exam);
    }

    @Transactional(readOnly = true)
    public List<ExamScopeDtos.ScheduleSlotOut> getSchedule(Long examId) {
        Exam exam = requireExam(examId);
        String examTenant = exam.getTenantId();
        return scheduleRepo.findByTenantIdAndExamIdAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(examTenant, examId).stream().map(this::toScheduleOut).collect(Collectors.toList());
    }

    @Transactional
    public List<ExamScopeDtos.ScheduleSlotOut> replaceSchedule(Long examId, ExamScopeDtos.ReplaceScheduleRequest body) {
        Exam exam = requireExam(examId);
        assertExamEditable(exam);
        String t = exam.getTenantId();
        List<ExamScheduleSlot> existing = scheduleRepo.findByTenantIdAndExamIdAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(t, examId);
        for (ExamScheduleSlot s : existing) {
            s.setIsDeleted(true);
        }
        scheduleRepo.saveAll(existing);
        List<ExamScheduleSlot> created = new ArrayList<>();
        if (body.getSlots() != null) {
            ensureScheduleRowsValidForExam(exam, body.getSlots());
            for (ExamScopeDtos.ScheduleSlotIn in : body.getSlots()) {
                if (in.getClassId() == null || in.getSubjectName() == null || in.getSubjectName().isBlank()) {
                    continue;
                }
                LocalDate d;
                LocalTime st;
                LocalTime et;
                try {
                    d = LocalDate.parse(in.getExamDate());
                    st = LocalTime.parse(in.getStartTime());
                    et = LocalTime.parse(in.getEndTime());
                } catch (DateTimeParseException | NullPointerException ex) {
                    throw new BusinessException("Invalid date or time on schedule row: " + in.getSubjectName());
                }
                ExamScheduleSlot row = new ExamScheduleSlot();
                row.setTenantId(t);
                row.setExamId(examId);
                row.setClassId(in.getClassId());
                row.setSectionId(in.getSectionId());
                row.setSubjectName(in.getSubjectName().trim());
                row.setPaperType(in.getPaperType() != null ? in.getPaperType().trim() : null);
                row.setInvigilatorName(in.getInvigilatorName() != null ? in.getInvigilatorName().trim() : null);
                row.setExamDate(d);
                row.setStartTime(st);
                row.setEndTime(et);
                row.setRoom(in.getRoom());
                row.setNotes(in.getNotes());
                row.setIsDeleted(false);
                created.add(row);
            }
        }
        scheduleRepo.saveAll(created);
        appendExamEvent(examId, "TIMETABLE_REPLACED", Map.of("rows", created.size()));
        log.info("Exam schedule replaced: exam={} rows={}", examId, created.size());
        parentPortalExamPageCache.invalidateTenant(t);
        refreshReportCaches();
        return created.stream().map(this::toScheduleOut).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExamDTOs.MarkResponse> getMarksByExam(Long examId) {
        Exam exam = requireExam(examId);
        String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole().trim().toUpperCase(Locale.ROOT) : "";
        List<MarkRecord> raw = markRepo.findByTenantIdAndExamId(TenantContext.getTenantId(), examId);
        List<MarkRecord> visible = markingAccessPolicy.filterMarksForViewer(role, exam, raw);
        return visible.stream().map(this::toMarkResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExamDTOs.MarkResponse> getMarksByStudent(Long studentId) {
        markingAccessPolicy.assertMayViewStudentMarks(studentId);
        return markRepo.findByTenantIdAndStudentId(TenantContext.getTenantId(), studentId).stream().map(this::toMarkResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExamScopeDtos.MarksEntryScopeRow> getMarksEntryScope(Long examId) {
        Exam exam = requireExam(examId);
        return markingAccessPolicy.marksEntryScopeForTeacher(examId, exam);
    }

    /**
     * Parent portal: exams whose class/section scope includes this child (cancelled omitted).
     */
    @Transactional(readOnly = true)
    public List<ExamDTOs.ParentExamSummaryResponse> listExamsForParentStudent(Long classId, Long sectionId) {
        String t = TenantContext.getTenantId();
        return examRepo.findByTenantIdAndIsDeletedFalse(t).stream()
                .filter(e -> e.getStatus() != Enums.ExamStatus.CANCELLED)
                .filter(e -> studentMatchesExamScope(t, e, classId, sectionId))
                .sorted(Comparator
                        .comparing((Exam e) -> e.getStartDate(), Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed()
                        .thenComparing(Exam::getId, Comparator.reverseOrder()))
                .map(this::toParentExamSummary)
                .collect(Collectors.toList());
    }

    /**
     * Parent portal (aggregated): exams whose audience intersects any linked child’s class/section.
     * Same payload shape as {@link #getExams()} for staff — UI can render cards without a second round-trip.
     */
    @Transactional(readOnly = true)
    public List<ExamDTOs.ExamResponse> listExamsForLinkedStudents(String tenantId, List<Student> linkedChildren) {
        return listExamsForLinkedStudentsPaged(tenantId, linkedChildren, 0, Integer.MAX_VALUE).getContent();
    }

    /**
     * Paged parent portal exam list (same DTO shape as full list). Uses batched scope/schedule queries per slice.
     */
    @Transactional(readOnly = true)
    public PageResponse<ExamDTOs.ExamResponse> listExamsForLinkedStudentsPaged(String tenantId, List<Student> linkedChildren, int page, int size) {
        if (linkedChildren == null || linkedChildren.isEmpty()) {
            return PageResponse.of(List.of(), page, size, 0);
        }
        List<Exam> all = examRepo.findByTenantIdAndIsDeletedFalse(tenantId);
        if (all.isEmpty()) {
            return PageResponse.of(List.of(), page, size, 0);
        }
        List<Long> allIds = all.stream().map(Exam::getId).collect(Collectors.toList());
        Map<Long, List<ExamClassScope>> scopesByExam = scopeRepo.findByTenantIdAndExamIdInAndIsDeletedFalse(tenantId, allIds).stream()
                .collect(Collectors.groupingBy(ExamClassScope::getExamId));

        List<Exam> visible = all.stream()
                .filter(e -> e.getStatus() != Enums.ExamStatus.CANCELLED)
                .filter(e -> linkedChildren.stream().anyMatch(st ->
                        st.getClassId() != null && studentMatchesExamScope(tenantId, e, st.getClassId(), st.getSectionId(), scopesByExam)))
                .sorted(Comparator
                        .comparing((Exam e) -> e.getStartDate(), Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed()
                        .thenComparing(Exam::getId, Comparator.reverseOrder()))
                .collect(Collectors.toList());

        long total = visible.size();
        if (size <= 0) {
            size = 20;
        }
        int from = Math.max(0, page) * size;
        if (from >= visible.size()) {
            return PageResponse.of(List.of(), page, size, total);
        }
        int to = Math.min(from + size, visible.size());
        List<Exam> slice = visible.subList(from, to);
        List<Long> sliceIds = slice.stream().map(Exam::getId).collect(Collectors.toList());
        Map<Long, List<ExamScheduleSlot>> slotsByExam = sliceIds.isEmpty()
                ? Map.of()
                : scheduleRepo.findByTenantIdAndExamIdInAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(tenantId, sliceIds).stream()
                .collect(Collectors.groupingBy(ExamScheduleSlot::getExamId));

        List<ExamDTOs.ExamResponse> content = slice.stream()
                .map(e -> toExamResponseForParentPortal(e, tenantId, linkedChildren, scopesByExam, slotsByExam.getOrDefault(e.getId(), List.of())))
                .collect(Collectors.toList());
        log.debug("Parent portal exam page tenant={} linkedChildren={} page={} size={} total={}", tenantId, linkedChildren.size(), page, size, total);
        return PageResponse.of(content, page, size, total);
    }

    /**
     * Parent portal: timetable rows for this child’s class/section only.
     */
    @Transactional(readOnly = true)
    public List<ExamScopeDtos.ScheduleSlotOut> listScheduleForParentStudent(Long examId, Long classId, Long sectionId) {
        Exam exam = requireExam(examId);
        String t = exam.getTenantId();
        if (!studentMatchesExamScope(t, exam, classId, sectionId)) {
            throw new UnauthorizedException("This exam is not available for your child’s class.");
        }
        return scheduleRepo.findByTenantIdAndExamIdAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(t, examId).stream()
                .map(this::toScheduleOut)
                .filter(slot -> scheduleRowVisibleToStudent(slot, classId, sectionId))
                .collect(Collectors.toList());
    }

    /**
     * Parent portal: published marks for one exam and student, scope-checked.
     */
    @Transactional(readOnly = true)
    public List<ExamDTOs.MarkResponse> listPublishedMarksForParentExam(Long studentId, Long examId, Long classId, Long sectionId) {
        Exam exam = requireExam(examId);
        String t = exam.getTenantId();
        if (!studentMatchesExamScope(t, exam, classId, sectionId)) {
            throw new UnauthorizedException("This exam is not available for your child’s class.");
        }
        if (!Boolean.TRUE.equals(exam.getResultsPublished())) {
            return List.of();
        }
        return markRepo.findByTenantIdAndExamId(t, examId).stream()
                .filter(m -> studentId.equals(m.getStudentId()))
                .map(this::toMarkResponse)
                .collect(Collectors.toList());
    }

    /**
     * Parent portal: all published marks for a student across in-scope exams (aggregated “results” tab).
     */
    @Transactional(readOnly = true)
    public List<ExamDTOs.MarkResponse> listPublishedMarksForParentStudent(Long studentId, Long classId, Long sectionId) {
        String t = TenantContext.getTenantId();
        List<MarkRecord> all = markRepo.findByTenantIdAndStudentId(t, studentId);
        List<ExamDTOs.MarkResponse> out = new ArrayList<>();
        for (MarkRecord m : all) {
            Exam ex = examRepo.findByIdAndTenantIdAndIsDeletedFalse(m.getExamId(), t).orElse(null);
            if (ex == null || !Boolean.TRUE.equals(ex.getResultsPublished())) {
                continue;
            }
            if (!studentMatchesExamScope(t, ex, classId, sectionId)) {
                continue;
            }
            out.add(toMarkResponse(m));
        }
        out.sort(Comparator.comparing(ExamDTOs.MarkResponse::getExamId, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(ExamDTOs.MarkResponse::getId, Comparator.nullsLast(Comparator.naturalOrder())));
        return out;
    }

    private boolean studentMatchesExamScope(String tenantId, Exam exam, Long classId, Long sectionId) {
        List<ExamClassScope> scopes = scopeRepo.findByTenantIdAndExamIdAndIsDeletedFalse(tenantId, exam.getId());
        Map<Long, List<ExamClassScope>> map = Map.of(exam.getId(), scopes);
        return studentMatchesExamScope(tenantId, exam, classId, sectionId, map);
    }

    private boolean studentMatchesExamScope(String tenantId, Exam exam, Long classId, Long sectionId, Map<Long, List<ExamClassScope>> scopesByExam) {
        if (classId == null) {
            return false;
        }
        List<ExamClassScope> scopes = scopesByExam.getOrDefault(exam.getId(), List.of());
        if (!scopes.isEmpty()) {
            return scopes.stream().anyMatch(sc ->
                    classId.equals(sc.getClassId())
                            && (sc.getSectionId() == null || (sectionId != null && sc.getSectionId().equals(sectionId))));
        }
        List<Long> ids = exam.getClassIds();
        return ids != null && ids.contains(classId);
    }

    private boolean scheduleRowVisibleToStudent(ExamScopeDtos.ScheduleSlotOut slot, Long classId, Long sectionId) {
        if (classId == null || slot.getClassId() == null || !slot.getClassId().equals(classId)) {
            return false;
        }
        if (slot.getSectionId() == null) {
            return true;
        }
        return sectionId != null && slot.getSectionId().equals(sectionId);
    }

    private ExamDTOs.ParentExamSummaryResponse toParentExamSummary(Exam e) {
        ExamDTOs.ParentExamSummaryResponse r = new ExamDTOs.ParentExamSummaryResponse();
        r.setId(e.getId());
        r.setName(e.getName());
        r.setAcademicYearId(e.getAcademicYearId());
        r.setStartDate(e.getStartDate() != null ? e.getStartDate().toString() : null);
        r.setEndDate(e.getEndDate() != null ? e.getEndDate().toString() : null);
        r.setStatus(e.getStatus() != null ? e.getStatus().name().toLowerCase(Locale.ROOT) : null);
        r.setResultsPublished(Boolean.TRUE.equals(e.getResultsPublished()));
        return r;
    }

    @Transactional
    public List<ExamDTOs.MarkResponse> saveMarks(ExamDTOs.BulkMarksRequest req) {
        Exam exam = requireExam(req.getExamId());
        assertMarksEntryAllowed(exam);
        markingAccessPolicy.assertMaySaveMarks(exam, req.getMarks());
        String t = TenantContext.getTenantId();
        String requestId = req.getRequestId() != null ? req.getRequestId().trim() : "";
        if (!requestId.isEmpty()) {
            Optional<ExamBulkOperationLog> existingOp =
                    examBulkOperationLogRepository.findByTenantIdAndOperationTypeAndRequestIdAndIsDeletedFalse(t, "BULK_MARKS_SAVE", requestId);
            if (existingOp.isPresent() && existingOp.get().getResponseJson() != null) {
                try {
                    List<ExamDTOs.MarkResponse> cached =
                            objectMapper.readValue(existingOp.get().getResponseJson(), new TypeReference<List<ExamDTOs.MarkResponse>>() {});
                    return cached;
                } catch (Exception ignored) {
                    // continue as fresh operation
                }
            }
        }
        List<MarkRecord> records = req.getMarks().stream().map(m -> {
            validateMarkEntry(m);
            double pct = m.getMaxMarks() > 0 ? (m.getMarksObtained() / m.getMaxMarks()) * 100 : 0;
            String grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 40 ? "D" : "F";
            MarkRecord rec = MarkRecord.builder()
                    .examId(req.getExamId())
                    .studentId(m.getStudentId())
                    .studentName(m.getStudentName())
                    .subjectName(m.getSubjectName())
                    .marksObtained(m.getMarksObtained())
                    .maxMarks(m.getMaxMarks())
                    .grade(grade)
                    .classId(m.getClassId())
                    .build();
            rec.setTenantId(t);
            return rec;
        }).collect(Collectors.toList());
        markRepo.saveAll(records);
        List<ExamDTOs.MarkResponse> response = records.stream().map(this::toMarkResponse).collect(Collectors.toList());
        if (!requestId.isEmpty()) {
            try {
                ExamBulkOperationLog op = new ExamBulkOperationLog();
                op.setTenantId(t);
                op.setOperationType("BULK_MARKS_SAVE");
                op.setRequestId(requestId);
                op.setExamId(req.getExamId());
                op.setStatus("COMPLETED");
                op.setResponseJson(objectMapper.writeValueAsString(response));
                examBulkOperationLogRepository.save(op);
            } catch (Exception ignored) {
                // idempotency cache is best effort, DB unique key still protects duplicates
            }
        }
        appendExamEvent(req.getExamId(), "MARKS_SAVED", Map.of("rows", records.size(), "requestId", requestId));
        log.info("Marks saved: exam={} count={}", req.getExamId(), records.size());
        auditService.logUpdate("EXAMS", "Saved marks rows=" + records.size(), req.getExamId(), null, "MARKS_SAVED");
        parentPortalExamPageCache.invalidateTenant(t);
        refreshReportCaches();
        return response;
    }

    @Transactional
    public ExamDTOs.TemplateResponse upsertTemplate(ExamDTOs.UpsertTemplateRequest req) {
        String t = TenantContext.getTenantId();
        if (req == null || req.getName() == null || req.getName().isBlank() || req.getBoardType() == null || req.getBoardType().isBlank()) {
            throw new BusinessException("Template name and board type are required.");
        }
        ExamTemplate row;
        if (req.getId() != null) {
            row = templateRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getId(), t)
                    .orElseThrow(() -> new ResourceNotFoundException("ExamTemplate", req.getId()));
        } else {
            row = new ExamTemplate();
            row.setTenantId(t);
        }
        row.setName(req.getName().trim());
        row.setBoardType(req.getBoardType().trim().toUpperCase(Locale.ROOT));
        row.setClassBand(req.getClassBand() != null ? req.getClassBand().trim() : null);
        row.setDefaultMarkingScheme(req.getDefaultMarkingScheme() != null ? req.getDefaultMarkingScheme().trim().toLowerCase(Locale.ROOT) : null);
        validateRules(req.getRules());
        row.setRulesJson(writeJson(req.getRules()));
        templateRepository.save(row);
        List<ExamTemplateComponent> old = templateComponentRepository.findByTenantIdAndTemplateIdAndIsDeletedFalseOrderByIdAsc(t, row.getId());
        for (ExamTemplateComponent c : old) {
            c.setIsDeleted(true);
        }
        templateComponentRepository.saveAll(old);
        List<ExamTemplateComponent> comps = new ArrayList<>();
        for (ExamDTOs.TemplateComponentIn in : req.getComponents() != null ? req.getComponents() : List.<ExamDTOs.TemplateComponentIn>of()) {
            if (in.getComponentCode() == null || in.getComponentCode().isBlank()) continue;
            ExamTemplateComponent c = new ExamTemplateComponent();
            c.setTenantId(t);
            c.setTemplateId(row.getId());
            c.setComponentCode(in.getComponentCode().trim().toUpperCase(Locale.ROOT));
            c.setComponentLabel(in.getComponentLabel() != null ? in.getComponentLabel().trim() : in.getComponentCode().trim());
            c.setMaxMarks(BigDecimal.valueOf(in.getMaxMarks() != null ? in.getMaxMarks() : 0.0));
            c.setWeightagePct(BigDecimal.valueOf(in.getWeightagePct() != null ? in.getWeightagePct() : 0.0));
            c.setOptional(Boolean.TRUE.equals(in.getOptional()));
            c.setRuleJson(writeJson(in.getRule()));
            comps.add(c);
        }
        templateComponentRepository.saveAll(comps);
        return toTemplateOut(row, comps);
    }

    @Transactional(readOnly = true)
    public List<ExamDTOs.TemplateResponse> listTemplates() {
        String t = TenantContext.getTenantId();
        List<ExamTemplate> rows = templateRepository.findByTenantIdAndIsDeletedFalseOrderByNameAsc(t);
        List<Long> ids = rows.stream().map(ExamTemplate::getId).toList();
        Map<Long, List<ExamTemplateComponent>> compByTpl = new HashMap<>();
        for (Long id : ids) {
            compByTpl.put(id, templateComponentRepository.findByTenantIdAndTemplateIdAndIsDeletedFalseOrderByIdAsc(t, id));
        }
        return rows.stream().map(r -> toTemplateOut(r, compByTpl.getOrDefault(r.getId(), List.of()))).toList();
    }

    @Transactional(readOnly = true)
    public List<ExamDTOs.PublicationSnapshotResponse> listPublicationSnapshots(Long examId) {
        Exam exam = requireExam(examId);
        return publicationSnapshotRepository
                .findByTenantIdAndExamIdAndIsDeletedFalseOrderByVersionNoDesc(exam.getTenantId(), examId)
                .stream()
                .map(this::toSnapshotOut)
                .toList();
    }

    @Transactional
    public ExamDTOs.ExamResponse rollbackToSnapshot(Long examId, ExamDTOs.RollbackToVersionRequest req) {
        if (req == null || req.getVersionNo() == null) {
            throw new BusinessException("Version is required for rollback.");
        }
        Exam exam = requireExam(examId);
        ExamPublicationSnapshot snap = publicationSnapshotRepository
                .findByTenantIdAndExamIdAndVersionNoAndIsDeletedFalse(exam.getTenantId(), examId, req.getVersionNo())
                .orElseThrow(() -> new ResourceNotFoundException("ExamPublicationSnapshot version", Long.valueOf(req.getVersionNo())));
        try {
            Map<String, Object> payload = objectMapper.readValue(snap.getSnapshotJson(), new TypeReference<>() {});
            Object gradingCfg = payload.get("gradingConfigJson");
            if (gradingCfg instanceof String s) {
                exam.setGradingConfigJson(s);
            }
            Object wf = payload.get("workflowState");
            if (wf instanceof String s) {
                exam.setWorkflowState(s);
            }
            exam.setWorkflowNote(trimNote(req.getNote()));
            examRepo.save(exam);
            appendExamEvent(examId, "ROLLBACK_TO_SNAPSHOT", Map.of("version", req.getVersionNo()));
            return toExamResponse(exam);
        } catch (Exception ex) {
            throw new BusinessException("Could not rollback from snapshot payload.");
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<ExamDTOs.ExamEventLogResponse> listExamEvents(Long examId, int page, int size) {
        Exam exam = requireExam(examId);
        Page<ExamEventLog> logs = examEventLogRepository.findByTenantIdAndExamIdAndIsDeletedFalseOrderByCreatedAtDesc(
                exam.getTenantId(),
                examId,
                PageRequest.of(page, size));
        return PageResponse.fromSpringPage(logs.map(this::toEventOut));
    }

    @Transactional(readOnly = true)
    public PageResponse<ExamDTOs.NotificationJobResponse> listExamNotificationJobs(Long examId, int page, int size) {
        Exam exam = requireExam(examId);
        Page<ExamNotificationJob> jobs = examNotificationJobRepository.findByTenantIdAndExamIdAndIsDeletedFalseOrderByCreatedAtDesc(
                exam.getTenantId(),
                examId,
                PageRequest.of(page, size));
        return PageResponse.fromSpringPage(jobs.map(this::toNotificationJobOut));
    }

    @Transactional(readOnly = true)
    public PageResponse<ExamDTOs.BulkOperationLogResponse> listExamBulkOps(Long examId, int page, int size) {
        Exam exam = requireExam(examId);
        Page<ExamBulkOperationLog> ops = examBulkOperationLogRepository.findByTenantIdAndExamIdAndIsDeletedFalseOrderByCreatedAtDesc(
                exam.getTenantId(),
                examId,
                PageRequest.of(page, size));
        return PageResponse.fromSpringPage(ops.map(this::toBulkOpOut));
    }

    @Transactional
    public int processPendingNotificationJobs(int batchSize) {
        int safeBatchSize = Math.max(1, Math.min(batchSize, 200));
        LocalDateTime now = LocalDateTime.now();
        List<String> processableStates = List.of("PENDING", "RETRY");
        List<ExamNotificationJob> jobs = new ArrayList<>();
        jobs.addAll(examNotificationJobRepository
                .findByStatusInAndIsDeletedFalseAndNextRetryAtIsNullOrderByCreatedAtAsc(
                        processableStates,
                        PageRequest.of(0, safeBatchSize)));
        if (jobs.size() < safeBatchSize) {
            List<ExamNotificationJob> retryDue = examNotificationJobRepository
                    .findByStatusInAndIsDeletedFalseAndNextRetryAtLessThanEqualOrderByNextRetryAtAscCreatedAtAsc(
                            processableStates,
                            now,
                            PageRequest.of(0, safeBatchSize - jobs.size()));
            jobs.addAll(retryDue);
        }

        int processed = 0;
        Set<Long> seenIds = new HashSet<>();
        for (ExamNotificationJob job : jobs) {
            if (job.getId() == null || !seenIds.add(job.getId())) {
                continue;
            }
            processed++;
            runJobWithTenantContext(job, () -> processNotificationJob(job, now));
        }
        if (!jobs.isEmpty()) {
            examNotificationJobRepository.saveAll(jobs);
        }
        return processed;
    }

    @Transactional(readOnly = true)
    public ExamDTOs.ReportCardResponse getReportCard(Long studentId, Long examId) {
        markingAccessPolicy.assertMayViewStudentMarks(studentId);
        String t = TenantContext.getTenantId();
        String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole().trim().toUpperCase(Locale.ROOT) : "";
        List<MarkRecord> marks;
        if ("PARENT".equals(role)) {
            Student s = studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, t)
                    .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
            marks = markRepo.findByTenantIdAndStudentId(t, studentId).stream()
                    .filter(m -> examId == null || examId.equals(m.getExamId()))
                    .filter(m -> {
                        Exam ex = examRepo.findByIdAndTenantIdAndIsDeletedFalse(m.getExamId(), t).orElse(null);
                        return ex != null && Boolean.TRUE.equals(ex.getResultsPublished())
                                && studentMatchesExamScope(t, ex, s.getClassId(), s.getSectionId());
                    })
                    .collect(Collectors.toList());
        } else {
            marks = examId != null
                    ? markRepo.findByTenantIdAndExamId(t, examId).stream().filter(m -> m.getStudentId().equals(studentId)).collect(Collectors.toList())
                    : markRepo.findByTenantIdAndStudentId(t, studentId);
            if ("TEACHER".equals(role)) {
                Exam scopeExam = examId != null ? requireExam(examId) : null;
                if (scopeExam != null) {
                    marks = markingAccessPolicy.filterMarksForViewer(role, scopeExam, marks);
                }
            }
        }
        double totalObtained = marks.stream().mapToDouble(MarkRecord::getMarksObtained).sum();
        double totalMax = marks.stream().mapToDouble(MarkRecord::getMaxMarks).sum();
        double overallPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
        String overallGrade = overallPct >= 90 ? "A+" : overallPct >= 80 ? "A" : overallPct >= 70 ? "B+" : overallPct >= 60 ? "B" : overallPct >= 50 ? "C" : "D";
        return ExamDTOs.ReportCardResponse.builder()
                .studentId(studentId)
                .studentName(marks.isEmpty() ? "" : marks.get(0).getStudentName())
                .subjects(marks.stream().map(this::toMarkResponse).collect(Collectors.toList()))
                .totalMarks(totalObtained)
                .totalMaxMarks(totalMax)
                .overallPercentage(Math.round(overallPct * 10) / 10.0)
                .overallGrade(overallGrade)
                .build();
    }

    private Exam requireExam(Long examId) {
        String ctx = TenantContext.getTenantId();
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            return examRepo.findById(examId).filter(e -> !Boolean.TRUE.equals(e.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        }
        return examRepo.findByIdAndTenantIdAndIsDeletedFalse(examId, ctx).orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
    }

    private List<Long> resolveClassIdsForCreate(ExamDTOs.CreateExamRequest req) {
        if (req.getClassScopes() != null && !req.getClassScopes().isEmpty()) {
            return req.getClassScopes().stream().map(ExamScopeDtos.ClassScopeIn::getClassId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
        }
        return req.getClassIds() != null ? new ArrayList<>(req.getClassIds()) : Collections.emptyList();
    }

    private void persistClassScopes(String tenant, Long examId, ExamDTOs.CreateExamRequest req, List<Long> fallbackClassIds) {
        if (req.getClassScopes() != null && !req.getClassScopes().isEmpty()) {
            for (ExamScopeDtos.ClassScopeIn row : req.getClassScopes()) {
                if (row.getClassId() == null) {
                    continue;
                }
                ExamClassScope s = new ExamClassScope();
                s.setTenantId(tenant);
                s.setExamId(examId);
                s.setClassId(row.getClassId());
                s.setSectionId(row.getSectionId());
                s.setIsDeleted(false);
                scopeRepo.save(s);
            }
        } else {
            for (Long cid : fallbackClassIds) {
                ExamClassScope s = new ExamClassScope();
                s.setTenantId(tenant);
                s.setExamId(examId);
                s.setClassId(cid);
                s.setSectionId(null);
                s.setIsDeleted(false);
                scopeRepo.save(s);
            }
        }
    }

    private ExamDTOs.MarkResponse toMarkResponse(MarkRecord m) {
        return ExamDTOs.MarkResponse.builder()
                .id(m.getId())
                .examId(m.getExamId())
                .studentId(m.getStudentId())
                .studentName(m.getStudentName())
                .subjectName(m.getSubjectName())
                .marksObtained(m.getMarksObtained())
                .maxMarks(m.getMaxMarks())
                .grade(m.getGrade())
                .classId(m.getClassId())
                .percentage(m.getMaxMarks() > 0 ? Math.round((m.getMarksObtained() / m.getMaxMarks()) * 1000) / 10.0 : 0)
                .build();
    }

    private ExamDTOs.ExamResponse toExamResponse(Exam e) {
        String examTenant = e.getTenantId();
        ExamDTOs.ExamResponse r = ExamDTOs.ExamResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .academicYearId(e.getAcademicYearId())
                .startDate(e.getStartDate() != null ? e.getStartDate().toString() : null)
                .endDate(e.getEndDate() != null ? e.getEndDate().toString() : null)
                .classIds(EntitySnapshotCollections.detachList(e.getClassIds()))
                .status(e.getStatus() != null ? e.getStatus().name().toLowerCase() : null)
                .build();
        r.setResultsPublished(Boolean.TRUE.equals(e.getResultsPublished()));
        applyConfigFromJson(e, r);
        r.setWorkflowState(e.getWorkflowState() != null ? e.getWorkflowState() : "APPROVED");
        r.setWorkflowNote(e.getWorkflowNote());
        r.setClassScopes(buildScopeOut(examTenant, e));
        r.setScheduleSlots(scheduleRepo.findByTenantIdAndExamIdAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(examTenant, e.getId()).stream().map(this::toScheduleOut).collect(Collectors.toList()));
        return r;
    }

    /**
     * Parent list: same top-level fields as {@link #toExamResponse(Exam)} but {@code classIds}, {@code classScopes},
     * and {@code scheduleSlots} are trimmed to linked children only (no other classes’ timetable rows).
     */
    private ExamDTOs.ExamResponse toExamResponseForParentPortal(Exam e, String tenantId, List<Student> linkedChildren) {
        List<ExamClassScope> scopes = scopeRepo.findByTenantIdAndExamIdAndIsDeletedFalse(tenantId, e.getId());
        Map<Long, List<ExamClassScope>> scopesByExam = Map.of(e.getId(), scopes);
        List<ExamScheduleSlot> slots = scheduleRepo.findByTenantIdAndExamIdAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(tenantId, e.getId());
        return toExamResponseForParentPortal(e, tenantId, linkedChildren, scopesByExam, slots);
    }

    private ExamDTOs.ExamResponse toExamResponseForParentPortal(
            Exam e,
            String tenantId,
            List<Student> linkedChildren,
            Map<Long, List<ExamClassScope>> scopesByExam,
            List<ExamScheduleSlot> scheduleRows
    ) {
        ExamDTOs.ExamResponse r = ExamDTOs.ExamResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .academicYearId(e.getAcademicYearId())
                .startDate(e.getStartDate() != null ? e.getStartDate().toString() : null)
                .endDate(e.getEndDate() != null ? e.getEndDate().toString() : null)
                .classIds(filterExamClassIdsForLinkedChildren(tenantId, e, linkedChildren, scopesByExam))
                .status(e.getStatus() != null ? e.getStatus().name().toLowerCase() : null)
                .build();
        r.setResultsPublished(Boolean.TRUE.equals(e.getResultsPublished()));
        applyConfigFromJson(e, r);
        r.setWorkflowState(e.getWorkflowState() != null ? e.getWorkflowState() : "APPROVED");
        r.setWorkflowNote(e.getWorkflowNote());
        r.setClassScopes(filterClassScopesForLinkedChildren(tenantId, e, linkedChildren, scopesByExam));
        r.setScheduleSlots(scheduleRows.stream()
                .map(this::toScheduleOut)
                .filter(slot -> linkedChildren.stream().anyMatch(st ->
                        scheduleRowVisibleToStudent(slot, st.getClassId(), st.getSectionId())))
                .collect(Collectors.toList()));
        return r;
    }

    private List<Long> filterExamClassIdsForLinkedChildren(String tenantId, Exam e, List<Student> linkedChildren, Map<Long, List<ExamClassScope>> scopesByExam) {
        return linkedChildren.stream()
                .filter(st -> st.getClassId() != null && studentMatchesExamScope(tenantId, e, st.getClassId(), st.getSectionId(), scopesByExam))
                .map(Student::getClassId)
                .distinct()
                .collect(Collectors.toList());
    }

    private List<ExamScopeDtos.ClassScopeOut> filterClassScopesForLinkedChildren(String tenantId, Exam e, List<Student> linkedChildren, Map<Long, List<ExamClassScope>> scopesByExam) {
        return buildScopeOut(tenantId, e, scopesByExam).stream()
                .filter(scope -> linkedChildren.stream().anyMatch(st ->
                        st.getClassId() != null
                                && Objects.equals(scope.getClassId(), st.getClassId())
                                && (scope.getSectionId() == null
                                || (st.getSectionId() != null && Objects.equals(scope.getSectionId(), st.getSectionId())))))
                .collect(Collectors.toList());
    }

    private List<ExamScopeDtos.ClassScopeOut> buildScopeOut(String examTenant, Exam exam) {
        List<ExamClassScope> rows = scopeRepo.findByTenantIdAndExamIdAndIsDeletedFalse(examTenant, exam.getId());
        return buildScopeOut(examTenant, exam, Map.of(exam.getId(), rows));
    }

    private List<ExamScopeDtos.ClassScopeOut> buildScopeOut(String examTenant, Exam exam, Map<Long, List<ExamClassScope>> scopesByExam) {
        List<ExamClassScope> rows = scopesByExam.getOrDefault(exam.getId(), List.of());
        if (!rows.isEmpty()) {
            return rows.stream().map(row -> {
                String cn = classRepo.findByIdAndTenantIdAndIsDeletedFalse(row.getClassId(), examTenant).map(SchoolClass::getName).orElse(null);
                String sn = null;
                if (row.getSectionId() != null) {
                    sn = sectionRepo.findByIdAndTenantIdAndIsDeletedFalse(row.getSectionId(), examTenant).map(Section::getName).orElse(null);
                }
                return new ExamScopeDtos.ClassScopeOut(row.getClassId(), row.getSectionId(), cn, sn);
            }).collect(Collectors.toList());
        }
        if (exam.getClassIds() == null || exam.getClassIds().isEmpty()) {
            return Collections.emptyList();
        }
        return exam.getClassIds().stream().map(cid -> {
            String cn = classRepo.findByIdAndTenantIdAndIsDeletedFalse(cid, examTenant).map(SchoolClass::getName).orElse(null);
            return new ExamScopeDtos.ClassScopeOut(cid, null, cn, null);
        }).collect(Collectors.toList());
    }

    private ExamScopeDtos.ScheduleSlotOut toScheduleOut(ExamScheduleSlot s) {
        String slotTenant = s.getTenantId();
        ExamScopeDtos.ScheduleSlotOut o = new ExamScopeDtos.ScheduleSlotOut();
        o.setId(s.getId());
        o.setClassId(s.getClassId());
        o.setSectionId(s.getSectionId());
        o.setClassName(classRepo.findByIdAndTenantIdAndIsDeletedFalse(s.getClassId(), slotTenant).map(SchoolClass::getName).orElse(null));
        if (s.getSectionId() != null) {
            o.setSectionName(sectionRepo.findByIdAndTenantIdAndIsDeletedFalse(s.getSectionId(), slotTenant).map(Section::getName).orElse(null));
        }
        o.setSubjectName(s.getSubjectName());
        o.setPaperType(s.getPaperType());
        o.setInvigilatorName(s.getInvigilatorName());
        o.setExamDate(s.getExamDate() != null ? s.getExamDate().toString() : null);
        o.setStartTime(s.getStartTime() != null ? s.getStartTime().toString() : null);
        o.setEndTime(s.getEndTime() != null ? s.getEndTime().toString() : null);
        o.setRoom(s.getRoom());
        o.setNotes(s.getNotes());
        return o;
    }

    public ExamService(
            final ExamRepository examRepo,
            final MarkRecordRepository markRepo,
            final ExamClassScopeRepository scopeRepo,
            final ExamScheduleSlotRepository scheduleRepo,
            final SchoolClassRepository classRepo,
            final SectionRepository sectionRepo,
            final ExamMarkingAccessPolicy markingAccessPolicy,
            final StudentRepository studentRepository,
            final ParentPortalExamPageCache parentPortalExamPageCache,
            final ExamTemplateRepository templateRepository,
            final ExamTemplateComponentRepository templateComponentRepository,
            final ExamPublicationSnapshotRepository publicationSnapshotRepository,
            final ExamEventLogRepository examEventLogRepository,
            final ExamNotificationJobRepository examNotificationJobRepository,
            final ExamBulkOperationLogRepository examBulkOperationLogRepository,
            final ObjectMapper objectMapper,
            final AuditService auditService,
            final ObjectProvider<CacheService> cacheService) {
        this.examRepo = examRepo;
        this.markRepo = markRepo;
        this.scopeRepo = scopeRepo;
        this.scheduleRepo = scheduleRepo;
        this.classRepo = classRepo;
        this.sectionRepo = sectionRepo;
        this.markingAccessPolicy = markingAccessPolicy;
        this.studentRepository = studentRepository;
        this.parentPortalExamPageCache = parentPortalExamPageCache;
        this.templateRepository = templateRepository;
        this.templateComponentRepository = templateComponentRepository;
        this.publicationSnapshotRepository = publicationSnapshotRepository;
        this.examEventLogRepository = examEventLogRepository;
        this.examNotificationJobRepository = examNotificationJobRepository;
        this.examBulkOperationLogRepository = examBulkOperationLogRepository;
        this.objectMapper = objectMapper;
        this.auditService = auditService;
        this.cacheService = cacheService;
    }

    private String buildGradingConfigJson(ExamDTOs.CreateExamRequest req) {
        Map<String, Object> config = new LinkedHashMap<>();
        if (req.getExamType() != null && !req.getExamType().isBlank()) {
            config.put("examType", req.getExamType().trim());
        }
        if (req.getMarkingScheme() != null && !req.getMarkingScheme().isBlank()) {
            config.put("markingScheme", req.getMarkingScheme().trim().toLowerCase(Locale.ROOT));
        }
        if (req.getGradingConfig() != null && !req.getGradingConfig().isEmpty()) {
            validateRules(req.getGradingConfig());
            config.put("rules", req.getGradingConfig());
        }
        if (config.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(config);
        } catch (Exception ex) {
            throw new BusinessException("Invalid grading config");
        }
    }

    private void applyConfigFromJson(Exam exam, ExamDTOs.ExamResponse out) {
        if (exam.getGradingConfigJson() == null || exam.getGradingConfigJson().isBlank()) {
            return;
        }
        try {
            Map<String, Object> cfg = objectMapper.readValue(exam.getGradingConfigJson(), new TypeReference<>() {});
            Object type = cfg.get("examType");
            Object scheme = cfg.get("markingScheme");
            Object rules = cfg.get("rules");
            if (type instanceof String s && !s.isBlank()) {
                out.setExamType(s);
            }
            if (scheme instanceof String s && !s.isBlank()) {
                out.setMarkingScheme(s);
            }
            if (rules instanceof Map<?, ?> m) {
                Map<String, Object> safe = new LinkedHashMap<>();
                for (Map.Entry<?, ?> entry : m.entrySet()) {
                    if (entry.getKey() instanceof String k) {
                        safe.put(k, entry.getValue());
                    }
                }
                out.setGradingConfig(safe);
            }
        } catch (Exception ignored) {
            // Keep API resilient if old/invalid config exists.
        }
    }

    private void validateMarkEntry(ExamDTOs.MarkEntry mark) {
        if (mark.getMaxMarks() == null || mark.getMaxMarks() <= 0) {
            throw new BusinessException("Max marks must be greater than 0");
        }
        if (mark.getMarksObtained() == null || mark.getMarksObtained() < 0) {
            throw new BusinessException("Marks obtained cannot be negative");
        }
        if (mark.getMarksObtained() > mark.getMaxMarks()) {
            throw new BusinessException("Marks obtained cannot exceed max marks");
        }
    }

    private String defaultWorkflowStateForCreatorRole(String role) {
        return "TEACHER".equals(role) ? "PENDING_APPROVAL" : "APPROVED";
    }

    private void ensureOneOfStates(Exam exam, String... expected) {
        String state = exam.getWorkflowState() == null ? "APPROVED" : exam.getWorkflowState().trim().toUpperCase(Locale.ROOT);
        for (String e : expected) {
            if (state.equals(e)) {
                return;
            }
        }
        throw new BusinessException("Invalid exam workflow state transition from " + state);
    }

    private void assertExamEditable(Exam exam) {
        String state = exam.getWorkflowState() == null ? "APPROVED" : exam.getWorkflowState().trim().toUpperCase(Locale.ROOT);
        if ("FROZEN".equals(state) || "PUBLISHED".equals(state)) {
            throw new BusinessException("Exam timetable is locked in state " + state);
        }
    }

    private void assertMarksEntryAllowed(Exam exam) {
        String state = exam.getWorkflowState() == null ? "APPROVED" : exam.getWorkflowState().trim().toUpperCase(Locale.ROOT);
        if ("FROZEN".equals(state) || "REJECTED".equals(state) || "DRAFT".equals(state) || "PENDING_APPROVAL".equals(state)) {
            throw new BusinessException("Marks entry is not allowed until exam is approved.");
        }
    }

    private String trimNote(String raw) {
        if (raw == null) {
            return null;
        }
        String x = raw.trim();
        return x.isEmpty() ? null : (x.length() > 500 ? x.substring(0, 500) : x);
    }

    private static String normalizeRole(String role) {
        if (role == null) {
            return "";
        }
        return role.trim().toUpperCase(Locale.ROOT);
    }

    private void refreshReportCaches() {
        cacheService.ifAvailable(cs -> {
            cs.clearRegion(CacheService.CacheRegion.REPORT_RESULTS);
            cs.clearRegion(CacheService.CacheRegion.DASHBOARD_SNAPSHOTS);
        });
    }

    private void ensureScheduleRowsValidForExam(Exam exam, List<ExamScopeDtos.ScheduleSlotIn> rows) {
        ExamRules rules = readExamRules(exam);
        Map<String, List<ExamScopeDtos.ScheduleSlotIn>> grouped = new HashMap<>();
        for (ExamScopeDtos.ScheduleSlotIn row : rows) {
            if (row.getClassId() == null || row.getExamDate() == null || row.getStartTime() == null || row.getEndTime() == null) {
                throw new BusinessException("Schedule row is missing class/date/time");
            }
            if (rules.requireRoom && (row.getRoom() == null || row.getRoom().isBlank())) {
                throw new BusinessException("Room is required for each schedule row by exam rule");
            }
            if (rules.requireInvigilator && (row.getInvigilatorName() == null || row.getInvigilatorName().isBlank())) {
                throw new BusinessException("Invigilator is required for each schedule row by exam rule");
            }
            LocalDate d = LocalDate.parse(row.getExamDate());
            LocalTime st = LocalTime.parse(row.getStartTime());
            LocalTime et = LocalTime.parse(row.getEndTime());
            if (!st.isBefore(et)) {
                throw new BusinessException("Schedule start time must be before end time");
            }
            if (exam.getStartDate() != null && d.isBefore(exam.getStartDate())) {
                throw new BusinessException("Schedule date cannot be before exam start date");
            }
            if (exam.getEndDate() != null && d.isAfter(exam.getEndDate())) {
                throw new BusinessException("Schedule date cannot be after exam end date");
            }
            if (rules.blackoutDates.contains(d.toString())) {
                throw new BusinessException("Schedule date is blocked by blackout calendar: " + d);
            }
            String bucket = row.getClassId() + "|" + (row.getSectionId() == null ? "ALL" : row.getSectionId()) + "|" + row.getExamDate();
            grouped.computeIfAbsent(bucket, k -> new ArrayList<>()).add(row);
            List<ExamScheduleSlot> existingOtherExam = scheduleRepo.findByTenantIdAndExamDateAndOtherExam(exam.getTenantId(), d, exam.getId());
            for (ExamScheduleSlot exSlot : existingOtherExam) {
                boolean sameClass =
                        exSlot.getClassId().equals(row.getClassId())
                        && (Objects.equals(exSlot.getSectionId(), row.getSectionId()) || exSlot.getSectionId() == null || row.getSectionId() == null);
                boolean sameRoom = row.getRoom() != null && !row.getRoom().isBlank() && exSlot.getRoom() != null
                        && row.getRoom().trim().equalsIgnoreCase(exSlot.getRoom().trim());
                boolean sameInvigilator = row.getInvigilatorName() != null && !row.getInvigilatorName().isBlank() && exSlot.getInvigilatorName() != null
                        && row.getInvigilatorName().trim().equalsIgnoreCase(exSlot.getInvigilatorName().trim());
                if ((sameClass || sameRoom || sameInvigilator) && overlaps(st, et, exSlot.getStartTime(), exSlot.getEndTime())) {
                    throw new BusinessException("Schedule conflicts with another exam slot (class/room/invigilator overlap).");
                }
            }
        }
        for (List<ExamScopeDtos.ScheduleSlotIn> bucketRows : grouped.values()) {
            if (rules.maxPapersPerDayPerClass > 0 && bucketRows.size() > rules.maxPapersPerDayPerClass) {
                throw new BusinessException("Schedule exceeds max papers per day rule for a class/section");
            }
            for (int i = 0; i < bucketRows.size(); i++) {
                LocalTime aStart = LocalTime.parse(bucketRows.get(i).getStartTime());
                LocalTime aEnd = LocalTime.parse(bucketRows.get(i).getEndTime());
                for (int j = i + 1; j < bucketRows.size(); j++) {
                    LocalTime bStart = LocalTime.parse(bucketRows.get(j).getStartTime());
                    LocalTime bEnd = LocalTime.parse(bucketRows.get(j).getEndTime());
                    if (aStart.isBefore(bEnd) && bStart.isBefore(aEnd)) {
                        throw new BusinessException("Schedule has overlapping time slots for the same class/section/date");
                    }
                }
            }
        }
    }

    private ExamRules readExamRules(Exam exam) {
        ExamRules out = new ExamRules();
        if (exam.getGradingConfigJson() == null || exam.getGradingConfigJson().isBlank()) {
            return out;
        }
        try {
            Map<String, Object> cfg = objectMapper.readValue(exam.getGradingConfigJson(), new TypeReference<>() {});
            Object rulesObj = cfg.get("rules");
            if (!(rulesObj instanceof Map<?, ?> m)) {
                return out;
            }
            Object examOpsObj = m.get("examOperations");
            if (!(examOpsObj instanceof Map<?, ?> ops)) {
                return out;
            }
            out.requireRoom = toBoolean(ops.get("requireRoom"), false);
            out.requireInvigilator = toBoolean(ops.get("requireInvigilator"), false);
            out.maxPapersPerDayPerClass = toInt(ops.get("maxPapersPerDayPerClass"), 0);
            Object blackoutObj = ops.get("blackoutDates");
            if (blackoutObj instanceof List<?> list) {
                for (Object x : list) {
                    if (x != null) {
                        out.blackoutDates.add(String.valueOf(x));
                    }
                }
            }
            return out;
        } catch (Exception ignored) {
            return out;
        }
    }

    private static boolean toBoolean(Object val, boolean fallback) {
        if (val instanceof Boolean b) return b;
        if (val instanceof String s) return "true".equalsIgnoreCase(s.trim());
        return fallback;
    }

    private static int toInt(Object val, int fallback) {
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s) {
            try {
                return Integer.parseInt(s.trim());
            } catch (Exception ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private static final class ExamRules {
        private boolean requireRoom;
        private boolean requireInvigilator;
        private int maxPapersPerDayPerClass;
        private Set<String> blackoutDates = new HashSet<>();
    }

    private boolean overlaps(LocalTime aStart, LocalTime aEnd, LocalTime bStart, LocalTime bEnd) {
        return aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
    }

    private void validateRules(Map<String, Object> rules) {
        if (rules == null || rules.isEmpty()) return;
        Object formulaObj = rules.get("formula");
        if (formulaObj instanceof String formula && !formula.isBlank()) {
            validateFormula(formula);
        }
    }

    private void validateFormula(String formula) {
        String f = formula.trim();
        if (f.length() > 300) {
            throw new BusinessException("Formula is too long.");
        }
        if (!f.matches("[A-Za-z0-9_+\\-*/().,%\\s><=!&|]+")) {
            throw new BusinessException("Formula contains unsafe characters.");
        }
        String lower = f.toLowerCase(Locale.ROOT);
        List<String> blocked = List.of("select ", "drop ", "insert ", "delete ", "update ", "script");
        for (String b : blocked) {
            if (lower.contains(b)) {
                throw new BusinessException("Formula contains blocked token.");
            }
        }
    }

    private String writeJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new BusinessException("Invalid JSON payload.");
        }
    }

    private Map<String, Object> readJsonMap(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return null;
        }
    }

    private ExamDTOs.TemplateResponse toTemplateOut(ExamTemplate row, List<ExamTemplateComponent> comps) {
        ExamDTOs.TemplateResponse out = new ExamDTOs.TemplateResponse();
        out.setId(row.getId());
        out.setName(row.getName());
        out.setBoardType(row.getBoardType());
        out.setClassBand(row.getClassBand());
        out.setDefaultMarkingScheme(row.getDefaultMarkingScheme());
        out.setRules(readJsonMap(row.getRulesJson()));
        List<ExamDTOs.TemplateComponentOut> componentOut = new ArrayList<>();
        for (ExamTemplateComponent c : comps) {
            ExamDTOs.TemplateComponentOut oc = new ExamDTOs.TemplateComponentOut();
            oc.setId(c.getId());
            oc.setComponentCode(c.getComponentCode());
            oc.setComponentLabel(c.getComponentLabel());
            oc.setMaxMarks(c.getMaxMarks() != null ? c.getMaxMarks().doubleValue() : null);
            oc.setWeightagePct(c.getWeightagePct() != null ? c.getWeightagePct().doubleValue() : null);
            oc.setOptional(c.getOptional());
            oc.setRule(readJsonMap(c.getRuleJson()));
            componentOut.add(oc);
        }
        out.setComponents(componentOut);
        return out;
    }

    private ExamDTOs.PublicationSnapshotResponse toSnapshotOut(ExamPublicationSnapshot s) {
        ExamDTOs.PublicationSnapshotResponse out = new ExamDTOs.PublicationSnapshotResponse();
        out.setId(s.getId());
        out.setVersionNo(s.getVersionNo());
        out.setSnapshotType(s.getSnapshotType());
        out.setNote(s.getNote());
        out.setPublishedAt(s.getPublishedAt() != null ? s.getPublishedAt().toString() : null);
        return out;
    }

    private ExamDTOs.ExamEventLogResponse toEventOut(ExamEventLog event) {
        ExamDTOs.ExamEventLogResponse out = new ExamDTOs.ExamEventLogResponse();
        out.setId(event.getId());
        out.setEventType(event.getEventType());
        out.setActorUserId(event.getActorUserId());
        out.setActorRole(event.getActorRole());
        out.setPayloadJson(event.getPayloadJson());
        out.setCreatedAt(formatDateTime(event.getCreatedAt()));
        return out;
    }

    private ExamDTOs.NotificationJobResponse toNotificationJobOut(ExamNotificationJob job) {
        ExamDTOs.NotificationJobResponse out = new ExamDTOs.NotificationJobResponse();
        out.setId(job.getId());
        out.setExamId(job.getExamId());
        out.setEventType(job.getEventType());
        out.setTargetRole(job.getTargetRole());
        out.setLocaleCode(job.getLocaleCode());
        out.setStatus(job.getStatus());
        out.setAttempts(job.getAttempts());
        out.setMaxAttempts(job.getMaxAttempts());
        out.setNextRetryAt(formatDateTime(job.getNextRetryAt()));
        out.setLastError(job.getLastError());
        out.setPayloadJson(job.getPayloadJson());
        out.setCreatedAt(formatDateTime(job.getCreatedAt()));
        out.setUpdatedAt(formatDateTime(job.getUpdatedAt()));
        return out;
    }

    private ExamDTOs.BulkOperationLogResponse toBulkOpOut(ExamBulkOperationLog logEntry) {
        ExamDTOs.BulkOperationLogResponse out = new ExamDTOs.BulkOperationLogResponse();
        out.setId(logEntry.getId());
        out.setOperationType(logEntry.getOperationType());
        out.setRequestId(logEntry.getRequestId());
        out.setExamId(logEntry.getExamId());
        out.setStatus(logEntry.getStatus());
        out.setCreatedAt(formatDateTime(logEntry.getCreatedAt()));
        return out;
    }

    private void processNotificationJob(ExamNotificationJob job, LocalDateTime now) {
        int attempts = job.getAttempts() != null ? job.getAttempts() : 0;
        int maxAttempts = job.getMaxAttempts() != null && job.getMaxAttempts() > 0 ? job.getMaxAttempts() : 5;
        try {
            if (job.getExamId() == null) {
                throw new BusinessException("Job is missing exam id");
            }
            examRepo.findByIdAndTenantIdAndIsDeletedFalse(job.getExamId(), job.getTenantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Exam", job.getExamId()));
            String role = (job.getTargetRole() != null ? job.getTargetRole() : "PARENT").toUpperCase(Locale.ROOT);
            String locale = (job.getLocaleCode() != null ? job.getLocaleCode().trim().toLowerCase(Locale.ROOT) : "en");
            job.setStatus("SENT");
            job.setLastError(null);
            job.setNextRetryAt(null);
            job.setAttempts(attempts + 1);
            appendExamEvent(job.getExamId(), "NOTIFICATION_SENT", Map.of(
                    "jobId", job.getId(),
                    "role", role,
                    "locale", locale,
                    "attempts", job.getAttempts()));
        } catch (Exception ex) {
            int updatedAttempts = attempts + 1;
            job.setAttempts(updatedAttempts);
            job.setLastError(trimError(ex.getMessage()));
            if (updatedAttempts >= maxAttempts) {
                job.setStatus("FAILED");
                job.setNextRetryAt(null);
            } else {
                job.setStatus("RETRY");
                job.setNextRetryAt(now.plusMinutes(backoffMinutes(updatedAttempts)));
            }
            appendExamEvent(job.getExamId(), "NOTIFICATION_FAILED", Map.of(
                    "jobId", job.getId(),
                    "attempts", updatedAttempts,
                    "maxAttempts", maxAttempts,
                    "error", trimError(ex.getMessage())));
        }
    }

    private String trimError(String value) {
        if (value == null || value.isBlank()) {
            return "Unknown notification error";
        }
        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    private long backoffMinutes(int attempts) {
        if (attempts <= 1) return 1;
        if (attempts == 2) return 2;
        if (attempts == 3) return 5;
        return 15;
    }

    private String formatDateTime(LocalDateTime value) {
        return value != null ? value.toString() : null;
    }

    private void runJobWithTenantContext(ExamNotificationJob job, Runnable task) {
        TenantScopedExecution.run(job.getTenantId(), null, "SYSTEM", task);
    }

    private void createPublicationSnapshot(Exam exam, String type, String note) {
        String tenant = exam.getTenantId();
        List<ExamPublicationSnapshot> existing = publicationSnapshotRepository.findByTenantIdAndExamIdAndIsDeletedFalseOrderByVersionNoDesc(tenant, exam.getId());
        int nextVersion = existing.isEmpty() ? 1 : existing.get(0).getVersionNo() + 1;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("examId", exam.getId());
        payload.put("workflowState", exam.getWorkflowState());
        payload.put("gradingConfigJson", exam.getGradingConfigJson());
        payload.put("resultsPublished", exam.getResultsPublished());
        payload.put("schedule", getSchedule(exam.getId()));
        payload.put("marks", getMarksByExam(exam.getId()));
        ExamPublicationSnapshot snap = new ExamPublicationSnapshot();
        snap.setTenantId(tenant);
        snap.setExamId(exam.getId());
        snap.setVersionNo(nextVersion);
        snap.setSnapshotType(type);
        snap.setNote(trimNote(note));
        snap.setPublishedByUserId(TenantContext.getUserId());
        snap.setPublishedAt(java.time.LocalDateTime.now());
        snap.setSnapshotJson(writeJson(payload));
        publicationSnapshotRepository.save(snap);
    }

    private void appendExamEvent(Long examId, String eventType, Map<String, Object> payload) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = examRepo.findById(examId)
                    .filter(e -> !Boolean.TRUE.equals(e.getIsDeleted()))
                    .map(Exam::getTenantId)
                    .orElseThrow(() -> new BusinessException("Unable to resolve exam tenant for event logging."));
        }
        ExamEventLog evt = new ExamEventLog();
        evt.setTenantId(tenantId);
        evt.setExamId(examId);
        evt.setEventType(eventType);
        evt.setActorUserId(TenantContext.getUserId());
        evt.setActorRole(TenantContext.getUserRole());
        evt.setPayloadJson(writeJson(payload));
        examEventLogRepository.save(evt);
    }

    private void queuePublicationNotifications(Exam exam, String eventType) {
        for (String role : List.of("PARENT", "TEACHER", "ADMIN")) {
            for (String locale : List.of("en", "hi")) {
                ExamNotificationJob job = new ExamNotificationJob();
                job.setTenantId(exam.getTenantId());
                job.setExamId(exam.getId());
                job.setEventType(eventType);
                job.setTargetRole(role);
                job.setLocaleCode(locale);
                job.setStatus("PENDING");
                job.setAttempts(0);
                job.setMaxAttempts(5);
                job.setPayloadJson(writeJson(Map.of(
                        "examName", exam.getName(),
                        "eventType", eventType,
                        "messageKey", "exams.notification." + eventType.toLowerCase(Locale.ROOT)
                )));
                examNotificationJobRepository.save(job);
            }
        }
    }
}
