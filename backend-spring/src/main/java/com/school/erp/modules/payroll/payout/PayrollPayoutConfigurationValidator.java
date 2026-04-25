package com.school.erp.modules.payroll.payout;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Fail-fast guard for live payout mode so production does not start with partial credentials.
 */
@Component
public class PayrollPayoutConfigurationValidator {
    @Value("${app.payroll.payout.provider:mock}")
    private String provider;

    private final PayrollPayoutRazorpayXProperties razorpayX;

    public PayrollPayoutConfigurationValidator(PayrollPayoutRazorpayXProperties razorpayX) {
        this.razorpayX = razorpayX;
    }

    @PostConstruct
    void validate() {
        if (!"razorpayx".equalsIgnoreCase(provider)) {
            return;
        }
        if (razorpayX.isDryRun()) {
            return;
        }
        require(razorpayX.getKeyId(), "app.payroll.payout.razorpayx.key-id");
        require(razorpayX.getKeySecret(), "app.payroll.payout.razorpayx.key-secret");
        require(razorpayX.getAccountNumber(), "app.payroll.payout.razorpayx.account-number");
        require(razorpayX.getWebhookSecret(), "app.payroll.payout.razorpayx.webhook-secret");
    }

    private static void require(String value, String key) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required payout configuration: " + key);
        }
    }
}
