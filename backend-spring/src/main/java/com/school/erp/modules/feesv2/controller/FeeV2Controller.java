package com.school.erp.modules.feesv2.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.feesv2.dto.FeeV2DTOs;
import com.school.erp.modules.feesv2.service.FeeV2Service;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.security.rbac.RbacSpel;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/fees-v2")
@Tag(name = "Fees V2", description = "Canonical fee domain: structures, billing, reporting, refunds, audit, late fees (phases 1–4)")
@RequireTenantFeature("fees")
public class FeeV2Controller {
    private final FeeV2Service service;

    public FeeV2Controller(FeeV2Service service) {
        this.service = service;
    }

    @GetMapping("/components")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.ComponentResponse>>> getComponents() {
        return ResponseEntity.ok(ApiResponse.ok(service.getComponents()));
    }

    @PostMapping("/components")
    @PreAuthorize(RbacSpel.FEE_CONFIG_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.ComponentResponse>> createComponent(@Valid @RequestBody FeeV2DTOs.CreateComponentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createComponent(request)));
    }

    @PutMapping("/components/{id}")
    @PreAuthorize(RbacSpel.FEE_CONFIG_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.ComponentResponse>> updateComponent(
            @PathVariable Long id,
            @Valid @RequestBody FeeV2DTOs.UpdateComponentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateComponent(id, request)));
    }

    @DeleteMapping("/components/{id}")
    @PreAuthorize(RbacSpel.FEE_CONFIG_WRITE)
    public ResponseEntity<ApiResponse<Void>> deleteComponent(@PathVariable Long id) {
        service.deleteComponent(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Component deleted"));
    }

    @GetMapping("/structures")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.StructureResponse>>> getStructures() {
        return ResponseEntity.ok(ApiResponse.ok(service.getStructures()));
    }

    @PostMapping("/structures")
    @PreAuthorize(RbacSpel.FEE_CONFIG_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.StructureResponse>> createStructure(@Valid @RequestBody FeeV2DTOs.CreateStructureRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createStructure(request)));
    }

    @PostMapping("/student-fee-map/snapshot")
    @PreAuthorize(RbacSpel.FEE_CONFIG_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.SnapshotFeeMapResponse>> createSnapshot(
            @Valid @RequestBody FeeV2DTOs.SnapshotFeeMapRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createStudentFeeMapSnapshot(request)));
    }

    @GetMapping("/student-fee-maps")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.StudentFeeMapResponse>>> getStudentFeeMaps(
            @RequestParam(required = false) Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getStudentFeeMaps(studentId)));
    }

    @GetMapping("/demands/students/{studentId}")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.DemandResponse>>> getStudentDemands(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getStudentDemands(studentId)));
    }

    @GetMapping("/discounts/students/{studentId}")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.DiscountResponse>>> getDiscountsForStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getDiscountsForStudent(studentId)));
    }

    @PostMapping("/discounts")
    @PreAuthorize(RbacSpel.FEE_BILLING_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.DiscountResponse>> createDiscount(@Valid @RequestBody FeeV2DTOs.CreateDiscountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createDiscount(request)));
    }

    @PutMapping("/discounts/{id}")
    @PreAuthorize(RbacSpel.FEE_BILLING_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.DiscountResponse>> updateDiscount(
            @PathVariable Long id, @Valid @RequestBody FeeV2DTOs.UpdateDiscountRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateDiscount(id, request)));
    }

    @DeleteMapping("/discounts/{id}")
    @PreAuthorize(RbacSpel.FEE_BILLING_WRITE)
    public ResponseEntity<ApiResponse<Void>> deleteDiscount(@PathVariable Long id) {
        service.deleteDiscount(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Discount removed"));
    }

    @GetMapping("/rules/{ruleId}/definition")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<FeeV2DTOs.RuleDefinitionResponse>> getRuleDefinition(@PathVariable Long ruleId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getRuleDefinition(ruleId)));
    }

    @PutMapping("/rules/{ruleId}/definition")
    @PreAuthorize(RbacSpel.FEE_CONFIG_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.RuleDefinitionResponse>> replaceRuleDefinition(
            @PathVariable Long ruleId, @Valid @RequestBody FeeV2DTOs.ReplaceRuleDefinitionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.replaceRuleDefinition(ruleId, request)));
    }

    @GetMapping("/rules")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.RuleResponse>>> getRules() {
        return ResponseEntity.ok(ApiResponse.ok(service.getRules()));
    }

    @PostMapping("/rules")
    @PreAuthorize(RbacSpel.FEE_CONFIG_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.RuleResponse>> createRule(@Valid @RequestBody FeeV2DTOs.CreateRuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createRule(request)));
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize(RbacSpel.FEE_CONFIG_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.RuleResponse>> updateRule(
            @PathVariable Long id,
            @Valid @RequestBody FeeV2DTOs.UpdateRuleRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateRule(id, request)));
    }

    @DeleteMapping("/rules/{id}")
    @PreAuthorize(RbacSpel.FEE_CONFIG_WRITE)
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable Long id) {
        service.deleteRule(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Rule deleted"));
    }

    @GetMapping("/demand-runs")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.DemandRunResponse>>> getDemandRuns() {
        return ResponseEntity.ok(ApiResponse.ok(service.getDemandRuns()));
    }

    @PostMapping("/demand-runs")
    @PreAuthorize(RbacSpel.FEE_BILLING_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.DemandRunResponse>> createDemandRun(@Valid @RequestBody FeeV2DTOs.CreateDemandRunRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createDemandRun(request)));
    }

    @PostMapping("/payments")
    @PreAuthorize(RbacSpel.FEE_BILLING_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.RecordPaymentResponse>> recordPayment(@Valid @RequestBody FeeV2DTOs.RecordPaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.recordPayment(request)));
    }

    @GetMapping("/ledger/students/{studentId}")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.LedgerEntryResponse>>> getStudentLedger(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getStudentLedger(studentId)));
    }

    @GetMapping("/reports/collection-summary")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<FeeV2DTOs.CollectionSummaryResponse>> getCollectionSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(service.getCollectionSummary(from, to)));
    }

    @GetMapping("/reports/defaulters")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.DefaulterRowResponse>>> getDefaulters() {
        return ResponseEntity.ok(ApiResponse.ok(service.getDefaulters()));
    }

    @GetMapping("/reports/outstanding-by-class")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.ClassOutstandingResponse>>> getOutstandingByClass() {
        return ResponseEntity.ok(ApiResponse.ok(service.getOutstandingByClass()));
    }

    @GetMapping("/reports/student-statement/{studentId}")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<FeeV2DTOs.StudentStatementResponse>> getStudentStatement(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getStudentStatement(studentId)));
    }

    @GetMapping("/payments/register")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.PaymentRegisterRowResponse>>> listPaymentRegister(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(service.listPaymentRegister(studentId, from, to)));
    }

    @GetMapping("/audit-events")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.AuditEventResponse>>> listAuditEvents() {
        return ResponseEntity.ok(ApiResponse.ok(service.listRecentAuditEvents()));
    }

    @PostMapping("/refunds")
    @PreAuthorize(RbacSpel.FEE_REFUND_REQUEST)
    public ResponseEntity<ApiResponse<FeeV2DTOs.RecordRefundResponse>> recordRefund(@Valid @RequestBody FeeV2DTOs.RecordRefundRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.recordRefund(request)));
    }

    @GetMapping("/late-fee-policies")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.LateFeePolicyResponse>>> getLateFeePolicies() {
        return ResponseEntity.ok(ApiResponse.ok(service.getLateFeePolicies()));
    }

    @PostMapping("/late-fee-policies")
    @PreAuthorize(RbacSpel.FEE_CONFIG_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.LateFeePolicyResponse>> createLateFeePolicy(
            @Valid @RequestBody FeeV2DTOs.CreateLateFeePolicyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createLateFeePolicy(request)));
    }

    @PutMapping("/late-fee-policies/{id}")
    @PreAuthorize(RbacSpel.FEE_CONFIG_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.LateFeePolicyResponse>> updateLateFeePolicy(
            @PathVariable Long id, @Valid @RequestBody FeeV2DTOs.UpdateLateFeePolicyRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateLateFeePolicy(id, request)));
    }

    @DeleteMapping("/late-fee-policies/{id}")
    @PreAuthorize(RbacSpel.FEE_CONFIG_WRITE)
    public ResponseEntity<ApiResponse<Void>> deleteLateFeePolicy(@PathVariable Long id) {
        service.deleteLateFeePolicy(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Late fee policy removed"));
    }

    @GetMapping("/late-fee-runs")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<List<FeeV2DTOs.LateFeeRunResponse>>> getLateFeeRuns() {
        return ResponseEntity.ok(ApiResponse.ok(service.getLateFeeRuns()));
    }

    @PostMapping("/late-fee-runs")
    @PreAuthorize(RbacSpel.FEE_BILLING_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.LateFeeRunResponse>> createLateFeeRun(
            @Valid @RequestBody FeeV2DTOs.CreateLateFeeRunRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createLateFeeRun(request)));
    }

    @PostMapping("/fee-assignments/preview")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<FeeV2DTOs.FeeAssignmentPreviewResponse>> previewFeeAssignments(
            @RequestBody FeeV2DTOs.FeeAssignmentPreviewRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.previewFeeAssignments(request)));
    }

    @PostMapping("/fee-assignments/execute")
    @PreAuthorize(RbacSpel.FEE_BILLING_WRITE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.FeeAssignmentExecuteResponse>> executeFeeAssignments(
            @Valid @RequestBody FeeV2DTOs.FeeAssignmentExecuteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(service.executeFeeAssignments(request)));
    }

    @PostMapping("/payments/razorpay-order")
    @PreAuthorize(RbacSpel.FEE_ONLINE_CHECKOUT)
    public ResponseEntity<ApiResponse<FeeV2DTOs.FeesV2RazorpayOrderResponse>> createFeesV2RazorpayOrder(
            @Valid @RequestBody FeeV2DTOs.FeesV2RazorpayOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(service.createFeesV2RazorpayOrder(request)));
    }

    @GetMapping("/reports/ledger-reconciliation")
    @PreAuthorize(RbacSpel.FEE_FINANCE_READ)
    public ResponseEntity<ApiResponse<FeeV2DTOs.LedgerReconciliationReportResponse>> getLedgerReconciliationReport() {
        return ResponseEntity.ok(ApiResponse.ok(service.getLedgerReconciliationReport()));
    }

    @PostMapping("/refunds/{refundId}/approve")
    @PreAuthorize(RbacSpel.FEE_REFUND_APPROVE)
    public ResponseEntity<ApiResponse<FeeV2DTOs.RecordRefundResponse>> approvePendingRefund(@PathVariable Long refundId) {
        return ResponseEntity.ok(ApiResponse.ok(service.approvePendingRefund(refundId)));
    }
}
