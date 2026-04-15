package com.school.erp.modules.audit.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.config.RabbitMQConfig;
import com.school.erp.modules.audit.entity.AuditLog;
import com.school.erp.modules.audit.repository.AuditLogRepository;
import com.school.erp.platform.port.AuditTrailPort;
import com.school.erp.tenant.TenantContext;
import jakarta.annotation.Nullable;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

@Service
public class AuditService implements AuditTrailPort {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository repo;
    @Nullable
    private final RabbitTemplate rabbitTemplate;

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(int page, int size, Enums.AuditAction action, String module, String q) {
        String t = TenantContext.getTenantId();
        String qq = q == null || q.isBlank() ? "" : q.trim();
        String mod = module == null || module.isBlank() ? null : module.trim();
        log.debug("Query audit logs page={} action={} module={} qPresent={}", page, action, mod, !qq.isEmpty());
        Page<AuditLog> pageResult = repo.searchPage(t, action, mod == null ? "" : mod, qq,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        log.info("Audit logs returned page={} elements={} total={}", page, pageResult.getNumberOfElements(), pageResult.getTotalElements());
        return pageResult;
    }

    /**
     * Log an action - can be called from any service
     */
    @Override
    @Transactional
    public void logAction(Enums.AuditAction action, String module, String description, Long entityId, String entityType, String oldValue, String newValue) {
        String t = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        AuditLog auditLog =  // In real impl, extract from request
        AuditLog.builder().action(action).module(module).description(description).userId(userId).userName(TenantContext.getUserRole()).entityId(entityId).entityType(entityType).oldValue(oldValue).newValue(newValue).ipAddress("system").build();
        auditLog.setTenantId(t != null ? t : "system");
        repo.save(auditLog);
        log.info("Audit persisted action={} module={} entityId={}", action, module, entityId);
        if (rabbitTemplate != null) {
            try {
                rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "event.audit.logged", Map.of("action", action.name(), "module", module, "description", description));
            } catch (Exception e) {
                log.warn("Audit event publish skipped: {}", e.getMessage());
            }
        }
    }

    /**
     * Convenience methods
     */
    public void logCreate(String module, String description, Long entityId) {
        logAction(Enums.AuditAction.CREATE, module, description, entityId, module, null, null);
    }

    public void logUpdate(String module, String description, Long entityId, String oldVal, String newVal) {
        logAction(Enums.AuditAction.UPDATE, module, description, entityId, module, oldVal, newVal);
    }

    public void logDelete(String module, String description, Long entityId) {
        logAction(Enums.AuditAction.DELETE, module, description, entityId, module, null, null);
    }

    @Override
    public void logLogin(String email) {
        logAction(Enums.AuditAction.LOGIN, "Auth", "User logged in: " + email, null, "User", null, null);
    }

    public AuditService(final AuditLogRepository repo, @Autowired(required = false) @Nullable RabbitTemplate rabbitTemplate) {
        this.repo = repo;
        this.rabbitTemplate = rabbitTemplate;
    }
}
