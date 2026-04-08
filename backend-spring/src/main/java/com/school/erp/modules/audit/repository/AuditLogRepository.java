package com.school.erp.modules.audit.repository;
import com.school.erp.modules.audit.entity.AuditLog; import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> { Page<AuditLog> findByTenantIdAndIsDeletedFalse(String t, Pageable p); }
