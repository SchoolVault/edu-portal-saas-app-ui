package com.school.erp.modules.exams.pdf;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.Element;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.school.erp.modules.exams.dto.ExamDTOs;
import java.io.ByteArrayOutputStream;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ExamReportCardPdfService {
    public byte[] render(
            String examName,
            String studentName,
            List<ExamDTOs.MarkResponse> marks,
            Double total,
            Double maxTotal,
            Double overallPct,
            String overallGrade) {
        try {
            Document document = new Document(PageSize.A4, 36f, 36f, 36f, 42f);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);
            document.open();
            Font title = new Font(Font.HELVETICA, 18, Font.BOLD);
            Font subtitle = new Font(Font.HELVETICA, 11, Font.NORMAL);
            Font strong = new Font(Font.HELVETICA, 11, Font.BOLD);
            Paragraph heading = new Paragraph("Student Report Card", title);
            heading.setAlignment(Element.ALIGN_CENTER);
            heading.setSpacingAfter(10f);
            document.add(heading);
            document.add(new Paragraph("Exam: " + (examName == null ? "-" : examName), subtitle));
            document.add(new Paragraph("Student: " + (studentName == null ? "-" : studentName), subtitle));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100f);
            table.setWidths(new float[]{3.6f, 1.2f, 1.2f, 1.2f, 1.0f});
            addHeader(table, "Subject");
            addHeader(table, "Obtained");
            addHeader(table, "Max");
            addHeader(table, "%");
            addHeader(table, "Grade");
            for (ExamDTOs.MarkResponse m : marks) {
                table.addCell(text(m.getSubjectName()));
                table.addCell(text(m.getMarksObtained() != null ? String.format("%.1f", m.getMarksObtained()) : "-"));
                table.addCell(text(m.getMaxMarks() != null ? String.format("%.1f", m.getMaxMarks()) : "-"));
                double pct = m.getPercentage();
                table.addCell(text(String.format("%.1f", pct)));
                table.addCell(text(m.getGrade()));
            }
            document.add(table);
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Total: " + fmt(total) + " / " + fmt(maxTotal), strong));
            document.add(new Paragraph("Overall %: " + fmt(overallPct), strong));
            document.add(new Paragraph("Overall Grade: " + (overallGrade == null ? "-" : overallGrade), strong));
            document.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to generate report card pdf", ex);
        }
    }

    private static void addHeader(PdfPTable table, String label) {
        PdfPCell c = new PdfPCell(new Phrase(label, new Font(Font.HELVETICA, 10, Font.BOLD)));
        c.setPadding(6f);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setBackgroundColor(new java.awt.Color(236, 240, 247));
        table.addCell(c);
    }

    private static PdfPCell text(String label) {
        PdfPCell c = new PdfPCell(new Phrase(label == null ? "-" : label, new Font(Font.HELVETICA, 10, Font.NORMAL)));
        c.setPadding(5f);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return c;
    }

    private static String fmt(Double v) {
        return v == null ? "-" : String.format("%.1f", v);
    }
}
