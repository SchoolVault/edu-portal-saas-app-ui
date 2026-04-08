package com.school.erp.modules.payroll.repository;
import com.school.erp.modules.payroll.entity.Payslip; import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface PayslipRepository extends JpaRepository<Payslip, Long> { List<Payslip> findByTenantIdAndIsDeletedFalse(String t); }
