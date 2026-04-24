package com.school.erp.modules.finance.repository;

import com.school.erp.modules.finance.entity.TenantFinanceProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantFinanceProfileRepository extends JpaRepository<TenantFinanceProfile, Long> {

    Optional<TenantFinanceProfile> findByTenantIdAndIsDeletedFalse(String tenantId);
}
