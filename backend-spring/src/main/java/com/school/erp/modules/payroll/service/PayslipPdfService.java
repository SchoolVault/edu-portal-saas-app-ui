package com.school.erp.modules.payroll.service;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.school.erp.modules.payroll.entity.Payslip;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class PayslipPdfService {

    public byte[] build(Payslip p, String schoolName) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document();
            PdfWriter.getInstance(doc, out);
            doc.open();
            doc.add(new Paragraph("Payslip — " + (schoolName != null ? schoolName : "School")));
            doc.add(new Paragraph(" "));
            doc.add(new Paragraph("Teacher: " + p.getTeacherName()));
            doc.add(new Paragraph("Period: " + p.getMonth() + " " + p.getYear()));
            doc.add(new Paragraph("Basic: " + p.getBasicSalary()));
            doc.add(new Paragraph("Allowances: " + p.getTotalAllowances()));
            doc.add(new Paragraph("Deductions: " + p.getTotalDeductions()));
            doc.add(new Paragraph("Net: " + p.getNetSalary()));
            doc.add(new Paragraph("Status: " + p.getStatus()));
            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("PDF generation failed", e);
        }
    }
}
