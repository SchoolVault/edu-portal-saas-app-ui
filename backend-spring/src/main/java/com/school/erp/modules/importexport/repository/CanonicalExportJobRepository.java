package com.school.erp.modules.importexport.repository;

import com.school.erp.modules.importexport.entity.CanonicalExportJob;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CanonicalExportJobRepository extends JpaRepository<CanonicalExportJob, Long> {
    Optional<CanonicalExportJob> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    Page<CanonicalExportJob> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Pageable pageable);
}
