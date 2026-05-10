package com.school.erp.modules.hostel.repository;

import com.school.erp.modules.hostel.entity.HostelAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HostelAuditLogRepository extends JpaRepository<HostelAuditLog, Long> {
    List<HostelAuditLog> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);
}
