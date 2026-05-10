package com.school.erp.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Binds email integration (SendGrid, Brevo, HTTP trigger, {@code dispatch.provider} routing). */
@Configuration
@EnableConfigurationProperties({
        IntegrationSendGridProperties.class,
        IntegrationBrevoProperties.class,
        IntegrationSesProperties.class,
        IntegrationEmailDispatchProperties.class
})
public class IntegrationEmailConfiguration {
}
