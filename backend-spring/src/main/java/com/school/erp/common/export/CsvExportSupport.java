package com.school.erp.common.export;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Shared CSV helpers for downloads across modules (reports, bulk export, platform audit).
 * Keeps UTF-8 BOM, RFC4180-style quoting, and optional human-readable preamble rows consistent.
 */
public final class CsvExportSupport {

    private static final DateTimeFormatter ISO_INSTANT = DateTimeFormatter.ISO_INSTANT.withZone(ZoneId.systemDefault());

    private CsvExportSupport() {}

    /** Strip UTF-8 BOM when present on the first line of a CSV (safe for re-import of exported files). */
    public static String stripLeadingBom(String line) {
        if (line == null || line.isEmpty()) {
            return line;
        }
        return line.charAt(0) == '\uFEFF' ? line.substring(1) : line;
    }

    public static String escapeField(String raw) {
        if (raw == null) {
            return "";
        }
        String s = raw.replace("\"", "\"\"");
        if (s.contains(",") || s.contains("\n") || s.contains("\r") || s.contains("\"")) {
            return "\"" + s + "\"";
        }
        return s;
    }

    /** UTF-8 BOM + body (Excel-friendly). */
    public static byte[] utf8BomBytes(String utf8Text) {
        byte[] raw = utf8Text.getBytes(StandardCharsets.UTF_8);
        byte[] out = new byte[raw.length + 3];
        out[0] = (byte) 0xEF;
        out[1] = (byte) 0xBB;
        out[2] = (byte) 0xBF;
        System.arraycopy(raw, 0, out, 3, raw.length);
        return out;
    }

    /**
     * Single-column preamble rows (then a blank line) before the machine header row.
     * Import templates must not call this — only human-readable / report exports.
     */
    public static void appendDocumentPreamble(StringBuilder sb, SchoolExportBranding branding, String documentTitle, Instant generatedAt) {
        appendSingleColumnRow(sb, "SchoolVault ERP — " + (documentTitle != null && !documentTitle.isBlank() ? documentTitle : "Export"));
        String schoolLine = branding.displaySchoolLine();
        if (!schoolLine.isBlank()) {
            appendSingleColumnRow(sb, schoolLine);
        }
        appendSingleColumnRow(sb, "Generated (server time): " + ISO_INSTANT.format(generatedAt != null ? generatedAt : Instant.now()));
        sb.append('\n');
    }

    public static void appendSingleColumnRow(StringBuilder sb, String text) {
        sb.append(escapeField(text)).append('\n');
    }
}
