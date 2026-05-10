package com.school.erp.modules.transport.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.transport.ops")
public class TransportOpsProperties {
    private String dlqRetryCron = "0 */5 * * * *";
    private int dlqRetryBatchSize = 25;
    private int dlqMaxRetries = 5;
    private int hotRetentionDays = 30;
    private int warmRetentionDays = 180;
    private String retentionCron = "0 25 2 * * *";
    private String escalationCron = "0 */10 * * * *";

    public String getDlqRetryCron() {
        return dlqRetryCron;
    }

    public void setDlqRetryCron(String dlqRetryCron) {
        this.dlqRetryCron = dlqRetryCron;
    }

    public int getDlqRetryBatchSize() {
        return dlqRetryBatchSize;
    }

    public void setDlqRetryBatchSize(int dlqRetryBatchSize) {
        this.dlqRetryBatchSize = dlqRetryBatchSize;
    }

    public int getDlqMaxRetries() {
        return dlqMaxRetries;
    }

    public void setDlqMaxRetries(int dlqMaxRetries) {
        this.dlqMaxRetries = dlqMaxRetries;
    }

    public int getHotRetentionDays() {
        return hotRetentionDays;
    }

    public void setHotRetentionDays(int hotRetentionDays) {
        this.hotRetentionDays = hotRetentionDays;
    }

    public int getWarmRetentionDays() {
        return warmRetentionDays;
    }

    public void setWarmRetentionDays(int warmRetentionDays) {
        this.warmRetentionDays = warmRetentionDays;
    }

    public String getRetentionCron() {
        return retentionCron;
    }

    public void setRetentionCron(String retentionCron) {
        this.retentionCron = retentionCron;
    }

    public String getEscalationCron() {
        return escalationCron;
    }

    public void setEscalationCron(String escalationCron) {
        this.escalationCron = escalationCron;
    }
}
