package com.school.erp.common.idempotency;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Objects;
import java.util.Set;

/**
 * HTTP idempotency for mutating APIs using {@code Idempotency-Key} and Redis.
 * Scoped per tenant, user, HTTP method, path, query string, and key (body is intentionally
 * excluded so the filter does not buffer requests; clients must not reuse keys for different payloads).
 * Placed after JWT so tenant/user participate in the scope hash.
 */
public class IdempotencyFilter extends OncePerRequestFilter {

    public static final String HEADER_IDEMPOTENCY_KEY = "Idempotency-Key";

    private static final Logger log = LoggerFactory.getLogger(IdempotencyFilter.class);
    private static final String PREFIX = "idem:v1";

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final IdempotencyProperties props;
    private final String keyPrefix;

    private static final Set<String> MUTATING = Set.of(
            HttpMethod.POST.name(),
            HttpMethod.PUT.name(),
            HttpMethod.PATCH.name());

    public IdempotencyFilter(
            StringRedisTemplate redis,
            ObjectMapper objectMapper,
            IdempotencyProperties props,
            String redisKeyNamespace) {
        this.redis = redis;
        this.objectMapper = objectMapper;
        this.props = props;
        this.keyPrefix = (redisKeyNamespace == null || redisKeyNamespace.isBlank() ? "sv" : redisKeyNamespace.trim()) + "::" + PREFIX;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri == null || !uri.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        if (!props.isEnabled() || !MUTATING.contains(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String idemHeader = request.getHeader(HEADER_IDEMPOTENCY_KEY);
        if (!StringUtils.hasText(idemHeader)) {
            filterChain.doFilter(request, response);
            return;
        }

        String idemKey = idemHeader.trim();
        if (idemKey.length() > props.getMaxKeyLength()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Idempotency-Key too long");
            return;
        }

        String ct = request.getContentType();
        if (ct != null && ct.toLowerCase().startsWith("multipart/")) {
            filterChain.doFilter(request, response);
            return;
        }

        long cl = request.getContentLengthLong();
        if (cl > 0 && cl > props.getMaxBodyBytes()) {
            filterChain.doFilter(request, response);
            return;
        }

        String scopeHash;
        try {
            scopeHash = scopeHash(request, idemKey);
        } catch (NoSuchAlgorithmException e) {
            log.warn("idempotency scope hash failed: {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }

        String resKey = keyPrefix + ":res:" + scopeHash;
        String lockKey = keyPrefix + ":lock:" + scopeHash;

        try {
            String cached = redis.opsForValue().get(resKey);
            if (cached != null) {
                CachedPayload payload = objectMapper.readValue(cached, CachedPayload.class);
                writePayload(response, payload);
                return;
            }

            Boolean locked = redis.opsForValue().setIfAbsent(lockKey, "1", Duration.ofSeconds(props.getLockTtlSeconds()));
            if (Boolean.FALSE.equals(locked)) {
                response.sendError(HttpServletResponse.SC_CONFLICT, "Idempotent request in progress");
                return;
            }

            ContentCachingResponseWrapper respWrapper = new ContentCachingResponseWrapper(response);
            try {
                filterChain.doFilter(request, respWrapper);
                byte[] body = respWrapper.getContentAsByteArray();
                int status = respWrapper.getStatus();
                if (status >= 200 && status < 300 && body.length <= props.getMaxBodyBytes()) {
                    CachedPayload toStore = CachedPayload.from(respWrapper, body);
                    redis.opsForValue().set(resKey, objectMapper.writeValueAsString(toStore), Duration.ofSeconds(props.getResponseTtlSeconds()));
                }
            } finally {
                redis.delete(lockKey);
                respWrapper.copyBodyToResponse();
            }
        } catch (org.springframework.data.redis.RedisConnectionFailureException | org.springframework.data.redis.RedisSystemException e) {
            if (props.isFailOpenOnRedisError()) {
                log.warn("idempotency redis unavailable, fail-open: {}", e.getMessage());
                filterChain.doFilter(request, response);
            } else {
                log.error("idempotency redis error", e);
                response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Idempotency store unavailable");
            }
        }
    }

    private static String scopeHash(HttpServletRequest req, String idemKey) throws NoSuchAlgorithmException {
        String tenant = TenantContext.getTenantId() != null ? TenantContext.getTenantId() : "";
        Long uid = TenantContext.getUserId();
        String userPart = uid != null ? uid.toString() : "anon";
        String qs = Objects.toString(req.getQueryString(), "");
        String raw = tenant + "|" + userPart + "|" + req.getMethod() + "|" + req.getRequestURI() + "|" + qs + "|" + idemKey;
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(md.digest(raw.getBytes(StandardCharsets.UTF_8)));
    }

    private static void writePayload(HttpServletResponse response, CachedPayload payload) throws IOException {
        response.setStatus(payload.status);
        if (payload.contentType != null) {
            response.setContentType(payload.contentType);
        }
        byte[] body = java.util.Base64.getDecoder().decode(payload.bodyBase64);
        response.getOutputStream().write(body);
    }

    /** JSON DTO stored in Redis */
    public static class CachedPayload {
        public int status;
        public String contentType;
        public String bodyBase64;

        static CachedPayload from(ContentCachingResponseWrapper w, byte[] body) {
            CachedPayload p = new CachedPayload();
            p.status = w.getStatus();
            p.contentType = w.getContentType();
            p.bodyBase64 = java.util.Base64.getEncoder().encodeToString(body);
            return p;
        }
    }
}
