package com.school.erp.modules.fees.pdf;

import com.school.erp.modules.settings.entity.TenantConfig;

/**
 * Branding / contact block for fee receipt PDFs (mirrors {@link com.school.erp.modules.payroll.pdf.PayslipPdfContext} scope).
 */
public record FeeReceiptPdfContext(
        String schoolName,
        String schoolCode,
        String schoolAddress,
        String schoolPhone,
        String schoolEmail) {

    public static FeeReceiptPdfContext fromTenantConfig(TenantConfig cfg) {
        if (cfg == null) {
            return new FeeReceiptPdfContext("School", "", "", "", "");
        }
        return new FeeReceiptPdfContext(
                nz(cfg.getSchoolName(), "School"),
                nz(cfg.getSchoolCode(), ""),
                nz(cfg.getAddress(), ""),
                nz(cfg.getPhone(), ""),
                nz(cfg.getEmail(), ""));
    }

    private static String nz(String s, String fallback) {
        if (s == null) {
            return fallback;
        }
        String t = s.trim();
        return t.isEmpty() ? fallback : t;
    }
}
