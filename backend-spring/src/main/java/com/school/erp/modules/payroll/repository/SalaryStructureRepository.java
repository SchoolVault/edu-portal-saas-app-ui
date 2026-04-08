package com.school.erp.modules.payroll.repository;
import com.school.erp.modules.payroll.entity.SalaryStructure; import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, Long> { List<SalaryStructure> findByTenantIdAndIsDeletedFalse(String t); }
