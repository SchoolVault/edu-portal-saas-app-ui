package com.school.erp.modules.fees.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.fees.dto.FeeDTOs;
import com.school.erp.modules.fees.service.FeeService;
import com.school.erp.modules.operations.dto.OperationsDTOs;
import com.school.erp.modules.operations.service.OperationsService;
import com.school.erp.security.rbac.RbacSpel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/fees")
@Tag(name = "Fees", description = "Fee Structure, Payments, Receipts & Collection Reports")
@RequireTenantFeature("fees")
public class FeeController {
    private final FeeService service;
    private final OperationsService operationsService;

    @GetMapping("/structures")
    @PreAuthorize(RbacSpel.FEE_STRUCTURES_READ)
    @Operation(summary = "List fee structures with components")
    public ResponseEntity<ApiResponse<List<FeeDTOs.FeeStructureResponse>>> getStructures() {
        return ResponseEntity.ok(ApiResponse.ok(service.getStructures()));
    }

    @PostMapping("/structures")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_WRITE)
    @Operation(summary = "Create fee structure with components", description = "Define fee structure with breakdown (tuition, transport, lab, etc.)")
    public ResponseEntity<ApiResponse<FeeDTOs.FeeStructureResponse>> createStructure(@Valid @RequestBody FeeDTOs.CreateFeeStructureRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createStructure(req)));
    }

    @PutMapping("/structures/{id}")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_WRITE)
    @Operation(summary = "Update fee structure", description = "Replaces component lines with the submitted list")
    public ResponseEntity<ApiResponse<FeeDTOs.FeeStructureResponse>> updateStructure(@PathVariable Long id, @Valid @RequestBody FeeDTOs.CreateFeeStructureRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateStructure(id, req)));
    }

    @DeleteMapping("/structures/{id}")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_WRITE)
    @Operation(summary = "Delete fee structure (soft)", description = "Marks structure and its components as deleted")
    public ResponseEntity<ApiResponse<Void>> deleteStructure(@PathVariable Long id) {
        service.deleteStructure(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Fee structure removed"));
    }

    @GetMapping("/payments")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_READ)
    @Operation(summary = "List fee payments", description = "Filter by status: PAID, PARTIAL, UNPAID, OVERDUE")
    public ResponseEntity<ApiResponse<List<FeeDTOs.FeePaymentResponse>>> getPayments(@RequestParam(required = false) Enums.FeeStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPayments(status)));
    }

    @GetMapping("/payments/paged")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_READ)
    @Operation(summary = "List fee payments (paged)", description = "Spring-style page in data; optional status and student name search (q)")
    public ResponseEntity<ApiResponse<PageResponse<FeeDTOs.FeePaymentResponse>>> getPaymentsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "16") int size,
            @RequestParam(required = false) Enums.FeeStatus status,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPaymentsPaged(page, size, status, q)));
    }

    @GetMapping("/payments/student/{studentId}")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_READ)
    @Operation(summary = "Get payment history for a student")
    public ResponseEntity<ApiResponse<List<FeeDTOs.FeePaymentResponse>>> getStudentPayments(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getStudentPayments(studentId)));
    }

    @PostMapping("/payments")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_WRITE)
    @Operation(summary = "Record fee payment", description = "Record a new payment or add to existing. Auto-calculates status, late fee, and generates receipt.")
    public ResponseEntity<ApiResponse<FeeDTOs.FeePaymentResponse>> recordPayment(@Valid @RequestBody FeeDTOs.RecordPaymentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.recordPayment(req)));
    }

    @PostMapping("/payments/bulk-assign")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_WRITE)
    @Operation(summary = "Bulk-assign fee structure to a class or section", description = "One request creates obligations for all active students; optional skip when duplicate structure+due date exists.")
    public ResponseEntity<ApiResponse<FeeDTOs.BulkAssignFeesResponse>> bulkAssignFees(@Valid @RequestBody FeeDTOs.BulkAssignFeesRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.bulkAssignFees(req)));
    }

    @GetMapping("/collection-summary")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_READ)
    @Operation(summary = "Fee collection summary", description = "Total collected, pending, overdue count, collection rate")
    public ResponseEntity<ApiResponse<FeeDTOs.FeeCollectionSummary>> getCollectionSummary() {
        return ResponseEntity.ok(ApiResponse.ok(service.getCollectionSummary()));
    }

    @PostMapping("/payments/reminders")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_WRITE)
    @Operation(summary = "Queue fee reminder", description = "Queues reminder without requiring Operations Hub module access.")
    public ResponseEntity<ApiResponse<Void>> enqueueFeeReminder(@RequestBody OperationsDTOs.FeeReminderEnqueueRequest req) {
        operationsService.enqueueFeeReminder(req);
        return ResponseEntity.ok(ApiResponse.ok(null, "Reminder queued"));
    }

    @GetMapping("/payments/{paymentId}/transactions")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_READ)
    @Operation(summary = "Fee transaction ledger", description = "Append-only transaction stream for one fee payment.")
    public ResponseEntity<ApiResponse<List<FeeDTOs.FeeTransactionResponse>>> getPaymentTransactions(@PathVariable Long paymentId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPaymentTransactions(paymentId)));
    }

    @PostMapping("/payments/{paymentId}/refunds/request")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_WRITE)
    @Operation(summary = "Request fee refund", description = "Creates REFUND_REQUESTED transaction in immutable ledger.")
    public ResponseEntity<ApiResponse<FeeDTOs.FeeTransactionResponse>> requestRefund(
            @PathVariable Long paymentId,
            @Valid @RequestBody FeeDTOs.FeeRefundRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.requestRefund(paymentId, request)));
    }

    @PostMapping("/payments/refunds/{transactionId}/approve")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_WRITE)
    @Operation(summary = "Approve fee refund", description = "Creates REFUND_APPROVED transaction linked by refund reference.")
    public ResponseEntity<ApiResponse<FeeDTOs.FeeTransactionResponse>> approveRefund(
            @PathVariable Long transactionId,
            @RequestBody FeeDTOs.FeeRefundDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.approveRefund(transactionId, request)));
    }

    @PostMapping("/payments/refunds/{transactionId}/execute")
    @PreAuthorize(RbacSpel.SCHOOL_FEES_WRITE)
    @Operation(summary = "Execute fee refund", description = "Creates REFUND_EXECUTED transaction and re-derives payment aggregate.")
    public ResponseEntity<ApiResponse<FeeDTOs.FeeTransactionResponse>> executeRefund(
            @PathVariable Long transactionId,
            @RequestBody FeeDTOs.FeeRefundExecuteRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.executeRefund(transactionId, request)));
    }

    public FeeController(final FeeService service, final OperationsService operationsService) {
        this.service = service;
        this.operationsService = operationsService;
    }
}
