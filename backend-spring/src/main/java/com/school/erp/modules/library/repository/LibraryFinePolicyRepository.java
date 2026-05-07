package com.school.erp.modules.library.repository;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.library.entity.LibraryFinePolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LibraryFinePolicyRepository extends JpaRepository<LibraryFinePolicy, Long> {
    List<LibraryFinePolicy> findByTenantIdAndIsDeletedFalseOrderByBorrowerTypeAsc(String tenantId);
    Optional<LibraryFinePolicy> findByTenantIdAndBorrowerTypeAndIsDeletedFalse(String tenantId, Enums.LibraryBorrowerType borrowerType);
}
