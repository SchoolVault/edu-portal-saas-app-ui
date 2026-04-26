package com.school.erp.modules.rbac.repository;

import com.school.erp.modules.rbac.entity.PermissionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionGroupRepository extends JpaRepository<PermissionGroup, Long> {

    List<PermissionGroup> findByTenantIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(String tenantId);

    Optional<PermissionGroup> findByTenantIdAndIdAndIsDeletedFalse(String tenantId, Long id);

    Optional<PermissionGroup> findByTenantIdAndCodeAndIsDeletedFalse(String tenantId, String code);

    Optional<PermissionGroup> findByTenantIdAndCode(String tenantId, String code);
}
