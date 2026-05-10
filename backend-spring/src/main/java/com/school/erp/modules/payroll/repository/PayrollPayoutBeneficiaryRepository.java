package com.school.erp.modules.payroll.repository;

import com.school.erp.modules.payroll.entity.PayrollPayoutBeneficiary;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayrollPayoutBeneficiaryRepository extends JpaRepository<PayrollPayoutBeneficiary, Long> {
    Optional<PayrollPayoutBeneficiary> findByTenantIdAndTeacherIdAndProviderAndBankFingerprintAndIsDeletedFalse(
            String tenantId, Long teacherId, String provider, String bankFingerprint);
}
