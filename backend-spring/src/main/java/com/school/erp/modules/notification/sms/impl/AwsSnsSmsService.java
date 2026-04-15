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
 * AWS SNS SMS service implementation.
 * Enabled when: app.sms.provider=AWS_SNS
 *
 * Configuration required:
 * - aws.region
 * - aws.access-key-id (or use IAM role)
 * - aws.secret-access-key (or use IAM role)
 *
 * Future implementation: Integrate AWS SDK for Java
 */
@Service
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "AWS_SNS")
@Slf4j
public class AwsSnsSmsService implements SmsService {

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    @Override
    public SmsResponse sendSms(SmsRequest request) {
        log.info("☁️ [AWS SNS] Sending SMS to: {}", request.getTo());

        try {
            // TODO: Integrate AWS SDK
            // SnsClient snsClient = SnsClient.builder()
            //     .region(Region.of(awsRegion))
            //     .build();
            //
            // PublishRequest publishRequest = PublishRequest.builder()
            //     .message(request.getMessage())
            //     .phoneNumber(request.getTo())
            //     .build();
            //
            // PublishResponse response = snsClient.publish(publishRequest);

            // Placeholder response until SDK is integrated
            return SmsResponse.builder()
                .success(true)
                .messageId("AWS-SNS-PLACEHOLDER-" + System.currentTimeMillis())
                .providerStatus("SENT")
                .providerName("AWS_SNS")
                .estimatedCostCents(6L) // AWS SNS typical cost
                .build();

        } catch (Exception e) {
            log.error("❌ [AWS SNS] Failed to send SMS: {}", e.getMessage(), e);
            return SmsResponse.builder()
                .success(false)
                .errorMessage(e.getMessage())
                .providerName("AWS_SNS")
                .build();
        }
    }

    @Override
    public BulkSmsResponse sendBulkSms(BulkSmsRequest request) {
        log.info("☁️ [AWS SNS BULK] Sending to {} recipients", request.getRecipients().length);

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
        return "AWS_SNS";
    }

    @Override
    public boolean isHealthy() {
        // TODO: Implement health check
        return awsRegion != null && !awsRegion.isEmpty();
    }
}
