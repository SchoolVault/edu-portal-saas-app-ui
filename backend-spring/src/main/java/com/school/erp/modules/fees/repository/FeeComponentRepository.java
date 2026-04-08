package com.school.erp.modules.fees.repository;
import com.school.erp.modules.fees.entity.FeeComponent;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface FeeComponentRepository extends JpaRepository<FeeComponent, Long> {
    List<FeeComponent> findByTenantIdAndFeeStructureId(String tenantId, Long feeStructureId);
}
