package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.PaymentAllocationV2;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentAllocationV2Repository extends JpaRepository<PaymentAllocationV2, Long> {
    List<PaymentAllocationV2> findByTenantIdAndAcademicYearIdAndPaymentIdAndIsDeletedFalseOrderByAllocationOrderAsc(
            String tenantId, Long academicYearId, Long paymentId);
}
