package com.school.erp.modules.payroll.pdf;

import java.util.List;

/**
 * Immutable inputs for payslip PDF rendering (no secrets beyond masked account).
 */
public record PayslipPdfContext(
        String schoolName,
        String schoolCode,
        String schoolAddress,
        String schoolPhone,
        String schoolEmail,
        String bankAccountHolder,
        String bankName,
        String bankIfsc,
        String bankAccountMasked,
        String payoutReference) {

    public PayslipPdfContext {
        schoolName = nz(schoolName, "School");
        schoolCode = schoolCode != null ? schoolCode.trim() : "";
        schoolAddress = schoolAddress != null ? schoolAddress.trim() : "";
        schoolPhone = schoolPhone != null ? schoolPhone.trim() : "";
        schoolEmail = schoolEmail != null ? schoolEmail.trim() : "";
        bankAccountHolder = bankAccountHolder != null ? bankAccountHolder.trim() : "";
        bankName = bankName != null ? bankName.trim() : "";
        bankIfsc = bankIfsc != null ? bankIfsc.trim().toUpperCase() : "";
        bankAccountMasked = bankAccountMasked != null ? bankAccountMasked.trim() : "";
        payoutReference = payoutReference != null ? payoutReference.trim() : "";
    }

    private static String nz(String v, String d) {
        return v == null || v.isBlank() ? d : v.trim();
    }

    public static PayslipPdfContext minimal(String schoolName) {
        return new PayslipPdfContext(schoolName, "", "", "", "", "", "", "", "", "");
    }

    public List<ComponentLine> parsedComponentsOrEmpty(String componentsJson) {
        return PayslipPdfContextParser.parseLines(componentsJson);
    }

    public record ComponentLine(String name, String type, String amountLabel) {
        public static ComponentLine of(String name, String type, String amountLabel) {
            return new ComponentLine(
                    name != null ? name : "",
                    type != null ? type : "",
                    amountLabel != null ? amountLabel : "");
        }
    }
}
