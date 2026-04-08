package com.school.erp.modules.fees.repository;
import com.school.erp.modules.fees.entity.FeeStructure;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface FeeStructureRepository extends JpaRepository<FeeStructure, Long> {
    List<FeeStructure> findByTenantIdAndIsDeletedFalse(String tenantId);
}
