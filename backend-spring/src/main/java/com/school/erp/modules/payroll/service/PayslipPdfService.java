package com.school.erp.modules.payroll.service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.payroll.entity.Payslip;
import com.school.erp.modules.payroll.pdf.PayslipPdfContext;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PayslipPdfService {

    private static final Logger log = LoggerFactory.getLogger(PayslipPdfService.class);

    /**
     * @param p payslip row
     * @param ctx school + bank + payout metadata (masked account only)
     */
    public byte[] build(Payslip p, PayslipPdfContext ctx) {
        log.debug("Generating payslip PDF payslipId={} period={}-{}", p.getId(), p.getMonth(), p.getYear());
        try {
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document();
            PdfWriter.getInstance(doc, out);
            doc.open();

            doc.add(new Paragraph("Salary payslip", titleFont));
            doc.add(new Paragraph("Generated for employee records. Confidential.", smallFont));
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

            PdfPTable emp = new PdfPTable(2);
            emp.setWidthPercentage(100);
            emp.setWidths(new float[] {1.1f, 2f});
            emp.addCell(cell("Employee", headFont, true));
            emp.addCell(cell(p.getTeacherName() != null ? p.getTeacherName() : "—", bodyFont, false));
            emp.addCell(cell("Pay period", headFont, true));
            emp.addCell(cell(periodLabel(p), bodyFont, false));
            emp.addCell(cell("Payslip #", headFont, true));
            emp.addCell(cell(String.valueOf(p.getId()), bodyFont, false));
            emp.addCell(cell("Status", headFont, true));
            emp.addCell(cell(statusLabel(p.getStatus()), bodyFont, false));
            if (p.getPaymentDate() != null) {
                emp.addCell(cell("Payment date", headFont, true));
                emp.addCell(cell(p.getPaymentDate().toString(), bodyFont, false));
            }
            doc.add(emp);
            doc.add(new Paragraph(" "));
            if (!ctx.schoolPhone().isEmpty() || !ctx.schoolEmail().isEmpty()) {
                PdfPTable contact = new PdfPTable(1);
                contact.setWidthPercentage(100);
                if (!ctx.schoolPhone().isEmpty()) {
                    contact.addCell(cell("School phone: " + ctx.schoolPhone(), bodyFont, false));
                }
                if (!ctx.schoolEmail().isEmpty()) {
                    contact.addCell(cell("School email: " + ctx.schoolEmail(), bodyFont, false));
                }
                doc.add(contact);
                doc.add(new Paragraph(" "));
            }

            PdfPTable bank = new PdfPTable(2);
            bank.setWidthPercentage(100);
            bank.setWidths(new float[] {1.1f, 2f});
            bank.addCell(cell("Bank credit (masked)", headFont, true));
            bank.addCell(cell("", bodyFont, false));
            bank.addCell(cell("Account holder", headFont, true));
            bank.addCell(cell(ctx.bankAccountHolder().isEmpty() ? "—" : ctx.bankAccountHolder(), bodyFont, false));
            bank.addCell(cell("Bank name", headFont, true));
            bank.addCell(cell(ctx.bankName().isEmpty() ? "—" : ctx.bankName(), bodyFont, false));
            bank.addCell(cell("IFSC", headFont, true));
            bank.addCell(cell(ctx.bankIfsc().isEmpty() ? "—" : ctx.bankIfsc(), bodyFont, false));
            bank.addCell(cell("Account no.", headFont, true));
            bank.addCell(cell(ctx.bankAccountMasked().isEmpty() ? "—" : ctx.bankAccountMasked(), bodyFont, false));
            doc.add(bank);
            doc.add(new Paragraph(" "));

            List<PayslipPdfContext.ComponentLine> lines = ctx.parsedComponentsOrEmpty(p.getComponentsJson());
            PdfPTable earn = new PdfPTable(3);
            earn.setWidthPercentage(100);
            earn.setWidths(new float[] {2.2f, 1f, 1f});
            earn.addCell(cell("Earnings & deductions", headFont, true));
            earn.addCell(cell("Type", headFont, true));
            earn.addCell(cell("Amount", headFont, true));
            if (lines.isEmpty()) {
                earn.addCell(cell("Component breakdown not stored for this payslip.", bodyFont, false, 3));
            } else {
                for (PayslipPdfContext.ComponentLine line : lines) {
                    earn.addCell(cell(line.name(), bodyFont, false));
                    earn.addCell(cell(typeShort(line.type()), bodyFont, false));
                    earn.addCell(cell(line.amountLabel(), bodyFont, false));
                }
            }
            doc.add(earn);
            doc.add(new Paragraph(" "));

            PdfPTable totals = new PdfPTable(2);
            totals.setWidthPercentage(60);
            totals.setHorizontalAlignment(Element.ALIGN_LEFT);
            totals.addCell(cell("Basic salary", headFont, true));
            totals.addCell(cell(money(p.getBasicSalary()), bodyFont, false));
            totals.addCell(cell("Total allowances", headFont, true));
            totals.addCell(cell(money(p.getTotalAllowances()), bodyFont, false));
            totals.addCell(cell("Total deductions", headFont, true));
            totals.addCell(cell(money(p.getTotalDeductions()), bodyFont, false));
            totals.addCell(cell("Net pay", headFont, true));
            totals.addCell(cell(money(p.getNetSalary()), headFont, false));
            doc.add(totals);

            if (!ctx.payoutReference().isEmpty()) {
                doc.add(new Paragraph(" "));
                doc.add(new Paragraph("Bank / payout reference: " + ctx.payoutReference(), bodyFont));
            }

            doc.add(new Paragraph(" "));
            doc.add(new Paragraph("This document is informational. For queries, contact school finance.", smallFont));

            doc.close();
            byte[] bytes = out.toByteArray();
            log.info("Payslip PDF generated payslipId={} sizeBytes={}", p.getId(), bytes.length);
            return bytes;
        } catch (Exception e) {
            log.error("Payslip PDF generation failed payslipId={}: {}", p.getId(), e.getMessage(), e);
            throw new IllegalStateException("PDF generation failed", e);
        }
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

    private static String periodLabel(Payslip p) {
        String m = p.getMonth() != null ? p.getMonth() : "";
        Integer y = p.getYear();
        if (y == null) {
            return m;
        }
        return (m + " " + y).trim();
    }

    private static String statusLabel(Enums.PayslipStatus s) {
        if (s == null) {
            return "—";
        }
        return switch (s) {
            case PAID -> "Paid";
            case GENERATED -> "Generated (pending settlement)";
            default -> s.name();
        };
    }

    private static String money(BigDecimal v) {
        if (v == null) {
            return "₹ 0";
        }
        return "₹ " + v.toPlainString();
    }

    private static String typeShort(String t) {
        if (t == null) {
            return "";
        }
        String u = t.toUpperCase();
        if ("BASIC".equals(u)) {
            return "Basic";
        }
        if (u.contains("ALLOW")) {
            return "Allowance";
        }
        if (u.contains("DEDUCT")) {
            return "Deduction";
        }
        return t;
    }
}
