package com.school.erp.config;

import com.school.erp.common.exception.RateLimitExceededException;
import com.school.erp.tenant.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;

/**
 * Stricter caps for sensitive paths (login, parent checkout, future OTP/SMS hooks).
 */
@Component
@ConditionalOnBean(RedisTemplate.class)
public class PathBasedRateLimitInterceptor implements HandlerInterceptor {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PathBasedRateLimitInterceptor.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final String keyPrefix;

    private static final int LOGIN_PER_MIN = 20;
    private static final int PAYMENT_PER_MIN = 40;
    private static final int OTP_PER_MIN = 10;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String uri = request.getRequestURI();
        try {
            if (uri != null && uri.contains("/api/v1/auth/login")) {
                bump("login:ip:" + clientIp(request), LOGIN_PER_MIN, "login");
            } else if (uri != null && uri.contains("/api/v1/auth/otp")) {
                bump("otp:ip:" + clientIp(request), OTP_PER_MIN, "OTP");
            } else if (uri != null && uri.contains("/api/v1/parent/payments/")) {
                String tenant = TenantContext.getTenantId();
                Long uid = TenantContext.getUserId();
                if (tenant != null && uid != null) {
                    bump("pay:" + tenant + ":" + uid, PAYMENT_PER_MIN, "parent payment");
                } else {
                    bump("pay:ip:" + clientIp(request), PAYMENT_PER_MIN, "parent payment");
                }
            }
        } catch (RateLimitExceededException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Path rate limit skipped: {}", e.getMessage());
        }
        return true;
    }

    private void bump(String suffix, int maxPerMinute, String label) {
        String key = keyPrefix + "path:" + suffix;
        Long c = redisTemplate.opsForValue().increment(key);
        if (c != null && c == 1) {
            redisTemplate.expire(key, Duration.ofMinutes(1));
        }
        if (c != null && c > maxPerMinute) {
            log.warn("Path rate limit exceeded ({}) key={} count={}", label, key, c);
            throw new RateLimitExceededException("Too many requests for this action. Try again shortly.");
        }
    }

    private static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String rip = request.getRemoteAddr();
        return rip != null ? rip : "unknown";
    }

    public PathBasedRateLimitInterceptor(
            RedisTemplate<String, Object> redisTemplate,
            @Value("${app.redis.key-namespace:sv}") String redisKeyNamespace) {
        this.redisTemplate = redisTemplate;
        String ns = redisKeyNamespace == null || redisKeyNamespace.isBlank() ? "sv" : redisKeyNamespace.trim();
        this.keyPrefix = ns.endsWith(":") ? ns : ns + ":";
    }
}
