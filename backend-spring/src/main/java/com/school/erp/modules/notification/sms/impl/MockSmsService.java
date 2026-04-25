package com.school.erp.modules.notification.sms.impl;

import com.school.erp.modules.notification.sms.BulkSmsRequest;
import com.school.erp.modules.notification.sms.BulkSmsResponse;
import com.school.erp.modules.notification.sms.SmsRequest;
import com.school.erp.modules.notification.sms.SmsResponse;
import com.school.erp.modules.notification.sms.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Mock SMS service for development and testing.
 * Logs SMS instead of actually sending them.
 * Enabled when: sms.provider=MOCK or sms.provider not configured.
 */
@Service
@ConditionalOnExpression(
    "'${app.sms.provider:MOCK}'.equalsIgnoreCase('MOCK') || '${app.sms.providers.mock.enabled:false}'.equalsIgnoreCase('true')")
@Slf4j
public class MockSmsService implements SmsService {

    private static final AtomicInteger messageCounter = new AtomicInteger(0);

    @Override
    public SmsResponse sendSms(SmsRequest request) {
        String messageId = "MOCK-" + UUID.randomUUID().toString().substring(0, 8);
        int count = messageCounter.incrementAndGet();

        log.info("📱 [MOCK SMS #{}] To: {}, Message: {}, From: {}, TenantId: {}, CorrelationId: {}",
            count,
            request.getTo(),
            request.getMessage(),
            request.getFrom(),
            request.getTenantId(),
            request.getCorrelationId());

        // Simulate success (99% success rate for realism)
        boolean success = Math.random() > 0.01;

        return SmsResponse.builder()
            .success(success)
            .messageId(messageId)
            .providerStatus(success ? "DELIVERED" : "FAILED")
            .errorMessage(success ? null : "Mock random failure for testing")
            .providerName("MOCK")
            .estimatedCostCents(5L) // Mock cost: 5 cents per SMS
            .build();
    }

    @Override
    public BulkSmsResponse sendBulkSms(BulkSmsRequest request) {
        log.info("📱 [MOCK BULK SMS] Recipients: {}, Message: {}, TenantId: {}",
            request.getRecipients().length,
            request.getMessage(),
            request.getTenantId());

        SmsResponse[] responses = new SmsResponse[request.getRecipients().length];
        int successCount = 0;
        int failedCount = 0;

        for (int i = 0; i < request.getRecipients().length; i++) {
            SmsRequest singleRequest = SmsRequest.builder()
                .to(request.getRecipients()[i])
                .message(request.getMessage())
                .from(request.getFrom())
                .tenantId(request.getTenantId())
                .correlationId(request.getCorrelationId())
                .build();

            SmsResponse response = sendSms(singleRequest);
            responses[i] = response;

            if (response.isSuccess()) {
                successCount++;
            } else {
                failedCount++;
            }
        }

        return BulkSmsResponse.builder()
            .totalSent(request.getRecipients().length)
            .successCount(successCount)
            .failedCount(failedCount)
            .responses(responses)
            .build();
    }

    @Override
    public String getProviderName() {
        return "MOCK";
    }

    @Override
    public boolean isHealthy() {
        return true; // Mock is always healthy
    }
}
