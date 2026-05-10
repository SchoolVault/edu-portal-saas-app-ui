package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.VisitorLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VisitorLogRepository extends JpaRepository<VisitorLog, Long> {

    List<VisitorLog> findByTenantIdAndIsDeletedFalseOrderByCheckInAtDesc(String tenantId);

    Page<VisitorLog> findByTenantIdAndIsDeletedFalseOrderByCheckInAtDesc(String tenantId, Pageable pageable);

    Optional<VisitorLog> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    @Query("""
            SELECT v FROM VisitorLog v
            WHERE v.tenantId = :tenantId
              AND v.isDeleted = false
              AND (
                LOWER(COALESCE(v.visitorName, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(v.phone, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(v.hostName, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(v.badgeNo, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(v.purpose, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(v.status, '')) LIKE LOWER(CONCAT('%', :q, '%'))
              )
            ORDER BY v.checkInAt DESC
            """)
    Page<VisitorLog> searchByTenantAndQuery(
            @Param("tenantId") String tenantId,
            @Param("q") String q,
            Pageable pageable);
}
