package com.school.erp.integration.email;

import com.school.erp.config.IntegrationSendGridProperties;
import com.school.erp.integration.email.verification.EmailVerificationMessageFormatter;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * SendGrid v3 mail send. Shares body text/HTML with Brevo via {@link EmailVerificationMessageFormatter}.
 */
@Component
public class SendGridTransactionalMailClient {

    public static final String SENDGRID_V3 = "https://api.sendgrid.com/v3/mail/send";

    private static final Logger log = LoggerFactory.getLogger(SendGridTransactionalMailClient.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final IntegrationSendGridProperties properties;

    public SendGridTransactionalMailClient(IntegrationSendGridProperties properties) {
        this.properties = properties;
    }

    public boolean isConfigured() {
        return properties != null && properties.isConfigured();
    }

    @Retry(name = "emailProvider")
    @CircuitBreaker(name = "emailProvider")
    public void sendEmailVerification(
            String toEmail,
            String verificationUrl,
            String expiresAtIso) {
        if (!isConfigured()) {
            return;
        }
        if (!StringUtils.hasText(toEmail) || !StringUtils.hasText(verificationUrl)) {
            return;
        }
        EmailVerificationMessageFormatter.FormattedMessage content =
                EmailVerificationMessageFormatter.build(verificationUrl, expiresAtIso);
        String subject = properties.getSubject();
        postMail(toEmail, subject, content);
    }

    @Retry(name = "emailProvider")
    @CircuitBreaker(name = "emailProvider")
    public void sendTransactionalEmail(String toEmail, String subject, String textContent, String htmlContent, List<String> categories) {
        if (!isConfigured()) {
            return;
        }
        if (!StringUtils.hasText(toEmail) || !StringUtils.hasText(subject)) {
            return;
        }
        postMail(
                toEmail,
                subject,
                textContent != null ? textContent : subject,
                htmlContent,
                categories != null ? categories : List.of());
    }

    private void postMail(
            String toEmail,
            String subject,
            EmailVerificationMessageFormatter.FormattedMessage content) {
        postMail(toEmail, subject, content.textPlain(), content.textHtml(), List.of("auth", "email_verification"));
    }

    private void postMail(
            String toEmail,
            String subject,
            String textContent,
            String htmlContent,
            List<String> categories) {
        List<Map<String, String>> to = new ArrayList<>();
        to.add(Map.of("email", toEmail.trim()));
        Map<String, Object> personalization = new LinkedHashMap<>();
        personalization.put("to", to);
        Map<String, String> from = new LinkedHashMap<>();
        from.put("email", properties.getFromEmail().trim());
        from.put("name", properties.getFromName() != null ? properties.getFromName() : "School");
        List<Map<String, String>> bodyContent = new ArrayList<>();
        bodyContent.add(Map.of("type", "text/plain", "value", StringUtils.hasText(textContent) ? textContent : subject));
        if (StringUtils.hasText(htmlContent)) {
            bodyContent.add(Map.of("type", "text/html", "value", htmlContent));
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("personalizations", List.of(personalization));
        body.put("from", from);
        body.put("subject", subject);
        body.put("content", bodyContent);
        if (categories != null && !categories.isEmpty()) {
            body.put("categories", categories);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getApiKey().trim());
        try {
            restTemplate.exchange(SENDGRID_V3, HttpMethod.POST, new HttpEntity<>(body, headers), Void.class);
            int at = toEmail.indexOf('@');
            String redacted = at < 0 ? "?" : toEmail.substring(0, 1) + "…" + toEmail.substring(at);
            log.info("SendGrid email_verification message accepted for to={} subject={}", redacted, subject);
        } catch (RestClientException ex) {
            log.warn("SendGrid email_verification send failed: {}", ex.getMessage());
            throw ex;
        }
    }
}
