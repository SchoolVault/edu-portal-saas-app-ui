package com.school.erp.modules.payroll.repository;

import com.school.erp.modules.payroll.entity.SalaryDisbursementAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalaryDisbursementAttemptRepository extends JpaRepository<SalaryDisbursementAttempt, Long> {

    List<SalaryDisbursementAttempt> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    boolean existsByTenantIdAndReferenceIdAndIsDeletedFalse(String tenantId, String referenceId);
}
