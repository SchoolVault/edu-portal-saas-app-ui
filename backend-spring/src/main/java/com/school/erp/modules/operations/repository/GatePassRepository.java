package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.GatePass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GatePassRepository extends JpaRepository<GatePass, Long> {

    List<GatePass> findByTenantIdAndIsDeletedFalseOrderByValidFromDesc(String tenantId);

    Page<GatePass> findByTenantIdAndIsDeletedFalseOrderByValidFromDesc(String tenantId, Pageable pageable);

    Optional<GatePass> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    @Query("""
            SELECT g FROM GatePass g
            WHERE g.tenantId = :tenantId
              AND g.isDeleted = false
              AND (
                LOWER(COALESCE(g.issuedToName, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(g.purpose, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(g.status, '')) LIKE LOWER(CONCAT('%', :q, '%'))
              )
            ORDER BY g.validFrom DESC
            """)
    Page<GatePass> searchByTenantAndQuery(
            @Param("tenantId") String tenantId,
            @Param("q") String q,
            Pageable pageable);
}
