package com.school.erp.common.importer;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ImportColumnMappingApplierTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void parseMappingJson_emptyString_yieldsEmptyMap() {
        assertThat(ImportColumnMappingApplier.parseMappingJson(objectMapper, "")).isEmpty();
        assertThat(ImportColumnMappingApplier.parseMappingJson(objectMapper, null)).isEmpty();
    }

    @Test
    void applyMapping_rewritesKeys() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("first_name", "A");
        row.put("last_name", "B");
        Map<String, String> mapping = Map.of(
                "first_name", "firstname",
                "last_name", "lastname");
        Map<String, String> out = ImportColumnMappingApplier.applyMapping(row, mapping);
        assertThat(out).containsEntry("firstname", "A").containsEntry("lastname", "B");
    }

    @Test
    void mappingFingerprint_emptyMap_matchesSha256EmptyString() {
        String fp = ImportColumnMappingApplier.mappingFingerprintSha256(Map.of());
        assertThat(fp).isEqualTo(sha256Hex(""));
    }

    private static String sha256Hex(String s) {
        try {
            java.security.MessageDigest d = java.security.MessageDigest.getInstance("SHA-256");
            byte[] h = d.digest(s.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(h.length * 2);
            for (byte b : h) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
