package com.school.erp.integration.email;

import com.school.erp.config.IntegrationSesProperties;
import com.school.erp.integration.email.verification.EmailVerificationMessageFormatter;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.Body;
import software.amazon.awssdk.services.ses.model.Content;
import software.amazon.awssdk.services.ses.model.Destination;
import software.amazon.awssdk.services.ses.model.Message;
import software.amazon.awssdk.services.ses.model.SendEmailRequest;

/**
 * Amazon SES outbound for verification mail (and future transactional templates). Reuses
 * {@link EmailVerificationMessageFormatter} with other providers.
 */
@Component
public class SesTransactionalMailClient {

    private static final Logger log = LoggerFactory.getLogger(SesTransactionalMailClient.class);
    private static final String CHARSET = "UTF-8";

    private final IntegrationSesProperties properties;
    private volatile SesClient sesClient;

    public SesTransactionalMailClient(IntegrationSesProperties properties) {
        this.properties = properties;
    }

    public boolean isConfigured() {
        return properties != null && properties.isConfigured();
    }

    @PreDestroy
    public void closeClient() {
        if (sesClient != null) {
            try {
                sesClient.close();
            } catch (Exception ex) {
                log.debug("SES client close: {}", ex.getMessage());
            }
        }
    }

    @Retry(name = "emailProvider")
    @CircuitBreaker(name = "emailProvider")
    public void sendEmailVerification(String toEmail, String verificationUrl, String expiresAtIso) {
        if (!isConfigured() || !StringUtils.hasText(toEmail) || !StringUtils.hasText(verificationUrl)) {
            return;
        }
        EmailVerificationMessageFormatter.FormattedMessage content =
                EmailVerificationMessageFormatter.build(verificationUrl, expiresAtIso);
        String fromLine = fromDisplayLine();
        String subject = properties.getSubject() != null ? properties.getSubject() : "Verify your email";
        SendEmailRequest req = SendEmailRequest.builder()
                .source(fromLine)
                .destination(Destination.builder().toAddresses(toEmail.trim()).build())
                .message(Message.builder()
                        .subject(Content.builder().data(subject).charset(CHARSET).build())
                        .body(Body.builder()
                                .text(Content.builder().data(content.textPlain()).charset(CHARSET).build())
                                .html(Content.builder().data(content.textHtml()).charset(CHARSET).build())
                                .build())
                        .build())
                .build();
        try {
            getClient().sendEmail(req);
            int at = toEmail.indexOf('@');
            String redacted = at < 0 ? "?" : toEmail.substring(0, 1) + "…" + toEmail.substring(at);
            log.info("Amazon SES email_verification sent for to={} subject={}", redacted, subject);
        } catch (SdkException ex) {
            log.warn("Amazon SES email_verification failed: {}", ex.getMessage());
            throw ex;
        }
    }

    private String fromDisplayLine() {
        String email = properties.getFromEmail().trim();
        String name = properties.getFromName();
        if (name != null && !name.isBlank()) {
            return name.trim() + " <" + email + ">";
        }
        return email;
    }

    private SesClient getClient() {
        if (sesClient == null) {
            synchronized (this) {
                if (sesClient == null) {
                    var b = SesClient.builder()
                            .region(Region.of(properties.getRegion().trim()));
                    if (properties.isUseDefaultCredentialChain()) {
                        b.credentialsProvider(DefaultCredentialsProvider.create());
                    } else {
                        b.credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(
                                        properties.getAccessKey().trim(),
                                        properties.getSecretKey().trim())));
                    }
                    sesClient = b.build();
                }
            }
        }
        return sesClient;
    }
}
