package com.school.erp.modules.platform.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.platform.dto.PlatformDTOs;
import com.school.erp.modules.platform.service.PlatformService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/platform")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform", description = "Super admin control plane for managing all schools")
public class PlatformController {
    private final PlatformService platformService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get platform dashboard")
    public ResponseEntity<ApiResponse<PlatformDTOs.PlatformDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(platformService.getDashboard()));
    }

    @GetMapping("/health")
    @Operation(summary = "Platform runtime health (memory, disk, component status)")
    public ResponseEntity<ApiResponse<PlatformDTOs.PlatformHealthResponse>> health() {
        return ResponseEntity.ok(ApiResponse.ok(platformService.getHealthSnapshot()));
    }

    @GetMapping("/schools")
    @Operation(summary = "List all schools")
    public ResponseEntity<ApiResponse<List<PlatformDTOs.SchoolSummary>>> getSchools() {
        return ResponseEntity.ok(ApiResponse.ok(platformService.getSchools()));
    }

    @GetMapping("/school-admins/chat-search")
    @Operation(summary = "Search school admins for platform operator chat (name, email, school, code)")
    public ResponseEntity<ApiResponse<List<PlatformDTOs.SchoolAdminChatHit>>> searchSchoolAdminsForChat(
            @RequestParam(value = "q", defaultValue = "") String q
    ) {
        return ResponseEntity.ok(ApiResponse.ok(platformService.searchSchoolAdminsForChat(q)));
    }

    @GetMapping("/schools/{tenantId}/detail")
    @Operation(summary = "School overview: profile, admins, counts (platform scope)")
    public ResponseEntity<ApiResponse<PlatformDTOs.SchoolDetailResponse>> getSchoolDetail(@PathVariable String tenantId) {
        return ResponseEntity.ok(ApiResponse.ok(platformService.getSchoolDetail(tenantId)));
    }

    @PostMapping("/schools/{tenantId}/suspend")
    @Operation(summary = "Suspend workspace and deactivate all users in tenant (no logins)")
    public ResponseEntity<ApiResponse<Void>> suspendSchool(@PathVariable String tenantId) {
        platformService.suspendSchoolWorkspace(tenantId);
        return ResponseEntity.ok(ApiResponse.ok(null, "School workspace suspended."));
    }

    @PostMapping("/schools/{tenantId}/activate")
    @Operation(summary = "Re-open workspace (users stay inactive until re-enabled individually)")
    public ResponseEntity<ApiResponse<Void>> activateSchool(@PathVariable String tenantId) {
        platformService.activateSchoolWorkspace(tenantId);
        return ResponseEntity.ok(ApiResponse.ok(null, "School workspace activated."));
    }

    @PostMapping("/schools/{tenantId}/purge-data")
    @Operation(summary = "Queue async hard-delete of all data for this tenant (workspace must be suspended; confirm school code)")
    public ResponseEntity<ApiResponse<PlatformDTOs.PurgeJobSummary>> requestPurge(
            @PathVariable String tenantId,
            @Valid @RequestBody PlatformDTOs.PurgeSchoolDataRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(platformService.requestTenantDataPurge(tenantId, request), "Purge job queued"));
    }

    @GetMapping("/schools/{tenantId}/purge-jobs")
    @Operation(summary = "List purge jobs for a tenant")
    public ResponseEntity<ApiResponse<List<PlatformDTOs.PurgeJobSummary>>> listPurgeJobs(@PathVariable String tenantId) {
        return ResponseEntity.ok(ApiResponse.ok(platformService.listPurgeJobsForTenant(tenantId)));
    }

    @GetMapping("/subscription-plans")
    @Operation(summary = "Catalog of subscription tiers (in-memory until billing service is integrated)")
    public ResponseEntity<ApiResponse<List<PlatformDTOs.SubscriptionPlanRow>>> subscriptionPlans() {
        return ResponseEntity.ok(ApiResponse.ok(platformService.listSubscriptionPlans()));
    }

    @PutMapping("/subscription-plans/{code}")
    @Operation(summary = "Update a catalog tier (super-admin; persisted in-memory for now)")
    public ResponseEntity<ApiResponse<PlatformDTOs.SubscriptionPlanRow>> updateSubscriptionPlan(
            @PathVariable String code,
            @RequestBody PlatformDTOs.SubscriptionPlanRow body
    ) {
        return ResponseEntity.ok(ApiResponse.ok(platformService.replaceSubscriptionPlan(code, body), "Plan updated"));
    }

    @PostMapping("/broadcasts")
    @Operation(summary = "Create in-app notifications for campus admins (one tenant or all)")
    public ResponseEntity<ApiResponse<PlatformDTOs.PlatformBroadcastResult>> broadcast(
            @Valid @RequestBody PlatformDTOs.PlatformBroadcastRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(platformService.broadcastToSchoolAdmins(request), "Broadcast queued"));
    }

    @GetMapping("/schools/{tenantId}/admins")
    @Operation(summary = "List admins for a school")
    public ResponseEntity<ApiResponse<List<PlatformDTOs.SchoolAdminSummary>>> getSchoolAdmins(@PathVariable String tenantId) {
        return ResponseEntity.ok(ApiResponse.ok(platformService.getSchoolAdmins(tenantId)));
    }

    @PutMapping("/schools/{tenantId}/admins/{userId}/status")
    @Operation(summary = "Activate or deactivate a school admin")
    public ResponseEntity<ApiResponse<PlatformDTOs.SchoolAdminSummary>> updateSchoolAdminStatus(
            @PathVariable String tenantId,
            @PathVariable Long userId,
            @Valid @RequestBody PlatformDTOs.ToggleAdminStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(platformService.updateSchoolAdminStatus(tenantId, userId, request), "School admin status updated"));
    }

    public PlatformController(PlatformService platformService) {
        this.platformService = platformService;
    }
}
