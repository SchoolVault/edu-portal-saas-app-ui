package com.school.erp.modules.fees.pdf;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.school.erp.modules.fees.dto.FeeDTOs;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Parent-facing fee receipt PDF — layout aligned with {@link com.school.erp.modules.payroll.service.PayslipPdfService}
 * (OpenPDF tables, school header, structured totals). Wording is English in-document; UI stays i18n-driven.
 */
@Service
public class FeeReceiptPdfService {

    private static final Logger log = LoggerFactory.getLogger(FeeReceiptPdfService.class);

    public byte[] build(FeeDTOs.PaymentReceiptResponse r, FeeReceiptPdfContext ctx) {
        log.debug("Generating fee receipt PDF receiptNumber={}", r.getReceiptNumber());
        try {
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15);
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document();
            PdfWriter.getInstance(doc, out);
            doc.open();

            doc.add(new Paragraph("School fee receipt", titleFont));
            doc.add(new Paragraph("Official record of fee credited to the student ledger.", smallFont));
            doc.add(new Paragraph(" "));

            PdfPTable schoolBlock = new PdfPTable(1);
            schoolBlock.setWidthPercentage(100);
            schoolBlock.addCell(cell("School: " + ctx.schoolName(), headFont, false));
            if (!ctx.schoolCode().isEmpty()) {
                schoolBlock.addCell(cell("School code: " + ctx.schoolCode(), bodyFont, false));
            }
            if (!ctx.schoolAddress().isEmpty()) {
                schoolBlock.addCell(cell("Address: " + ctx.schoolAddress(), bodyFont, false));
            }
            doc.add(schoolBlock);
            doc.add(new Paragraph(" "));

            if (!ctx.schoolPhone().isEmpty() || !ctx.schoolEmail().isEmpty()) {
                PdfPTable contact = new PdfPTable(1);
                contact.setWidthPercentage(100);
                if (!ctx.schoolPhone().isEmpty()) {
                    contact.addCell(cell("Phone: " + ctx.schoolPhone(), bodyFont, false));
                }
                if (!ctx.schoolEmail().isEmpty()) {
                    contact.addCell(cell("Email: " + ctx.schoolEmail(), bodyFont, false));
                }
                doc.add(contact);
                doc.add(new Paragraph(" "));
            }

            PdfPTable meta = new PdfPTable(2);
            meta.setWidthPercentage(100);
            meta.setWidths(new float[] {1.15f, 2f});
            meta.addCell(cell("Receipt #", headFont, true));
            meta.addCell(cell(safe(r.getReceiptNumber()), bodyFont, false));
            meta.addCell(cell("Student", headFont, true));
            meta.addCell(cell(safe(r.getStudentName()), bodyFont, false));
            meta.addCell(cell("Class", headFont, true));
            meta.addCell(cell(safe(r.getClassName()), bodyFont, false));
            meta.addCell(cell("Fee plan", headFont, true));
            meta.addCell(cell(safe(r.getFeeStructureName()), bodyFont, false));
            meta.addCell(cell("Ledger status", headFont, true));
            meta.addCell(cell(ledgerStatus(r), bodyFont, false));
            meta.addCell(cell("Payment date", headFont, true));
            meta.addCell(cell(safe(r.getPaymentDate()), bodyFont, false));
            if (r.getDueDate() != null && !r.getDueDate().isBlank()) {
                meta.addCell(cell("Due date", headFont, true));
                meta.addCell(cell(r.getDueDate(), bodyFont, false));
            }
            meta.addCell(cell("Payment method", headFont, true));
            meta.addCell(cell(safe(r.getPaymentMethod()), bodyFont, false));
            meta.addCell(cell("Channel / provider", headFont, true));
            meta.addCell(cell(safe(r.getProvider()), bodyFont, false));
            if (r.getProviderPaymentId() != null && !r.getProviderPaymentId().isBlank()) {
                meta.addCell(cell("Provider payment id", headFont, true));
                meta.addCell(cell(r.getProviderPaymentId(), bodyFont, false));
            }
            doc.add(meta);
            doc.add(new Paragraph(" "));

            PdfPTable lines = new PdfPTable(3);
            lines.setWidthPercentage(100);
            lines.setWidths(new float[] {2.2f, 1f, 1f});
            lines.addCell(cell("Fee component", headFont, true));
            lines.addCell(cell("Type", headFont, true));
            lines.addCell(cell("Amount (" + safe(r.getCurrency()) + ")", headFont, true));
            if (r.getLineItems() == null || r.getLineItems().isEmpty()) {
                lines.addCell(cell("No line breakdown stored for this receipt.", bodyFont, false, 3));
            } else {
                for (FeeDTOs.ParentFeeLineItem li : r.getLineItems()) {
                    lines.addCell(cell(safe(li.getName()), bodyFont, false));
                    lines.addCell(cell(safe(li.getType()), bodyFont, false));
                    lines.addCell(cell(money(li.getAmount()), bodyFont, false));
                }
            }
            doc.add(lines);
            doc.add(new Paragraph(" "));

            PdfPTable totals = new PdfPTable(2);
            totals.setWidthPercentage(62);
            totals.setHorizontalAlignment(Element.ALIGN_LEFT);
            totals.addCell(cell("Plan total", headFont, true));
            totals.addCell(cell(money(r.getTotalAmount()), bodyFont, false));
            totals.addCell(cell("Discount", headFont, true));
            totals.addCell(cell(money(r.getDiscount()), bodyFont, false));
            totals.addCell(cell("Late fee", headFont, true));
            totals.addCell(cell(money(r.getLateFee()), bodyFont, false));
            totals.addCell(cell("Amount credited (this receipt)", headFont, true));
            totals.addCell(cell(money(r.getAmountPaid()), headFont, false));
            totals.addCell(cell("Paid to date", headFont, true));
            totals.addCell(cell(money(r.getPaidAmount()), bodyFont, false));
            totals.addCell(cell("Outstanding", headFont, true));
            totals.addCell(cell(money(r.getDueAmount()), headFont, false));
            doc.add(totals);

            doc.add(new Paragraph(" "));
            doc.add(new Paragraph(
                    "This receipt reflects the school fee ledger as of the payment date above. For queries, contact school finance.",
                    smallFont));

            doc.close();
            byte[] bytes = out.toByteArray();
            log.info("Fee receipt PDF generated receiptNumber={} sizeBytes={}", r.getReceiptNumber(), bytes.length);
            return bytes;
        } catch (Exception e) {
            log.error("Fee receipt PDF generation failed receiptNumber={}: {}", r.getReceiptNumber(), e.getMessage(), e);
            throw new IllegalStateException("PDF generation failed", e);
        }
    }

    private static String ledgerStatus(FeeDTOs.PaymentReceiptResponse r) {
        BigDecimal due = r.getDueAmount();
        if (due == null || due.compareTo(BigDecimal.ZERO) <= 0) {
            return "Paid in full";
        }
        BigDecimal paid = r.getPaidAmount();
        if (paid != null && paid.compareTo(BigDecimal.ZERO) > 0) {
            return "Partially paid — outstanding balance remains";
        }
        return "Posted";
    }

    private static PdfPCell cell(String text, Font font, boolean header) {
        return cell(text, font, header, 1);
    }

    private static PdfPCell cell(String text, Font font, boolean header, int colspan) {
        PdfPCell c = new PdfPCell(new Phrase(text != null ? text : "", font));
        c.setColspan(colspan);
        c.setPadding(5f);
        if (header) {
            c.setBackgroundColor(new java.awt.Color(241, 245, 249));
        }
        return c;
    }

    private static String safe(String s) {
        return s != null && !s.isBlank() ? s : "—";
    }

    private static String money(BigDecimal v) {
        if (v == null) {
            return "0";
        }
        return v.toPlainString();
    }
}
