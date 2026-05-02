package com.school.erp.modules.payroll.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.payroll.dto.PayrollDTOs;
import com.school.erp.modules.payroll.entity.Payslip;
import com.school.erp.modules.payroll.service.DemoFinanceResetService;
import com.school.erp.modules.payroll.service.PayrollService;
import com.school.erp.security.rbac.RbacSpel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payroll")
@Tag(name = "Payroll", description = "Salary Structure, Payslip Generation & Management")
@RequireTenantFeature("payroll")
public class PayrollController {
    private final PayrollService service;
    private final DemoFinanceResetService demoFinanceResetService;

    @GetMapping("/structures")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_READ)
    @Operation(summary = "List salary structures with components")
    public ResponseEntity<ApiResponse<List<PayrollDTOs.SalaryStructureResponse>>> listStructures() {
        return ResponseEntity.ok(ApiResponse.ok(service.getStructures()));
    }

    @GetMapping("/structures/paged")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_READ)
    @Operation(summary = "List salary structures (paged)")
    public ResponseEntity<ApiResponse<PageResponse<PayrollDTOs.SalaryStructureResponse>>> listStructuresPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.getStructuresPaged(page, size)));
    }

    @PostMapping("/structures")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_WRITE)
    @Operation(summary = "Create salary structure", description = "Define basic salary, allowances, and deductions for a teacher")
    public ResponseEntity<ApiResponse<PayrollDTOs.SalaryStructureResponse>> createStructure(@Valid @RequestBody PayrollDTOs.CreateSalaryStructureRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createStructure(req)));
    }

    @PutMapping("/structures/{id}")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_WRITE)
    @Operation(summary = "Update salary structure", description = "Replace basic salary and component lines for an existing structure (teacher id must match).")
    public ResponseEntity<ApiResponse<PayrollDTOs.SalaryStructureResponse>> updateStructure(
            @PathVariable long id, @Valid @RequestBody PayrollDTOs.CreateSalaryStructureRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateStructure(id, req)));
    }

    @PostMapping("/payslips/generate")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_WRITE)
    @Operation(summary = "Generate payslips", description = "Generate payslips for all teachers for a given month/year")
    public ResponseEntity<ApiResponse<List<Payslip>>> generatePayslips(@Valid @RequestBody PayrollDTOs.GeneratePayslipRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.generatePayslips(req.getMonth(), req.getYear())));
    }

    @GetMapping("/teachers/payment-details")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_READ)
    @Operation(summary = "Teachers on salary with bank details (masked) for disbursement")
    public ResponseEntity<ApiResponse<List<PayrollDTOs.TeacherPaymentDetailsResponse>>> teacherPaymentDetails() {
        return ResponseEntity.ok(ApiResponse.ok(service.listTeacherPaymentDetails()));
    }

    @GetMapping("/payslips")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_READ)
    @Operation(summary = "List payslips", description = "Filter by year and month")
    public ResponseEntity<ApiResponse<List<Payslip>>> listPayslips(@RequestParam(required = false) Integer year, @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPayslips(year, month)));
    }

    @GetMapping("/payslips/paged")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_READ)
    @Operation(summary = "List payslips (paged)", description = "Filter by year and month")
    public ResponseEntity<ApiResponse<PageResponse<Payslip>>> listPayslipsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPayslipsPaged(page, size, year, month)));
    }

    @GetMapping("/payslips/me")
    @PreAuthorize(RbacSpel.PORTAL_TEACHER_SELF)
    @Operation(summary = "Teacher payslips for linked profile")
    public ResponseEntity<ApiResponse<List<Payslip>>> myPayslips(@RequestParam(required = false) Integer year, @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMyPayslips(year, month)));
    }

    @GetMapping("/payslips/me/paged")
    @PreAuthorize(RbacSpel.PORTAL_TEACHER_SELF)
    @Operation(summary = "Teacher payslips (paged)")
    public ResponseEntity<ApiResponse<PageResponse<Payslip>>> myPayslipsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMyPayslipsPaged(page, size, year, month)));
    }

    @GetMapping(value = "/payslips/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize(RbacSpel.PAYROLL_PAYSLIP_READ)
    @Operation(summary = "Download payslip PDF")
    public ResponseEntity<byte[]> payslipPdf(@PathVariable Long id) {
        byte[] data = service.getPayslipPdf(id);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("payslip-" + id + ".pdf", StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(data);
    }

    @PostMapping("/payslips/{id}/mark-paid")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_WRITE)
    @Operation(summary = "Mark payslip paid (after bank transfer recorded)")
    public ResponseEntity<ApiResponse<Payslip>> markPaid(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.markPayslipPaid(id)));
    }

    @PostMapping("/disburse/initiate")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_WRITE)
    @Operation(summary = "Initiate salary disbursement", description = "Uses generated payslip net amount and teacher bank profile; returns a bank reference for reconciliation")
    public ResponseEntity<ApiResponse<PayrollDTOs.DisburseSalaryResponse>> initiateDisburse(
            @Valid @RequestBody PayrollDTOs.DisburseSalaryRequest req,
            @RequestHeader(value = "X-Operation-Key", required = false) String operationKey,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        return ResponseEntity.ok(ApiResponse.ok(service.initiateSalaryDisbursement(req, operationKey, idempotencyKey)));
    }

    @GetMapping("/disburse/attempts/paged")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_READ)
    @Operation(summary = "Disbursement attempts queue (paged)", description = "Filter by status: SUBMITTED, COMPLETED, FAILED")
    public ResponseEntity<ApiResponse<PageResponse<PayrollDTOs.DisbursementAttemptResponse>>> disbursementAttemptsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok(service.getDisbursementAttemptsPaged(page, size, status)));
    }

    @GetMapping("/disburse/summary")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_READ)
    @Operation(summary = "Disbursement queue summary")
    public ResponseEntity<ApiResponse<PayrollDTOs.DisbursementQueueSummaryResponse>> disbursementSummary() {
        return ResponseEntity.ok(ApiResponse.ok(service.getDisbursementSummary()));
    }

    @PostMapping("/disburse/attempts/{id}/status")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_WRITE)
    @Operation(summary = "Reconcile disbursement status", description = "Updates queue attempt status and synchronizes payslip paid/generated state")
    public ResponseEntity<ApiResponse<PayrollDTOs.DisbursementAttemptResponse>> updateDisbursementStatus(
            @PathVariable Long id,
            @Valid @RequestBody PayrollDTOs.UpdateDisbursementStatusRequest req,
            @RequestHeader(value = "X-Operation-Key", required = false) String operationKey,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateDisbursementStatus(id, req, operationKey, idempotencyKey)));
    }

    @PostMapping("/demo/reset-finance-data")
    @PreAuthorize(RbacSpel.SCHOOL_PAYROLL_WRITE)
    @Operation(summary = "Reset demo finance data", description = "Demo-only one-click reset for fees and payroll sample data in current tenant.")
    public ResponseEntity<ApiResponse<Map<String, Long>>> resetDemoFinanceData() {
        return ResponseEntity.ok(ApiResponse.ok(demoFinanceResetService.resetDemoFinanceData(), "Demo finance data reset completed."));
    }

    public PayrollController(final PayrollService service, final DemoFinanceResetService demoFinanceResetService) {
        this.service = service;
        this.demoFinanceResetService = demoFinanceResetService;
    }
}
