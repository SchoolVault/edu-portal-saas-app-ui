package com.school.erp.modules.academic.repository;

import com.school.erp.modules.academic.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {
    List<AcademicYear> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<AcademicYear> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
