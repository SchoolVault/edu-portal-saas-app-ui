package com.school.erp.modules.academic.repository;

import com.school.erp.modules.academic.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {
    List<AcademicYear> findByTenantIdAndIsDeletedFalse(String tenantId);
}
