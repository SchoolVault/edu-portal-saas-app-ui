package com.school.erp.config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final ObjectProvider<RateLimitInterceptor> rateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        rateLimitInterceptor.ifAvailable(r ->
                registry.addInterceptor(r).addPathPatterns("/api/**").excludePathPatterns("/api/v1/auth/**", "/swagger-ui/**", "/api-docs/**", "/actuator/**"));
    }

    public WebConfig(final ObjectProvider<RateLimitInterceptor> rateLimitInterceptor) {
        this.rateLimitInterceptor = rateLimitInterceptor;
    }
}
