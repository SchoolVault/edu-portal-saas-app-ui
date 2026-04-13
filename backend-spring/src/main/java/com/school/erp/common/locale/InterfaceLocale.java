package com.school.erp.common.locale;

import java.util.Locale;
import java.util.Set;

/**
 * Allowed UI locale tags. Extend {@link #ALLOWED} when adding translation files.
 */
public final class InterfaceLocale {

    public static final String DEFAULT = "en";
    private static final Set<String> ALLOWED = Set.of("en", "hi");

    private InterfaceLocale() {
    }

    public static boolean isAllowed(String raw) {
        return normalize(raw) != null;
    }

    /**
     * @return lowercase ISO tag (e.g. en, hi) or null if unsupported / blank
     */
    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String t = raw.trim().toLowerCase(Locale.ROOT);
        if (t.length() > 16) {
            return null;
        }
        int dash = t.indexOf('-');
        if (dash > 0) {
            t = t.substring(0, dash);
        }
        return ALLOWED.contains(t) ? t : null;
    }

    public static String orDefault(String raw) {
        String n = normalize(raw);
        return n != null ? n : DEFAULT;
    }
}
