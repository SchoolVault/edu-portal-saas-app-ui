package com.school.erp.modules.payroll.payout;

import java.util.Locale;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.payroll.payout", name = "provider", havingValue = "mock", matchIfMissing = true)
public class MockPayrollPayoutGatewayClient implements PayrollPayoutGatewayClient {

    @Override
    public PayoutInitiationResult initiate(PayoutInitiationRequest request) {
        String method = request.paymentMethod() != null ? request.paymentMethod().toUpperCase(Locale.ROOT) : "NETBANKING";
        String ref = method + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        String payload = "{\"mock\":true,\"rail\":\"" + method + "\",\"operationKey\":\"" + request.operationKey() + "\"}";
        return new PayoutInitiationResult("mock_payout", ref, "SUBMITTED", payload);
    }

    @Override
    public PayoutStatusResult fetchStatus(String providerReferenceId) {
        String payload = "{\"mock\":true,\"providerReferenceId\":\"" + providerReferenceId + "\",\"polled\":true}";
        return new PayoutStatusResult("mock_payout", providerReferenceId, "PROCESSED", payload);
    }
}
