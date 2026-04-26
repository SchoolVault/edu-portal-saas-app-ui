package com.school.erp.modules.communication.policy;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Which inbox timeline {@code audiences} tokens a signed-in role may apply. Keeps UI/API tampering from
 * attaching meaningless filters; announcement rows are still scoped in {@code CommunicationService}.
 */
public final class InboxAudienceTokenPolicy {
    private InboxAudienceTokenPolicy() {}

    /** Spring / JWT role string → uppercase without {@code ROLE_} prefix. */
    public static String normalizeRole(final String raw) {
        if (raw == null) {
            return "";
        }
        String r = raw.trim().toUpperCase(Locale.ROOT);
        if (r.startsWith("ROLE_")) {
            r = r.substring(5);
        }
        return r;
    }

    /**
     * Strips tokens the role is not allowed to filter on. Order preserved (de-duplicated).
     */
    public static LinkedHashSet<String> sanitize(final String rawRole, final Set<String> tokens) {
        final String role = normalizeRole(rawRole);
        final Set<String> annAllowed = allowedAnnouncementAudienceTokens(role);
        final LinkedHashSet<String> out = new LinkedHashSet<>();
        if (tokens == null) {
            return out;
        }
        for (String t : tokens) {
            if (t == null) {
                continue;
            }
            final String u = t.trim().toUpperCase(Locale.ROOT);
            if (u.isEmpty()) {
                continue;
            }
            if (annAllowed.contains(u)) {
                out.add(u);
            }
        }
        return out;
    }

    /** Uppercase announcement audience keys this role may use in a filter. */
    public static Set<String> allowedAnnouncementAudienceTokens(final String roleUpper) {
        return switch (roleUpper) {
            case "PARENT", "STUDENT" -> Set.of("ALL", "PARENTS", "CLASS", "SECTION");
            case "TEACHER" -> Set.of("ALL", "TEACHERS", "CLASS", "SECTION");
            case "ADMIN", "SUPER_ADMIN", "LIBRARY_STAFF", "SCHOOL_STAFF" ->
                    Set.of("ALL", "TEACHERS", "PARENTS", "CLASS", "SECTION");
            default -> Set.of("ALL", "CLASS", "SECTION");
        };
    }
}
