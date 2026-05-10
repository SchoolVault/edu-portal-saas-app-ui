package com.school.erp.cache.logging;

import com.school.erp.config.AppCacheAccessLogProperties;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.Collection;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Wraps a {@link CacheManager} so every {@link Cache} is a {@link LoggingCache} (when enabled in props).
 */
public class LoggingCacheManager implements CacheManager {

    private final CacheManager delegate;
    private final AppCacheAccessLogProperties props;
    private final ConcurrentHashMap<String, Cache> wrappers = new ConcurrentHashMap<>();

    public LoggingCacheManager(CacheManager delegate, AppCacheAccessLogProperties props) {
        this.delegate = delegate;
        this.props = props;
    }

    @Override
    public Cache getCache(String name) {
        Cache raw = delegate.getCache(name);
        if (raw == null) {
            return null;
        }
        if (!props.isEnabled()) {
            return raw;
        }
        return wrappers.computeIfAbsent(name, n -> new LoggingCache(n, raw, props));
    }

    @Override
    public Collection<String> getCacheNames() {
        return delegate.getCacheNames();
    }
}
