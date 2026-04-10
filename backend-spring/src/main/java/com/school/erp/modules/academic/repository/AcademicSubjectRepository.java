package com.school.erp.modules.academic.repository;

import com.school.erp.modules.academic.entity.AcademicSubject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AcademicSubjectRepository extends JpaRepository<AcademicSubject, Long> {

    List<AcademicSubject> findByTenantIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(String tenantId);
}
