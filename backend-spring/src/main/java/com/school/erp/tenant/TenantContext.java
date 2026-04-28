package com.school.erp.tenant;

public class TenantContext {
    private static final ThreadLocal<String> TENANT_ID = new ThreadLocal<>();
    private static final ThreadLocal<Long> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> USER_ROLE = new ThreadLocal<>();
    private static final ThreadLocal<String> USER_DISPLAY_NAME = new ThreadLocal<>();
    private static final ThreadLocal<String> USER_PRINCIPAL = new ThreadLocal<>();
    /** Best-effort client IP for the current HTTP request (set by security filter). */
    private static final ThreadLocal<String> CLIENT_IP = new ThreadLocal<>();

    public static void setTenantId(String tenantId) {
        TENANT_ID.set(tenantId);
    }

    public static String getTenantId() {
        return TENANT_ID.get();
    }

    /** Alias for legacy call sites (same as {@link #getTenantId()}). */
    public static String getCurrentTenantId() {
        return getTenantId();
    }

    public static void setUserId(Long userId) {
        USER_ID.set(userId);
    }

    public static Long getUserId() {
        return USER_ID.get();
    }

    public static void setUserRole(String role) {
        USER_ROLE.set(role);
    }

    public static String getUserRole() {
        return USER_ROLE.get();
    }

    public static void setUserDisplayName(String displayName) {
        USER_DISPLAY_NAME.set(displayName);
    }

    public static String getUserDisplayName() {
        return USER_DISPLAY_NAME.get();
    }

    public static void setUserPrincipal(String principal) {
        USER_PRINCIPAL.set(principal);
    }

    public static String getUserPrincipal() {
        return USER_PRINCIPAL.get();
    }

    public static void setClientIp(String clientIp) {
        CLIENT_IP.set(clientIp);
    }

    /** @return client IP captured for this request, or null if unset */
    public static String getClientIp() {
        return CLIENT_IP.get();
    }

    public static void clear() {
        TENANT_ID.remove();
        USER_ID.remove();
        USER_ROLE.remove();
        USER_DISPLAY_NAME.remove();
        USER_PRINCIPAL.remove();
        CLIENT_IP.remove();
        AcademicYearContext.clear();
    }
}
