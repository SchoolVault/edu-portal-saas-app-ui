package com.school.erp.modules.rbac.repository;

import com.school.erp.modules.rbac.entity.SchoolRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolRoleRepository extends JpaRepository<SchoolRole, Long> {

    long countByTenantIdAndIsDeletedFalse(String tenantId);

    List<SchoolRole> findByTenantIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(String tenantId);

    Optional<SchoolRole> findByTenantIdAndCodeAndIsDeletedFalse(String tenantId, String code);
}
