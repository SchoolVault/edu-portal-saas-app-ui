package com.school.erp.security;

import com.school.erp.common.logging.MdcKeys;
import com.school.erp.security.rbac.SlimJwtAuthorityCache;
import com.school.erp.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.MDC;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtUtil jwtUtil;
    private final SlimJwtAuthorityCache slimJwtAuthorityCache;
    private final boolean slimJwtPermissions;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        TenantContext.setClientIp(resolveClientIp(request));
        try {
            String token = extractToken(request);
            // Do not bind TenantContext / SecurityContext from JWT on auth endpoints that must work
            // without tenant scope (e.g. switching schools). Otherwise a stale Bearer token scopes
            // Hibernate's tenant filter to the wrong tenant and login returns 401 for valid users.
            if (!isAnonymousAuthPath(request) && token != null && jwtUtil.validateToken(token)) {
                String email = jwtUtil.getEmail(token);
                String tenantId = jwtUtil.getTenantId(token);
                Long userId = jwtUtil.getUserId(token);
                String role = jwtUtil.getRole(token);
                String displayName = jwtUtil.getName(token);
                // Set tenant context
                TenantContext.setTenantId(tenantId);
                TenantContext.setUserId(userId);
                TenantContext.setUserRole(role);
                TenantContext.setUserDisplayName(displayName);
                TenantContext.setUserPrincipal(email);
                List<SimpleGrantedAuthority> authorities;
                if (slimJwtPermissions) {
                    authorities = new ArrayList<>(
                            slimJwtAuthorityCache.appAuthoritiesFor(tenantId, userId));
                } else {
                    authorities = new ArrayList<>();
                    if (role != null) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                    }
                    for (String p : jwtUtil.getPermissionAuthorities(token)) {
                        authorities.add(new SimpleGrantedAuthority(p));
                    }
                }
                var auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
                MDC.put(MdcKeys.TENANT_ID, tenantId == null ? "" : tenantId);
                MDC.put(MdcKeys.USER_ID, userId == null ? "" : String.valueOf(userId));
                MDC.put(MdcKeys.USER_ROLE, role == null ? "" : role);
                log.debug("JWT accepted tenant={} userId={} role={}", tenantId, userId, role);
            }
        } catch (Exception e) {
            log.error("JWT authentication error: {}", e.getMessage(), e);
        }
        try {
            filterChain.doFilter(request, response);
        } finally {
            MdcKeys.clearTenantUser();
            TenantContext.clear();
        }
    }

    private static boolean isAnonymousAuthPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) {
            return false;
        }
        return uri.contains("/api/v1/auth/login")
                || uri.contains("/api/v1/auth/phone/")
                || uri.contains("/api/v1/auth/onboard-tenant")
                || uri.contains("/api/v1/auth/refresh-token")
                || uri.contains("/api/v1/auth/logout");
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    /** Prefer {@code X-Forwarded-For} first hop when behind a proxy; otherwise {@code X-Real-IP} or remote address. */
    private static String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xff)) {
            int comma = xff.indexOf(',');
            String first = (comma > 0 ? xff.substring(0, comma) : xff).trim();
            if (!first.isEmpty()) {
                return truncateIp(first);
            }
        }
        String real = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(real)) {
            return truncateIp(real.trim());
        }
        String addr = request.getRemoteAddr();
        return addr == null ? "" : truncateIp(addr.trim());
    }

    private static String truncateIp(String ip) {
        if (ip.length() > 45) {
            return ip.substring(0, 45);
        }
        return ip;
    }

    public JwtAuthenticationFilter(
            final JwtUtil jwtUtil,
            final SlimJwtAuthorityCache slimJwtAuthorityCache,
            @Value("${app.jwt.slim-permissions:false}") boolean slimJwtPermissions) {
        this.jwtUtil = jwtUtil;
        this.slimJwtAuthorityCache = slimJwtAuthorityCache;
        this.slimJwtPermissions = slimJwtPermissions;
    }
}
