package com.school.erp.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class JwtUtil {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtUtil.class);
    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(resolveHmacKeyBytes(secret));
        this.expirationMs = expirationMs;
    }

    /**
     * Accepts (1) standard or URL-safe Base64 that decodes to at least 32 bytes (legacy / openssl rand -base64 32),
     * or (2) any non-empty UTF-8 string (e.g. Render “generate password”) — hashed with SHA-256 to 32 bytes for HS256.
     */
    static byte[] resolveHmacKeyBytes(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("app.jwt.secret must not be empty");
        }
        String s = secret.trim();
        try {
            byte[] decoded = Base64.getDecoder().decode(s);
            if (decoded.length >= 32) {
                return decoded;
            }
        } catch (IllegalArgumentException ignored) {
            // not standard Base64 (e.g. contains '-' from UUIDs or plain phrases)
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(s);
            if (decoded.length >= 32) {
                return decoded;
            }
        } catch (IllegalArgumentException ignored) {
            // not URL-safe Base64
        }
        org.slf4j.LoggerFactory.getLogger(JwtUtil.class).debug(
                "JWT secret is not Base64 (or decoded length < 32); using SHA-256(UTF-8 secret) for HMAC key");
        return sha256(s.getBytes(StandardCharsets.UTF_8));
    }

    private static byte[] sha256(byte[] input) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(input);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public String generateToken(Long userId, String tenantId, String subject, String role, String name) {
        return generateToken(userId, tenantId, subject, role, name, "");
    }

    /**
     * @param subject JWT subject: typically normalized email, or {@code phone:…} when email absent.
     */
    public String generateToken(Long userId, String tenantId, String subject, String role, String name, String permissionsCsv) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("userId", userId);
        claims.put("tenantId", tenantId);
        claims.put("role", role);
        claims.put("name", name);
        claims.put("permissions", permissionsCsv != null ? permissionsCsv : "");
        return Jwts.builder().subject(subject).claims(claims).issuedAt(new Date()).expiration(new Date(System.currentTimeMillis() + expirationMs)).signWith(key).compact();
    }

    /** Stable principal string for JWT subject and audit (email preferred; else phone; else user id). */
    public static String principalSubject(String email, String phone, Long userId) {
        if (email != null && !email.isBlank()) {
            return email.trim().toLowerCase(java.util.Locale.ROOT);
        }
        if (phone != null && !phone.isBlank()) {
            return "phone:" + phone.trim();
        }
        if (userId != null) {
            return "user:" + userId;
        }
        return "unknown";
    }

    public Claims parseToken(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    public String getEmail(String token) {
        return parseToken(token).getSubject();
    }

    public String getTenantId(String token) {
        return parseToken(token).get("tenantId", String.class);
    }

    public Long getUserId(String token) {
        return parseToken(token).get("userId", Long.class);
    }

    public String getRole(String token) {
        return parseToken(token).get("role", String.class);
    }

    public String getName(String token) {
        return parseToken(token).get("name", String.class);
    }

    /** Fine-grained authorities (e.g. LIBRARY_CIRCULATION) in addition to ROLE_* . */
    public List<String> getPermissionAuthorities(String token) {
        String raw = parseToken(token).get("permissions", String.class);
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split(",")).map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
    }
}
