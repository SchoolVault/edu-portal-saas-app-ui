package com.school.erp.modules.parent.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.attendance.dto.AttendanceDTOs;
import com.school.erp.modules.attendance.entity.AttendanceRecord;
import com.school.erp.modules.attendance.repository.AttendanceRepository;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.service.StudentEnrolmentDisplayService;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.timetable.dto.TimetableDTOs;
import com.school.erp.modules.timetable.entity.TimetableEntry;
import com.school.erp.modules.timetable.service.TimetableService;
import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.exams.dto.ParentExamNotificationDTOs;
import com.school.erp.modules.exams.dto.ExamScopeDtos;
import com.school.erp.modules.exams.service.ExamService;
import com.school.erp.modules.exams.service.ParentExamNotificationService;
import com.school.erp.modules.reports.dto.ReportModuleDTOs;
import com.school.erp.modules.reports.service.ReportService;
import com.school.erp.modules.fees.repository.FeePaymentRepository;
import com.school.erp.modules.fees.entity.FeePayment;
import com.school.erp.modules.fees.dto.FeeDTOs;
import com.school.erp.modules.fees.service.FeeService;
import com.school.erp.modules.parent.service.ParentPortalReadFacade;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.audit.service.AuditService;
import com.school.erp.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/parent")
@Tag(name = "Parent Portal", description = "Parent view - children, grades, fees, attendance")
@PreAuthorize("hasRole('PARENT')")
public class ParentController {
    private final StudentRepository studentRepo;
    private final GuardianService guardianService;
    private final ExamService examService;
    private final FeePaymentRepository feeRepo;
    private final AttendanceRepository attendanceRepo;
    private final FeeService feeService;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final TimetableService timetableService;
    private final ParentPortalReadFacade parentPortalReadFacade;
    private final StudentEnrolmentDisplayService studentEnrolmentDisplayService;
    private final TenantConfigRepository tenantConfigRepository;
    private final AuditService auditService;
    private final ParentExamNotificationService parentExamNotificationService;
    private final ReportService reportService;

    @GetMapping("/exams")
    @Operation(summary = "Exams for your children only",
            description = "Union of exam cycles whose class/section audience includes at least one linked child. "
                    + "Same JSON shape as GET /exams (staff-only). Parents must not call GET /exams.")
    public ResponseEntity<ApiResponse<List<ExamDTOs.ExamResponse>>> listExamsForMyChildren() {
        auditService.logUpdate("PARENT_EXAMS", "Viewed parent exam cards", null, null, "view=exam_cards");
        return ResponseEntity.ok(ApiResponse.ok(parentPortalReadFacade.listExamsForCurrentParentUser()));
    }

    @GetMapping("/exams/paged")
    @Operation(summary = "Exams for your children (paged)",
            description = "Same payload as GET /parent/exams with server-side paging and a short-lived cache. "
                    + "Prefer this for large exam catalogs; max size 50.")
    public ResponseEntity<ApiResponse<PageResponse<ExamDTOs.ExamResponse>>> listExamsForMyChildrenPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int capped = Math.min(Math.max(size, 1), 50);
        auditService.logUpdate("PARENT_EXAMS", "Viewed parent exam cards paged", null, null, "page=" + page + ",size=" + capped);
        return ResponseEntity.ok(ApiResponse.ok(parentPortalReadFacade.listExamsForCurrentParentUserPaged(page, capped)));
    }

    @GetMapping("/children")
    @Operation(summary = "Get parent's children", description = "Returns all students linked to the current parent user")
    public ResponseEntity<ApiResponse<List<Student>>> getChildren() {
        String tenantId = TenantContext.getTenantId();
        Long parentId = TenantContext.getUserId();
        List<Student> children = guardianService.findStudentsForParentUser(tenantId, parentId).stream()
                .filter(s -> s.getStatus() == Enums.StudentStatus.ACTIVE)
                .collect(Collectors.toList());
        studentEnrolmentDisplayService.enrichClassSectionDisplay(tenantId, children);
        enrichHomeroomFromSchoolClass(tenantId, children);
        enrichSchoolEmailForParentPortal(tenantId, children);
        return ResponseEntity.ok(ApiResponse.ok(children));
    }

    @GetMapping("/children/{studentId}/marks")
    @Operation(summary = "Get child's published exam marks",
            description = "Only marks for exams that include this student’s class/section and have results published.")
    public ResponseEntity<ApiResponse<List<ExamDTOs.MarkResponse>>> getChildMarks(@PathVariable Long studentId) {
        Student s = assertParentOwnsStudent(studentId);
        auditService.logUpdate("PARENT_EXAMS", "Viewed child published marks", studentId, null, "scope=all_exams");
        return ResponseEntity.ok(ApiResponse.ok(
                examService.listPublishedMarksForParentStudent(studentId, s.getClassId(), s.getSectionId())));
    }

    @GetMapping("/children/{studentId}/exams")
    @Operation(summary = "List exams for the child’s class/section")
    public ResponseEntity<ApiResponse<List<ExamDTOs.ParentExamSummaryResponse>>> getChildExams(@PathVariable Long studentId) {
        Student s = assertParentOwnsStudent(studentId);
        auditService.logUpdate("PARENT_EXAMS", "Viewed child exam summaries", studentId, null, "scope=child");
        return ResponseEntity.ok(ApiResponse.ok(examService.listExamsForParentStudent(s.getClassId(), s.getSectionId())));
    }

    @GetMapping("/children/{studentId}/exams/{examId}/schedule")
    @Operation(summary = "Exam timetable for the child (scoped rows only)")
    public ResponseEntity<ApiResponse<List<ExamScopeDtos.ScheduleSlotOut>>> getChildExamSchedule(
            @PathVariable Long studentId,
            @PathVariable Long examId) {
        Student s = assertParentOwnsStudent(studentId);
        auditService.logUpdate("PARENT_EXAMS", "Viewed child exam timetable", examId, null, "studentId=" + studentId);
        return ResponseEntity.ok(ApiResponse.ok(
                examService.listScheduleForParentStudent(examId, s.getClassId(), s.getSectionId())));
    }

    @GetMapping("/children/{studentId}/exams/{examId}/marks")
    @Operation(summary = "Published marks for one exam and this child")
    public ResponseEntity<ApiResponse<List<ExamDTOs.MarkResponse>>> getChildExamMarks(
            @PathVariable Long studentId,
            @PathVariable Long examId) {
        Student s = assertParentOwnsStudent(studentId);
        auditService.logUpdate("PARENT_EXAMS", "Viewed child exam marks", examId, null, "studentId=" + studentId);
        return ResponseEntity.ok(ApiResponse.ok(
                examService.listPublishedMarksForParentExam(studentId, examId, s.getClassId(), s.getSectionId())));
    }

    @GetMapping(value = "/children/{studentId}/exams/{examId}/report-card/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Download child report card PDF for one exam")
    public ResponseEntity<byte[]> getChildExamReportCardPdf(
            @PathVariable Long studentId,
            @PathVariable Long examId) {
        Student s = assertParentOwnsStudent(studentId);
        byte[] data = examService.parentReportCardPdf(studentId, examId, s.getClassId(), s.getSectionId());
        auditService.logUpdate("PARENT_EXAMS", "Downloaded child report card pdf", examId, null, "studentId=" + studentId);
        String safeName = ("report-card-" + studentId + "-" + examId).replaceAll("[^a-zA-Z0-9._-]", "_");
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(safeName + ".pdf", StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(data);
    }

    @PostMapping("/children/{studentId}/exams/{examId}/report-card/jobs")
    @Operation(summary = "Queue async report card PDF generation for child+exam")
    public ResponseEntity<ApiResponse<ReportModuleDTOs.ReportJobResponse>> queueChildExamReportCardJob(
            @PathVariable Long studentId,
            @PathVariable Long examId) {
        Student s = assertParentOwnsStudent(studentId);
        ReportModuleDTOs.GenerateReportRequest req = new ReportModuleDTOs.GenerateReportRequest();
        req.setReportType("REPORT_CARD");
        req.setFormat("PDF");
        req.setScheduleAt(java.time.LocalDateTime.now().plusSeconds(2).toString());
        req.setRequestId("parent-report-card-" + studentId + "-" + examId + "-" + System.currentTimeMillis());
        req.setFilters(Map.of(
                "studentId", studentId,
                "examId", examId,
                "classId", s.getClassId()));
        ReportModuleDTOs.ReportJobResponse out = reportService.generateReport(req);
        auditService.logUpdate("PARENT_EXAMS", "Queued async report card job", examId, null, "studentId=" + studentId + ",jobId=" + out.getId());
        return ResponseEntity.ok(ApiResponse.ok(out));
    }

    @GetMapping("/exam-notifications/unread-count")
    @Operation(summary = "Unread parent exam notification count")
    public ResponseEntity<ApiResponse<Long>> unreadExamNotificationCount() {
        return ResponseEntity.ok(ApiResponse.ok(parentExamNotificationService.unreadCountForCurrentParent()));
    }

    @PostMapping("/exam-notifications/ack")
    @Operation(summary = "Acknowledge parent exam notifications")
    public ResponseEntity<ApiResponse<Void>> acknowledgeExamNotifications(
            @RequestBody(required = false) ParentExamNotificationDTOs.BulkAcknowledgeRequest req) {
        parentExamNotificationService.acknowledgeForCurrentParent(
                req != null ? req.getExamId() : null,
                req != null ? req.getEventTypes() : null);
        return ResponseEntity.ok(ApiResponse.ok(null, "Acknowledged"));
    }

    @GetMapping("/exam-notifications/preferences")
    @Operation(summary = "Parent exam notification preference")
    public ResponseEntity<ApiResponse<ParentExamNotificationDTOs.NotificationPreferenceResponse>> getExamNotificationPreference() {
        return ResponseEntity.ok(ApiResponse.ok(parentExamNotificationService.getPreferenceForCurrentParent()));
    }

    @PutMapping("/exam-notifications/preferences")
    @Operation(summary = "Update parent exam notification preference")
    public ResponseEntity<ApiResponse<ParentExamNotificationDTOs.NotificationPreferenceResponse>> updateExamNotificationPreference(
            @RequestBody ParentExamNotificationDTOs.UpdateNotificationPreferenceRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(parentExamNotificationService.upsertPreferenceForCurrentParent(req)));
    }

    @GetMapping("/children/{studentId}/fees")
    @Operation(summary = "Get child's fee status")
    public ResponseEntity<ApiResponse<List<FeePayment>>> getChildFees(@PathVariable Long studentId) {
        assertParentOwnsStudent(studentId);
        return ResponseEntity.ok(ApiResponse.ok(feeRepo.findByTenantIdAndStudentIdAndIsDeletedFalse(TenantContext.getTenantId(), studentId)));
    }

    @GetMapping("/children/{studentId}/fee-obligations")
    @Operation(summary = "Get child fee obligations with payment breakdown",
            description = "Each obligation includes lineItems from the linked fee structure (tuition, transport, hostel, uniform, …) for parent-facing breakdown.")
    public ResponseEntity<ApiResponse<List<FeeDTOs.ParentFeeObligationResponse>>> getChildFeeObligations(@PathVariable Long studentId) {
        assertParentOwnsStudent(studentId);
        return ResponseEntity.ok(ApiResponse.ok(feeService.getParentFeeObligations(studentId)));
    }

    @PostMapping("/payments/checkout-session")
    @Operation(summary = "Create a parent checkout session")
    public ResponseEntity<ApiResponse<FeeDTOs.CheckoutSessionResponse>> createCheckoutSession(
            @RequestBody FeeDTOs.CreateCheckoutSessionRequest request,
            @RequestHeader(value = "X-Operation-Key", required = false) String operationKey,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        return ResponseEntity.ok(ApiResponse.ok(feeService.createCheckoutSession(request, operationKey, idempotencyKey)));
    }

    @PostMapping("/payments/checkout-session/{attemptId}/confirm")
    @Operation(summary = "Confirm a parent checkout session")
    public ResponseEntity<ApiResponse<FeeDTOs.PaymentReceiptResponse>> confirmCheckout(@PathVariable Long attemptId,
                                                                                       @RequestBody FeeDTOs.ConfirmCheckoutRequest request,
                                                                                       @RequestHeader(value = "X-Operation-Key", required = false) String operationKey,
                                                                                       @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        return ResponseEntity.ok(ApiResponse.ok(feeService.confirmCheckout(attemptId, request, operationKey, idempotencyKey), "Payment confirmed"));
    }

    @GetMapping("/payments/receipts/{receiptNumber}")
    @Operation(summary = "Get receipt by receipt number")
    public ResponseEntity<ApiResponse<FeeDTOs.PaymentReceiptResponse>> getReceipt(@PathVariable String receiptNumber) {
        return ResponseEntity.ok(ApiResponse.ok(feeService.getReceipt(receiptNumber)));
    }

    @GetMapping(value = "/payments/receipts/{receiptNumber}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Download fee receipt as PDF")
    public ResponseEntity<byte[]> downloadFeeReceiptPdf(@PathVariable String receiptNumber) {
        byte[] data = feeService.getParentFeeReceiptPdf(receiptNumber);
        String safeName = receiptNumber.replaceAll("[^a-zA-Z0-9._-]", "_");
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("fee-receipt-" + safeName + ".pdf", StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(data);
    }

    @GetMapping("/children/{studentId}/receipts")
    @Operation(summary = "List fee receipts for a child in a date range (payment activity)")
    public ResponseEntity<ApiResponse<List<FeeDTOs.PaymentReceiptResponse>>> listChildReceipts(
            @PathVariable Long studentId,
            @RequestParam String from,
            @RequestParam String to) {
        assertParentOwnsStudent(studentId);
        return ResponseEntity.ok(ApiResponse.ok(feeService.listParentReceipts(studentId, LocalDate.parse(from), LocalDate.parse(to))));
    }

    @GetMapping("/children/{studentId}/attendance")
    @Operation(summary = "Get child's attendance summary")
    public ResponseEntity<ApiResponse<AttendanceDTOs.AttendanceStatsResponse>> getChildAttendance(@PathVariable Long studentId,
                                                                                                   @RequestParam String from,
                                                                                                   @RequestParam String to) {
        Student student = assertParentOwnsStudent(studentId);
        List<AttendanceRecord> records = attendanceRepo.findByTenantIdAndStudentIdAndDateBetween(TenantContext.getTenantId(), studentId, LocalDate.parse(from), LocalDate.parse(to));
        long present = records.stream().filter(r -> r.getStatus() == com.school.erp.common.enums.Enums.AttendanceStatus.PRESENT).count();
        long absent = records.stream().filter(r -> r.getStatus() == com.school.erp.common.enums.Enums.AttendanceStatus.ABSENT).count();
        long late = records.stream().filter(r -> r.getStatus() == com.school.erp.common.enums.Enums.AttendanceStatus.LATE).count();
        long excused = records.stream().filter(r -> r.getStatus() == com.school.erp.common.enums.Enums.AttendanceStatus.EXCUSED).count();
        long total = records.size();
        double pct = total > 0 ? (double) (present + late) / total * 100 : 0;
        AttendanceDTOs.AttendanceStatsResponse response = AttendanceDTOs.AttendanceStatsResponse.builder()
                .studentId(student.getId())
                .totalDays(total)
                .present(present)
                .absent(absent)
                .late(late)
                .excused(excused)
                .attendancePercentage(Math.round(pct * 10) / 10.0)
                .build();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/children/{studentId}/attendance-records")
    @Operation(summary = "Get child's raw attendance records")
    public ResponseEntity<ApiResponse<List<AttendanceDTOs.AttendanceResponse>>> getChildAttendanceRecords(@PathVariable Long studentId,
                                                                                                           @RequestParam String from,
                                                                                                           @RequestParam String to) {
        assertParentOwnsStudent(studentId);
        List<AttendanceDTOs.AttendanceResponse> records = attendanceRepo.findByTenantIdAndStudentIdAndDateBetween(TenantContext.getTenantId(), studentId, LocalDate.parse(from), LocalDate.parse(to))
                .stream()
                .map(r -> AttendanceDTOs.AttendanceResponse.builder()
                        .id(r.getId())
                        .studentId(r.getStudentId())
                        .studentName(r.getStudentName())
                        .classId(r.getClassId())
                        .sectionId(r.getSectionId())
                        .date(r.getDate().toString())
                        .status(r.getStatus().name().toLowerCase())
                        .markedBy(r.getMarkedBy())
                        .remarks(r.getRemarks())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(records));
    }

    @GetMapping("/children/{studentId}/timetable")
    @Operation(summary = "Child’s weekly class timetable", description = "Resolves class/section from the student after parent access check; same payload shape as GET /timetable.")
    public ResponseEntity<ApiResponse<List<TimetableEntry>>> getChildClassTimetable(@PathVariable Long studentId) {
        Student s = assertParentOwnsStudent(studentId);
        Long sectionParam = (s.getSectionId() != null && s.getSectionId() > 0) ? s.getSectionId() : null;
        return ResponseEntity.ok(ApiResponse.ok(timetableService.getByClassAndSection(s.getClassId(), sectionParam)));
    }

    @GetMapping("/children/{studentId}/timetable/grid")
    @Operation(summary = "Child’s timetable grid", description = "Same shape as GET /timetable/grid, scoped to the linked student.")
    public ResponseEntity<ApiResponse<TimetableDTOs.TimetableGridResponse>> getChildClassTimetableGrid(@PathVariable Long studentId) {
        Student s = assertParentOwnsStudent(studentId);
        Long sectionParam = (s.getSectionId() != null && s.getSectionId() > 0) ? s.getSectionId() : null;
        return ResponseEntity.ok(ApiResponse.ok(timetableService.getGrid(s.getClassId(), sectionParam)));
    }

    /**
     * Fills {@code homeroomTeacherUserId} / {@code homeroomTeacherName} from the student's class row so the JSON matches parent-portal mocks.
     */
    /**
     * Populates {@code schoolEmail} for parent settings: uses stored student email when set; otherwise derives
     * {@code {admission}@{domain}} from the tenant’s configured school contact email domain.
     */
    private void enrichSchoolEmailForParentPortal(String tenantId, List<Student> children) {
        if (children == null || children.isEmpty()) {
            return;
        }
        String domain = tenantConfigRepository.findByTenantId(tenantId)
                .map(c -> extractEmailDomain(c.getEmail()))
                .orElse(null);
        for (Student s : children) {
            String stored = s.getEmail() != null ? s.getEmail().trim() : "";
            if (!stored.isEmpty()) {
                s.setSchoolEmail(stored);
            } else if (domain != null && !domain.isBlank() && s.getAdmissionNumber() != null) {
                String local = admissionToEmailLocalPart(s.getAdmissionNumber());
                if (!local.isEmpty()) {
                    s.setSchoolEmail(local + "@" + domain.toLowerCase());
                }
            }
        }
    }

    private static String extractEmailDomain(String email) {
        if (email == null) {
            return null;
        }
        String t = email.trim();
        int at = t.lastIndexOf('@');
        if (at <= 0 || at >= t.length() - 1) {
            return null;
        }
        return t.substring(at + 1).trim();
    }

    private static String admissionToEmailLocalPart(String admissionNumber) {
        if (admissionNumber == null) {
            return "";
        }
        return admissionNumber.trim().toLowerCase().replaceAll("[^a-z0-9._-]+", "");
    }

    private void enrichHomeroomFromSchoolClass(String tenantId, List<Student> children) {
        if (children == null || children.isEmpty()) {
            return;
        }
        Map<Long, SchoolClass> byClassId = new HashMap<>();
        for (Student s : children) {
            Long classId = s.getClassId();
            if (classId == null) {
                continue;
            }
            SchoolClass sc = byClassId.computeIfAbsent(
                    classId,
                    id -> schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId).orElse(null));
            if (sc == null) {
                continue;
            }
            Long homeroomTeacherPk = sc.getClassTeacherId();
            if (s.getSectionId() != null) {
                Section sec = sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(s.getSectionId(), tenantId).orElse(null);
                if (sec != null && sec.getClassTeacherId() != null) {
                    homeroomTeacherPk = sec.getClassTeacherId();
                }
            }
            if (homeroomTeacherPk != null) {
                teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(homeroomTeacherPk, tenantId).ifPresent(t -> {
                    s.setHomeroomTeacherUserId(t.getUserId());
                    if (t.getUserId() != null) {
                        userRepository.findByIdAndTenantIdAndIsDeletedFalse(t.getUserId(), tenantId)
                                .ifPresent(u -> s.setHomeroomTeacherName(u.getName()));
                    }
                    if (s.getHomeroomTeacherName() == null || s.getHomeroomTeacherName().isBlank()) {
                        if (s.getSectionId() != null) {
                            sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(s.getSectionId(), tenantId).ifPresent(sec -> {
                                if (sec.getClassTeacherName() != null && !sec.getClassTeacherName().isBlank()) {
                                    s.setHomeroomTeacherName(sec.getClassTeacherName());
                                }
                            });
                        }
                        if (s.getHomeroomTeacherName() == null || s.getHomeroomTeacherName().isBlank()) {
                            s.setHomeroomTeacherName(sc.getClassTeacherName());
                        }
                    }
                });
            }
        }
    }

    private Student assertParentOwnsStudent(Long studentId) {
        Student student = studentRepo.findByIdAndTenantIdAndIsDeletedFalse(studentId, TenantContext.getTenantId())
                .orElseThrow(() -> new com.school.erp.common.exception.ResourceNotFoundException("Student", studentId));
        Long uid = TenantContext.getUserId();
        if (uid == null
                || (!uid.equals(student.getParentId())
                && !guardianService.guardianUserHasAccessToStudent(TenantContext.getTenantId(), uid, studentId))) {
            throw new UnauthorizedException("You are not allowed to access this student");
        }
        return student;
    }

    public ParentController(
            final StudentRepository studentRepo,
            final GuardianService guardianService,
            final ExamService examService,
            final FeePaymentRepository feeRepo,
            final AttendanceRepository attendanceRepo,
            final FeeService feeService,
            final SchoolClassRepository schoolClassRepository,
            final SectionRepository sectionRepository,
            final TeacherRepository teacherRepository,
            final UserRepository userRepository,
            final TimetableService timetableService,
            final ParentPortalReadFacade parentPortalReadFacade,
            final StudentEnrolmentDisplayService studentEnrolmentDisplayService,
            final TenantConfigRepository tenantConfigRepository,
            final AuditService auditService,
            final ParentExamNotificationService parentExamNotificationService,
            final ReportService reportService) {
        this.studentRepo = studentRepo;
        this.guardianService = guardianService;
        this.examService = examService;
        this.feeRepo = feeRepo;
        this.attendanceRepo = attendanceRepo;
        this.feeService = feeService;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
        this.timetableService = timetableService;
        this.parentPortalReadFacade = parentPortalReadFacade;
        this.studentEnrolmentDisplayService = studentEnrolmentDisplayService;
        this.tenantConfigRepository = tenantConfigRepository;
        this.auditService = auditService;
        this.parentExamNotificationService = parentExamNotificationService;
        this.reportService = reportService;
    }
}
