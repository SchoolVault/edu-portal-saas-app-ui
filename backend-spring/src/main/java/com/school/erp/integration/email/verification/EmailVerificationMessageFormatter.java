package com.school.erp.integration.email.verification;

import org.springframework.util.StringUtils;

/**
 * Single place for HTML/plain text for “verify your email” — keeps every transactional provider
 * (SendGrid, Brevo, future SES, …) consistent. Future: replace with a template ID per tenant/brand.
 */
public final class EmailVerificationMessageFormatter {

    public record FormattedMessage(String textPlain, String textHtml) {}

    private EmailVerificationMessageFormatter() {}

    public static FormattedMessage build(String verificationUrl, String expiresAtIso) {
        if (!StringUtils.hasText(verificationUrl)) {
            return new FormattedMessage("", "");
        }
        String plain = "Verify your email address by opening this link in your browser (single use):\n\n" + verificationUrl
                + (StringUtils.hasText(expiresAtIso) ? "\n\nLink expiry (server time): " + expiresAtIso : "");
        String safeExp = StringUtils.hasText(expiresAtIso) ? htmlEscapePlain(expiresAtIso) : "";
        String href = hrefSafe(verificationUrl);
        String html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/><title>Verify email</title></head><body style=\"font-family:system-ui,sans-serif;line-height:1.5;\">"
                + "<p>Please confirm your email address to use email sign-in and related features.</p>"
                + "<p><a href=\"" + href + "\">Verify your email</a></p>"
                + (StringUtils.hasText(safeExp) ? "<p><small>Expires: " + safeExp + "</small></p>" : "")
                + "<p><small>If you did not request this, you can ignore this message.</small></p>"
                + "</body></html>";
        return new FormattedMessage(plain, html);
    }

    private static String hrefSafe(String url) {
        if (url == null) {
            return "";
        }
        return url.indexOf('"') < 0 ? url : url.replace("\"", "&quot;");
    }

    private static String htmlEscapePlain(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
