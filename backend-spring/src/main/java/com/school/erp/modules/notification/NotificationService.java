package com.school.erp.modules.notification;

import com.school.erp.modules.notification.dto.NotificationDispatchResult;
import com.school.erp.modules.notification.dto.SimpleNotificationRequest;
import com.school.erp.modules.notification.dto.WelcomeCredentialsRequest;

/**
 * Unified notification facade (SMS today; email / WhatsApp can plug in later).
 */
public interface NotificationService {

    NotificationDispatchResult sendWelcomeCredentials(WelcomeCredentialsRequest request);

    NotificationDispatchResult sendNotification(SimpleNotificationRequest request);

    boolean isHealthy();
}
