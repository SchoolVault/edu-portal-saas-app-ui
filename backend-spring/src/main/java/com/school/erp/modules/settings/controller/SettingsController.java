package com.school.erp.modules.settings.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.security.rbac.RbacSpel;
import com.school.erp.modules.settings.dto.SchoolBranchDTO;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.service.SettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
@Tag(name = "Settings", description = "School Configuration, Branding & Feature Flags")
public class SettingsController {
    private final SettingsService service;

    @GetMapping
    @Operation(summary = "Get school settings")
    public ResponseEntity<ApiResponse<TenantConfig>> get() {
        return ResponseEntity.ok(ApiResponse.ok(service.getSettings()));
    }

    @PutMapping
    @PreAuthorize(RbacSpel.SCHOOL_TENANT_SETTINGS)
    @Operation(summary = "Update school settings", description = "Update name, address, phone, email, branding colors, logo")
    public ResponseEntity<ApiResponse<TenantConfig>> update(@RequestBody TenantConfig config) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateSettings(config), "Settings updated"));
    }

    @GetMapping("/features")
    @Operation(summary = "Get feature flags", description = "Returns enabled/disabled status for each module")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> getFeatures() {
        return ResponseEntity.ok(ApiResponse.ok(service.getFeatureFlags()));
    }

    @PutMapping("/features")
    @PreAuthorize(RbacSpel.SCHOOL_TENANT_SETTINGS)
    @Operation(summary = "Update feature flags", description = "Enable/disable modules: transport, library, hostel, payroll, etc.")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> updateFeatures(@RequestBody Map<String, Boolean> flags) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateFeatureFlags(flags), "Features updated"));
    }

    @GetMapping("/branches")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List branches by school code", description = "Returns all campuses/tenants sharing the same school code; omit param to use current tenant code")
    public ResponseEntity<ApiResponse<List<SchoolBranchDTO>>> branches(@RequestParam(required = false) String schoolCode) {
        return ResponseEntity.ok(ApiResponse.ok(service.listBranchesBySchoolCode(schoolCode)));
    }

    public SettingsController(final SettingsService service) {
        this.service = service;
    }
}
