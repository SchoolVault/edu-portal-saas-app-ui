package com.school.erp.modules.transport.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(TransportOpsProperties.class)
public class TransportModuleConfiguration {
}
