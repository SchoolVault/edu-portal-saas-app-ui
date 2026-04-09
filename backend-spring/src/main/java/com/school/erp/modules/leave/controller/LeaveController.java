package com.school.erp.modules.leave.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.leave.dto.LeaveDTOs;
import com.school.erp.modules.leave.service.LeaveService;
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
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "All leave requests (admin/teacher)")
    public ResponseEntity<ApiResponse<List<LeaveDTOs.LeaveResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(leaveService.listAll()));
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
}
