package com.school.erp.modules.payroll.repository;

import com.school.erp.modules.payroll.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PayslipRepository extends JpaRepository<Payslip, Long> {
    List<Payslip> findByTenantIdAndIsDeletedFalse(String t);

    boolean existsByTenantIdAndPayrollMonthAndIsDeletedFalse(String tenantId, String payrollMonth);

    Optional<Payslip> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
