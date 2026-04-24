package com.school.erp.modules.audit.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.export.CsvExportSupport;
import com.school.erp.common.export.SchoolExportBranding;
import com.school.erp.modules.audit.entity.AuditLog;
import com.school.erp.modules.audit.repository.AuditLogRepository;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.tenant.TenantContext;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class AuditExportService {

    private static final int MAX_EXPORT_ROWS = 10_000;
    private static final int EXPORT_PAGE_SIZE = 500;
    private static final DateTimeFormatter FILE_DATE = DateTimeFormatter.BASIC_ISO_DATE.withZone(ZoneId.systemDefault());
    private static final DateTimeFormatter DISPLAY_TS =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

    private final AuditLogRepository auditLogRepository;
    private final TenantConfigRepository tenantConfigRepository;

    public AuditExportService(AuditLogRepository auditLogRepository, TenantConfigRepository tenantConfigRepository) {
        this.auditLogRepository = auditLogRepository;
        this.tenantConfigRepository = tenantConfigRepository;
    }

    public record RenderedExport(byte[] body, String contentType, String fileName) {}

    public RenderedExport export(
            Enums.AuditAction action,
            String module,
            String q,
            LocalDate from,
            LocalDate to,
            String formatRaw) {
        String format = formatRaw == null ? "" : formatRaw.trim().toUpperCase(Locale.ROOT);
        if (!"CSV".equals(format) && !"PDF".equals(format)) {
            throw new BusinessException("Unsupported export format (use CSV or PDF).");
        }
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new BusinessException("Tenant context is required for audit export.");
        }
        String qq = q == null || q.isBlank() ? "" : q.trim();
        String mod = module == null || module.isBlank() ? null : module.trim();
        LocalDateTime fromDt = from == null ? null : from.atStartOfDay();
        LocalDateTime toExclusive = to == null ? null : to.plusDays(1).atStartOfDay();

        List<AuditLog> rows = loadRows(tenantId, action, mod == null ? "" : mod, qq, fromDt, toExclusive);
        SchoolExportBranding branding = resolveBranding(tenantId);
        Instant generatedAt = Instant.now();
        String period = (from != null ? from.toString() : "…") + " — " + (to != null ? to.toString() : "…");
        String title = "Audit trail (" + period + ")";

        if ("CSV".equals(format)) {
            return new RenderedExport(buildCsv(rows, branding, title, generatedAt, rows.size() >= MAX_EXPORT_ROWS),
                    "text/csv;charset=UTF-8",
                    fileName("audit-trail", "csv", from, to, generatedAt));
        }
        return new RenderedExport(buildPdf(rows, branding, title, generatedAt, rows.size() >= MAX_EXPORT_ROWS),
                "application/pdf",
                fileName("audit-trail", "pdf", from, to, generatedAt));
    }

    private List<AuditLog> loadRows(
            String tenantId,
            Enums.AuditAction action,
            String module,
            String q,
            LocalDateTime from,
            LocalDateTime toExclusive) {
        List<AuditLog> out = new ArrayList<>();
        int page = 0;
        while (out.size() < MAX_EXPORT_ROWS) {
            Page<AuditLog> p = auditLogRepository.searchPage(
                    tenantId,
                    action,
                    module,
                    q,
                    from,
                    toExclusive,
                    PageRequest.of(page, EXPORT_PAGE_SIZE, Sort.by(Sort.Direction.DESC, "createdAt")));
            for (AuditLog row : p.getContent()) {
                out.add(row);
                if (out.size() >= MAX_EXPORT_ROWS) {
                    break;
                }
            }
            if (!p.hasNext()) {
                break;
            }
            page++;
        }
        return out;
    }

    private SchoolExportBranding resolveBranding(String tenantId) {
        return tenantConfigRepository
                .findByTenantId(tenantId.trim())
                .map(c -> new SchoolExportBranding(
                        c.getSchoolName() != null ? c.getSchoolName() : "",
                        c.getSchoolCode() != null ? c.getSchoolCode() : ""))
                .orElse(SchoolExportBranding.empty());
    }

    private byte[] buildCsv(List<AuditLog> rows, SchoolExportBranding branding, String title, Instant generatedAt, boolean truncated) {
        StringBuilder sb = new StringBuilder();
        CsvExportSupport.appendDocumentPreamble(sb, branding, title, generatedAt);
        if (truncated) {
            CsvExportSupport.appendSingleColumnRow(sb, "Note: export limited to the first " + MAX_EXPORT_ROWS + " rows for this filter set.");
        }
        List<String> headerNames = List.of("action", "module", "description", "user_name", "user_id", "timestamp", "ip_address");
        sb.append(headerNames.stream().map(CsvExportSupport::escapeField).collect(Collectors.joining(","))).append('\n');
        if (rows.isEmpty()) {
            CsvExportSupport.appendSingleColumnRow(sb, "No audit rows matched the selected period and filters.");
        } else {
            for (AuditLog a : rows) {
                sb.append(CsvExportSupport.escapeField(a.getAction() != null ? a.getAction().name() : ""))
                        .append(',')
                        .append(CsvExportSupport.escapeField(a.getModule()))
                        .append(',')
                        .append(CsvExportSupport.escapeField(a.getDescription()))
                        .append(',')
                        .append(CsvExportSupport.escapeField(a.getUserName()))
                        .append(',')
                        .append(CsvExportSupport.escapeField(a.getUserId() != null ? String.valueOf(a.getUserId()) : ""))
                        .append(',')
                        .append(CsvExportSupport.escapeField(formatTs(a.getCreatedAt())))
                        .append(',')
                        .append(CsvExportSupport.escapeField(a.getIpAddress()))
                        .append('\n');
            }
        }
        return CsvExportSupport.utf8BomBytes(sb.toString());
    }

    private byte[] buildPdf(List<AuditLog> rows, SchoolExportBranding branding, String title, Instant generatedAt, boolean truncated) {
        try {
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 7);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 7);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
            PdfWriter.getInstance(doc, out);
            doc.open();

            doc.add(new Paragraph("SchoolVault ERP — " + title, titleFont));
            String schoolLine = branding.displaySchoolLine();
            if (!schoolLine.isBlank()) {
                doc.add(new Paragraph(schoolLine, bodyFont));
            }
            doc.add(new Paragraph("Generated: " + DISPLAY_TS.format(generatedAt), smallFont));
            if (truncated) {
                doc.add(new Paragraph(
                        "Note: only the first " + MAX_EXPORT_ROWS + " rows are included for this filter set.", smallFont));
            }
            doc.add(new Paragraph(" "));

            if (rows.isEmpty()) {
                doc.add(new Paragraph("No audit rows matched the selected period and filters.", bodyFont));
            } else {
                PdfPTable table = new PdfPTable(7);
                table.setWidthPercentage(100);
                table.setWidths(new float[] {0.9f, 1.1f, 3.4f, 1.2f, 0.6f, 1.2f, 1.0f});
                for (String h : List.of("Action", "Module", "Description", "User", "User ID", "Timestamp", "IP")) {
                    table.addCell(headerCell(h, headFont));
                }
                for (AuditLog a : rows) {
                    table.addCell(bodyCell(a.getAction() != null ? a.getAction().name() : "", bodyFont));
                    table.addCell(bodyCell(a.getModule(), bodyFont));
                    table.addCell(bodyCell(a.getDescription(), bodyFont));
                    table.addCell(bodyCell(a.getUserName(), bodyFont));
                    table.addCell(bodyCell(a.getUserId() != null ? String.valueOf(a.getUserId()) : "", bodyFont));
                    table.addCell(bodyCell(formatTs(a.getCreatedAt()), bodyFont));
                    table.addCell(bodyCell(a.getIpAddress() != null ? a.getIpAddress() : "", bodyFont));
                }
                doc.add(table);
            }

            doc.add(new Paragraph(" "));
            doc.add(new Paragraph(
                    "Operational audit extract for the signed-in school workspace. Retention and admissibility follow your organisation policy.",
                    smallFont));
            doc.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new BusinessException("Could not render audit export.");
        }
    }

    private static String formatTs(LocalDateTime createdAt) {
        if (createdAt == null) {
            return "";
        }
        return createdAt.toString();
    }

    private static PdfPCell headerCell(String text, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text != null ? text : "", font));
        c.setBackgroundColor(new Color(241, 245, 249));
        c.setPadding(4f);
        return c;
    }

    private static PdfPCell bodyCell(String text, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text != null ? text : "", font));
        c.setPadding(3f);
        return c;
    }

    private static String fileName(String base, String ext, LocalDate from, LocalDate to, Instant generatedAt) {
        String f = from != null ? from.toString() : "open";
        String t = to != null ? to.toString() : "open";
        String stamp = FILE_DATE.format(generatedAt);
        return base + "-" + f + "_to_" + t + "-" + stamp + "." + ext;
    }
}
