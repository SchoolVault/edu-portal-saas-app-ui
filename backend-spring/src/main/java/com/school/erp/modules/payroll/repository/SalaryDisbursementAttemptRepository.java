package com.school.erp.modules.payroll.repository;

import com.school.erp.modules.payroll.entity.SalaryDisbursementAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

public interface SalaryDisbursementAttemptRepository extends JpaRepository<SalaryDisbursementAttempt, Long> {

    List<SalaryDisbursementAttempt> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    boolean existsByTenantIdAndReferenceIdAndIsDeletedFalse(String tenantId, String referenceId);

    Page<SalaryDisbursementAttempt> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Pageable pageable);

    Page<SalaryDisbursementAttempt> findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, String status, Pageable pageable);

    Optional<SalaryDisbursementAttempt> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    Optional<SalaryDisbursementAttempt> findByTenantIdAndOperationKeyAndIsDeletedFalse(String tenantId, String operationKey);

    List<SalaryDisbursementAttempt> findByTenantIdAndStatusInAndIsDeletedFalseOrderByCreatedAtAsc(String tenantId, List<String> statuses);

    List<String> findDistinctTenantIdByIsDeletedFalse();

    Optional<SalaryDisbursementAttempt> findFirstByReferenceIdAndIsDeletedFalseOrderByCreatedAtDesc(String referenceId);

    Optional<SalaryDisbursementAttempt> findFirstByTenantIdAndReferenceIdAndIsDeletedFalseOrderByCreatedAtDesc(
            String tenantId, String referenceId);

    Optional<SalaryDisbursementAttempt> findFirstByTenantIdAndPayslipIdAndIsDeletedFalseOrderByCreatedAtDesc(
            String tenantId, Long payslipId);

    long countByStatusInAndCreatedAtBeforeAndIsDeletedFalse(List<String> statuses, LocalDateTime cutoff);
}
