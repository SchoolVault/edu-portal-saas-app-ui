package com.school.erp.platform.port;

import com.school.erp.common.enums.Enums;

/**
 * Cross-module audit entry point. Implemented by {@link com.school.erp.modules.audit.service.AuditService}.
 */
public interface AuditTrailPort {

    void logLogin(String email);

    void logAction(Enums.AuditAction action, String module, String description, Long entityId, String entityType, String oldValue, String newValue);
}
