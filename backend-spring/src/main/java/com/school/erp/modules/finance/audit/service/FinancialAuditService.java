package com.school.erp.modules.finance.audit.service;

import com.school.erp.modules.finance.audit.entity.FinancialAuditEvent;
import com.school.erp.modules.finance.audit.repository.FinancialAuditEventRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class FinancialAuditService {

    private final FinancialAuditEventRepository repository;

    public FinancialAuditService(FinancialAuditEventRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(
            String moduleName,
            String actionName,
            String entityType,
            Long entityId,
            String operationKey,
            String idempotencyKey,
            String fromState,
            String toState,
            String eventStatus,
            String provider,
            String referenceId,
            String currency,
            BigDecimal amount,
            String detailJson
    ) {
        FinancialAuditEvent event = new FinancialAuditEvent();
        event.setTenantId(TenantContext.getTenantId());
        event.setModuleName(moduleName);
        event.setActionName(actionName);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setOperationKey(operationKey);
        event.setIdempotencyKey(idempotencyKey);
        event.setFromState(fromState);
        event.setToState(toState);
        event.setEventStatus(eventStatus);
        event.setProvider(provider);
        event.setReferenceId(referenceId);
        event.setCurrency(currency);
        event.setAmount(amount);
        event.setDetailJson(detailJson);
        event.setIsActive(true);
        event.setIsDeleted(false);
        repository.save(event);
    }
}
