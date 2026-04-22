package com.school.erp.modules.payroll.repository;

import com.school.erp.modules.payroll.entity.SalaryDisbursementAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SalaryDisbursementAttemptRepository extends JpaRepository<SalaryDisbursementAttempt, Long> {

    List<SalaryDisbursementAttempt> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    boolean existsByTenantIdAndReferenceIdAndIsDeletedFalse(String tenantId, String referenceId);

    Page<SalaryDisbursementAttempt> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Pageable pageable);

    Page<SalaryDisbursementAttempt> findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, String status, Pageable pageable);

    Optional<SalaryDisbursementAttempt> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
