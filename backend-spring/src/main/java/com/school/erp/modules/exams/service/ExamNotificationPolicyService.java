package com.school.erp.modules.exams.service;

import com.school.erp.modules.auth.entity.User;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Delivery policy for exam notifications.
 * Centralizes channel ordering and quiet-hour behavior so user/tenant preferences
 * can be added later without touching exam workflow methods.
 */
@Service
public class ExamNotificationPolicyService {
    private final LocalTime smsWindowStart;
    private final LocalTime smsWindowEnd;

    public ExamNotificationPolicyService(
            @Value("${app.exams.notifications.sms-window-start:07:00}") String smsWindowStart,
            @Value("${app.exams.notifications.sms-window-end:21:00}") String smsWindowEnd) {
        this.smsWindowStart = LocalTime.parse(smsWindowStart);
        this.smsWindowEnd = LocalTime.parse(smsWindowEnd);
    }

    public List<String> preferredChannelsForUser(User user) {
        List<String> channels = new ArrayList<>();
        channels.add("IN_APP");

        boolean smsAllowedNow = isWithinSmsWindow(LocalTime.now());
        if (smsAllowedNow
                && user.getPhone() != null
                && !user.getPhone().isBlank()
                && Boolean.TRUE.equals(user.getPhoneVerified())) {
            channels.add("SMS");
        }

        if (user.getEmail() != null
                && !user.getEmail().isBlank()
                && Boolean.TRUE.equals(user.getEmailVerified())) {
            channels.add("EMAIL");
        }
        return channels;
    }

    private boolean isWithinSmsWindow(LocalTime now) {
        if (smsWindowEnd.isAfter(smsWindowStart) || smsWindowEnd.equals(smsWindowStart)) {
            return !now.isBefore(smsWindowStart) && !now.isAfter(smsWindowEnd);
        }
        // Overnight window support (e.g. 22:00-06:00)
        return !now.isBefore(smsWindowStart) || !now.isAfter(smsWindowEnd);
    }
}

