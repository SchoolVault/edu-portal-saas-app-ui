package com.school.erp.common.util;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Canonical portal phone format: {@code +{country}-{national}} where national is exactly 10 digits
 * (e.g. {@code +91-9876543210}).
 * Used for OTP, password reset, and user lookup so UI + API + DB stay aligned.
 */
public final class InternationalPhone {

    /** Strict canonical form after normalization. */
    public static final String CANONICAL_PATTERN = "^\\+\\d{1,4}-\\d{10}$";

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
            if (cc.isEmpty() || nat.length() != 10) {
                return null;
            }
            return "+" + cc + "-" + nat;
        }
        String compact = t.replaceAll("\\s+", "");
        if (compact.matches("^\\+\\d{1,4}-\\d+$")) {
            int dash = compact.indexOf('-');
            String cc = compact.substring(1, dash).replaceAll("\\D", "");
            String nat = compact.substring(dash + 1).replaceAll("\\D", "");
            if (cc.isEmpty() || nat.length() != 10) {
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
        return "Invalid phone format. Use exactly 10 digits (or +<country>-<10-digit-number>), e.g. +91-9876543210.";
    }

    /**
     * Whether two raw/stored values denote the same portal phone for policy checks (admin vs self-service).
     * Uses canonical form when parseable, otherwise compares India national 10-digit extractions so
     * {@code +91-9876543210} matches {@code 9876543210} and legacy {@code 919876543210} forms.
     */
    public static boolean samePortalPhone(String rawA, String rawB) {
        if (rawA == null && rawB == null) {
            return true;
        }
        if (rawA == null || rawB == null) {
            return false;
        }
        String a = rawA.trim();
        String b = rawB.trim();
        if (a.isEmpty() && b.isEmpty()) {
            return true;
        }
        if (a.isEmpty() || b.isEmpty()) {
            return false;
        }
        String ca = canonical(a);
        String cb = canonical(b);
        if (ca != null && cb != null) {
            return ca.equals(cb);
        }
        String da = a.replaceAll("\\D", "");
        String db = b.replaceAll("\\D", "");
        String na = indianNationalDigits(da);
        String nb = indianNationalDigits(db);
        if (na.length() == 10 && nb.length() == 10) {
            return na.equals(nb);
        }
        if (ca != null) {
            for (String k : compatibleLookupKeys(ca)) {
                if (k != null && (k.replaceAll("\\D", "").equals(db) || k.equals(b))) {
                    return true;
                }
            }
        }
        if (cb != null) {
            for (String k : compatibleLookupKeys(cb)) {
                if (k != null && (k.replaceAll("\\D", "").equals(da) || k.equals(a))) {
                    return true;
                }
            }
        }
        return false;
    }

    private static String indianNationalDigits(String digits) {
        if (digits == null || digits.isEmpty()) {
            return "";
        }
        if (digits.length() == 10) {
            return digits;
        }
        if (digits.length() == 12 && digits.startsWith("91")) {
            return digits.substring(2);
        }
        if (digits.length() == 11 && digits.startsWith("0")) {
            return digits.substring(1);
        }
        if (digits.length() == 13 && digits.startsWith("091")) {
            return digits.substring(3);
        }
        return "";
    }

    public static String normalizeSchoolCode(String schoolCode) {
        if (schoolCode == null) {
            return "";
        }
        return schoolCode.trim().toUpperCase(Locale.ROOT);
    }
}
