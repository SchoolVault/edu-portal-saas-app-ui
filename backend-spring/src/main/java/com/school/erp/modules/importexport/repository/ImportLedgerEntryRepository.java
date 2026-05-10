package com.school.erp.modules.importexport.repository;

import com.school.erp.modules.importexport.entity.ImportLedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ImportLedgerEntryRepository extends JpaRepository<ImportLedgerEntry, Long> {

    List<ImportLedgerEntry> findByTenantIdAndJobIdAndIsDeletedFalseOrderByLineIndexAsc(String tenantId, long jobId);

    Page<ImportLedgerEntry> findByTenantIdAndJobIdAndIsDeletedFalse(String tenantId, long jobId, Pageable pageable);

    @Query("SELECT e.outcome, COUNT(e) FROM ImportLedgerEntry e WHERE e.tenantId = :tenantId AND e.jobId = :jobId AND e.isDeleted = false GROUP BY e.outcome")
    List<Object[]> countByOutcomeForJob(@Param("tenantId") String tenantId, @Param("jobId") long jobId);

    long countByTenantIdAndJobIdAndIsDeletedFalse(String tenantId, long jobId);
}
