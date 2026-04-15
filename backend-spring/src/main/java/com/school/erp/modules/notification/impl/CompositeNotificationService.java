package com.school.erp.modules.notification.impl;

import com.school.erp.modules.notification.NotificationService;
import com.school.erp.modules.notification.dto.NotificationDispatchResult;
import com.school.erp.modules.notification.dto.SimpleNotificationRequest;
import com.school.erp.modules.notification.dto.WelcomeCredentialsRequest;
import com.school.erp.modules.notification.sms.SmsRequest;
import com.school.erp.modules.notification.sms.SmsResponse;
import com.school.erp.modules.notification.sms.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompositeNotificationService implements NotificationService {

    private final SmsService smsService;

    @Override
    public NotificationDispatchResult sendWelcomeCredentials(WelcomeCredentialsRequest request) {
        log.info("Notification welcome: user={} role={} tenant={}",
                request.getRecipientName(), request.getRole(), request.getTenantId());

        long startTime = System.currentTimeMillis();
        String message = buildWelcomeMessage(request);

        if (request.getRecipientPhone() != null && !request.getRecipientPhone().isBlank()) {
            try {
                SmsRequest smsRequest = SmsRequest.builder()
                        .to(request.getRecipientPhone())
                        .message(message)
                        .tenantId(request.getTenantId())
                        .correlationId("welcome-" + request.getUserId())
                        .build();

                SmsResponse smsResponse = smsService.sendSms(smsRequest);

                if (smsResponse.isSuccess()) {
                    long elapsed = System.currentTimeMillis() - startTime;
                    log.info("Notification SMS ok phone={} messageId={} elapsedMs={}",
                            request.getRecipientPhone(), smsResponse.getMessageId(), elapsed);

                    return NotificationDispatchResult.builder()
                            .success(true)
                            .channel("SMS")
                            .messageId(smsResponse.getMessageId())
                            .deliveryTimeMs(elapsed)
                            .build();
                }
                log.warn("Notification SMS failed phone={} err={}",
                        request.getRecipientPhone(), smsResponse.getErrorMessage());
            } catch (Exception e) {
                log.error("Notification SMS exception phone={}", request.getRecipientPhone(), e);
            }
        }

        long elapsed = System.currentTimeMillis() - startTime;
        log.error("Notification all channels failed user={} role={}", request.getRecipientName(), request.getRole());

        return NotificationDispatchResult.builder()
                .success(false)
                .errorMessage("No valid notification channel available")
                .deliveryTimeMs(elapsed)
                .build();
    }

    @Override
    public NotificationDispatchResult sendNotification(SimpleNotificationRequest request) {
        log.info("Notification generic type={} priority={}", request.getType(), request.getPriority());

        long startTime = System.currentTimeMillis();

        if (request.getRecipientPhone() != null) {
            try {
                SmsRequest smsRequest = SmsRequest.builder()
                        .to(request.getRecipientPhone())
                        .message(request.getMessage())
                        .tenantId(request.getTenantId())
                        .build();

                SmsResponse smsResponse = smsService.sendSms(smsRequest);

                if (smsResponse.isSuccess()) {
                    long elapsed = System.currentTimeMillis() - startTime;
                    return NotificationDispatchResult.builder()
                            .success(true)
                            .channel("SMS")
                            .messageId(smsResponse.getMessageId())
                            .deliveryTimeMs(elapsed)
                            .build();
                }
            } catch (Exception e) {
                log.error("SMS notification failed: {}", e.getMessage(), e);
            }
        }

        return NotificationDispatchResult.failed("Notification delivery failed");
    }

    @Override
    public boolean isHealthy() {
        return smsService.isHealthy();
    }

    private String buildWelcomeMessage(WelcomeCredentialsRequest req) {
        String portalUrl = "https://school.portal";

        return switch (req.getRole()) {
            case TEACHER -> String.format(
                    "Welcome to %s!\n\nYour teacher portal access:\nPhone: %s\nPassword: %s\nSchool Code: %s\n\nLogin at: %s\n\nFor security, please change your password after first login.",
                    req.getSchoolName(), req.getUsername(), req.getPassword(), req.getSchoolCode(), portalUrl);
            case GUARDIAN -> String.format(
                    "Welcome to %s Parent Portal!\n\nYour access credentials:\nPhone: %s\nPassword: %s\nSchool Code: %s\n\nLogin at: %s\n\nTrack your child's attendance, grades, fees, and more!",
                    req.getSchoolName(), req.getUsername(), req.getPassword(), req.getSchoolCode(), portalUrl);
            case STUDENT -> String.format(
                    "Welcome to %s Student Portal!\n\nYour login details:\nUsername: %s\nPassword: %s\nSchool Code: %s\n\nAccess at: %s\n\nView assignments, timetables, and exam schedules.",
                    req.getSchoolName(), req.getUsername(), req.getPassword(), req.getSchoolCode(), portalUrl);
            case LIBRARY_STAFF -> String.format(
                    "Welcome to %s Library System!\n\nYour staff access:\nPhone: %s\nPassword: %s\nSchool Code: %s\n\nLogin at: %s",
                    req.getSchoolName(), req.getUsername(), req.getPassword(), req.getSchoolCode(), portalUrl);
            default -> String.format(
                    "Welcome to %s!\n\nLogin: %s\nPassword: %s\nSchool Code: %s\n\nPortal: %s",
                    req.getSchoolName(), req.getUsername(), req.getPassword(), req.getSchoolCode(), portalUrl);
        };
    }
}
