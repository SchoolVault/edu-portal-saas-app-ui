package com.school.erp.modules.settings.repository;

import com.school.erp.modules.settings.entity.TenantConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TenantConfigRepository extends JpaRepository<TenantConfig, Long> {
    Optional<TenantConfig> findByTenantId(String t);
    Optional<TenantConfig> findBySchoolCode(String schoolCode);
    boolean existsBySchoolCode(String schoolCode);

    List<TenantConfig> findAllBySchoolCodeOrderBySchoolNameAsc(String schoolCode);

    /** Distinct school tenants (one row per tenant in {@code tenant_configs}). */
    @Query("SELECT c.tenantId FROM TenantConfig c")
    List<String> findAllTenantIds();
}
