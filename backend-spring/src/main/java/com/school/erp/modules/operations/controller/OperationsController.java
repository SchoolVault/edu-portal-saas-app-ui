package com.school.erp.modules.operations.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.operations.dto.OperationsDTOs;
import com.school.erp.modules.operations.service.OperationsService;
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
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class OperationsController {

    private final OperationsService operationsService;

    public OperationsController(OperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping("/staff")
    @Operation(summary = "List operational staff (non-teaching roles)")
    public ResponseEntity<ApiResponse<List<OperationsDTOs.OperationalStaffResponse>>> listStaff() {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listStaff()));
    }

    @PostMapping("/staff")
    @Operation(summary = "Add operational staff")
    public ResponseEntity<ApiResponse<OperationsDTOs.OperationalStaffResponse>> createStaff(
            @Valid @RequestBody OperationsDTOs.OperationalStaffCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.createStaff(req)));
    }

    @DeleteMapping("/staff/{id}")
    @Operation(summary = "Remove operational staff", description = "Soft-delete by default. permanent=true purges the row only when no user or transport link exists.")
    public ResponseEntity<ApiResponse<Void>> deleteStaff(
            @PathVariable Long id,
            @RequestParam(name = "permanent", defaultValue = "false") boolean permanent) {
        operationsService.deleteStaff(id, permanent);
        return ResponseEntity.ok(ApiResponse.ok(null, permanent ? "Permanently removed" : "Soft-deleted"));
    }

    @GetMapping("/visitors")
    public ResponseEntity<ApiResponse<List<OperationsDTOs.VisitorLogResponse>>> listVisitors() {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listVisitors()));
    }

    @PostMapping("/visitors/check-in")
    public ResponseEntity<ApiResponse<OperationsDTOs.VisitorLogResponse>> checkIn(@RequestBody OperationsDTOs.VisitorCheckInRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.checkInVisitor(req)));
    }

    @PostMapping("/visitors/{id}/check-out")
    public ResponseEntity<ApiResponse<OperationsDTOs.VisitorLogResponse>> checkOut(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.checkOutVisitor(id)));
    }

    @GetMapping("/gate-passes")
    public ResponseEntity<ApiResponse<List<OperationsDTOs.GatePassResponse>>> listGate() {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listGatePasses()));
    }

    @PostMapping("/gate-passes")
    public ResponseEntity<ApiResponse<OperationsDTOs.GatePassResponse>> createGate(@RequestBody OperationsDTOs.GatePassCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.createGatePass(req)));
    }

    @PostMapping("/gate-passes/{id}/revoke")
    public ResponseEntity<ApiResponse<Void>> revokeGate(@PathVariable Long id) {
        operationsService.revokeGatePass(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Revoked"));
    }

    @GetMapping("/inventory")
    public ResponseEntity<ApiResponse<List<OperationsDTOs.InventoryItemResponse>>> listInv() {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listInventory()));
    }

    @PostMapping("/inventory")
    public ResponseEntity<ApiResponse<OperationsDTOs.InventoryItemResponse>> upsertInv(@RequestBody OperationsDTOs.InventoryItemCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.upsertInventory(req)));
    }

    @DeleteMapping("/inventory/{id}")
    @Operation(summary = "Remove inventory item (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteInv(@PathVariable Long id) {
        operationsService.deleteInventory(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Inventory item removed"));
    }

    @GetMapping("/fee-reminders")
    public ResponseEntity<ApiResponse<List<OperationsDTOs.FeeReminderResponse>>> listRem(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.listFeeReminders(status)));
    }

    @PostMapping("/fee-reminders")
    public ResponseEntity<ApiResponse<OperationsDTOs.FeeReminderResponse>> enqueueRem(@RequestBody OperationsDTOs.FeeReminderEnqueueRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.enqueueFeeReminder(req)));
    }

    @GetMapping("/payroll-accrual/summary")
    public ResponseEntity<ApiResponse<OperationsDTOs.PayrollAccrualSummaryResponse>> payrollSummary(
            @RequestParam(required = false) String period) {
        return ResponseEntity.ok(ApiResponse.ok(operationsService.payrollAccrualSummary(period)));
    }
}
