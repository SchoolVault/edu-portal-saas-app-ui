package com.school.erp.modules.reports.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.export.CsvExportSupport;
import com.school.erp.common.export.SchoolExportBranding;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ReportExportService {

    private static final DateTimeFormatter FILE_DATE = DateTimeFormatter.BASIC_ISO_DATE.withZone(ZoneId.systemDefault());
    private static final DateTimeFormatter DISPLAY_INSTANT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm z").withZone(ZoneId.systemDefault());

    private final TenantConfigRepository tenantConfigRepository;

    public ReportExportService(TenantConfigRepository tenantConfigRepository) {
        this.tenantConfigRepository = tenantConfigRepository;
    }

    public RenderedReport render(String reportType, String format, List<Map<String, Object>> rows, String tenantId) {
        SchoolExportBranding branding = resolveBranding(tenantId);
        Instant generatedAt = Instant.now();
        if ("CSV".equalsIgnoreCase(format)) {
            return new RenderedReport(
                    buildCsv(reportType, rows, branding, generatedAt),
                    "text/csv",
                    safeFileName(reportType, "csv", generatedAt));
        }
        if ("PDF".equalsIgnoreCase(format)) {
            return new RenderedReport(
                    buildPdf(reportType, rows, branding, generatedAt),
                    "application/pdf",
                    safeFileName(reportType, "pdf", generatedAt));
        }
        throw new BusinessException("Unsupported report export format: " + format);
    }

    private SchoolExportBranding resolveBranding(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return SchoolExportBranding.empty();
        }
        return tenantConfigRepository
                .findByTenantId(tenantId.trim())
                .map(c -> new SchoolExportBranding(
                        c.getSchoolName() != null ? c.getSchoolName() : "",
                        c.getSchoolCode() != null ? c.getSchoolCode() : ""))
                .orElse(SchoolExportBranding.empty());
    }

    private byte[] buildCsv(String reportType, List<Map<String, Object>> rows, SchoolExportBranding branding, Instant generatedAt) {
        StringBuilder sb = new StringBuilder();
        CsvExportSupport.appendDocumentPreamble(sb, branding, humanReportTitle(reportType), generatedAt);
        if (rows == null || rows.isEmpty()) {
            CsvExportSupport.appendSingleColumnRow(sb, "No data rows for the selected filters.");
            return CsvExportSupport.utf8BomBytes(sb.toString());
        }
        List<String> headers = stableHeaders(rows.get(0));
        sb.append(String.join(",", headers.stream().map(CsvExportSupport::escapeField).toList())).append('\n');
        for (Map<String, Object> row : rows) {
            List<String> cells = new ArrayList<>();
            for (String h : headers) {
                cells.add(CsvExportSupport.escapeField(String.valueOf(row.getOrDefault(h, ""))));
            }
            sb.append(String.join(",", cells)).append('\n');
        }
        return CsvExportSupport.utf8BomBytes(sb.toString());
    }

    private static List<String> stableHeaders(Map<String, Object> firstRow) {
        List<String> headers = new ArrayList<>(firstRow.keySet());
        Collections.sort(headers, String.CASE_INSENSITIVE_ORDER);
        return headers;
    }

    private byte[] buildPdf(String reportType, List<Map<String, Object>> rows, SchoolExportBranding branding, Instant generatedAt) {
        try {
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(doc, out);
            doc.open();

            doc.add(new Paragraph("SchoolVault ERP — " + humanReportTitle(reportType), titleFont));
            String schoolLine = branding.displaySchoolLine();
            if (!schoolLine.isBlank()) {
                doc.add(new Paragraph(schoolLine, bodyFont));
            }
            doc.add(new Paragraph("Generated: " + DISPLAY_INSTANT.format(generatedAt), smallFont));
            doc.add(new Paragraph(" "));

            if (rows == null || rows.isEmpty()) {
                doc.add(new Paragraph("No data rows for the selected filters.", bodyFont));
            } else {
                List<String> headers = stableHeaders(rows.get(0));
                PdfPTable table = new PdfPTable(headers.size());
                table.setWidthPercentage(100);
                table.setSpacingBefore(4f);
                for (String h : headers) {
                    table.addCell(headerCell(h, headFont));
                }
                for (Map<String, Object> row : rows) {
                    for (String h : headers) {
                        table.addCell(bodyCell(String.valueOf(row.getOrDefault(h, "")), bodyFont));
                    }
                }
                doc.add(table);
            }

            doc.add(new Paragraph(" "));
            doc.add(new Paragraph(
                    "This document was generated from operational data for the signed-in school workspace. "
                            + "Figures are point-in-time and may differ from audited financial statements.",
                    smallFont));

            doc.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new BusinessException("Could not render PDF report.");
        }
    }

    private static PdfPCell headerCell(String text, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text != null ? text : "", font));
        c.setBackgroundColor(new Color(241, 245, 249));
        c.setPadding(5f);
        return c;
    }

    private static PdfPCell bodyCell(String text, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text != null ? text : "", font));
        c.setPadding(4f);
        return c;
    }

    private static String humanReportTitle(String reportType) {
        if (reportType == null || reportType.isBlank()) {
            return "Report";
        }
        return reportType.trim().replace('_', ' ');
    }

    private static String safeFileName(String reportType, String ext, Instant generatedAt) {
        String core = reportType == null ? "report" : reportType.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        if (core.isBlank()) {
            core = "report";
        }
        return core + "-" + FILE_DATE.format(generatedAt) + "." + ext;
    }

    public record RenderedReport(byte[] content, String contentType, String fileName) {}
}
