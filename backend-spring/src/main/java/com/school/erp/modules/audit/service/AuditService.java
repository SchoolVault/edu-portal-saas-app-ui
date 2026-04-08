package com.school.erp.modules.audit.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.config.RabbitMQConfig;
import com.school.erp.modules.audit.entity.AuditLog;
import com.school.erp.modules.audit.repository.AuditLogRepository;
import com.school.erp.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository repo;
    private final RabbitTemplate rabbitTemplate;

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(int page, int size, Enums.AuditAction action, String module) {
        String t = TenantContext.getTenantId();
        if (action != null && module != null) {
            return repo.findByTenantIdAndActionAndModuleAndIsDeletedFalse(t, action, module,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        } else if (action != null) {
            return repo.findByTenantIdAndActionAndIsDeletedFalse(t, action,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        } else if (module != null) {
            return repo.findByTenantIdAndModuleAndIsDeletedFalse(t, module,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        }
        return repo.findByTenantIdAndIsDeletedFalse(t, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    /** Log an action - can be called from any service */
    @Transactional
    public void logAction(Enums.AuditAction action, String module, String description,
                          Long entityId, String entityType, String oldValue, String newValue) {
        String t = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();

        AuditLog auditLog = AuditLog.builder()
                .action(action).module(module).description(description)
                .userId(userId).userName(TenantContext.getUserRole())
                .entityId(entityId).entityType(entityType)
                .oldValue(oldValue).newValue(newValue)
                .ipAddress("system") // In real impl, extract from request
                .build();
        auditLog.setTenantId(t != null ? t : "system");
        repo.save(auditLog);

        // Publish to RabbitMQ for async processing
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "event.audit.logged",
                    Map.of("action", action.name(), "module", module, "description", description));
        } catch (Exception e) {
            log.debug("Audit event publish skipped: {}", e.getMessage());
        }
    }

    /** Convenience methods */
    public void logCreate(String module, String description, Long entityId) {
        logAction(Enums.AuditAction.CREATE, module, description, entityId, module, null, null);
    }

    public void logUpdate(String module, String description, Long entityId, String oldVal, String newVal) {
        logAction(Enums.AuditAction.UPDATE, module, description, entityId, module, oldVal, newVal);
    }

    public void logDelete(String module, String description, Long entityId) {
        logAction(Enums.AuditAction.DELETE, module, description, entityId, module, null, null);
    }

    public void logLogin(String email) {
        logAction(Enums.AuditAction.LOGIN, "Auth", "User logged in: " + email, null, "User", null, null);
    }
}
