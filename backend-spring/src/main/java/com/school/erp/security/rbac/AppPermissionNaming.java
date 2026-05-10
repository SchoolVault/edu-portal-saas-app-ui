package com.school.erp.security.rbac;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Guardrail for permission-driven RBAC naming.
 * <p>
 * Contract: all permission codes follow {@code MODULE_ACTION[_QUALIFIER]} in uppercase snake-case.
 * This keeps backend, seed roles, and frontend mirrors deterministic while modules migrate one-by-one.
 * </p>
 */
@Component
public class AppPermissionNaming {

    private static final Pattern CODE_PATTERN = Pattern.compile("^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$");

    @PostConstruct
    void verifyEnumNamingConvention() {
        for (AppPermission permission : AppPermission.values()) {
            String code = permission.name();
            if (!CODE_PATTERN.matcher(code).matches()) {
                throw new IllegalStateException(
                        "Invalid AppPermission code '" + code
                                + "'. Expected MODULE_ACTION format (uppercase snake-case).");
            }
        }
    }
}
