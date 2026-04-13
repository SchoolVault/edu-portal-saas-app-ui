package com.school.erp.platform.port;

/**
 * Outbound port for domain notifications. Default wires to Spring
 * {@link org.springframework.context.ApplicationEventPublisher}; replace with Kafka / Rabbit
 * outbox when you outgrow in-process events.
 */
public interface DomainEventPublisher {

    void publish(Object event);
}
