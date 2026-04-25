package com.school.erp.security.rbac;

import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Caches effective {@link AppPermission} authorities for slim JWTs (avoids a DB hit on every request).
 * Call {@link #evictForTenant} after RBAC mutations; entries expire in-process after ~10 minutes.
 */
@Component
public class SlimJwtAuthorityCache {

    private static final long TTL_MS = 10 * 60_000L;

    private static final class Entry {
        final long expiresAt;
        final List<SimpleGrantedAuthority> authorities;

        Entry(long expiresAt, List<SimpleGrantedAuthority> authorities) {
            this.expiresAt = expiresAt;
            this.authorities = authorities;
        }
    }

    private final ConcurrentHashMap<String, Entry> map = new ConcurrentHashMap<>();
    private final UserRepository userRepository;
    private final EffectivePermissionService effectivePermissionService;

    public SlimJwtAuthorityCache(UserRepository userRepository, EffectivePermissionService effectivePermissionService) {
        this.userRepository = userRepository;
        this.effectivePermissionService = effectivePermissionService;
    }

    public List<SimpleGrantedAuthority> appAuthoritiesFor(String tenantId, Long userId) {
        if (tenantId == null || userId == null) {
            return List.of();
        }
        String key = tenantId + '\u0000' + userId;
        long now = System.currentTimeMillis();
        Entry e = map.get(key);
        if (e != null && e.expiresAt > now) {
            return e.authorities;
        }
        List<SimpleGrantedAuthority> loaded = load(tenantId, userId);
        map.put(key, new Entry(now + TTL_MS, List.copyOf(loaded)));
        return List.copyOf(loaded);
    }

    public void evictForUser(String tenantId, Long userId) {
        if (tenantId == null || userId == null) {
            return;
        }
        map.remove(tenantId + '\u0000' + userId);
    }

    public void evictForTenant(String tenantId) {
        if (tenantId == null) {
            return;
        }
        String prefix = tenantId + '\u0000';
        map.keySet().removeIf(s -> s.startsWith(prefix));
    }

    /** Platform global cache clear (permissions / all regions): drop every in-process authority entry. */
    public void evictAll() {
        map.clear();
    }

    private List<SimpleGrantedAuthority> load(String tenantId, long userId) {
        return userRepository
                .findByIdAndTenantIdAndIsDeletedFalse(userId, tenantId)
                .map(this::toAuthorities)
                .orElse(List.of());
    }

    private List<SimpleGrantedAuthority> toAuthorities(User user) {
        List<SimpleGrantedAuthority> out = new ArrayList<>();
        if (user.getRole() == null) {
            return out;
        }
        out.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        for (AppPermission p : effectivePermissionService.resolveEffectivePermissions(user)) {
            if (p != null) {
                out.add(new SimpleGrantedAuthority(p.name()));
            }
        }
        return out;
    }
}
