package com.school.erp.common.importer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.exception.BusinessException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

/**
 * Optional user mapping from file header keys (as read by {@link TabularImportStreamReader}, lowercased)
 * to canonical import keys used by validators and row execution.
 */
public final class ImportColumnMappingApplier {

    private ImportColumnMappingApplier() {
    }

    /**
     * Parses JSON object of {@code { "file_header": "canonicalkey", ... }}. Empty or blank JSON yields empty map (identity mapping at apply time).
     */
    public static Map<String, String> parseMappingJson(ObjectMapper objectMapper, String columnMappingJson) {
        if (columnMappingJson == null || columnMappingJson.isBlank()) {
            return Map.of();
        }
        try {
            Map<String, String> raw = objectMapper.readValue(columnMappingJson, new TypeReference<>() {
            });
            Map<String, String> out = new LinkedHashMap<>();
            for (Map.Entry<String, String> e : raw.entrySet()) {
                if (e.getKey() == null || e.getValue() == null) {
                    continue;
                }
                String src = e.getKey().trim().toLowerCase(Locale.ROOT);
                String canon = e.getValue().trim().toLowerCase(Locale.ROOT);
                if (!src.isEmpty() && !canon.isEmpty()) {
                    out.put(src, canon);
                }
            }
            return out;
        } catch (Exception ex) {
            throw new BusinessException("Invalid columnMappingJson: " + ex.getMessage());
        }
    }

    /**
     * Stable fingerprint for idempotency keys when the same file is submitted with different mappings.
     */
    public static String mappingFingerprintSha256(Map<String, String> mapping) {
        if (mapping == null || mapping.isEmpty()) {
            return sha256Hex("");
        }
        TreeMap<String, String> sorted = new TreeMap<>(mapping);
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> e : sorted.entrySet()) {
            sb.append(e.getKey()).append('=').append(e.getValue()).append('\n');
        }
        return sha256Hex(sb.toString());
    }

    private static String sha256Hex(String utf8) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(utf8.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                out.append(String.format("%02x", b));
            }
            return out.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    /**
     * When {@code mapping} is empty, returns {@code row} unchanged. Otherwise builds a new row containing only
     * mapped columns (canonical keys).
     */
    public static Map<String, String> applyMapping(Map<String, String> row, Map<String, String> mapping) {
        if (mapping == null || mapping.isEmpty()) {
            return row;
        }
        Map<String, String> out = new LinkedHashMap<>();
        for (Map.Entry<String, String> e : mapping.entrySet()) {
            String fileKey = e.getKey();
            String canonicalKey = e.getValue();
            if (row.containsKey(fileKey)) {
                out.put(canonicalKey, row.get(fileKey));
            }
        }
        return out;
    }
}
