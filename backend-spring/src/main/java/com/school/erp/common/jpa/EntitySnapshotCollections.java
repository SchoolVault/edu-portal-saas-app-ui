package com.school.erp.common.jpa;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Copies values out of Hibernate-managed collections into plain {@link List} instances.
 * <p>
 * API DTOs, {@code Map} payloads (e.g. report rows), and Spring Cache values must not retain
 * references to {@code PersistentBag} or other Hibernate collection wrappers: Redis serialization
 * often runs after the persistence context is closed, which triggers
 * "failed to lazily initialize a collection - no Session" when Jackson walks the graph.
 * Call these helpers from transactional mapping code while the session is still open.
 */
public final class EntitySnapshotCollections {

    private EntitySnapshotCollections() {
    }

    /**
     * @param fromEntity nullable; may be a Hibernate wrapper — iteration materializes lazies inside the txn
     */
    public static <T> List<T> detachList(List<T> fromEntity) {
        if (fromEntity == null || fromEntity.isEmpty()) {
            return List.of();
        }
        return Collections.unmodifiableList(new ArrayList<>(fromEntity));
    }
}
