package com.school.erp.integration.email;

import com.school.erp.config.IntegrationEmailDispatchProperties;
import com.school.erp.integration.email.verification.EmailProvider;
import com.school.erp.integration.outbound.OutboundEmailHttpClient;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class TransactionalEmailDispatcher {
    private final IntegrationEmailDispatchProperties dispatchProperties;
    private final SendGridTransactionalMailClient sendGridClient;
    private final BrevoTransactionalMailClient brevoClient;
    private final SesTransactionalMailClient sesClient;
    private final OutboundEmailHttpClient outboundEmailHttpClient;

    public TransactionalEmailDispatcher(
            IntegrationEmailDispatchProperties dispatchProperties,
            SendGridTransactionalMailClient sendGridClient,
            BrevoTransactionalMailClient brevoClient,
            SesTransactionalMailClient sesClient,
            OutboundEmailHttpClient outboundEmailHttpClient) {
        this.dispatchProperties = dispatchProperties;
        this.sendGridClient = sendGridClient;
        this.brevoClient = brevoClient;
        this.sesClient = sesClient;
        this.outboundEmailHttpClient = outboundEmailHttpClient;
    }

    public void dispatch(
            String tenantId,
            String toEmail,
            String subject,
            String textBody,
            String htmlBody,
            String correlationId,
            String eventType) {
        if (!StringUtils.hasText(toEmail) || !StringUtils.hasText(subject)) {
            throw new IllegalArgumentException("Email recipient and subject are required");
        }

        EmailProvider provider = dispatchProperties.getProvider() != null
                ? dispatchProperties.getProvider()
                : EmailProvider.AUTO;

        if (provider == EmailProvider.NONE) {
            throw new IllegalStateException("Email provider is disabled");
        }
        if (provider == EmailProvider.AUTO) {
            dispatchAuto(tenantId, toEmail, subject, textBody, htmlBody, correlationId, eventType);
            return;
        }
        dispatchByProvider(provider, tenantId, toEmail, subject, textBody, htmlBody, correlationId, eventType);
    }

    private void dispatchAuto(
            String tenantId,
            String toEmail,
            String subject,
            String textBody,
            String htmlBody,
            String correlationId,
            String eventType) {
        if (sendGridClient.isConfigured()) {
            sendGridClient.sendTransactionalEmail(toEmail, subject, textBody, htmlBody, tags(eventType));
            return;
        }
        if (brevoClient.isConfigured()) {
            brevoClient.sendTransactionalEmail(toEmail, subject, textBody, htmlBody, tags(eventType));
            return;
        }
        if (sesClient.isConfigured()) {
            sesClient.sendTransactionalEmail(toEmail, subject, textBody, htmlBody, tags(eventType));
            return;
        }
        if (outboundEmailHttpClient.isTriggerConfigured()) {
            publishHttpTrigger(tenantId, toEmail, subject, textBody, htmlBody, correlationId, eventType);
            return;
        }
        throw new IllegalStateException("No email provider configured");
    }

    private void dispatchByProvider(
            EmailProvider provider,
            String tenantId,
            String toEmail,
            String subject,
            String textBody,
            String htmlBody,
            String correlationId,
            String eventType) {
        switch (provider) {
            case SENDGRID -> sendGridClient.sendTransactionalEmail(toEmail, subject, textBody, htmlBody, tags(eventType));
            case BREVO -> brevoClient.sendTransactionalEmail(toEmail, subject, textBody, htmlBody, tags(eventType));
            case SES -> sesClient.sendTransactionalEmail(toEmail, subject, textBody, htmlBody, tags(eventType));
            case HTTP -> publishHttpTrigger(tenantId, toEmail, subject, textBody, htmlBody, correlationId, eventType);
            default -> throw new IllegalStateException("Unsupported email provider: " + provider);
        }
    }

    private void publishHttpTrigger(
            String tenantId,
            String toEmail,
            String subject,
            String textBody,
            String htmlBody,
            String correlationId,
            String eventType) {
        Map<String, Object> attrs = new LinkedHashMap<>();
        attrs.put("toEmail", toEmail);
        attrs.put("subject", subject);
        attrs.put("textBody", textBody);
        attrs.put("htmlBody", htmlBody);
        attrs.put("correlationId", correlationId);
        outboundEmailHttpClient.postTriggerPayload(
                StringUtils.hasText(eventType) ? eventType : "notification_email_requested",
                tenantId,
                attrs);
    }

    private List<String> tags(String eventType) {
        return StringUtils.hasText(eventType) ? List.of("notification", eventType) : List.of("notification");
    }
}
