package com.school.erp.modules.payroll.pdf;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

final class PayslipPdfContextParser {
    private PayslipPdfContextParser() {}

    static List<PayslipPdfContext.ComponentLine> parseLines(String componentsJson) {
        if (componentsJson == null || componentsJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            ObjectMapper om = new ObjectMapper();
            JsonNode root = om.readTree(componentsJson);
            if (!root.isArray()) {
                return Collections.emptyList();
            }
            List<PayslipPdfContext.ComponentLine> out = new ArrayList<>();
            for (JsonNode n : root) {
                String name = text(n, "name");
                String type = text(n, "type");
                String amt = amountFieldAsPlainString(n);
                if (name.isEmpty() && amt.isEmpty()) {
                    continue;
                }
                String label = formatAmount(amt);
                out.add(PayslipPdfContext.ComponentLine.of(name, type, label));
            }
            return out;
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private static String text(JsonNode n, String field) {
        if (n == null || !n.has(field) || n.get(field).isNull()) {
            return "";
        }
        return n.get(field).asText("").trim();
    }

    /** Supports amount stored as JSON string or number. */
    private static String amountFieldAsPlainString(JsonNode n) {
        if (n == null || !n.has("amount") || n.get("amount").isNull()) {
            return "";
        }
        JsonNode a = n.get("amount");
        if (a.isNumber()) {
            return a.decimalValue().toPlainString();
        }
        return a.asText("").trim();
    }

    private static String formatAmount(String raw) {
        if (raw == null || raw.isBlank()) {
            return "—";
        }
        try {
            BigDecimal v = new BigDecimal(raw.trim());
            return "₹ " + v.toPlainString();
        } catch (Exception e) {
            return raw.trim();
        }
    }
}
