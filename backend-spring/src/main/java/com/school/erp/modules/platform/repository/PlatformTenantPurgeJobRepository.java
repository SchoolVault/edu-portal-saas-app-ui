package com.school.erp.modules.platform.repository;

import com.school.erp.modules.platform.entity.PlatformTenantPurgeJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlatformTenantPurgeJobRepository extends JpaRepository<PlatformTenantPurgeJob, Long> {
    List<PlatformTenantPurgeJob> findByTenantIdOrderByCreatedAtDesc(String tenantId);
}
