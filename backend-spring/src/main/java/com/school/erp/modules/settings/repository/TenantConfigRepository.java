package com.school.erp.modules.settings.repository;

import com.school.erp.modules.settings.entity.TenantConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantConfigRepository extends JpaRepository<TenantConfig, Long> {
    Optional<TenantConfig> findByTenantId(String t);
    Optional<TenantConfig> findBySchoolCode(String schoolCode);
    boolean existsBySchoolCode(String schoolCode);
}
