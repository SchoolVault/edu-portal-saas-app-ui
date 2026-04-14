package com.school.erp.modules.audit.repository;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByTenantIdAndIsDeletedFalse(String tenantId, Pageable pageable);
    Page<AuditLog> findByTenantIdAndActionAndIsDeletedFalse(String tenantId, Enums.AuditAction action, Pageable pageable);
    Page<AuditLog> findByTenantIdAndModuleAndIsDeletedFalse(String tenantId, String module, Pageable pageable);
    Page<AuditLog> findByTenantIdAndActionAndModuleAndIsDeletedFalse(String tenantId, Enums.AuditAction action, String module, Pageable pageable);

    @Query(value = """
            SELECT a FROM AuditLog a WHERE a.tenantId = :t AND (a.isDeleted = false OR a.isDeleted IS NULL)
              AND (:action IS NULL OR a.action = :action)
              AND (:module IS NULL OR :module = '' OR a.module = :module)
              AND (:q = '' OR LOWER(a.description) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(COALESCE(a.userName, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(a.module) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY a.createdAt DESC
            """,
            countQuery = """
            SELECT count(a) FROM AuditLog a WHERE a.tenantId = :t AND (a.isDeleted = false OR a.isDeleted IS NULL)
              AND (:action IS NULL OR a.action = :action)
              AND (:module IS NULL OR :module = '' OR a.module = :module)
              AND (:q = '' OR LOWER(a.description) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(COALESCE(a.userName, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(a.module) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<AuditLog> searchPage(@Param("t") String t, @Param("action") Enums.AuditAction action,
                             @Param("module") String module, @Param("q") String q, Pageable pageable);
}
