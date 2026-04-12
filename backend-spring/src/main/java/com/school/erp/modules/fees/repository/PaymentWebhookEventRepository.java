package com.school.erp.modules.fees.repository;

import com.school.erp.modules.fees.entity.PaymentWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, Long> {

    Optional<PaymentWebhookEvent> findByProviderAndPayloadSha256(String provider, String payloadSha256);
}
