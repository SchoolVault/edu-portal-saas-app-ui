package com.school.erp.modules.importexport.repository;

import com.school.erp.modules.importexport.entity.ImportJobLine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImportJobLineRepository extends JpaRepository<ImportJobLine, Long> {
    List<ImportJobLine> findByJobIdAndTenantIdAndIsDeletedFalseOrderByLineIndexAsc(Long jobId, String tenantId);

    Page<ImportJobLine> findByJobIdAndTenantIdAndIsDeletedFalseOrderByLineIndexAsc(Long jobId, String tenantId, Pageable pageable);

    long countByJobIdAndTenantIdAndStatusAndIsDeletedFalse(Long jobId, String tenantId, String status);
}
