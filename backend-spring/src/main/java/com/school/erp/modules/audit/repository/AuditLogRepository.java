package com.school.erp.modules.audit.repository;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByTenantIdAndIsDeletedFalse(String tenantId, Pageable pageable);
    Page<AuditLog> findByTenantIdAndActionAndIsDeletedFalse(String tenantId, Enums.AuditAction action, Pageable pageable);
    Page<AuditLog> findByTenantIdAndModuleAndIsDeletedFalse(String tenantId, String module, Pageable pageable);
    Page<AuditLog> findByTenantIdAndActionAndModuleAndIsDeletedFalse(String tenantId, Enums.AuditAction action, String module, Pageable pageable);
}
