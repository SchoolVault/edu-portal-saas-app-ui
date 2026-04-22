package com.school.erp.modules.fees.repository;
import com.school.erp.modules.fees.entity.FeeStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FeeStructureRepository extends JpaRepository<FeeStructure, Long> {
    List<FeeStructure> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<FeeStructure> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    boolean existsByTenantIdAndIsDeletedFalseAndClassIdAndAcademicYearIdAndNameIgnoreCase(
            String tenantId, Long classId, Long academicYearId, String name);

    boolean existsByTenantIdAndIsDeletedFalseAndClassIdAndAcademicYearIdAndNameIgnoreCaseAndIdNot(
            String tenantId, Long classId, Long academicYearId, String name, Long id);

    Optional<FeeStructure> findFirstByTenantIdAndIsDeletedFalseAndClassIdAndAcademicYearIdAndNameIgnoreCase(
            String tenantId, Long classId, Long academicYearId, String name);
}
