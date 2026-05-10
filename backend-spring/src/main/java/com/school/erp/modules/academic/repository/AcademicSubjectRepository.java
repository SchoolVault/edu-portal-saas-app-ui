package com.school.erp.modules.academic.repository;

import com.school.erp.modules.academic.entity.AcademicSubject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicSubjectRepository extends JpaRepository<AcademicSubject, Long> {

    List<AcademicSubject> findByTenantIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(String tenantId);

    boolean existsByTenantIdAndNameAndIsDeletedFalse(String tenantId, String name);

    boolean existsByTenantIdAndNameIgnoreCaseAndIsDeletedFalse(String tenantId, String name);

    boolean existsByTenantIdAndCodeAndIsDeletedFalse(String tenantId, String code);

    Optional<AcademicSubject> findFirstByTenantIdAndNameIgnoreCaseAndIsDeletedFalse(String tenantId, String name);

    Optional<AcademicSubject> findFirstByTenantIdAndCodeIgnoreCaseAndIsDeletedFalse(String tenantId, String code);

    long countByTenantIdAndIsDeletedFalse(String tenantId);
}
