package com.school.erp.modules.fees.webhook;

import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

/**
 * Unauthenticated endpoint — protected by HMAC signature verification only.
 */
@Hidden
@RestController
@RequestMapping("/api/v1/fees/webhooks")
public class RazorpayWebhookController {

    private final PaymentWebhookIngestService ingestService;

    @PostMapping("/razorpay")
    public ResponseEntity<String> razorpay(HttpServletRequest request) throws IOException {
        byte[] body = request.getInputStream().readAllBytes();
        String sig = request.getHeader(RazorpayWebhookSignatureVerifier.expectedHeaderName());
        if (sig == null || sig.isBlank()) {
            sig = request.getHeader("X-Razorpay-Signature");
        }
        return ingestService.ingestRazorpay(body, sig);
    }

    public RazorpayWebhookController(PaymentWebhookIngestService ingestService) {
        this.ingestService = ingestService;
    }
}
