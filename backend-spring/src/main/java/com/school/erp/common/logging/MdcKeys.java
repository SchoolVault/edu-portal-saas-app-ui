package com.school.erp.common.logging;

import org.slf4j.MDC;

/**
 * MDC keys appended to every log line via {@code logging.pattern.console}.
 * Cleared per-request to avoid leaking tenant/user across Tomcat worker threads.
 */
public final class MdcKeys {

    public static final String TRACE_ID = "traceId";
    public static final String TENANT_ID = "tenantId";
    public static final String USER_ID = "userId";
    public static final String USER_ROLE = "userRole";

    private MdcKeys() {
    }

    public static void clearTenantUser() {
        MDC.remove(TENANT_ID);
        MDC.remove(USER_ID);
        MDC.remove(USER_ROLE);
    }
}
