package com.school.erp.common.jpa;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EntitySnapshotCollectionsTest {

    @Test
    void detachList_nullOrEmpty_returnsEmpty() {
        assertTrue(EntitySnapshotCollections.detachList(null).isEmpty());
        assertTrue(EntitySnapshotCollections.detachList(List.of()).isEmpty());
    }

    @Test
    void detachList_copiesMutatingSourceDoesNotAffectSnapshot() {
        ArrayList<String> src = new ArrayList<>(List.of("a"));
        List<String> snap = EntitySnapshotCollections.detachList(src);
        src.add("b");
        assertEquals(List.of("a"), snap);
    }
}
