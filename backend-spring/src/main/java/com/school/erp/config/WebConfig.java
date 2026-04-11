package com.school.erp.config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final ObjectProvider<RateLimitInterceptor> rateLimitInterceptor;
    private final ObjectProvider<PathBasedRateLimitInterceptor> pathBasedRateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        pathBasedRateLimitInterceptor.ifAvailable(p -> registry.addInterceptor(p)
                .addPathPatterns("/api/v1/auth/login", "/api/v1/auth/otp/**", "/api/v1/parent/payments/**"));
        rateLimitInterceptor.ifAvailable(r ->
                registry.addInterceptor(r).addPathPatterns("/api/**").excludePathPatterns("/api/v1/auth/**", "/swagger-ui/**", "/api-docs/**", "/actuator/**"));
    }

    public WebConfig(
            final ObjectProvider<RateLimitInterceptor> rateLimitInterceptor,
            final ObjectProvider<PathBasedRateLimitInterceptor> pathBasedRateLimitInterceptor) {
        this.rateLimitInterceptor = rateLimitInterceptor;
        this.pathBasedRateLimitInterceptor = pathBasedRateLimitInterceptor;
    }
}
