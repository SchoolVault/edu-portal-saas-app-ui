package com.school.erp.modules.payroll.repository;

import com.school.erp.modules.payroll.entity.PayrollPayoutWebhookEvent;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayrollPayoutWebhookEventRepository extends JpaRepository<PayrollPayoutWebhookEvent, Long> {
    Optional<PayrollPayoutWebhookEvent> findByProviderAndPayloadSha256(String provider, String payloadSha256);
    Optional<PayrollPayoutWebhookEvent> findByProviderAndExternalEventId(String provider, String externalEventId);
    long countByCreatedAtBefore(Instant cutoff);
    void deleteByCreatedAtBefore(Instant cutoff);
}
