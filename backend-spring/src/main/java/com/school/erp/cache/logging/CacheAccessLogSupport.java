package com.school.erp.cache.logging;

import com.school.erp.config.AppCacheAccessLogProperties;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Safe cache key representation for logs (hash / truncate / none).
 */
public final class CacheAccessLogSupport {

    private CacheAccessLogSupport() {
    }

    public static String formatKeyRef(Object key, AppCacheAccessLogProperties props) {
        if (key == null) {
            return "";
        }
        if (props.getKeyPrivacy() == AppCacheAccessLogProperties.KeyPrivacy.NONE) {
            return "";
        }
        String s = String.valueOf(key);
        if (props.getKeyPrivacy() == AppCacheAccessLogProperties.KeyPrivacy.TRUNCATE) {
            int max = Math.max(8, props.getTruncateLength());
            return s.length() <= max ? s : s.substring(0, max) + "…";
        }
        return sha256Prefix(s, 12);
    }

    private static String sha256Prefix(String input, int hexChars) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            String hex = HexFormat.of().formatHex(digest);
            return hex.length() <= hexChars ? hex : hex.substring(0, hexChars);
        } catch (NoSuchAlgorithmException e) {
            return "hash-unavailable";
        }
    }
}
