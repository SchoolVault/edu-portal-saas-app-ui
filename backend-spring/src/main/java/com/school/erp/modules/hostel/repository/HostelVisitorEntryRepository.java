package com.school.erp.modules.hostel.repository;

import com.school.erp.modules.hostel.entity.HostelVisitorEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HostelVisitorEntryRepository extends JpaRepository<HostelVisitorEntry, Long> {
    List<HostelVisitorEntry> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    List<HostelVisitorEntry> findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, String status);

    Optional<HostelVisitorEntry> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
