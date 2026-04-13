package com.school.erp.platform.port.internal;

import com.school.erp.platform.port.DomainEventPublisher;
import org.springframework.context.ApplicationEventPublisher;

public class SpringDomainEventPublisher implements DomainEventPublisher {

    private final ApplicationEventPublisher delegate;

    public SpringDomainEventPublisher(ApplicationEventPublisher delegate) {
        this.delegate = delegate;
    }

    @Override
    public void publish(Object event) {
        delegate.publishEvent(event);
    }
}
