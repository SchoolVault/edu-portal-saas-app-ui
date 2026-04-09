package com.school.erp.config;

import com.school.erp.common.exception.RateLimitExceededException;
import com.school.erp.tenant.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import java.time.Duration;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RateLimitInterceptor.class);
    private final RedisTemplate<String, Object> redisTemplate;
    private static final int MAX_REQUESTS_PER_MINUTE = 120;
    private static final int MAX_REQUESTS_PER_HOUR = 3600;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return true; // Public endpoints
        try {
            // Per-minute rate limit
            String minuteKey = "rate:min:" + tenantId;
            Long minuteCount = redisTemplate.opsForValue().increment(minuteKey);
            if (minuteCount != null && minuteCount == 1) {
                redisTemplate.expire(minuteKey, Duration.ofMinutes(1));
            }
            if (minuteCount != null && minuteCount > MAX_REQUESTS_PER_MINUTE) {
                log.warn("Rate limit exceeded for tenant {} - {} requests/min", tenantId, minuteCount);
                throw new RateLimitExceededException("Rate limit exceeded. Maximum " + MAX_REQUESTS_PER_MINUTE + " requests per minute.");
            }
            // Per-hour rate limit
            String hourKey = "rate:hour:" + tenantId;
            Long hourCount = redisTemplate.opsForValue().increment(hourKey);
            if (hourCount != null && hourCount == 1) {
                redisTemplate.expire(hourKey, Duration.ofHours(1));
            }
            if (hourCount != null && hourCount > MAX_REQUESTS_PER_HOUR) {
                log.warn("Hourly rate limit exceeded for tenant {} - {} requests/hour", tenantId, hourCount);
                throw new RateLimitExceededException("Hourly rate limit exceeded. Maximum " + MAX_REQUESTS_PER_HOUR + " requests per hour.");
            }
            // Set rate limit headers
            response.setHeader("X-RateLimit-Limit", String.valueOf(MAX_REQUESTS_PER_MINUTE));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, MAX_REQUESTS_PER_MINUTE - (minuteCount != null ? minuteCount : 0))));
        } catch (RateLimitExceededException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Redis unavailable for rate limiting, skipping: {}", e.getMessage());
        }
        return true;
    }

    public RateLimitInterceptor(final RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
}
