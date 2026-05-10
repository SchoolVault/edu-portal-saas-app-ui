package com.school.erp.config;

import com.school.erp.tenant.hibernate.ScopedQueryStatementInspector;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HibernateScopeGuardConfiguration {

    @Bean
    public HibernatePropertiesCustomizer scopedQueryStatementInspectorCustomizer() {
        return properties -> properties.put("hibernate.session_factory.statement_inspector", new ScopedQueryStatementInspector());
    }
}
