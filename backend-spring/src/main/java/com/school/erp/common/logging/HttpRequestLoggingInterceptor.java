package com.school.erp.common.logging;

import com.school.erp.tenant.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * One INFO line per completed MVC request: method, path, status, latency, tenant and principal context.
 * Runs inside the dispatcher while {@link TenantContext} is still populated.
 */
@Component
public class HttpRequestLoggingInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(HttpRequestLoggingInterceptor.class);
    static final String ATTR_START_NS = HttpRequestLoggingInterceptor.class.getName() + ".startNs";

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) {
        request.setAttribute(ATTR_START_NS, System.nanoTime());
        return true;
    }

    @Override
    public void afterCompletion(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler,
            @Nullable Exception ex) {
        Long startNs = (Long) request.getAttribute(ATTR_START_NS);
        long durationMs = startNs == null ? -1L : (System.nanoTime() - startNs) / 1_000_000L;
        String method = request.getMethod();
        String uri = request.getRequestURI();
        int status = response.getStatus();
        String tenant = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        String role = TenantContext.getUserRole();

        if (ex != null) {
            log.warn("HTTP {} {} -> {} ({} ms) tenant={} userId={} role={} — handler exception: {}",
                    method, uri, status, durationMs, tenant, userId, role, ex.getMessage());
            return;
        }
        if (status >= 500) {
            log.error("HTTP {} {} -> {} ({} ms) tenant={} userId={} role={}",
                    method, uri, status, durationMs, tenant, userId, role);
        } else if (status >= 400) {
            log.warn("HTTP {} {} -> {} ({} ms) tenant={} userId={} role={}",
                    method, uri, status, durationMs, tenant, userId, role);
        } else {
            log.info("HTTP {} {} -> {} ({} ms) tenant={} userId={} role={}",
                    method, uri, status, durationMs, tenant, userId, role);
        }
    }
}
