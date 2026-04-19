package com.school.erp.modules.guardian.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Derives human-facing contact fields from {@code guardians.phones_json} / {@code emails_json}
 * for listing APIs. Keeps parsing logic in one place for reuse when the JSON shape evolves.
 */
public final class GuardianContactExtractor {

    private GuardianContactExtractor() {
    }

    public static String firstEmail(String emailsJson, ObjectMapper objectMapper) {
        if (emailsJson == null || emailsJson.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(emailsJson);
            if (root.isArray()) {
                for (JsonNode n : root) {
                    if (n.isTextual()) {
                        String t = n.asText();
                        return t.isBlank() ? null : t.trim();
                    }
                    if (n.isObject()) {
                        if (n.hasNonNull("email")) {
                            String t = n.get("email").asText();
                            return t == null || t.isBlank() ? null : t.trim();
                        }
                        if (n.hasNonNull("value")) {
                            String t = n.get("value").asText();
                            return t == null || t.isBlank() ? null : t.trim();
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // leave null; API still returns primary phone from column
        }
        return null;
    }

    /**
     * Phone numbers from JSON that are not the same as {@code primaryPhone} (alternate / work / WhatsApp lines).
     */
    public static List<String> additionalPhones(String phonesJson, String primaryPhone, ObjectMapper objectMapper) {
        Set<String> out = new LinkedHashSet<>();
        String normPrimary = normalizePhone(primaryPhone);
        if (phonesJson == null || phonesJson.isBlank()) {
            return List.of();
        }
        try {
            JsonNode root = objectMapper.readTree(phonesJson);
            if (!root.isArray()) {
                return List.of();
            }
            for (JsonNode n : root) {
                String p = extractPhoneToken(n);
                if (p != null && !p.isBlank() && !normalizePhone(p).equals(normPrimary)) {
                    out.add(p.trim());
                }
            }
        } catch (Exception ignored) {
            return List.of();
        }
        return new ArrayList<>(out);
    }

    private static String extractPhoneToken(JsonNode n) {
        if (n == null || n.isNull()) {
            return null;
        }
        if (n.isTextual()) {
            return n.asText();
        }
        if (n.isObject()) {
            if (n.hasNonNull("phone")) {
                return n.get("phone").asText();
            }
            if (n.hasNonNull("number")) {
                return n.get("number").asText();
            }
            if (n.hasNonNull("value")) {
                return n.get("value").asText();
            }
        }
        return null;
    }

    private static String normalizePhone(String p) {
        return p == null ? "" : p.replaceAll("\\s+", "");
    }
}
