package com.school.erp.common.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Earliest filter: assigns a correlation id for Render/log aggregation and sets {@link MDC} trace key.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationMdcFilter extends OncePerRequestFilter {

    public static final String HEADER_REQUEST_ID = "X-Request-Id";
    public static final String HEADER_CORRELATION_ID = "X-Correlation-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String traceId = firstNonBlank(
                request.getHeader(HEADER_REQUEST_ID),
                request.getHeader(HEADER_CORRELATION_ID));
        if (!StringUtils.hasText(traceId)) {
            traceId = UUID.randomUUID().toString();
        }
        MDC.put(MdcKeys.TRACE_ID, traceId);
        MDC.put(MdcKeys.CORRELATION_ID, traceId);
        response.setHeader(HEADER_REQUEST_ID, traceId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MdcKeys.clearCorrelationAndTrace();
        }
    }

    private static String firstNonBlank(String a, String b) {
        if (StringUtils.hasText(a)) {
            return a.trim();
        }
        if (StringUtils.hasText(b)) {
            return b.trim();
        }
        return null;
    }
}
