package com.school.erp.modules.notification.sms;

/**
 * SMS Service abstraction for sending SMS messages.
 * Implementations: Mock, Msg91, Twilio, {@code AwsSnsSmsService}, {@code SpringedgeSmsService}; selected via
 * {@code app.sms.provider} and {@code app.sms.routing.priority}.
 */
public interface SmsService {

    SmsResponse sendSms(SmsRequest request);

    BulkSmsResponse sendBulkSms(BulkSmsRequest request);

    String getProviderName();

    boolean isHealthy();
}
