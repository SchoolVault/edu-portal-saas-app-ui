package com.school.erp.modules.fees.repository;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.fees.entity.FeePayment;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface FeePaymentRepository extends JpaRepository<FeePayment, Long> {
    List<FeePayment> findByTenantIdAndIsDeletedFalse(String tenantId);
    List<FeePayment> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, Enums.FeeStatus status);
    List<FeePayment> findByTenantIdAndStudentIdAndIsDeletedFalse(String tenantId, Long studentId);
    java.util.Optional<FeePayment> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    java.util.Optional<FeePayment> findByReceiptNumberAndTenantIdAndIsDeletedFalse(String receiptNumber, String tenantId);
}
