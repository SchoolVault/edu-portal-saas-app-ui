package com.school.erp.modules.notification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Delivery guardrails and retry tuning for external notification channels.
 */
@ConfigurationProperties(prefix = "app.notification.delivery")
public class NotificationDeliveryProperties {
    private int smsMaxAttempts = 4;
    private int whatsappMaxAttempts = 5;
    private int emailMaxAttempts = 5;
    private int inAppMaxAttempts = 3;
    private int perUserPerHourLimit = 40;
    /** Tenant daily budget in minor units (paise / cents). */
    private long tenantDailyBudgetMinor = 200_000L;
    private int smsEstimatedCostMinor = 25;
    private int whatsappEstimatedCostMinor = 35;
    private int emailEstimatedCostMinor = 5;
    private String webhookSecret = "";

    public int getSmsMaxAttempts() { return smsMaxAttempts; }
    public void setSmsMaxAttempts(int smsMaxAttempts) { this.smsMaxAttempts = smsMaxAttempts; }
    public int getWhatsappMaxAttempts() { return whatsappMaxAttempts; }
    public void setWhatsappMaxAttempts(int whatsappMaxAttempts) { this.whatsappMaxAttempts = whatsappMaxAttempts; }
    public int getEmailMaxAttempts() { return emailMaxAttempts; }
    public void setEmailMaxAttempts(int emailMaxAttempts) { this.emailMaxAttempts = emailMaxAttempts; }
    public int getInAppMaxAttempts() { return inAppMaxAttempts; }
    public void setInAppMaxAttempts(int inAppMaxAttempts) { this.inAppMaxAttempts = inAppMaxAttempts; }
    public int getPerUserPerHourLimit() { return perUserPerHourLimit; }
    public void setPerUserPerHourLimit(int perUserPerHourLimit) { this.perUserPerHourLimit = perUserPerHourLimit; }
    public long getTenantDailyBudgetMinor() { return tenantDailyBudgetMinor; }
    public void setTenantDailyBudgetMinor(long tenantDailyBudgetMinor) { this.tenantDailyBudgetMinor = tenantDailyBudgetMinor; }
    public int getSmsEstimatedCostMinor() { return smsEstimatedCostMinor; }
    public void setSmsEstimatedCostMinor(int smsEstimatedCostMinor) { this.smsEstimatedCostMinor = smsEstimatedCostMinor; }
    public int getWhatsappEstimatedCostMinor() { return whatsappEstimatedCostMinor; }
    public void setWhatsappEstimatedCostMinor(int whatsappEstimatedCostMinor) { this.whatsappEstimatedCostMinor = whatsappEstimatedCostMinor; }
    public int getEmailEstimatedCostMinor() { return emailEstimatedCostMinor; }
    public void setEmailEstimatedCostMinor(int emailEstimatedCostMinor) { this.emailEstimatedCostMinor = emailEstimatedCostMinor; }
    public String getWebhookSecret() { return webhookSecret; }
    public void setWebhookSecret(String webhookSecret) { this.webhookSecret = webhookSecret; }
}
