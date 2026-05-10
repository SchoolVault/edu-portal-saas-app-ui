package com.school.erp.modules.payroll.webhook;

import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Hidden
@RestController
@RequestMapping("/api/v1/payroll/webhooks")
public class PayrollPayoutWebhookController {
    private final PayrollPayoutWebhookIngestService ingestService;

    public PayrollPayoutWebhookController(PayrollPayoutWebhookIngestService ingestService) {
        this.ingestService = ingestService;
    }

    @PostMapping("/razorpayx")
    public ResponseEntity<String> razorpayx(HttpServletRequest request) throws IOException {
        byte[] body = request.getInputStream().readAllBytes();
        String sig = request.getHeader(RazorpayXPayrollWebhookSignatureVerifier.expectedHeaderName());
        if (sig == null || sig.isBlank()) {
            sig = request.getHeader("X-Razorpay-Signature");
        }
        return ingestService.ingest(body, sig);
    }
}
