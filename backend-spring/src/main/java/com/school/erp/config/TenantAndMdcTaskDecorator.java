package com.school.erp.config;

import com.school.erp.common.logging.MdcKeys;
import com.school.erp.tenant.AcademicYearContext;
import com.school.erp.tenant.TenantContext;
import org.slf4j.MDC;
import org.springframework.core.task.TaskDecorator;

import java.util.Map;

/**
 * Copies {@link TenantContext} and {@link MDC} from the caller thread into async workers, then clears them.
 */
public final class TenantAndMdcTaskDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        String tenantId = TenantContext.getTenantId();
        Long academicYearId = AcademicYearContext.getAcademicYearId();
        Long userId = TenantContext.getUserId();
        String role = TenantContext.getUserRole();
        Map<String, String> contextMap = MDC.getCopyOfContextMap();
        return () -> {
            try {
                if (tenantId != null && !tenantId.isBlank()) {
                    TenantContext.setTenantId(tenantId);
                }
                if (academicYearId != null) {
                    AcademicYearContext.setAcademicYearId(academicYearId);
                }
                if (userId != null) {
                    TenantContext.setUserId(userId);
                }
                if (role != null && !role.isBlank()) {
                    TenantContext.setUserRole(role);
                }
                if (contextMap != null) {
                    MDC.setContextMap(contextMap);
                }
                runnable.run();
            } finally {
                TenantContext.clear();
                AcademicYearContext.clear();
                MdcKeys.clearTenantUser();
                MdcKeys.clearCorrelationAndTrace();
                MDC.clear();
            }
        };
    }
}
