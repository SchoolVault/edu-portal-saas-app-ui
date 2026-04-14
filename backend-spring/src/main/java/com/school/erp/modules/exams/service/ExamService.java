package com.school.erp.modules.exams.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.exams.dto.ExamScopeDtos;
import com.school.erp.modules.exams.entity.*;
import com.school.erp.modules.exams.policy.ExamMarkingAccessPolicy;
import com.school.erp.modules.exams.repository.*;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
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
        exam.setTenantId(tenant);
        examRepo.save(exam);
        persistClassScopes(tenant, exam.getId(), req, classIds);
        log.info("Exam created: {}", exam.getName());
        return toExamResponse(exam);
    }

    @Transactional
    public ExamDTOs.ExamResponse updateExamStatus(Long examId, String status) {
        Exam exam = requireExam(examId);
        exam.setStatus(Enums.ExamStatus.valueOf(status.toUpperCase()));
        examRepo.save(exam);
        return toExamResponse(exam);
    }

    @Transactional
    public ExamDTOs.ExamResponse setResultsPublished(Long examId, boolean published) {
        Exam exam = requireExam(examId);
        exam.setResultsPublished(published);
        examRepo.save(exam);
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
        String t = exam.getTenantId();
        List<ExamScheduleSlot> existing = scheduleRepo.findByTenantIdAndExamIdAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(t, examId);
        for (ExamScheduleSlot s : existing) {
            s.setIsDeleted(true);
        }
        scheduleRepo.saveAll(existing);
        List<ExamScheduleSlot> created = new ArrayList<>();
        if (body.getSlots() != null) {
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
        log.info("Exam schedule replaced: exam={} rows={}", examId, created.size());
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
        if (linkedChildren == null || linkedChildren.isEmpty()) {
            return List.of();
        }
        List<ExamDTOs.ExamResponse> out = examRepo.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .filter(e -> e.getStatus() != Enums.ExamStatus.CANCELLED)
                .filter(e -> linkedChildren.stream().anyMatch(st ->
                        st.getClassId() != null && studentMatchesExamScope(tenantId, e, st.getClassId(), st.getSectionId())))
                .sorted(Comparator
                        .comparing((Exam e) -> e.getStartDate(), Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed()
                        .thenComparing(Exam::getId, Comparator.reverseOrder()))
                .map(e -> toExamResponseForParentPortal(e, tenantId, linkedChildren))
                .collect(Collectors.toList());
        log.debug("Parent portal exam list tenant={} linkedChildren={} visibleExams={}", tenantId, linkedChildren.size(), out.size());
        return out;
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
        if (classId == null) {
            return false;
        }
        List<ExamClassScope> scopes = scopeRepo.findByTenantIdAndExamIdAndIsDeletedFalse(tenantId, exam.getId());
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
        markingAccessPolicy.assertMaySaveMarks(exam, req.getMarks());
        String t = TenantContext.getTenantId();
        List<MarkRecord> records = req.getMarks().stream().map(m -> {
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
        log.info("Marks saved: exam={} count={}", req.getExamId(), records.size());
        return records.stream().map(this::toMarkResponse).collect(Collectors.toList());
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
                .classIds(e.getClassIds())
                .status(e.getStatus() != null ? e.getStatus().name().toLowerCase() : null)
                .build();
        r.setResultsPublished(Boolean.TRUE.equals(e.getResultsPublished()));
        r.setClassScopes(buildScopeOut(examTenant, e));
        r.setScheduleSlots(scheduleRepo.findByTenantIdAndExamIdAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(examTenant, e.getId()).stream().map(this::toScheduleOut).collect(Collectors.toList()));
        return r;
    }

    /**
     * Parent list: same top-level fields as {@link #toExamResponse(Exam)} but {@code classIds}, {@code classScopes},
     * and {@code scheduleSlots} are trimmed to linked children only (no other classes’ timetable rows).
     */
    private ExamDTOs.ExamResponse toExamResponseForParentPortal(Exam e, String tenantId, List<Student> linkedChildren) {
        ExamDTOs.ExamResponse r = ExamDTOs.ExamResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .academicYearId(e.getAcademicYearId())
                .startDate(e.getStartDate() != null ? e.getStartDate().toString() : null)
                .endDate(e.getEndDate() != null ? e.getEndDate().toString() : null)
                .classIds(filterExamClassIdsForLinkedChildren(tenantId, e, linkedChildren))
                .status(e.getStatus() != null ? e.getStatus().name().toLowerCase() : null)
                .build();
        r.setResultsPublished(Boolean.TRUE.equals(e.getResultsPublished()));
        r.setClassScopes(filterClassScopesForLinkedChildren(tenantId, e, linkedChildren));
        r.setScheduleSlots(scheduleRepo.findByTenantIdAndExamIdAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(tenantId, e.getId()).stream()
                .map(this::toScheduleOut)
                .filter(slot -> linkedChildren.stream().anyMatch(st ->
                        scheduleRowVisibleToStudent(slot, st.getClassId(), st.getSectionId())))
                .collect(Collectors.toList()));
        return r;
    }

    private List<Long> filterExamClassIdsForLinkedChildren(String tenantId, Exam e, List<Student> linkedChildren) {
        return linkedChildren.stream()
                .filter(st -> st.getClassId() != null && studentMatchesExamScope(tenantId, e, st.getClassId(), st.getSectionId()))
                .map(Student::getClassId)
                .distinct()
                .collect(Collectors.toList());
    }

    private List<ExamScopeDtos.ClassScopeOut> filterClassScopesForLinkedChildren(String tenantId, Exam e, List<Student> linkedChildren) {
        return buildScopeOut(tenantId, e).stream()
                .filter(scope -> linkedChildren.stream().anyMatch(st ->
                        st.getClassId() != null
                                && Objects.equals(scope.getClassId(), st.getClassId())
                                && (scope.getSectionId() == null
                                || (st.getSectionId() != null && Objects.equals(scope.getSectionId(), st.getSectionId())))))
                .collect(Collectors.toList());
    }

    private List<ExamScopeDtos.ClassScopeOut> buildScopeOut(String examTenant, Exam exam) {
        List<ExamClassScope> rows = scopeRepo.findByTenantIdAndExamIdAndIsDeletedFalse(examTenant, exam.getId());
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
            final StudentRepository studentRepository) {
        this.examRepo = examRepo;
        this.markRepo = markRepo;
        this.scopeRepo = scopeRepo;
        this.scheduleRepo = scheduleRepo;
        this.classRepo = classRepo;
        this.sectionRepo = sectionRepo;
        this.markingAccessPolicy = markingAccessPolicy;
        this.studentRepository = studentRepository;
    }
}
