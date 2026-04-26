package com.school.erp.integration.email.verification;

import com.school.erp.config.IntegrationEmailDispatchProperties;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Picks a channel from {@code dispatch.provider} and per-channel {@link #isReady()}. New email providers:
 * implement {@link EmailVerificationChannel}, add to {@link #AUTO_ORDER} for AUTO failover.
 */
@Component
public class EmailVerificationChannelSelector {

    /**
     * When {@link EmailProvider#AUTO}: first ready wins (single hop per request).
     */
    private static final List<EmailProvider> AUTO_ORDER = List.of(
            EmailProvider.SENDGRID, EmailProvider.BREVO, EmailProvider.SES, EmailProvider.HTTP);

    private final IntegrationEmailDispatchProperties dispatch;
    private final Map<EmailProvider, EmailVerificationChannel> byKind;

    public EmailVerificationChannelSelector(
            List<EmailVerificationChannel> channelBeans,
            IntegrationEmailDispatchProperties dispatch) {
        this.dispatch = dispatch;
        this.byKind = new EnumMap<>(EmailProvider.class);
        for (EmailVerificationChannel c : channelBeans) {
            if (c == null || c.kind() == null) {
                continue;
            }
            this.byKind.put(c.kind(), c);
        }
    }

    public Optional<EmailVerificationChannel> select() {
        EmailProvider p = dispatch.getProvider() != null ? dispatch.getProvider() : EmailProvider.AUTO;
        if (p == EmailProvider.NONE) {
            return Optional.empty();
        }
        if (p == EmailProvider.AUTO) {
            for (EmailProvider k : AUTO_ORDER) {
                Optional<EmailVerificationChannel> c = getWhenReady(k);
                if (c.isPresent()) {
                    return c;
                }
            }
            return Optional.empty();
        }
        return getWhenReady(p);
    }

    private Optional<EmailVerificationChannel> getWhenReady(EmailProvider kind) {
        EmailVerificationChannel c = byKind.get(kind);
        if (c == null || !c.isReady()) {
            return Optional.empty();
        }
        return Optional.of(c);
    }
}
