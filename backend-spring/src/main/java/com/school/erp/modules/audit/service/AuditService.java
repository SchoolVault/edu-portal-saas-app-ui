package com.school.erp.modules.audit.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.config.RabbitMQConfig;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AuditService implements AuditTrailPort {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository repo;
    private final UserRepository userRepository;
    @Nullable
    private final RabbitTemplate rabbitTemplate;

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(int page, int size, Enums.AuditAction action, String module, String q, LocalDate from, LocalDate to) {
        String t = TenantContext.getTenantId();
        String qq = q == null || q.isBlank() ? "" : q.trim();
        String mod = module == null || module.isBlank() ? null : module.trim();
        LocalDateTime fromDt = from == null ? null : from.atStartOfDay();
        LocalDateTime toExclusive = to == null ? null : to.plusDays(1).atStartOfDay();
        log.debug("Query audit logs page={} action={} module={} qPresent={} from={} to={}", page, action, mod, !qq.isEmpty(), from, to);
        Page<AuditLog> pageResult = repo.searchPage(
                t,
                action,
                mod == null ? "" : mod,
                qq,
                fromDt,
                toExclusive,
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
        String actorName = truncate(resolveActorDisplayName(t, userId), 200);
        String ip = TenantContext.getClientIp();
        if (ip == null || ip.isBlank()) {
            ip = "—";
        }
        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .module(module)
                .description(truncate(description, 500))
                .userId(userId)
                .userName(actorName)
                .entityId(entityId)
                .entityType(entityType)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(truncate(ip, 45))
                .build();
        auditLog.setTenantId(t != null ? t : "system");
        repo.save(auditLog);
        log.info("Audit persisted action={} module={} entityId={} actor={}", action, module, entityId, actorName);
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

    /**
     * Prefer the persisted user record so the audit trail names the actual person (name + email),
     * not a generic JWT display label shared by many admins.
     */
    private String resolveActorDisplayName(String tenantId, Long userId) {
        if (tenantId != null && userId != null) {
            User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, tenantId).orElse(null);
            if (user != null) {
                return formatUserIdentityForAudit(user);
            }
        }
        String contextDisplayName = TenantContext.getUserDisplayName();
        if (contextDisplayName != null && !contextDisplayName.isBlank()) {
            return contextDisplayName.trim();
        }
        String principal = TenantContext.getUserPrincipal();
        if (principal != null && !principal.isBlank()) {
            return principal.trim();
        }
        String role = TenantContext.getUserRole();
        if (role != null && !role.isBlank()) {
            return role.trim().toUpperCase();
        }
        return "System";
    }

    private static String formatUserIdentityForAudit(User user) {
        String name = user.getName() == null ? "" : user.getName().trim();
        String email = user.getEmail() == null ? "" : user.getEmail().trim().toLowerCase();
        if (!name.isEmpty() && !email.isEmpty()) {
            return name + " (" + email + ")";
        }
        if (!email.isEmpty()) {
            return email;
        }
        if (!name.isEmpty()) {
            return name;
        }
        return "User #" + user.getId();
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return null;
        }
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, max - 1) + "…";
    }

    public AuditService(final AuditLogRepository repo, final UserRepository userRepository, @Autowired(required = false) @Nullable RabbitTemplate rabbitTemplate) {
        this.repo = repo;
        this.userRepository = userRepository;
        this.rabbitTemplate = rabbitTemplate;
    }
}
