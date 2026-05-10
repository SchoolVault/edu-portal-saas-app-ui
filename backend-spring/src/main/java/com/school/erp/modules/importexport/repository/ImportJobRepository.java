package com.school.erp.modules.importexport.repository;

import com.school.erp.modules.importexport.entity.ImportJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ImportJobRepository extends JpaRepository<ImportJob, Long> {
    Optional<ImportJob> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    Page<ImportJob> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Pageable pageable);

    boolean existsByTenantIdAndOriginalFilenameAndIsDeletedFalse(String tenantId, String originalFilename);

    Optional<ImportJob> findFirstByTenantIdAndJobTypeAndPayloadHashAndColumnMappingHashAndExecutionModeAndStatusInAndIsDeletedFalseOrderByCreatedAtDesc(
            String tenantId, String jobType, String payloadHash, String columnMappingHash, String executionMode, Collection<String> statuses);

    List<ImportJob> findByStatusAndIsDeletedFalseAndStartedAtBefore(String status, java.time.LocalDateTime startedBefore);

    long countByTenantIdAndIsDeletedFalseAndCreatedAtAfter(String tenantId, LocalDateTime createdAtAfter);

    @Query("SELECT COUNT(j) FROM ImportJob j WHERE j.tenantId = :tenantId AND j.isDeleted = false AND j.status = :status AND j.createdAt >= :since")
    long countByTenantStatusCreatedSince(@Param("tenantId") String tenantId, @Param("status") String status, @Param("since") LocalDateTime since);

    long countByTenantIdAndIsDeletedFalseAndStatus(String tenantId, String status);

    @Query("SELECT COALESCE(SUM(j.successCount), 0) FROM ImportJob j WHERE j.tenantId = :tenantId AND j.isDeleted = false AND j.status = 'COMPLETED' AND j.createdAt >= :since")
    long sumSuccessRowsSince(@Param("tenantId") String tenantId, @Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(j.failCount), 0) FROM ImportJob j WHERE j.tenantId = :tenantId AND j.isDeleted = false AND j.status = 'COMPLETED' AND j.createdAt >= :since")
    long sumFailedRowsSince(@Param("tenantId") String tenantId, @Param("since") LocalDateTime since);
}
