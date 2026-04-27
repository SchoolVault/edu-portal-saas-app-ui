package com.school.erp.modules.operations.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.operations.dto.OperationsDTOs;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.modules.operations.service.OperationsService;
import com.school.erp.security.rbac.RbacSpel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/operations")
@Tag(name = "School operations", description = "Staff, visitors, gate passes, inventory, fee reminders, payroll accrual stub")
@RequireTenantFeature("operationsHub")
public class OperationsController {

    private final OperationsService operationsService;

    public OperationsController(OperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping("/staff")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_READ)
    @Operation(summary = "List operational staff (non-teaching roles)")
    public ResponseEntity<ApiResponse<List<OperationsDTOs.OperationalStaffResponse>>> listStaff() {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listStaff()));
    }

    @GetMapping("/staff/paged")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_READ)
    @Operation(summary = "List operational staff (paged)")
    public ResponseEntity<ApiResponse<PageResponse<OperationsDTOs.OperationalStaffResponse>>> listStaffPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listStaffPaged(page, size)));
    }

    @PostMapping("/staff")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_WRITE)
    @Operation(summary = "Add operational staff")
    public ResponseEntity<ApiResponse<OperationsDTOs.OperationalStaffResponse>> createStaff(
            @Valid @RequestBody OperationsDTOs.OperationalStaffCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.createStaff(req)));
    }

    @DeleteMapping("/staff/{id}")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_WRITE)
    @Operation(summary = "Remove operational staff", description = "Soft-delete by default. permanent=true purges the row only when no user or transport link exists.")
    public ResponseEntity<ApiResponse<Void>> deleteStaff(
            @PathVariable Long id,
            @RequestParam(name = "permanent", defaultValue = "false") boolean permanent) {
        operationsService.deleteStaff(id, permanent);
        return ResponseEntity.ok(ApiResponse.ok(null, permanent ? "Permanently removed" : "Soft-deleted"));
    }

    @GetMapping("/visitors")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_READ)
    public ResponseEntity<ApiResponse<List<OperationsDTOs.VisitorLogResponse>>> listVisitors() {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listVisitors()));
    }

    @GetMapping("/visitors/paged")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_READ)
    public ResponseEntity<ApiResponse<PageResponse<OperationsDTOs.VisitorLogResponse>>> listVisitorsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listVisitorsPaged(page, size)));
    }

    @PostMapping("/visitors/check-in")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_WRITE)
    public ResponseEntity<ApiResponse<OperationsDTOs.VisitorLogResponse>> checkIn(@RequestBody OperationsDTOs.VisitorCheckInRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.checkInVisitor(req)));
    }

    @PostMapping("/visitors/{id}/check-out")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_WRITE)
    public ResponseEntity<ApiResponse<OperationsDTOs.VisitorLogResponse>> checkOut(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.checkOutVisitor(id)));
    }

    @GetMapping("/gate-passes")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_READ)
    public ResponseEntity<ApiResponse<List<OperationsDTOs.GatePassResponse>>> listGate() {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listGatePasses()));
    }

    @GetMapping("/gate-passes/paged")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_READ)
    public ResponseEntity<ApiResponse<PageResponse<OperationsDTOs.GatePassResponse>>> listGatePaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listGatePassesPaged(page, size)));
    }

    @PostMapping("/gate-passes")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_WRITE)
    public ResponseEntity<ApiResponse<OperationsDTOs.GatePassResponse>> createGate(@RequestBody OperationsDTOs.GatePassCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.createGatePass(req)));
    }

    @PostMapping("/gate-passes/{id}/revoke")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_WRITE)
    public ResponseEntity<ApiResponse<Void>> revokeGate(@PathVariable Long id) {
        operationsService.revokeGatePass(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Revoked"));
    }

    @GetMapping("/inventory")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_READ)
    public ResponseEntity<ApiResponse<List<OperationsDTOs.InventoryItemResponse>>> listInv() {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listInventory()));
    }

    @GetMapping("/inventory/paged")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_READ)
    public ResponseEntity<ApiResponse<PageResponse<OperationsDTOs.InventoryItemResponse>>> listInvPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listInventoryPaged(page, size)));
    }

    @PostMapping("/inventory")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_WRITE)
    public ResponseEntity<ApiResponse<OperationsDTOs.InventoryItemResponse>> upsertInv(@RequestBody OperationsDTOs.InventoryItemCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.upsertInventory(req)));
    }

    @DeleteMapping("/inventory/{id}")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_WRITE)
    @Operation(summary = "Remove inventory item (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteInv(@PathVariable Long id) {
        operationsService.deleteInventory(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Inventory item removed"));
    }

    @GetMapping("/fee-reminders")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_READ)
    public ResponseEntity<ApiResponse<List<OperationsDTOs.FeeReminderResponse>>> listRem(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listFeeReminders(status)));
    }

    @GetMapping("/fee-reminders/paged")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_READ)
    @Operation(summary = "Fee reminder queue (paged)", description = "Omit status for all rows; otherwise filter by status")
    public ResponseEntity<ApiResponse<PageResponse<OperationsDTOs.FeeReminderResponse>>> listRemPaged(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listFeeRemindersPaged(status, page, size)));
    }

    @PostMapping("/fee-reminders")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_WRITE)
    public ResponseEntity<ApiResponse<OperationsDTOs.FeeReminderResponse>> enqueueRem(@RequestBody OperationsDTOs.FeeReminderEnqueueRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.enqueueFeeReminder(req)));
    }

    @GetMapping("/payroll-accrual/summary")
    @PreAuthorize(RbacSpel.SCHOOL_OPERATIONS_READ)
    public ResponseEntity<ApiResponse<OperationsDTOs.PayrollAccrualSummaryResponse>> payrollSummary(
            @RequestParam(required = false) String period) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.payrollAccrualSummary(period)));
    }
}
