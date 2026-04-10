package com.school.erp.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declares exchanges/queues and {@link RabbitTemplate}. Skipped when AMQP autoconfig is off (e.g. {@code dev} profile).
 */
@Configuration
@ConditionalOnBean(ConnectionFactory.class)
public class RabbitMQConfig {

    public static final String EXCHANGE = "school-erp-exchange";
    public static final String NOTIFICATION_QUEUE = "notification-queue";
    public static final String AUDIT_QUEUE = "audit-queue";
    public static final String EMAIL_QUEUE = "email-queue";

    @Bean
    public TopicExchange exchange() { return new TopicExchange(EXCHANGE); }

    @Bean
    public Queue notificationQueue() { return QueueBuilder.durable(NOTIFICATION_QUEUE).build(); }

    @Bean
    public Queue auditQueue() { return QueueBuilder.durable(AUDIT_QUEUE).build(); }

    @Bean
    public Queue emailQueue() { return QueueBuilder.durable(EMAIL_QUEUE).build(); }

    @Bean
    public Binding notificationBinding() { return BindingBuilder.bind(notificationQueue()).to(exchange()).with("event.notification.*"); }

    @Bean
    public Binding auditBinding() { return BindingBuilder.bind(auditQueue()).to(exchange()).with("event.audit.*"); }

    @Bean
    public Binding emailBinding() { return BindingBuilder.bind(emailQueue()).to(exchange()).with("event.email.*"); }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() { return new Jackson2JsonMessageConverter(); }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory factory) {
        RabbitTemplate template = new RabbitTemplate(factory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
