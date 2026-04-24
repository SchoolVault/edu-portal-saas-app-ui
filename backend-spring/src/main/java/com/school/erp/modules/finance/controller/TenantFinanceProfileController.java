package com.school.erp.modules.finance.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.security.rbac.RbacSpel;
import com.school.erp.modules.finance.dto.TenantFinanceProfileDTOs;
import com.school.erp.modules.finance.service.TenantFinanceProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings/finance-profile")
@Tag(
        name = "Finance profile",
        description = "Per-tenant fee settlement routing (Razorpay Route linked accounts). "
                + "UI: Settings → Finance & payments → Fee settlement; not part of user profile.")
public class TenantFinanceProfileController {

    private final TenantFinanceProfileService service;

    public TenantFinanceProfileController(TenantFinanceProfileService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize(RbacSpel.SCHOOL_SETTINGS_FINANCE)
    @Operation(summary = "Get finance routing profile for current tenant")
    public ResponseEntity<ApiResponse<TenantFinanceProfileDTOs.FinanceProfileResponse>> get() {
        return ResponseEntity.ok(ApiResponse.ok(service.getCurrentTenantProfile()));
    }

    @PutMapping
    @PreAuthorize(RbacSpel.SCHOOL_SETTINGS_FINANCE)
    @Operation(summary = "Update finance routing profile for current tenant")
    public ResponseEntity<ApiResponse<TenantFinanceProfileDTOs.FinanceProfileResponse>> put(
            @Valid @RequestBody TenantFinanceProfileDTOs.FinanceProfileUpdateRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(service.upsert(body)));
    }

    @PostMapping("/submit-for-review")
    @PreAuthorize(RbacSpel.SCHOOL_SETTINGS_FINANCE)
    @Operation(
            summary = "Submit Razorpay Route settlement for platform review",
            description = "Moves onboarding from DRAFT or PENDING_CHANGES to SUBMITTED. Parent online fee checkout stays blocked until platform sets LIVE.")
    public ResponseEntity<ApiResponse<TenantFinanceProfileDTOs.FinanceProfileResponse>> submitForReview(
            @Valid @RequestBody TenantFinanceProfileDTOs.FinanceProfileSubmitRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(service.submitForReview(body), "Submitted for platform review"));
    }

    @PostMapping("/withdraw-submission")
    @PreAuthorize(RbacSpel.SCHOOL_SETTINGS_FINANCE)
    @Operation(summary = "Withdraw a pending Route submission", description = "Returns onboarding to DRAFT so the school can edit configuration again.")
    public ResponseEntity<ApiResponse<TenantFinanceProfileDTOs.FinanceProfileResponse>> withdrawSubmission() {
        return ResponseEntity.ok(ApiResponse.ok(service.withdrawSubmission(), "Submission withdrawn"));
    }
}
