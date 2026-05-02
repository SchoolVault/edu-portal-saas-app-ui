package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeComponentMasterV2;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeComponentMasterV2Repository extends JpaRepository<FeeComponentMasterV2, Long> {
    List<FeeComponentMasterV2> findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByNameAsc(String tenantId, Long academicYearId);
    Optional<FeeComponentMasterV2> findByTenantIdAndAcademicYearIdAndCodeAndIsDeletedFalse(String tenantId, Long academicYearId, String code);
    Optional<FeeComponentMasterV2> findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(Long id, String tenantId, Long academicYearId);
}
