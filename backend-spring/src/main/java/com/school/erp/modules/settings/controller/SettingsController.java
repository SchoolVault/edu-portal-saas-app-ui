package com.school.erp.modules.settings.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.tenant.TenantContext; import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor; import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/settings") @RequiredArgsConstructor
@Tag(name = "Settings", description = "School Settings & Configuration APIs")
public class SettingsController {
    private final com.school.erp.modules.settings.repository.TenantConfigRepository repo;

    @GetMapping @Operation(summary = "Get tenant settings")
    public ResponseEntity<ApiResponse<TenantConfig>> get() {
        return ResponseEntity.ok(ApiResponse.ok(repo.findByTenantId(TenantContext.getTenantId()).orElse(null)));
    }

    @PutMapping @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Update tenant settings")
    public ResponseEntity<ApiResponse<TenantConfig>> update(@RequestBody TenantConfig config) {
        TenantConfig existing = repo.findByTenantId(TenantContext.getTenantId()).orElse(new TenantConfig());
        existing.setTenantId(TenantContext.getTenantId());
        if (config.getSchoolName() != null) existing.setSchoolName(config.getSchoolName());
        if (config.getAddress() != null) existing.setAddress(config.getAddress());
        if (config.getPhone() != null) existing.setPhone(config.getPhone());
        if (config.getEmail() != null) existing.setEmail(config.getEmail());
        if (config.getPrimaryColor() != null) existing.setPrimaryColor(config.getPrimaryColor());
        if (config.getSecondaryColor() != null) existing.setSecondaryColor(config.getSecondaryColor());
        if (config.getFeaturesJson() != null) existing.setFeaturesJson(config.getFeaturesJson());
        return ResponseEntity.ok(ApiResponse.ok(repo.save(existing), "Settings updated"));
    }
}
