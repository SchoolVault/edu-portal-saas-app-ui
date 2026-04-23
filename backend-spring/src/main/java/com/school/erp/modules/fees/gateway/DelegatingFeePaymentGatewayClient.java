package com.school.erp.modules.fees.gateway;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.fees.gateway.strategy.FeePaymentCheckoutStrategy;
import org.springframework.context.annotation.Primary;
import org.springframework.core.annotation.AnnotationAwareOrderComparator;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Routes checkout to the first matching {@link FeePaymentCheckoutStrategy} (ordered by Spring
 * {@code @Order}). Add a new strategy bean to plug in another gateway without editing this class.
 */
@Component
@Primary
public class DelegatingFeePaymentGatewayClient implements PaymentGatewayClient {

    private final List<FeePaymentCheckoutStrategy> strategies;

    public DelegatingFeePaymentGatewayClient(List<FeePaymentCheckoutStrategy> strategies) {
        this.strategies = new ArrayList<>(strategies);
        AnnotationAwareOrderComparator.sort(this.strategies);
    }

    private String normalize(String provider) {
        return provider == null ? "" : provider.trim().toLowerCase(Locale.ROOT);
    }

    private FeePaymentCheckoutStrategy resolve(String provider) {
        String p = normalize(provider);
        return strategies.stream()
                .filter(s -> s.supports(p))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unsupported payment provider: " + p));
    }

    @Override
    public GatewayCheckoutSession createSession(
            String provider,
            String tenantId,
            Long paymentId,
            BigDecimal amount,
            String currency,
            String returnUrl) {
        String p = normalize(provider);
        if (p.isEmpty()) {
            throw new BusinessException("Payment provider is required");
        }
        return resolve(p).createSession(p, tenantId, paymentId, amount, currency, returnUrl);
    }

    @Override
    public GatewayPaymentConfirmation confirmPayment(
            String provider,
            String checkoutToken,
            String providerOrderId,
            String providerPaymentId,
            String providerSignature) {
        String p = normalize(provider);
        return resolve(p).confirmPayment(p, checkoutToken, providerOrderId, providerPaymentId, providerSignature);
    }

    @Override
    public GatewayPaymentStatus fetchPaymentStatus(String provider, String providerOrderId, String providerPaymentId) {
        String p = normalize(provider);
        return resolve(p).fetchPaymentStatus(p, providerOrderId, providerPaymentId);
    }
}
