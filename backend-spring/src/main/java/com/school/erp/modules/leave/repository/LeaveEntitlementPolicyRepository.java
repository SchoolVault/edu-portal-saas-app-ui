package com.school.erp.modules.leave.repository;

import com.school.erp.modules.leave.entity.LeaveEntitlementPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeaveEntitlementPolicyRepository extends JpaRepository<LeaveEntitlementPolicy, Long> {

    Optional<LeaveEntitlementPolicy> findByTenantIdAndIsDeletedFalse(String tenantId);
}
