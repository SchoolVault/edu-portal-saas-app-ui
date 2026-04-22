package com.school.erp.modules.platform.repository;

import com.school.erp.modules.platform.entity.PlatformTenantPurgeJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PlatformTenantPurgeJobRepository extends JpaRepository<PlatformTenantPurgeJob, Long> {
    List<PlatformTenantPurgeJob> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    @Query("""
            SELECT j
            FROM PlatformTenantPurgeJob j
            WHERE (:status IS NULL OR UPPER(j.status) = UPPER(:status))
              AND (
                    :q IS NULL
                    OR LOWER(j.tenantId) LIKE LOWER(CONCAT('%', :q, '%'))
                    OR LOWER(j.schoolCode) LIKE LOWER(CONCAT('%', :q, '%'))
                    OR LOWER(COALESCE(j.schoolName, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                  )
            """)
    Page<PlatformTenantPurgeJob> findAllForGlobalPurgeHistory(
            @Param("status") String status,
            @Param("q") String q,
            Pageable pageable
    );
}
