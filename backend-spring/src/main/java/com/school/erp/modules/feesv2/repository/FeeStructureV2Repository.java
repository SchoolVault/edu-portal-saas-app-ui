package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeStructureV2;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeStructureV2Repository extends JpaRepository<FeeStructureV2, Long> {
    List<FeeStructureV2> findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByClassIdAscStructureNameAscVersionNoDesc(String tenantId, Long academicYearId);
    Optional<FeeStructureV2> findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(Long id, String tenantId, Long academicYearId);
}
