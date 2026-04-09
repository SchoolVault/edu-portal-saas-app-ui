package com.school.erp.modules.parent.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.attendance.dto.AttendanceDTOs;
import com.school.erp.modules.attendance.entity.AttendanceRecord;
import com.school.erp.modules.attendance.repository.AttendanceRepository;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.exams.repository.MarkRecordRepository;
import com.school.erp.modules.exams.entity.MarkRecord;
import com.school.erp.modules.fees.repository.FeePaymentRepository;
import com.school.erp.modules.fees.entity.FeePayment;
import com.school.erp.modules.fees.dto.FeeDTOs;
import com.school.erp.modules.fees.service.FeeService;
import com.school.erp.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/parent")
@Tag(name = "Parent Portal", description = "Parent view - children, grades, fees, attendance")
@PreAuthorize("hasAnyRole('PARENT','ADMIN')")
public class ParentController {
    private final StudentRepository studentRepo;
    private final GuardianService guardianService;
    private final MarkRecordRepository markRepo;
    private final FeePaymentRepository feeRepo;
    private final AttendanceRepository attendanceRepo;
    private final FeeService feeService;

    @GetMapping("/children")
    @Operation(summary = "Get parent's children", description = "Returns all students linked to the current parent user")
    public ResponseEntity<ApiResponse<List<Student>>> getChildren() {
        String t = TenantContext.getTenantId();
        Long parentId = TenantContext.getUserId();
        List<Student> children = guardianService.findStudentsForParentUser(t, parentId);
        return ResponseEntity.ok(ApiResponse.ok(children));
    }

    @GetMapping("/children/{studentId}/marks")
    @Operation(summary = "Get child's exam marks")
    public ResponseEntity<ApiResponse<List<MarkRecord>>> getChildMarks(@PathVariable Long studentId) {
        assertParentOwnsStudent(studentId);
        return ResponseEntity.ok(ApiResponse.ok(markRepo.findByTenantIdAndStudentId(TenantContext.getTenantId(), studentId)));
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
        return ResponseEntity.ok(ApiResponse.ok(feeService.getParentFeeObligations(studentId)));
    }

    @PostMapping("/payments/checkout-session")
    @Operation(summary = "Create a parent checkout session")
    public ResponseEntity<ApiResponse<FeeDTOs.CheckoutSessionResponse>> createCheckoutSession(@RequestBody FeeDTOs.CreateCheckoutSessionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(feeService.createCheckoutSession(request)));
    }

    @PostMapping("/payments/checkout-session/{attemptId}/confirm")
    @Operation(summary = "Confirm a parent checkout session")
    public ResponseEntity<ApiResponse<FeeDTOs.PaymentReceiptResponse>> confirmCheckout(@PathVariable Long attemptId,
                                                                                       @RequestBody FeeDTOs.ConfirmCheckoutRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(feeService.confirmCheckout(attemptId, request), "Payment confirmed"));
    }

    @GetMapping("/payments/receipts/{receiptNumber}")
    @Operation(summary = "Get receipt by receipt number")
    public ResponseEntity<ApiResponse<FeeDTOs.PaymentReceiptResponse>> getReceipt(@PathVariable String receiptNumber) {
        return ResponseEntity.ok(ApiResponse.ok(feeService.getReceipt(receiptNumber)));
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

    private Student assertParentOwnsStudent(Long studentId) {
        Student student = studentRepo.findByIdAndTenantIdAndIsDeletedFalse(studentId, TenantContext.getTenantId())
                .orElseThrow(() -> new com.school.erp.common.exception.ResourceNotFoundException("Student", studentId));
        Long uid = TenantContext.getUserId();
        boolean admin = "ADMIN".equals(TenantContext.getUserRole());
        if (!admin
                && !uid.equals(student.getParentId())
                && !guardianService.guardianUserHasAccessToStudent(TenantContext.getTenantId(), uid, studentId)) {
            throw new UnauthorizedException("You are not allowed to access this student");
        }
        return student;
    }

    public ParentController(
            final StudentRepository studentRepo,
            final GuardianService guardianService,
            final MarkRecordRepository markRepo,
            final FeePaymentRepository feeRepo,
            final AttendanceRepository attendanceRepo,
            final FeeService feeService) {
        this.studentRepo = studentRepo;
        this.guardianService = guardianService;
        this.markRepo = markRepo;
        this.feeRepo = feeRepo;
        this.attendanceRepo = attendanceRepo;
        this.feeService = feeService;
    }
}
