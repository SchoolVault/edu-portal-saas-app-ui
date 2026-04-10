package com.school.erp.config;

import com.school.erp.common.logging.HttpRequestLoggingInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebLoggingConfig implements WebMvcConfigurer {

    private final HttpRequestLoggingInterceptor httpRequestLoggingInterceptor;

    public WebLoggingConfig(HttpRequestLoggingInterceptor httpRequestLoggingInterceptor) {
        this.httpRequestLoggingInterceptor = httpRequestLoggingInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(httpRequestLoggingInterceptor)
                .addPathPatterns("/api/**");
    }
}
