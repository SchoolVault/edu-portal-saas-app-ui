package com.school.erp.modules.payment.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.payment.dto.PaymentDTOs;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Creates provider orders and returns client payloads. Persists to {@code fee_payment_attempts} when wired.
 */
@Service
public class PaymentCheckoutService {

    private static final Logger log = LoggerFactory.getLogger(PaymentCheckoutService.class);

    private final ObjectMapper objectMapper;

    @Value("${app.payments.razorpay.key:rzp_test_placeholder}")
    private String razorpayKeyId;

    public PaymentCheckoutService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public PaymentDTOs.CreateOrderResponse createOrder(PaymentDTOs.CreateOrderRequest req) {
        String tenantId = TenantContext.getTenantId();
        String provider = req.getProvider() == null ? "" : req.getProvider().trim().toUpperCase(Locale.ROOT);
        if (!provider.equals("RAZORPAY") && !provider.equals("STRIPE") && !provider.equals("MOCK")) {
            throw new BusinessException("Unsupported payment provider: " + req.getProvider());
        }
        String attemptId = UUID.randomUUID().toString().replace("-", "").substring(0, 18);
        String providerOrderId = "ord_" + System.currentTimeMillis();
        Map<String, Object> client = new LinkedHashMap<>();
        client.put("key", razorpayKeyId);
        client.put("amount", req.getAmount().movePointRight(2).longValue());
        client.put("currency", req.getCurrency());
        client.put("order_id", providerOrderId);
        client.put("name", "SchoolVault");
        client.put("description", req.getPurpose());
        client.put("notes", Map.of("tenantId", tenantId, "purpose", req.getPurpose()));

        String json;
        try {
            json = objectMapper.writeValueAsString(client);
        } catch (JsonProcessingException e) {
            throw new BusinessException("Could not build checkout payload");
        }
        log.info("payment.checkout.create tenant={} purpose={} provider={} amount={} {}", tenantId, req.getPurpose(), provider, req.getAmount(), req.getCurrency());

        PaymentDTOs.CreateOrderResponse res = new PaymentDTOs.CreateOrderResponse();
        res.setAttemptId(attemptId);
        res.setProviderOrderId(providerOrderId);
        res.setPublicKeyId(razorpayKeyId);
        res.setAmount(req.getAmount());
        res.setCurrency(req.getCurrency());
        res.setClientOptionsJson(json);
        res.setStatus("CREATED");
        return res;
    }
}
