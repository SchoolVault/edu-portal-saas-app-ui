package com.school.erp.modules.identity.job;

import com.school.erp.modules.identity.repository.OtpVerificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Periodically soft-deletes OTP rows that are no longer usable: expired {@code PENDING},
 * or terminal outcomes ({@code VERIFIED}, {@code FAILED}, {@code EXPIRED}) past a retention window.
 * Still-valid {@code PENDING} rows ({@code expiresAt} in the future) are never removed.
 */
@Component
@ConditionalOnProperty(name = "app.otp.cleanup.enabled", havingValue = "true", matchIfMissing = true)
public class OtpRetentionCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(OtpRetentionCleanupJob.class);

    private final OtpVerificationRepository otpVerificationRepository;

    @Value("${app.otp.cleanup.terminal-retention-hours:24}")
    private int terminalRetentionHours;

    public OtpRetentionCleanupJob(OtpVerificationRepository otpVerificationRepository) {
        this.otpVerificationRepository = otpVerificationRepository;
    }

    @Scheduled(cron = "${app.otp.cleanup.cron:0 10 */6 * * *}")
    @Transactional
    public void purgeStaleOtps() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime terminalCutoff = now.minusHours(Math.max(1, terminalRetentionHours));
        int n = otpVerificationRepository.softDeleteNonActionable(now, terminalCutoff);
        if (n > 0) {
            log.info("OTP retention cleanup soft-deleted rows={} terminalRetentionHours={}", n, terminalRetentionHours);
        } else {
            log.debug("OTP retention cleanup: nothing to purge");
        }
    }
}
