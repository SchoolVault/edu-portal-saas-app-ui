package com.school.erp.modules.ai.service;

import com.school.erp.common.exception.ForbiddenException;
import com.school.erp.tenant.TenantContext;
import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AiSecurityGuard {
    public void ensureTenantContext() {
        if (TenantContext.getTenantId() == null || TenantContext.getTenantId().isBlank()) {
            throw new ForbiddenException("Tenant context is required for AI execution.");
        }
    }

    public void ensureHasAnyAuthority(Collection<String> requiredAuthorities) {
        if (requiredAuthorities == null || requiredAuthorities.isEmpty()) {
            return;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new ForbiddenException("Authentication required.");
        }
        Set<String> granted = auth.getAuthorities().stream().map(a -> a.getAuthority()).collect(Collectors.toSet());
        // Phase-1 AI rollout: tenant/platform admins can use curated read tools even when fine-grained atoms are not fully mapped yet.
        if (granted.contains("TENANT_ADMIN") || granted.contains("PLATFORM_ADMIN")
                || granted.contains("ADMIN") || granted.contains("SUPER_ADMIN")
                || granted.contains("ROLE_ADMIN") || granted.contains("ROLE_SUPER_ADMIN")) {
            return;
        }
        boolean allowed = requiredAuthorities.stream().anyMatch(granted::contains);
        if (!allowed) {
            throw new ForbiddenException("Insufficient permissions for AI tool.");
        }
    }

    public String sanitizePrompt(String prompt) {
        if (prompt == null) return "";
        String cleaned = prompt.replaceAll("(?i)<script.*?>.*?</script>", "");
        cleaned = cleaned.replaceAll("(?i)ignore previous instructions", "[blocked-injection-pattern]");
        return cleaned.strip();
    }
}
