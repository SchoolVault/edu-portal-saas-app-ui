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
 * MSG91 (India) SMS adapter — configure credentials and HTTP call when moving beyond mock.
 * Enabled when {@code app.sms.provider=MSG91}.
 */
@Service
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "MSG91")
@Slf4j
public class Msg91SmsService implements SmsService {

    @Value("${app.sms.msg91.auth-key:}")
    private String authKey;

    @Value("${app.sms.msg91.sender-id:}")
    private String senderId;

    @Override
    public SmsResponse sendSms(SmsRequest request) {
        log.info("MSG91 SMS stub to={} tenantId={} senderId={} correlationId={}",
                request.getTo(), request.getTenantId(), senderId, request.getCorrelationId());
        if (authKey == null || authKey.isBlank()) {
            return SmsResponse.builder()
                    .success(false)
                    .providerName("MSG91")
                    .errorMessage("app.sms.msg91.auth-key is not configured")
                    .build();
        }
        // Integrate MSG91 Flow / SMS API here; keep response contract stable for callers.
        return SmsResponse.builder()
                .success(true)
                .messageId("MSG91-STUB-" + (request.getCorrelationId() != null ? request.getCorrelationId() : "na"))
                .providerStatus("QUEUED")
                .providerName("MSG91")
                .build();
    }

    @Override
    public BulkSmsResponse sendBulkSms(BulkSmsRequest request) {
SmsResponse[] responses = new SmsResponse[request.getRecipients().length];
        for (int i = 0; i < request.getRecipients().length; i++) {
            responses[i] = sendSms(SmsRequest.builder()
                    .to(request.getRecipients()[i])
                    .message(request.getMessage())
                    .from(request.getFrom())
                    .tenantId(request.getTenantId())
                    .correlationId(request.getCorrelationId())
                    .build());
        }
        int ok = 0;
        for (SmsResponse r : responses) {
            if (r.isSuccess()) {
                ok++;
            }
        }
        return BulkSmsResponse.builder()
                .totalSent(request.getRecipients().length)
                .successCount(ok)
                .failedCount(request.getRecipients().length - ok)
                .responses(responses)
                .build();
    }

    @Override
    public String getProviderName() {
        return "MSG91";
    }

    @Override
    public boolean isHealthy() {
        return authKey != null && !authKey.isBlank();
    }
}
