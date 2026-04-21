package com.school.erp.modules.importexport.config;

import com.school.erp.config.ImportRuntimeProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(ImportRuntimeProperties.class)
public class ImportModuleConfiguration {
}
