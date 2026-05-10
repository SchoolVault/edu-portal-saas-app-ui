package com.school.erp.modules.ai.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Field-level AI response policy:
 * - school admins: full tenant data
 * - teachers/non-teaching staff: restricted sensitive fields
 * Centralized here so every new AI tool automatically gets policy enforcement.
 */
@Component
public class AiResponseAuthorizationPolicy {
    private static final Set<String> SENSITIVE_KEYS = Set.of(
            "phone", "email", "guardianPhone", "guardianEmail", "address", "dob", "aadhaar", "bankAccountNumber", "ifsc");

    public Map<String, Object> apply(String toolName, Map<String, Object> payload, AiTooling.ToolContext context) {
        RoleProfile profile = profileFor(context.role());
        if (profile == RoleProfile.ADMIN_FULL) {
            return payload;
        }
        return sanitizeMapByRole(payload, profile);
    }

    private RoleProfile profileFor(String role) {
        String r = role == null ? "" : role.toLowerCase(Locale.ROOT).replace("role_", "");
        if (r.contains("super_admin") || r.contains("platform_admin") || r.contains("tenant_admin") || r.equals("admin")) {
            return RoleProfile.ADMIN_FULL;
        }
        if (r.equals("teacher") || r.contains("academic_teacher")) {
            return RoleProfile.TEACHER_LIMITED;
        }
        if (r.contains("school_staff") || r.contains("library_staff") || r.contains("accountant") || r.contains("principal")) {
            return RoleProfile.STAFF_LIMITED;
        }
        if (r.contains("parent")) return RoleProfile.PARENT_SELF;
        if (r.contains("student")) return RoleProfile.STUDENT_SELF;
        return RoleProfile.STAFF_LIMITED;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> sanitizeMapByRole(Map<String, Object> in, RoleProfile profile) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (Map.Entry<String, Object> e : in.entrySet()) {
            String key = e.getKey();
            Object value = e.getValue();
            if (SENSITIVE_KEYS.contains(key)) {
                out.put(key, "[restricted]");
                continue;
            }
            if (value instanceof Map<?, ?> nested) {
                out.put(key, sanitizeMapByRole((Map<String, Object>) nested, profile));
                continue;
            }
            if (value instanceof List<?> list) {
                List<Object> next = new ArrayList<>(list.size());
                for (Object row : list) {
                    if (row instanceof Map<?, ?> rowMap) {
                        next.add(sanitizeMapByRole((Map<String, Object>) rowMap, profile));
                    } else {
                        next.add(row);
                    }
                }
                out.put(key, next);
                continue;
            }
            out.put(key, value);
        }
        out.putIfAbsent("dataScope", profile.name());
        return out;
    }

    private enum RoleProfile {
        ADMIN_FULL,
        TEACHER_LIMITED,
        STAFF_LIMITED,
        PARENT_SELF,
        STUDENT_SELF
    }
}
