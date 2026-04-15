package com.school.erp.modules.notification.sms;

/**
 * SMS Service abstraction for sending SMS messages.
 * Implementations: MockSmsService, TwilioSmsService, AwsSnsSmsService, Msg91SmsService
 */
public interface SmsService {

    SmsResponse sendSms(SmsRequest request);

    BulkSmsResponse sendBulkSms(BulkSmsRequest request);

    String getProviderName();

    boolean isHealthy();
}
