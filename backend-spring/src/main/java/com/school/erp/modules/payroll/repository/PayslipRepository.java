package com.school.erp.modules.payroll.repository;

import com.school.erp.modules.payroll.entity.Payslip;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PayslipRepository extends JpaRepository<Payslip, Long> {
    List<Payslip> findByTenantIdAndIsDeletedFalse(String t);

    @Query("SELECT p FROM Payslip p WHERE p.tenantId = :t AND (p.isDeleted IS NULL OR p.isDeleted = false) "
            + "AND (:year IS NULL OR p.year = :year) "
            + "AND (:month IS NULL OR :month = '' OR LOWER(TRIM(p.month)) = LOWER(TRIM(:month)))")
    Page<Payslip> pageByTenantAndPeriod(
            @Param("t") String t, @Param("year") Integer year, @Param("month") String month, Pageable pageable);

    @Query("SELECT p FROM Payslip p WHERE p.tenantId = :t AND p.teacherId = :teacherId AND (p.isDeleted IS NULL OR p.isDeleted = false) "
            + "AND (:year IS NULL OR p.year = :year) "
            + "AND (:month IS NULL OR :month = '' OR LOWER(TRIM(p.month)) = LOWER(TRIM(:month)))")
    Page<Payslip> pageByTenantTeacherAndPeriod(
            @Param("t") String t, @Param("teacherId") Long teacherId, @Param("year") Integer year, @Param("month") String month, Pageable pageable);

    boolean existsByTenantIdAndPayrollMonthAndIsDeletedFalse(String tenantId, String payrollMonth);

    Optional<Payslip> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
