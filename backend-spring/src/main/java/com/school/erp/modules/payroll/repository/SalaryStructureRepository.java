package com.school.erp.modules.payroll.repository;

import com.school.erp.modules.payroll.entity.SalaryStructure;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, Long> {
    List<SalaryStructure> findByTenantIdAndIsDeletedFalse(String t);

    Page<SalaryStructure> findByTenantIdAndIsDeletedFalse(String t, Pageable pageable);

    boolean existsByTenantIdAndIsDeletedFalseAndTeacherId(String tenantId, Long teacherId);
}
