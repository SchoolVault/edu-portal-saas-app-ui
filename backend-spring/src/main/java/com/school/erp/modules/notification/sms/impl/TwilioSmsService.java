package com.school.erp.modules.notification.sms.impl;

import com.school.erp.modules.notification.sms.BulkSmsRequest;
import com.school.erp.modules.notification.sms.BulkSmsResponse;
import com.school.erp.modules.notification.sms.SmsRequest;
import com.school.erp.modules.notification.sms.SmsResponse;
import com.school.erp.modules.notification.sms.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Twilio SMS service implementation.
 * Enabled when: app.sms.provider=TWILIO
 *
 * Configuration required:
 * - app.sms.twilio.account-sid
 * - app.sms.twilio.auth-token
 * - app.sms.twilio.from-number
 *
 * Future implementation: Integrate Twilio Java SDK
 */
@Service
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "TWILIO")
@Slf4j
public class TwilioSmsService implements SmsService {

    @Value("${app.sms.twilio.account-sid:}")
    private String accountSid;

    @Value("${app.sms.twilio.auth-token:}")
    private String authToken;

    @Value("${app.sms.twilio.from-number:}")
    private String fromNumber;

    @Override
    public SmsResponse sendSms(SmsRequest request) {
        log.info("🔵 [TWILIO SMS] Sending to: {}", request.getTo());

        try {
            // TODO: Integrate Twilio SDK
            // Twilio.init(accountSid, authToken);
            // Message message = Message.creator(
            //     new PhoneNumber(request.getTo()),
            //     new PhoneNumber(request.getFrom() != null ? request.getFrom() : fromNumber),
            //     request.getMessage()
            // ).create();

            // Placeholder response until SDK is integrated
            return SmsResponse.builder()
                .success(true)
                .messageId("TWILIO-PLACEHOLDER-" + System.currentTimeMillis())
                .providerStatus("QUEUED")
                .providerName("TWILIO")
                .estimatedCostCents(7L) // Twilio typical cost
                .build();

        } catch (Exception e) {
            log.error("❌ [TWILIO SMS] Failed to send SMS: {}", e.getMessage(), e);
            return SmsResponse.builder()
                .success(false)
                .errorMessage(e.getMessage())
                .providerName("TWILIO")
                .build();
        }
    }

    @Override
    public BulkSmsResponse sendBulkSms(BulkSmsRequest request) {
        log.info("🔵 [TWILIO BULK SMS] Sending to {} recipients", request.getRecipients().length);

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

            // Rate limiting: avoid hitting Twilio API too fast
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
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
        return "TWILIO";
    }

    @Override
    public boolean isHealthy() {
        // TODO: Implement health check (ping Twilio API)
        return accountSid != null && !accountSid.isEmpty();
    }
}
