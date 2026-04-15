package com.school.erp.common.util;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Canonical portal phone format: {@code +{country}-{national}} (e.g. {@code +91-9876543210}).
 * Used for OTP, password reset, and user lookup so UI + API + DB stay aligned.
 */
public final class InternationalPhone {

    /** Strict canonical form after normalization. */
    public static final String CANONICAL_PATTERN = "^\\+\\d{1,4}-\\d{6,14}$";

    private InternationalPhone() {
    }

    /**
     * Normalizes flexible user input to {@code +CC-NNNN…}. Returns {@code null} if not parseable.
     */
    public static String canonical(String raw) {
        if (raw == null) {
            return null;
        }
        String t = raw.trim();
        if (t.isEmpty()) {
            return null;
        }
        if (t.matches(CANONICAL_PATTERN)) {
            int dash = t.indexOf('-');
            String cc = t.substring(1, dash).replaceAll("\\D", "");
            String nat = t.substring(dash + 1).replaceAll("\\D", "");
            if (cc.isEmpty() || nat.length() < 6 || nat.length() > 14) {
                return null;
            }
            return "+" + cc + "-" + nat;
        }
        String compact = t.replaceAll("\\s+", "");
        if (compact.matches("^\\+\\d{1,4}-\\d+$")) {
            int dash = compact.indexOf('-');
            String cc = compact.substring(1, dash).replaceAll("\\D", "");
            String nat = compact.substring(dash + 1).replaceAll("\\D", "");
            if (cc.isEmpty() || nat.length() < 6 || nat.length() > 14) {
                return null;
            }
            return "+" + cc + "-" + nat;
        }
        String digits = compact.replaceAll("\\D", "");
        if (digits.isEmpty()) {
            return null;
        }
        if (compact.startsWith("+91") && digits.length() >= 12 && digits.startsWith("91")) {
            String national = digits.substring(2);
            if (national.length() == 10) {
                return "+91-" + national;
            }
        }
        if (digits.length() == 10) {
            return "+91-" + digits;
        }
        if (digits.length() == 12 && digits.startsWith("91")) {
            return "+91-" + digits.substring(2);
        }
        if (digits.length() == 11 && digits.startsWith("1")) {
            return "+1-" + digits.substring(1);
        }
        return null;
    }

    /**
     * Keys to match legacy {@code users.phone} rows (with/without hyphen, national-only, etc.).
     */
    public static List<String> compatibleLookupKeys(String canonical) {
        if (canonical == null || !canonical.matches(CANONICAL_PATTERN)) {
            return List.of();
        }
        Set<String> out = new LinkedHashSet<>();
        out.add(canonical);
        out.add(canonical.replace("-", ""));
        int dash = canonical.indexOf('-');
        if (dash > 0 && dash < canonical.length() - 1) {
            String national = canonical.substring(dash + 1).replaceAll("\\D", "");
            if (!national.isEmpty()) {
                out.add(national);
            }
        }
        return new ArrayList<>(out);
    }

    /** SMS / SIP gateways: strip hyphen, keep leading +. */
    public static String toSmsAddress(String canonical) {
        if (canonical == null) {
            return null;
        }
        return canonical.replace("-", "");
    }

    public static String invalidMessage() {
        return "Invalid phone format. Use +<country>-<number>, e.g. +91-9876543210.";
    }

    public static String normalizeSchoolCode(String schoolCode) {
        if (schoolCode == null) {
            return "";
        }
        return schoolCode.trim().toUpperCase(Locale.ROOT);
    }
}
