package com.school.erp.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AuthEmailVerificationProperties.class)
public class AuthEmailModuleConfiguration {
}
