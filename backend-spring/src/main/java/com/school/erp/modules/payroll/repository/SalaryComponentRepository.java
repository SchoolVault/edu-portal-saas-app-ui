package com.school.erp.modules.payroll.repository;
import com.school.erp.modules.payroll.entity.SalaryComponent; import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface SalaryComponentRepository extends JpaRepository<SalaryComponent, Long> { List<SalaryComponent> findByTenantIdAndSalaryStructureId(String t, Long ssId); }
