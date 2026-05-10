package com.school.erp.modules.hostel.repository;

import com.school.erp.modules.hostel.entity.HostelIncidentPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HostelIncidentPolicyRepository extends JpaRepository<HostelIncidentPolicy, Long> {
    Optional<HostelIncidentPolicy> findByTenantIdAndIncidentTypeAndIsDeletedFalse(String tenantId, String incidentType);

    List<HostelIncidentPolicy> findByTenantIdAndIsDeletedFalseOrderByIncidentTypeAsc(String tenantId);
}
