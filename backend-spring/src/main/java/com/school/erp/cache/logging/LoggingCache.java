package com.school.erp.cache.logging;

import com.school.erp.config.AppCacheAccessLogProperties;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;

import java.util.concurrent.Callable;

/**
 * Decorates a Spring {@link Cache} to log whether a read came from Redis ({@code source=redis})
 * or from the loader ({@code source=loader}, i.e. DB / computation). Controlled by
 * {@link AppCacheAccessLogProperties}.
 */
public class LoggingCache implements Cache {

    private static final Logger LOG = LoggerFactory.getLogger("com.school.erp.cache.access");

    private final String region;
    private final Cache delegate;
    private final AppCacheAccessLogProperties props;

    public LoggingCache(String region, Cache delegate, AppCacheAccessLogProperties props) {
        this.region = region;
        this.delegate = delegate;
        this.props = props;
    }

    @Override
    public String getName() {
        return delegate.getName();
    }

    @Override
    public Object getNativeCache() {
        return delegate.getNativeCache();
    }

    @Override
    public ValueWrapper get(Object key) {
        ValueWrapper w = delegate.get(key);
        if (w != null && props.isEnabled() && props.isLogHits() && LOG.isDebugEnabled()) {
            LOG.debug("CACHE source=redis region={} keyRef={} tenant={}",
                    region, CacheAccessLogSupport.formatKeyRef(key, props), safeTenant());
        }
        return w;
    }

    @Override
    public <T> T get(Object key, Class<T> type) {
        T value = delegate.get(key, type);
        if (value != null && props.isEnabled() && props.isLogHits() && LOG.isDebugEnabled()) {
            LOG.debug("CACHE source=redis region={} keyRef={} tenant={}",
                    region, CacheAccessLogSupport.formatKeyRef(key, props), safeTenant());
        }
        return value;
    }

    @Override
    public <T> T get(Object key, Callable<T> valueLoader) {
        if (!props.isEnabled()) {
            return delegate.get(key, valueLoader);
        }
        ValueWrapper hit = delegate.get(key);
        if (hit != null) {
            if (props.isLogHits() && LOG.isDebugEnabled()) {
                LOG.debug("CACHE source=redis region={} keyRef={} tenant={}",
                        region, CacheAccessLogSupport.formatKeyRef(key, props), safeTenant());
            }
            @SuppressWarnings("unchecked")
            T cast = (T) hit.get();
            return cast;
        }
        if (props.isLogMissLoads() && LOG.isInfoEnabled()) {
            LOG.info("CACHE source=loader region={} keyRef={} tenant={}",
                    region, CacheAccessLogSupport.formatKeyRef(key, props), safeTenant());
        }
        try {
            return delegate.get(key, valueLoader);
        } catch (RuntimeException | Error e) {
            throw e;
        } catch (Exception e) {
            throw new ValueRetrievalException(key, valueLoader, e);
        }
    }

    @Override
    public void put(Object key, Object value) {
        delegate.put(key, value);
    }

    @Override
    public ValueWrapper putIfAbsent(Object key, Object value) {
        return delegate.putIfAbsent(key, value);
    }

    @Override
    public void evict(Object key) {
        delegate.evict(key);
    }

    @Override
    public boolean evictIfPresent(Object key) {
        return delegate.evictIfPresent(key);
    }

    @Override
    public void clear() {
        delegate.clear();
    }

    @Override
    public boolean invalidate() {
        return delegate.invalidate();
    }

    private static String safeTenant() {
        String t = TenantContext.getTenantId();
        return t == null || t.isBlank() ? "" : t;
    }
}
