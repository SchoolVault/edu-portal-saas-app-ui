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

    @GetMapping("/schools")
    @Operation(summary = "List all schools")
    public ResponseEntity<ApiResponse<List<PlatformDTOs.SchoolSummary>>> getSchools() {
        return ResponseEntity.ok(ApiResponse.ok(platformService.getSchools()));
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
