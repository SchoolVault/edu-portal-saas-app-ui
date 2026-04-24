package com.school.erp.modules.rbac.config;

import com.school.erp.modules.rbac.service.RbacTenantBootstrapService;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * One-time (idempotent) seed per school tenant after deploy: default role rows + backfill from legacy
 * {@code users.role} if assignments are empty.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 20)
public class RbacDataInitializer implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(RbacDataInitializer.class);

    private final TenantConfigRepository tenantConfigRepository;
    private final RbacTenantBootstrapService rbacTenantBootstrapService;

    public RbacDataInitializer(
            TenantConfigRepository tenantConfigRepository,
            RbacTenantBootstrapService rbacTenantBootstrapService) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.rbacTenantBootstrapService = rbacTenantBootstrapService;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (String tid : tenantConfigRepository.findAllTenantIds()) {
            try {
                rbacTenantBootstrapService.ensureTenantSeeded(tid);
            } catch (Exception e) {
                log.warn("RBAC seed failed for tenantId={}: {}", tid, e.getMessage());
            }
        }
    }
}
