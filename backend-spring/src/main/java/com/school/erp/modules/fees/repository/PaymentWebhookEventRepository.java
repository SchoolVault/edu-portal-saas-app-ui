package com.school.erp.modules.fees.repository;

import com.school.erp.modules.fees.entity.PaymentWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, Long> {

    Optional<PaymentWebhookEvent> findByProviderAndPayloadSha256(String provider, String payloadSha256);

    Optional<PaymentWebhookEvent> findByProviderAndExternalEventId(String provider, String externalEventId);

    long countByCreatedAtBefore(Instant cutoff);

    void deleteByCreatedAtBefore(Instant cutoff);
}
