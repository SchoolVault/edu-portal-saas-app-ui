package com.school.erp.modules.reports.service;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.school.erp.common.exception.BusinessException;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ReportExportService {
    public RenderedReport render(String reportType, String format, List<Map<String, Object>> rows) {
        if ("CSV".equalsIgnoreCase(format)) {
            return new RenderedReport(
                    buildCsv(rows),
                    "text/csv",
                    safeFileName(reportType, "csv"));
        }
        if ("PDF".equalsIgnoreCase(format)) {
            return new RenderedReport(
                    buildPdf(reportType, rows),
                    "application/pdf",
                    safeFileName(reportType, "pdf"));
        }
        throw new BusinessException("Unsupported report export format: " + format);
    }

    private byte[] buildCsv(List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()) {
            return "No rows".getBytes(StandardCharsets.UTF_8);
        }
        List<String> headers = new ArrayList<>(rows.get(0).keySet());
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(",", headers)).append("\n");
        for (Map<String, Object> row : rows) {
            List<String> cells = new ArrayList<>();
            for (String h : headers) {
                String raw = String.valueOf(row.getOrDefault(h, ""));
                cells.add("\"" + raw.replace("\"", "\"\"") + "\"");
            }
            sb.append(String.join(",", cells)).append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] buildPdf(String reportType, List<Map<String, Object>> rows) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document();
            PdfWriter.getInstance(doc, out);
            doc.open();
            doc.add(new Paragraph("Report: " + reportType));
            doc.add(new Paragraph(" "));
            if (rows == null || rows.isEmpty()) {
                doc.add(new Paragraph("No rows available for selected filters."));
            } else {
                List<String> headers = new ArrayList<>(rows.get(0).keySet());
                PdfPTable table = new PdfPTable(headers.size());
                headers.forEach(table::addCell);
                for (Map<String, Object> row : rows) {
                    for (String h : headers) {
                        table.addCell(String.valueOf(row.getOrDefault(h, "")));
                    }
                }
                doc.add(table);
            }
            doc.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new BusinessException("Could not render PDF report.");
        }
    }

    private String safeFileName(String reportType, String ext) {
        String core = reportType == null ? "report" : reportType.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        return core + "." + ext;
    }

    public record RenderedReport(byte[] content, String contentType, String fileName) {}
}
