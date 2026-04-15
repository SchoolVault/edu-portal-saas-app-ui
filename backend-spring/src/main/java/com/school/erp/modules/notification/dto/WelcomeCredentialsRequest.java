package com.school.erp.modules.notification.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WelcomeCredentialsRequest {
    private String tenantId;
    private Long userId;
    private String recipientPhone;
    private String recipientEmail;
    private String recipientName;
    private String schoolName;
    private String schoolCode;
    private String username;
    private String password;
    private NotificationUserRole role;
    private Boolean forceSms;
    private Boolean forceEmail;
}
