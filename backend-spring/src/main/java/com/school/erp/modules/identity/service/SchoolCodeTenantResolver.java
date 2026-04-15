package com.school.erp.modules.identity.service;

import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Optional;

/**
 * Resolves {@code tenant_id} from a school code for unauthenticated flows (OTP, phone login).
 */
@Component
@RequiredArgsConstructor
public class SchoolCodeTenantResolver {

    private final TenantConfigRepository tenantConfigRepository;

    public String resolveTenantId(String schoolCode) {
        String sc = schoolCode == null ? "" : schoolCode.trim().toUpperCase(Locale.ROOT);
        if ("PLATFORM".equals(sc)) {
            return "platform";
        }
        return tenantConfigRepository.findBySchoolCode(sc)
                .map(TenantConfig::getTenantId)
                .orElseThrow(() -> new UnauthorizedException("Invalid school code"));
    }

    /** Workspace row when the school code maps to a real tenant (not {@code PLATFORM}). */
    public Optional<TenantConfig> resolveWorkspace(String schoolCode) {
        String sc = schoolCode == null ? "" : schoolCode.trim().toUpperCase(Locale.ROOT);
        if ("PLATFORM".equals(sc)) {
            return Optional.empty();
        }
        return tenantConfigRepository.findBySchoolCode(sc);
    }
}
