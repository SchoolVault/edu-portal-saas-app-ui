package com.school.erp.integration.email;

import com.school.erp.config.IntegrationBrevoProperties;
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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Brevo (Sendinblue) v3 SMTP API — same resilience profile as other outbound email I/O.
 *
 * @see <a href="https://developers.brevo.com/reference/sendtransacemail">Send transactional email</a>
 */
@Component
public class BrevoTransactionalMailClient {

    public static final String BREVO_V3 = "https://api.brevo.com/v3/smtp/email";

    private static final Logger log = LoggerFactory.getLogger(BrevoTransactionalMailClient.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final IntegrationBrevoProperties properties;

    public BrevoTransactionalMailClient(IntegrationBrevoProperties properties) {
        this.properties = properties;
    }

    public boolean isConfigured() {
        return properties != null && properties.isConfigured();
    }

    @Retry(name = "emailProvider")
    @CircuitBreaker(name = "emailProvider")
    public void sendEmailVerification(String toEmail, String verificationUrl, String expiresAtIso) {
        if (!isConfigured() || !StringUtils.hasText(toEmail) || !StringUtils.hasText(verificationUrl)) {
            return;
        }
        EmailVerificationMessageFormatter.FormattedMessage content =
                EmailVerificationMessageFormatter.build(verificationUrl, expiresAtIso);
        String subject = properties.getSubject();
        Map<String, Object> sender = new LinkedHashMap<>();
        sender.put("name", properties.getFromName() != null ? properties.getFromName() : "School");
        sender.put("email", properties.getFromEmail().trim());
        Map<String, String> to = new LinkedHashMap<>();
        to.put("email", toEmail.trim());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sender", sender);
        body.put("to", List.of(to));
        body.put("subject", subject);
        body.put("textContent", content.textPlain());
        body.put("htmlContent", content.textHtml());
        body.put("tags", List.of("auth", "email_verification"));
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", properties.getApiKey().trim());
        try {
            restTemplate.exchange(BREVO_V3, HttpMethod.POST, new HttpEntity<>(body, headers), Void.class);
            int at = toEmail.indexOf('@');
            String redacted = at < 0 ? "?" : toEmail.substring(0, 1) + "…" + toEmail.substring(at);
            log.info("Brevo email_verification message accepted for to={} subject={}", redacted, subject);
        } catch (RestClientException ex) {
            log.warn("Brevo email_verification send failed: {}", ex.getMessage());
            throw ex;
        }
    }

    @Retry(name = "emailProvider")
    @CircuitBreaker(name = "emailProvider")
    public void sendTransactionalEmail(String toEmail, String subject, String textContent, String htmlContent, List<String> tags) {
        if (!isConfigured() || !StringUtils.hasText(toEmail) || !StringUtils.hasText(subject)) {
            return;
        }
        Map<String, Object> sender = new LinkedHashMap<>();
        sender.put("name", properties.getFromName() != null ? properties.getFromName() : "School");
        sender.put("email", properties.getFromEmail().trim());
        Map<String, String> to = new LinkedHashMap<>();
        to.put("email", toEmail.trim());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sender", sender);
        body.put("to", List.of(to));
        body.put("subject", subject.trim());
        body.put("textContent", StringUtils.hasText(textContent) ? textContent : subject.trim());
        if (StringUtils.hasText(htmlContent)) {
            body.put("htmlContent", htmlContent);
        }
        if (tags != null && !tags.isEmpty()) {
            body.put("tags", tags);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", properties.getApiKey().trim());
        try {
            restTemplate.exchange(BREVO_V3, HttpMethod.POST, new HttpEntity<>(body, headers), Void.class);
        } catch (RestClientException ex) {
            log.warn("Brevo transactional send failed: {}", ex.getMessage());
            throw ex;
        }
    }
}
