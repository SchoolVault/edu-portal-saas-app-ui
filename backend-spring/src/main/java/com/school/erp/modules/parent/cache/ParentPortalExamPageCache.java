package com.school.erp.modules.parent.cache;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.exams.dto.ExamDTOs;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Short-TTL in-process cache for parent portal exam pages (tenant + user scoped).
 * Invalidated on exam mutations for the tenant so admins see fresh data quickly; parents may see up to TTL staleness.
 */
@Component
public class ParentPortalExamPageCache {
    private static final long TTL_MS = Duration.ofMinutes(12).toMillis();

    private record Entry(PageResponse<ExamDTOs.ExamResponse> payload, long expiresAtEpochMs) {
    }

    private final ConcurrentHashMap<String, Entry> store = new ConcurrentHashMap<>();

    private static String key(String tenantId, long userId, int page, int size) {
        return tenantId + "|" + userId + "|" + page + "|" + size;
    }

    public PageResponse<ExamDTOs.ExamResponse> getIfPresent(String tenantId, long userId, int page, int size) {
        Entry e = store.get(key(tenantId, userId, page, size));
        if (e == null) {
            return null;
        }
        if (System.currentTimeMillis() > e.expiresAtEpochMs) {
            store.remove(key(tenantId, userId, page, size), e);
            return null;
        }
        return e.payload;
    }

    public void put(String tenantId, long userId, int page, int size, PageResponse<ExamDTOs.ExamResponse> payload) {
        store.put(key(tenantId, userId, page, size), new Entry(payload, System.currentTimeMillis() + TTL_MS));
    }

    /**
     * Drop all cached pages for a school (any parent user) after exam catalog changes.
     */
    public void invalidateTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return;
        }
        String prefix = tenantId + "|";
        store.keySet().removeIf(k -> k.startsWith(prefix));
    }
}
