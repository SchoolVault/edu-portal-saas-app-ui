package com.school.erp.modules.settings.policy;

import java.util.Collections;
import java.util.Set;

/**
 * Optional product modules controlled at platform level (super-admin rollout per school).
 * School admins may view flags but must not mutate these keys via {@code PUT /settings/features}.
 */
public final class TenantModuleFeaturePolicy {
    public static final String CHAT = "chat";
    public static final String TRANSPORT = "transport";
    public static final String HOSTEL = "hostel";
    public static final String LIBRARY = "library";
    public static final String AUDIT = "audit";
    public static final String OPERATIONS_HUB = "operationsHub";
    public static final String IMPORT_EXPORT = "importExport";
    public static final String DIRECTORY = "directory";
    public static final String DOCUMENTS = "documents";
    public static final String EXAMS = "exams";
    public static final String LEAVE = "leave";

    private static final Set<String> PLATFORM_MANAGED = Set.of(
            CHAT, TRANSPORT, HOSTEL, LIBRARY, AUDIT, OPERATIONS_HUB, IMPORT_EXPORT, DIRECTORY, DOCUMENTS, EXAMS, LEAVE
    );

    private TenantModuleFeaturePolicy() {
    }

    public static Set<String> platformManagedKeys() {
        return Collections.unmodifiableSet(PLATFORM_MANAGED);
    }

    public static boolean isPlatformManaged(String key) {
        return key != null && PLATFORM_MANAGED.contains(key);
    }
}
