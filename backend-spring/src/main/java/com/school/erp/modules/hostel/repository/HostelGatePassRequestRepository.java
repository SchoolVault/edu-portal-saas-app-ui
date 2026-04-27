package com.school.erp.modules.hostel.repository;

import com.school.erp.modules.hostel.entity.HostelGatePassRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HostelGatePassRequestRepository extends JpaRepository<HostelGatePassRequest, Long> {
    List<HostelGatePassRequest> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    List<HostelGatePassRequest> findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, String status);

    Optional<HostelGatePassRequest> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
