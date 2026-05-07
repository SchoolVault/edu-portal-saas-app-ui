package com.school.erp.modules.leave.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.leave.dto.LeaveDTOs;
import com.school.erp.modules.leave.service.LeaveService;
import com.school.erp.security.rbac.RbacSpel;
import com.school.erp.security.RequireTenantFeature;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leave")
@Tag(name = "Leave", description = "Leave requests and approvals")
@RequireTenantFeature("leave")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @PostMapping("/requests")
    @PreAuthorize(RbacSpel.SCHOOL_LEAVE_SELF_APPLY)
    @Operation(summary = "Submit leave request")
    public ResponseEntity<ApiResponse<LeaveDTOs.LeaveResponse>> submit(@Valid @RequestBody LeaveDTOs.CreateLeaveRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(leaveService.submit(req)));
    }

    @GetMapping("/requests/mine")
    @PreAuthorize(RbacSpel.SCHOOL_LEAVE_SELF_READ)
    @Operation(summary = "My leave requests")
    public ResponseEntity<ApiResponse<List<LeaveDTOs.LeaveResponse>>> mine() {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.listMine()));
    }

    @GetMapping("/requests")
    @PreAuthorize(RbacSpel.SCHOOL_LEAVE_APPROVAL_READ)
    @Operation(summary = "All leave requests (school admin approver queue)")
    public ResponseEntity<ApiResponse<List<LeaveDTOs.LeaveResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.listAll()));
    }

    @GetMapping("/requests/mine/paged")
    @PreAuthorize(RbacSpel.SCHOOL_LEAVE_SELF_READ)
    @Operation(summary = "My leave requests (paged)")
    public ResponseEntity<ApiResponse<PageResponse<LeaveDTOs.LeaveResponse>>> minePaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.listMinePaged(page, size, q)));
    }

    @GetMapping("/requests/paged")
    @PreAuthorize(RbacSpel.SCHOOL_LEAVE_APPROVAL_READ)
    @Operation(summary = "All leave requests (paged, school admin approver queue)")
    public ResponseEntity<ApiResponse<PageResponse<LeaveDTOs.LeaveResponse>>> listPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.listAllPaged(page, size, q)));
    }

    @PutMapping("/requests/{id}/decision")
    @PreAuthorize(RbacSpel.SCHOOL_LEAVE_APPROVAL_WRITE)
    @Operation(summary = "Approve or reject leave")
    public ResponseEntity<ApiResponse<LeaveDTOs.LeaveResponse>> decide(
            @PathVariable Long id, @RequestBody LeaveDTOs.ApproveLeaveRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.decide(id, req)));
    }

    @PutMapping("/requests/{id}/cancel")
    @PreAuthorize(RbacSpel.SCHOOL_LEAVE_SELF_APPLY)
    @Operation(summary = "Cancel own pending leave request")
    public ResponseEntity<ApiResponse<LeaveDTOs.LeaveResponse>> cancelMine(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.cancelMine(id, reason)));
    }

    @GetMapping("/balance")
    @PreAuthorize(RbacSpel.SCHOOL_LEAVE_SELF_READ)
    @Operation(summary = "Leave entitlement snapshot for the signed-in user")
    public ResponseEntity<ApiResponse<LeaveDTOs.LeaveBalanceSummary>> balance() {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.balanceForCurrentUser()));
    }

    @GetMapping("/policy")
    @PreAuthorize(RbacSpel.SCHOOL_LEAVE_SELF_READ)
    @Operation(summary = "Tenant leave policy (entitled days per bucket + optional policy year label)")
    public ResponseEntity<ApiResponse<LeaveDTOs.LeaveEntitlementPolicy>> getPolicy() {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.getLeavePolicy()));
    }

    @PutMapping("/policy")
    @PreAuthorize(RbacSpel.SCHOOL_LEAVE_APPROVAL_WRITE)
    @Operation(summary = "Update tenant leave policy (school admin)")
    public ResponseEntity<ApiResponse<LeaveDTOs.LeaveEntitlementPolicy>> updatePolicy(
            @Valid @RequestBody LeaveDTOs.LeaveEntitlementPolicy body) {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.updateLeavePolicy(body)));
    }

    @PostMapping("/entitlements/allocate")
    @PreAuthorize(RbacSpel.SCHOOL_LEAVE_APPROVAL_WRITE)
    @Operation(summary = "Bulk allocate leave opening balances for selected users/roles")
    public ResponseEntity<ApiResponse<LeaveDTOs.BulkEntitlementAllocationResponse>> allocateEntitlements(
            @RequestBody LeaveDTOs.BulkEntitlementAllocationRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.bulkAllocateEntitlements(body)));
    }

    @GetMapping("/ledger/mine")
    @PreAuthorize(RbacSpel.SCHOOL_LEAVE_SELF_READ)
    @Operation(summary = "Leave entitlement ledger timeline for signed-in user")
    public ResponseEntity<ApiResponse<List<LeaveDTOs.EntitlementLedgerEntryResponse>>> myLedger() {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.listMyLedgerEntries()));
    }
}
