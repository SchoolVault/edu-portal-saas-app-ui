package com.school.erp.modules.reminder.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.reminder.dto.ReminderJobRunResultDto;
import com.school.erp.modules.reminder.service.FeeReminderAutomationService;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * HTTP trigger for Render Cron Jobs. Header {@code X-Job-Key} must match {@code app.internal-jobs.key} / {@code APP_INTERNAL_JOB_KEY}.
 */
@RestController
@RequestMapping("/api/v1/internal/jobs/reminders")
@Hidden
public class ReminderInternalJobController {
    private final FeeReminderAutomationService feeReminderAutomationService;

    @Value("${app.internal-jobs.key:}")
    private String expectedJobKey;

    public ReminderInternalJobController(FeeReminderAutomationService feeReminderAutomationService) {
        this.feeReminderAutomationService = feeReminderAutomationService;
    }

    @PostMapping("/run")
    public ResponseEntity<ApiResponse<ReminderJobRunResultDto>> run(
            @RequestHeader(value = "X-Job-Key", required = false) String jobKey) {
        assertJobKey(jobKey);
        int fee = feeReminderAutomationService.runScheduledRemindersForAllTenants();
        return ResponseEntity.ok(ApiResponse.ok(new ReminderJobRunResultDto(fee)));
    }

    private void assertJobKey(String provided) {
        if (expectedJobKey == null || expectedJobKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (provided == null || !expectedJobKey.equals(provided)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
    }
}
