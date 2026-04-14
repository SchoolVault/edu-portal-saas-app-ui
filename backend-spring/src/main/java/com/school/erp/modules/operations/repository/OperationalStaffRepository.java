package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.OperationalStaff;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OperationalStaffRepository extends JpaRepository<OperationalStaff, Long> {

    List<OperationalStaff> findByTenantIdAndIsDeletedFalseOrderByFullNameAsc(String tenantId);

    Page<OperationalStaff> findByTenantIdAndIsDeletedFalseOrderByFullNameAsc(String tenantId, Pageable pageable);

    Optional<OperationalStaff> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    Optional<OperationalStaff> findByIdAndTenantId(Long id, String tenantId);
}
