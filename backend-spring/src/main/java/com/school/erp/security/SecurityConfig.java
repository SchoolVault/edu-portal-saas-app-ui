package com.school.erp.security;

import com.school.erp.common.idempotency.IdempotencyFilter;
import com.school.erp.config.AppSecurityProperties;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(AppSecurityProperties.class)
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtFilter;
    private final AcademicYearContextFilter academicYearContextFilter;
    private final AppSecurityProperties appSecurityProperties;
    private final ObjectProvider<IdempotencyFilter> idempotencyFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;
    @Value("${app.cors.allowed-methods}")
    private String allowedMethods;
    @Value("${app.cors.allowed-headers}")
    private String allowedHeaders;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    // Public auth surface only — profile, preferences, register (admin), etc. require JWT.
                    auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/phone/**").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/onboard-tenant").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/refresh-token").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/logout").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/email-verification/confirm").permitAll();
                    auth.requestMatchers("/api/v1/fees/webhooks/**").permitAll();
                    auth.requestMatchers("/api/v1/payroll/webhooks/**").permitAll();
                    auth.requestMatchers("/api/v1/notifications/webhooks/**").permitAll();
                    if (appSecurityProperties.isPermitSwaggerAnonymous()) {
                        auth.requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/api-docs/**", "/v3/api-docs/**").permitAll();
                    } else {
                        auth.requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/api-docs/**", "/v3/api-docs/**")
                                .hasAnyRole("ADMIN", "SUPER_ADMIN");
                    }
                    if (appSecurityProperties.isPermitActuatorAnonymous()) {
                        auth.requestMatchers("/actuator/**").permitAll();
                    } else {
                        auth.requestMatchers("/actuator/health", "/actuator/health/**").permitAll();
                        auth.requestMatchers("/actuator/info", "/actuator/info/**").permitAll();
                        auth.requestMatchers("/actuator/**").hasAnyRole("ADMIN", "SUPER_ADMIN");
                    }
                    auth.requestMatchers("/ws", "/ws/**").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/v1/internal/jobs/**").permitAll();
                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    auth.anyRequest().authenticated();
                })
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(academicYearContextFilter, JwtAuthenticationFilter.class);
        idempotencyFilter.ifAvailable(f -> http.addFilterAfter(f, JwtAuthenticationFilter.class));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList());
        config.setAllowedMethods(Arrays.stream(allowedMethods.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList());
        if ("*".equals(allowedHeaders.trim())) {
            config.setAllowedHeaders(List.of("*"));
        } else {
            config.setAllowedHeaders(Arrays.stream(allowedHeaders.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList());
        }
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        config.setExposedHeaders(List.of("X-Request-Id", "X-Correlation-Id"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    public SecurityConfig(
            final JwtAuthenticationFilter jwtFilter,
            final AcademicYearContextFilter academicYearContextFilter,
            final AppSecurityProperties appSecurityProperties,
            ObjectProvider<IdempotencyFilter> idempotencyFilter) {
        this.jwtFilter = jwtFilter;
        this.academicYearContextFilter = academicYearContextFilter;
        this.appSecurityProperties = appSecurityProperties;
        this.idempotencyFilter = idempotencyFilter;
    }
}
