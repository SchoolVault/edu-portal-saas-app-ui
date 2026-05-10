package com.school.erp.common.util;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * India-first portal phones: stored as exactly 10 national digits ({@code 9876543210}).
 * Legacy rows may still hold {@code +91-9876543210} or compact forms; use {@link #portalPhoneLookupKeys}
 * for tenant lookups. SMS gateways still receive {@code +91} E.164 without hyphen.
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
        if (digits.length() == 11 && digits.startsWith("0")) {
            String national = digits.substring(1);
            if (national.length() == 10) {
                return "+91-" + national;
            }
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
        return importPhoneInvalidMessage();
    }

    /**
     * Bulk import / CSV: accept 10-digit India mobiles only (optional +91 / spaces in the sheet).
     * Stored value is {@code national} digits only — no {@code +91-} prefix. Interactive APIs may still use
     * {@link #canonical(String)} for OTP/login payloads; {@link #compatibleLookupKeys} bridges both.
     */
    public static String nationalIndiaMobile10(String raw) {
        if (raw == null) {
            return null;
        }
        String t = normalizeSpreadsheetPhoneToken(raw.trim());
        if (t.isEmpty()) {
            return null;
        }
        String digits = t.replaceAll("\\D", "");
        if (digits.length() == 11 && digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        if (digits.length() == 12 && digits.startsWith("91")) {
            digits = digits.substring(2);
        }
        if (digits.length() == 10 && digits.matches("^[6-9]\\d{9}$")) {
            return digits;
        }
        return null;
    }

    public static String importPhoneInvalidMessage() {
        return "Invalid India mobile for import. Use exactly 10 digits (6–9 as first digit). "
                + "Optional +91 or spaces in the sheet; do not use country code alone without the full number.";
    }

    /**
     * Keys to find rows regardless of whether the DB has 10-digit national or legacy {@code +91-…} values.
     */
    public static List<String> importPhoneLookupKeys(String raw) {
        String national = nationalIndiaMobile10(raw);
        if (national == null) {
            return List.of();
        }
        return compatibleLookupKeys("+91-" + national);
    }

    /**
     * Keys to match user/teacher rows whether the DB value is legacy canonical, compact, or 10-digit national.
     */
    public static List<String> portalPhoneLookupKeys(String storedOrInput) {
        if (storedOrInput == null) {
            return List.of();
        }
        String t = storedOrInput.trim();
        if (t.isEmpty()) {
            return List.of();
        }
        if (t.matches(CANONICAL_PATTERN)) {
            return compatibleLookupKeys(t);
        }
        String national = nationalIndiaMobile10(t);
        if (national != null) {
            return compatibleLookupKeys("+91-" + national);
        }
        String c = canonical(t);
        if (c != null) {
            return compatibleLookupKeys(c);
        }
        return List.of(t);
    }

    /**
     * SMS {@code to} address ({@code +CCNNNN…}, no hyphen). Accepts stored national 10, legacy canonical, or pasted forms.
     */
    public static String toSmsAddressFromStoredOrInput(String rawOrStored) {
        if (rawOrStored == null || rawOrStored.isBlank()) {
            return null;
        }
        String national = nationalIndiaMobile10(rawOrStored.trim());
        if (national != null) {
            return toSmsAddress("+91-" + national);
        }
        String c = canonical(rawOrStored.trim());
        return c == null ? null : toSmsAddress(c);
    }

    private static String normalizeSpreadsheetPhoneToken(String t) {
        if (t.isEmpty()) {
            return t;
        }
        if (t.matches("^\\d+\\.0+$")) {
            return t.replaceAll("\\.0+$", "");
        }
        if (t.contains("E") || t.contains("e")) {
            try {
                String plain = new BigDecimal(t.trim()).toPlainString();
                int dot = plain.indexOf('.');
                if (dot >= 0 && plain.substring(dot + 1).replace("0", "").isEmpty()) {
                    return plain.substring(0, dot);
                }
                return plain;
            } catch (Exception ignored) {
                return t;
            }
        }
        return t;
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
