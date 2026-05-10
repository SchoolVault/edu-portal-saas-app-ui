package com.school.erp.modules.finance.audit.repository;

import com.school.erp.modules.finance.audit.entity.FinancialAuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialAuditEventRepository extends JpaRepository<FinancialAuditEvent, Long> {
}
