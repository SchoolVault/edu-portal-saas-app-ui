package com.school.erp.modules.leave.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.leave.dto.LeaveDTOs;
import com.school.erp.modules.leave.service.LeaveService;
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
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Submit leave request")
    public ResponseEntity<ApiResponse<LeaveDTOs.LeaveResponse>> submit(@Valid @RequestBody LeaveDTOs.CreateLeaveRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(leaveService.submit(req)));
    }

    @GetMapping("/requests/mine")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "My leave requests")
    public ResponseEntity<ApiResponse<List<LeaveDTOs.LeaveResponse>>> mine() {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.listMine()));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "All leave requests (school admin approver queue)")
    public ResponseEntity<ApiResponse<List<LeaveDTOs.LeaveResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.listAll()));
    }

    @GetMapping("/requests/mine/paged")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "My leave requests (paged)")
    public ResponseEntity<ApiResponse<PageResponse<LeaveDTOs.LeaveResponse>>> minePaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.listMinePaged(page, size, q)));
    }

    @GetMapping("/requests/paged")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "All leave requests (paged, school admin approver queue)")
    public ResponseEntity<ApiResponse<PageResponse<LeaveDTOs.LeaveResponse>>> listPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.listAllPaged(page, size, q)));
    }

    @PutMapping("/requests/{id}/decision")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve or reject leave")
    public ResponseEntity<ApiResponse<LeaveDTOs.LeaveResponse>> decide(
            @PathVariable Long id, @RequestBody LeaveDTOs.ApproveLeaveRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.decide(id, req)));
    }

    @GetMapping("/balance")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Leave entitlement snapshot for the signed-in user")
    public ResponseEntity<ApiResponse<LeaveDTOs.LeaveBalanceSummary>> balance() {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.balanceForCurrentUser()));
    }

    @GetMapping("/policy")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Tenant leave policy (entitled days per bucket + optional policy year label)")
    public ResponseEntity<ApiResponse<LeaveDTOs.LeaveEntitlementPolicy>> getPolicy() {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.getLeavePolicy()));
    }

    @PutMapping("/policy")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update tenant leave policy (school admin)")
    public ResponseEntity<ApiResponse<LeaveDTOs.LeaveEntitlementPolicy>> updatePolicy(
            @Valid @RequestBody LeaveDTOs.LeaveEntitlementPolicy body) {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.updateLeavePolicy(body)));
    }
}
