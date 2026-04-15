package com.school.erp.common.util;

/**
 * Canonical trimming for phone fields stored on {@code users} / {@code guardians}.
 */
public final class PhoneNormalization {

    private PhoneNormalization() {
    }

    /** {@code null} or blank after trim → {@code null}; otherwise trimmed value. */
    public static String trimToNull(String phone) {
        if (phone == null) {
            return null;
        }
        String t = phone.trim();
        return t.isEmpty() ? null : t;
    }

    /**
     * Guardian {@code primary_phone} must be non-null in DB; when the portal user has no phone yet,
     * use a stable placeholder (matches V14 backfill style).
     */
    public static String guardianPrimaryOrPlaceholder(String phone, long userId) {
        String t = trimToNull(phone);
        return t != null ? t : "UNLINKED_" + userId;
    }
}
