package com.school.erp.modules.fees.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.fees.dto.FeeDTOs;
import com.school.erp.modules.fees.service.FeeService;
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
public class FeeController {
    private final FeeService service;

    @GetMapping("/structures")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "List fee structures with components")
    public ResponseEntity<ApiResponse<List<FeeDTOs.FeeStructureResponse>>> getStructures() {
        return ResponseEntity.ok(ApiResponse.ok(service.getStructures()));
    }

    @PostMapping("/structures")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Create fee structure with components", description = "Define fee structure with breakdown (tuition, transport, lab, etc.)")
    public ResponseEntity<ApiResponse<FeeDTOs.FeeStructureResponse>> createStructure(@Valid @RequestBody FeeDTOs.CreateFeeStructureRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createStructure(req)));
    }

    @PutMapping("/structures/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Update fee structure", description = "Replaces component lines with the submitted list")
    public ResponseEntity<ApiResponse<FeeDTOs.FeeStructureResponse>> updateStructure(@PathVariable Long id, @Valid @RequestBody FeeDTOs.CreateFeeStructureRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateStructure(id, req)));
    }

    @DeleteMapping("/structures/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Delete fee structure (soft)", description = "Marks structure and its components as deleted")
    public ResponseEntity<ApiResponse<Void>> deleteStructure(@PathVariable Long id) {
        service.deleteStructure(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Fee structure removed"));
    }

    @GetMapping("/payments")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List fee payments", description = "Filter by status: PAID, PARTIAL, UNPAID, OVERDUE")
    public ResponseEntity<ApiResponse<List<FeeDTOs.FeePaymentResponse>>> getPayments(@RequestParam(required = false) Enums.FeeStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPayments(status)));
    }

    @GetMapping("/payments/student/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get payment history for a student")
    public ResponseEntity<ApiResponse<List<FeeDTOs.FeePaymentResponse>>> getStudentPayments(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getStudentPayments(studentId)));
    }

    @PostMapping("/payments")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Record fee payment", description = "Record a new payment or add to existing. Auto-calculates status, late fee, and generates receipt.")
    public ResponseEntity<ApiResponse<FeeDTOs.FeePaymentResponse>> recordPayment(@Valid @RequestBody FeeDTOs.RecordPaymentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.recordPayment(req)));
    }

    @GetMapping("/collection-summary")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Fee collection summary", description = "Total collected, pending, overdue count, collection rate")
    public ResponseEntity<ApiResponse<FeeDTOs.FeeCollectionSummary>> getCollectionSummary() {
        return ResponseEntity.ok(ApiResponse.ok(service.getCollectionSummary()));
    }

    public FeeController(final FeeService service) {
        this.service = service;
    }
}
