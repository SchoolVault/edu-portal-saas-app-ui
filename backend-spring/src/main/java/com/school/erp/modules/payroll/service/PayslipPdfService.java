package com.school.erp.modules.payroll.service;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.school.erp.modules.payroll.entity.Payslip;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class PayslipPdfService {

    private static final Logger log = LoggerFactory.getLogger(PayslipPdfService.class);

    public byte[] build(Payslip p, String schoolName) {
        log.debug("Generating payslip PDF payslipId={} period={}-{}", p.getId(), p.getMonth(), p.getYear());
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
            byte[] bytes = out.toByteArray();
            log.info("Payslip PDF generated payslipId={} sizeBytes={}", p.getId(), bytes.length);
            return bytes;
        } catch (Exception e) {
            log.error("Payslip PDF generation failed payslipId={}: {}", p.getId(), e.getMessage(), e);
            throw new IllegalStateException("PDF generation failed", e);
        }
    }
}
