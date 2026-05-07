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
import com.school.erp.tenant.AcademicYearContext;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
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
        CsvExportSupport.appendSingleColumnRow(sb, "Academic year scope: " + humanAcademicYearScope());
        if (rows == null || rows.isEmpty()) {
            CsvExportSupport.appendSingleColumnRow(sb, "No data rows for the selected filters.");
            return CsvExportSupport.utf8BomBytes(sb.toString());
        }
        if (isReportCard(reportType) && isDetailedReportCardRows(rows)) {
            appendReportCardCsvRows(sb, rows);
            return CsvExportSupport.utf8BomBytes(sb.toString());
        }
        List<String> headers = stableHeaders(rows.get(0));
        List<String> displayHeaders = headers.stream().map(ReportExportService::humanizeHeader).toList();
        sb.append(String.join(",", displayHeaders.stream().map(CsvExportSupport::escapeField).toList())).append('\n');
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
            doc.add(new Paragraph("Academic year scope: " + humanAcademicYearScope(), smallFont));
            doc.add(new Paragraph(" "));

            if (rows == null || rows.isEmpty()) {
                doc.add(new Paragraph("No data rows for the selected filters.", bodyFont));
            } else {
                if (isReportCard(reportType) && isDetailedReportCardRows(rows)) {
                    appendReportCardPdf(doc, rows, headFont, bodyFont, smallFont);
                } else {
                    List<String> headers = stableHeaders(rows.get(0));
                    PdfPTable table = new PdfPTable(headers.size());
                    table.setWidthPercentage(100);
                    table.setSpacingBefore(4f);
                    for (String h : headers) {
                        table.addCell(headerCell(humanizeHeader(h), headFont));
                    }
                    for (Map<String, Object> row : rows) {
                        for (String h : headers) {
                            table.addCell(bodyCell(String.valueOf(row.getOrDefault(h, "")), bodyFont));
                        }
                    }
                    doc.add(table);
                }
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

    private static boolean isReportCard(String reportType) {
        return reportType != null && "REPORT_CARD".equalsIgnoreCase(reportType.trim());
    }

    private static boolean isDetailedReportCardRows(List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()) {
            return false;
        }
        Map<String, Object> first = rows.get(0);
        return first.containsKey("subjectName") && (first.containsKey("marksObtained") || first.containsKey("maxMarks"));
    }

    private void appendReportCardCsvRows(StringBuilder sb, List<Map<String, Object>> rows) {
        List<Map<String, Object>> sorted = new ArrayList<>(rows);
        sorted.sort(Comparator
                .comparing((Map<String, Object> row) -> examGroupLabel(row), String.CASE_INSENSITIVE_ORDER)
                .thenComparing(row -> stringValue(row.get("subjectName")), String.CASE_INSENSITIVE_ORDER));

        Map<String, List<Map<String, Object>>> byExam = new LinkedHashMap<>();
        for (Map<String, Object> row : sorted) {
            String key = examGroupLabel(row);
            byExam.computeIfAbsent(key, unused -> new ArrayList<>()).add(row);
        }

        boolean multiExam = byExam.size() > 1;
        if (!multiExam) {
            sb.append(String.join(
                            ",",
                            List.of("Subject", "Marks", "Max marks", "Grade", "%")
                                    .stream().map(CsvExportSupport::escapeField).toList()))
                    .append('\n');
            List<Map<String, Object>> examRows = byExam.values().iterator().next();
            for (Map<String, Object> row : examRows) {
                appendCsvRow(sb, List.of(
                        stringValue(row.get("subjectName")),
                        numberText(row.get("marksObtained")),
                        numberText(row.get("maxMarks")),
                        stringValue(row.get("grade")),
                        decimal1(percent(row))));
            }
            return;
        }

        for (Map.Entry<String, List<Map<String, Object>>> examBlock : byExam.entrySet()) {
            appendCsvSingle(sb, "Exam: " + examBlock.getKey());
            sb.append(String.join(
                            ",",
                            List.of("Subject", "Marks", "Max marks", "Grade", "%")
                                    .stream().map(CsvExportSupport::escapeField).toList()))
                    .append('\n');
            double obtained = 0;
            double max = 0;
            for (Map<String, Object> row : examBlock.getValue()) {
                obtained += numberValue(row.get("marksObtained"));
                max += numberValue(row.get("maxMarks"));
                appendCsvRow(sb, List.of(
                        stringValue(row.get("subjectName")),
                        numberText(row.get("marksObtained")),
                        numberText(row.get("maxMarks")),
                        stringValue(row.get("grade")),
                        decimal1(percent(row))));
            }
            appendCsvRow(sb, List.of("Exam subtotal", decimal1(obtained), decimal1(max), "", decimal1(max > 0 ? (obtained / max) * 100d : 0d)));
            sb.append('\n');
        }
    }

    private void appendReportCardPdf(Document doc, List<Map<String, Object>> rows, Font headFont, Font bodyFont, Font smallFont)
            throws Exception {
        List<Map<String, Object>> sorted = new ArrayList<>(rows);
        sorted.sort(Comparator
                .comparing((Map<String, Object> row) -> examGroupLabel(row), String.CASE_INSENSITIVE_ORDER)
                .thenComparing(row -> stringValue(row.get("subjectName")), String.CASE_INSENSITIVE_ORDER));

        Map<String, List<Map<String, Object>>> byExam = new LinkedHashMap<>();
        for (Map<String, Object> row : sorted) {
            String key = examGroupLabel(row);
            byExam.computeIfAbsent(key, unused -> new ArrayList<>()).add(row);
        }

        boolean multiExam = byExam.size() > 1;
        for (Map.Entry<String, List<Map<String, Object>>> examBlock : byExam.entrySet()) {
            if (multiExam) {
                doc.add(new Paragraph("Exam: " + examBlock.getKey(), headFont));
            }
            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setSpacingBefore(4f);
            table.addCell(headerCell("Subject", headFont));
            table.addCell(headerCell("Marks", headFont));
            table.addCell(headerCell("Max marks", headFont));
            table.addCell(headerCell("Grade", headFont));
            table.addCell(headerCell("%", headFont));

            double obtained = 0;
            double max = 0;
            for (Map<String, Object> row : examBlock.getValue()) {
                obtained += numberValue(row.get("marksObtained"));
                max += numberValue(row.get("maxMarks"));
                table.addCell(bodyCell(stringValue(row.get("subjectName")), bodyFont));
                table.addCell(bodyCell(numberText(row.get("marksObtained")), bodyFont));
                table.addCell(bodyCell(numberText(row.get("maxMarks")), bodyFont));
                table.addCell(bodyCell(stringValue(row.get("grade")), bodyFont));
                table.addCell(bodyCell(decimal1(percent(row)), bodyFont));
            }

            PdfPCell subtotalLabel = headerCell("Exam subtotal", headFont);
            subtotalLabel.setColspan(1);
            table.addCell(subtotalLabel);
            table.addCell(headerCell(decimal1(obtained), headFont));
            table.addCell(headerCell(decimal1(max), headFont));
            table.addCell(headerCell("", headFont));
            table.addCell(headerCell(decimal1(max > 0 ? (obtained / max) * 100d : 0d), headFont));
            doc.add(table);
            if (multiExam) {
                doc.add(new Paragraph(" ", smallFont));
            }
        }
    }

    private static void appendCsvRow(StringBuilder sb, List<String> values) {
        sb.append(String.join(",", values.stream().map(CsvExportSupport::escapeField).toList())).append('\n');
    }

    private static void appendCsvSingle(StringBuilder sb, String value) {
        CsvExportSupport.appendSingleColumnRow(sb, value);
    }

    private static String examGroupLabel(Map<String, Object> row) {
        String examName = stringValue(row.get("examName"));
        if (!examName.isBlank()) {
            return examName;
        }
        String examCode = stringValue(row.get("examCode"));
        if (!examCode.isBlank()) {
            return examCode;
        }
        Object examId = row.get("examId");
        if (examId != null) {
            return "Exam " + examId;
        }
        return "Exam";
    }

    private static String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private static double numberValue(Object value) {
        if (value instanceof Number n) {
            return n.doubleValue();
        }
        if (value == null) {
            return 0d;
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ex) {
            return 0d;
        }
    }

    private static String numberText(Object value) {
        return decimal1(numberValue(value));
    }

    private static double percent(Map<String, Object> row) {
        double max = numberValue(row.get("maxMarks"));
        if (max <= 0d) {
            return 0d;
        }
        return (numberValue(row.get("marksObtained")) / max) * 100d;
    }

    private static String decimal1(double value) {
        return String.format(Locale.ROOT, "%.1f", value);
    }

    private static String humanizeHeader(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String spaced = raw
                .replaceAll("([a-z0-9])([A-Z])", "$1 $2")
                .replace('_', ' ')
                .replace('-', ' ')
                .trim();
        String[] parts = spaced.split("\\s+");
        List<String> out = new ArrayList<>(parts.length);
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            out.add(Character.toUpperCase(part.charAt(0)) + part.substring(1).toLowerCase(Locale.ROOT));
        }
        return String.join(" ", out);
    }

    private static String humanAcademicYearScope() {
        Long academicYearId = AcademicYearContext.getAcademicYearId();
        if (academicYearId == null) {
            return "All years";
        }
        return "Academic year ID " + academicYearId;
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
