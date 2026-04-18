package com.school.erp.cache;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RedisTenantCacheEvictorTest {

    @Test
    void suffixBelongsToTenant_exactAndPrefix() {
        assertTrue(RedisTenantCacheEvictor.suffixBelongsToTenant("t1", "t1"));
        assertTrue(RedisTenantCacheEvictor.suffixBelongsToTenant("t1:getSettings", "t1"));
        assertTrue(RedisTenantCacheEvictor.suffixBelongsToTenant("t1:uid:ROLE:getStudents", "t1"));
    }

    @Test
    void suffixBelongsToTenant_doesNotConfuseTenant12WithTenant1() {
        assertFalse(RedisTenantCacheEvictor.suffixBelongsToTenant("t12", "t1"));
        assertFalse(RedisTenantCacheEvictor.suffixBelongsToTenant("t12:foo", "t1"));
    }
}
