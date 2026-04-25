package com.school.erp.modules.payroll.payout;

import java.math.BigDecimal;

/** Provider abstraction for salary payout initiation and status polling. */
public interface PayrollPayoutGatewayClient {

    PayoutInitiationResult initiate(PayoutInitiationRequest request);

    PayoutStatusResult fetchStatus(String providerReferenceId);

    record PayoutInitiationRequest(
            String tenantId,
            Long teacherId,
            String teacherName,
            BigDecimal amount,
            String currency,
            String paymentMethod,
            String bankAccountHolder,
            String bankAccountNumber,
            String bankIfsc,
            String bankName,
            String operationKey) {
    }

    record PayoutInitiationResult(
            String providerName,
            String providerReferenceId,
            String status,
            String payloadJson) {
    }

    record PayoutStatusResult(
            String providerName,
            String providerReferenceId,
            String status,
            String payloadJson) {
    }
}
