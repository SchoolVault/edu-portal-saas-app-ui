package com.school.erp.modules.exams.service;

import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.exams.entity.MarkRecord;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Component
public class ExamReportCardSchemaEngine {
    public List<ExamDTOs.ReportCardSection> renderSections(
            Map<String, Object> schema,
            List<MarkRecord> marks,
            List<ExamDTOs.MarkResponse> subjectRows,
            double totalObtained,
            double totalMax,
            double overallPct,
            String overallGrade,
            String localeCode
    ) {
        List<SectionDescriptor> descriptors = extractSections(schema, localeCode);
        List<ExamDTOs.ReportCardSection> out = new ArrayList<>();
        for (SectionDescriptor descriptor : descriptors) {
            String k = descriptor.key;
            ExamDTOs.ReportCardSection section = new ExamDTOs.ReportCardSection();
            section.setKey(k);
            section.setTitle(descriptor.title != null ? descriptor.title : localizedTitle(k, localeCode));
            Map<String, Object> data = new LinkedHashMap<>();
            if ("header".equals(k)) {
                data.put("generatedAt", java.time.LocalDateTime.now().toString());
                data.put("subjectCount", subjectRows.size());
            } else if ("scholastic".equals(k) || "subjects".equals(k) || "subjectsummary".equals(k)) {
                data.put("rows", subjectRows);
            } else if ("totals".equals(k) || "summary".equals(k)) {
                data.put("totalMarks", totalObtained);
                data.put("totalMaxMarks", totalMax);
                data.put("overallPercentage", overallPct);
                data.put("overallGrade", overallGrade);
            } else if ("attendance".equals(k)) {
                data.put("note", "Attendance integration is enabled; populate from attendance module snapshot.");
            } else if ("remarks".equals(k) || "teacherremarks".equals(k)) {
                data.put("template", defaultRemarkTemplate(overallPct, localeCode));
            } else {
                data.put("note", "Section configured and reserved for extension.");
            }
            String layout = resolveLayoutForSection(k, descriptor.layout);
            data.put("layout", layout);
            if ("remarks".equals(layout) && data.get("remark") == null && data.get("template") != null) {
                data.put("remark", data.get("template"));
            }
            applyFieldRules(data, descriptor, layout, localeCode);
            section.setData(data);
            out.add(section);
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private List<SectionDescriptor> extractSections(Map<String, Object> schema, String localeCode) {
        if (schema != null) {
            Object secObj = schema.get("sections");
            if (secObj instanceof List<?> secList) {
                List<SectionDescriptor> out = new ArrayList<>();
                for (Object row : secList) {
                    if (row instanceof Map<?, ?> m) {
                        String key = m.get("key") != null ? String.valueOf(m.get("key")).trim().toLowerCase(Locale.ROOT) : "";
                        if (key.isBlank()) {
                            continue;
                        }
                        String title = m.get("title") != null ? String.valueOf(m.get("title")).trim() : null;
                        String layout = m.get("layout") != null ? String.valueOf(m.get("layout")).trim().toLowerCase(Locale.ROOT) : null;
                        out.add(new SectionDescriptor(
                                key,
                                title,
                                layout,
                                extractFieldRules(m.get("fields")),
                                extractFieldRules(m.get("columns"))));
                        continue;
                    }
                    if (row != null && !String.valueOf(row).isBlank()) {
                        String key = String.valueOf(row).trim().toLowerCase(Locale.ROOT);
                        out.add(new SectionDescriptor(key, localizedTitle(key, localeCode), null, List.of(), List.of()));
                    }
                }
                if (!out.isEmpty()) {
                    return out;
                }
            }
        }
        return List.of(
                new SectionDescriptor("header", localizedTitle("header", localeCode), "list", List.of(), List.of()),
                new SectionDescriptor("scholastic", localizedTitle("scholastic", localeCode), "table", List.of(), List.of()),
                new SectionDescriptor("totals", localizedTitle("totals", localeCode), "badges", List.of(), List.of()),
                new SectionDescriptor("remarks", localizedTitle("remarks", localeCode), "remarks", List.of(), List.of())
        );
    }

    @SuppressWarnings("unchecked")
    private List<FieldRule> extractFieldRules(Object raw) {
        if (!(raw instanceof List<?> rows)) {
            return List.of();
        }
        List<FieldRule> out = new ArrayList<>();
        for (Object row : rows) {
            if (!(row instanceof Map<?, ?> map)) {
                continue;
            }
            String key = map.get("key") != null ? String.valueOf(map.get("key")).trim() : "";
            if (key.isBlank()) {
                continue;
            }
            String label = map.get("label") != null ? String.valueOf(map.get("label")).trim() : null;
            String format = map.get("format") != null ? String.valueOf(map.get("format")).trim().toLowerCase(Locale.ROOT) : null;
            Integer order = null;
            if (map.get("order") instanceof Number n) {
                order = n.intValue();
            }
            boolean visible = !Boolean.FALSE.equals(map.get("visible"));
            out.add(new FieldRule(key, label, format, visible, order));
        }
        out.sort(Comparator.comparing(FieldRule::safeOrder).thenComparing(FieldRule::key));
        return out;
    }

    private String resolveLayoutForSection(String key, String explicitLayout) {
        if (explicitLayout != null && !explicitLayout.isBlank()) {
            return explicitLayout;
        }
        return switch (key) {
            case "scholastic", "subjects", "subjectsummary" -> "table";
            case "totals", "summary" -> "badges";
            case "remarks", "teacherremarks" -> "remarks";
            case "header" -> "list";
            default -> "list";
        };
    }

    private String localizedTitle(String key, String localeCode) {
        String locale = (localeCode == null || localeCode.isBlank()) ? "en" : localeCode.trim().toLowerCase(Locale.ROOT);
        boolean hi = locale.startsWith("hi");
        return switch (key) {
            case "header" -> hi ? "रिपोर्ट हेडर" : "Report Header";
            case "scholastic", "subjects", "subjectsummary" -> hi ? "विषय विवरण" : "Subject Details";
            case "totals", "summary" -> hi ? "कुल व सारांश" : "Totals & Summary";
            case "attendance" -> hi ? "उपस्थिति" : "Attendance";
            case "remarks", "teacherremarks" -> hi ? "टिप्पणी" : "Remarks";
            default -> key;
        };
    }

    private String defaultRemarkTemplate(double overallPct, String localeCode) {
        boolean hi = localeCode != null && localeCode.toLowerCase(Locale.ROOT).startsWith("hi");
        if (overallPct >= 85) {
            return hi ? "बहुत अच्छा प्रदर्शन। इसी निरंतरता को बनाए रखें।" : "Excellent performance. Keep up the consistency.";
        }
        if (overallPct >= 60) {
            return hi ? "अच्छा प्रयास। चुनिंदा विषयों में और सुधार की संभावना है।" : "Good effort. There is room to improve in selected subjects.";
        }
        return hi ? "आधारभूत अवधारणाओं पर अतिरिक्त सहायता की आवश्यकता है।" : "Needs additional support on foundational concepts.";
    }

    private void applyFieldRules(
            Map<String, Object> data,
            SectionDescriptor descriptor,
            String layout,
            String localeCode
    ) {
        if ("table".equals(layout)) {
            applyTableRules(data, descriptor.tableFields, localeCode);
            return;
        }
        List<FieldRule> rules = descriptor.fields;
        if (rules.isEmpty()) {
            return;
        }
        List<Map<String, Object>> displayRows = new ArrayList<>();
        for (FieldRule rule : rules) {
            if (!rule.visible) {
                continue;
            }
            Object value = data.get(rule.key);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("key", rule.key);
            row.put("label", rule.labelOrDefault());
            row.put("value", formatValue(value, rule.format, localeCode));
            displayRows.add(row);
        }
        if (!displayRows.isEmpty()) {
            data.put("displayRows", displayRows);
        }
        if ("badges".equals(layout) && !displayRows.isEmpty()) {
            List<String> badges = displayRows.stream()
                    .map(row -> String.valueOf(row.get("label")) + " " + String.valueOf(row.get("value")))
                    .toList();
            data.put("badges", badges);
        }
        if ("remarks".equals(layout)) {
            Object remark = data.get("remark");
            if (remark == null || String.valueOf(remark).isBlank()) {
                Object template = data.get("template");
                if (template != null) {
                    data.put("remark", formatValue(template, null, localeCode));
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void applyTableRules(Map<String, Object> data, List<FieldRule> tableFields, String localeCode) {
        Object rawRows = data.get("rows");
        if (!(rawRows instanceof List<?> listRows)) {
            return;
        }
        List<Map<String, Object>> sourceRows = listRows.stream()
                .filter(Map.class::isInstance)
                .map(v -> (Map<String, Object>) v)
                .toList();
        if (sourceRows.isEmpty()) {
            return;
        }
        List<FieldRule> effectiveFields = tableFields;
        if (effectiveFields.isEmpty()) {
            Map<String, Object> sample = sourceRows.get(0);
            effectiveFields = sample.keySet().stream()
                    .filter(Objects::nonNull)
                    .map(k -> new FieldRule(String.valueOf(k), null, null, true, null))
                    .toList();
        }
        List<Map<String, Object>> columns = new ArrayList<>();
        for (FieldRule field : effectiveFields) {
            if (!field.visible) {
                continue;
            }
            Map<String, Object> col = new LinkedHashMap<>();
            col.put("key", field.key);
            col.put("label", field.labelOrDefault());
            columns.add(col);
        }
        List<Map<String, Object>> normalizedRows = new ArrayList<>();
        for (Map<String, Object> src : sourceRows) {
            Map<String, Object> row = new LinkedHashMap<>();
            for (FieldRule field : effectiveFields) {
                if (!field.visible) {
                    continue;
                }
                row.put(field.key, formatValue(src.get(field.key), field.format, localeCode));
            }
            normalizedRows.add(row);
        }
        data.put("tableColumns", columns);
        data.put("tableRows", normalizedRows);
    }

    private String formatValue(Object value, String format, String localeCode) {
        if (value == null) {
            return "—";
        }
        String f = format == null ? "" : format.trim().toLowerCase(Locale.ROOT);
        if ("percent".equals(f) && value instanceof Number n) {
            return String.format(Locale.ROOT, "%.1f%%", n.doubleValue());
        }
        if ("number".equals(f) && value instanceof Number n) {
            return String.format(Locale.ROOT, "%.2f", n.doubleValue());
        }
        if ("currency_inr".equals(f) && value instanceof Number n) {
            return "INR " + String.format(Locale.ROOT, "%.2f", n.doubleValue());
        }
        String text = String.valueOf(value);
        if ("uppercase".equals(f)) {
            return text.toUpperCase(Locale.ROOT);
        }
        if ("lowercase".equals(f)) {
            return text.toLowerCase(Locale.ROOT);
        }
        if ("title".equals(f)) {
            return toTitleCase(text);
        }
        return text;
    }

    private String toTitleCase(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }
        String[] parts = text.toLowerCase(Locale.ROOT).split("\\s+");
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            String p = parts[i];
            if (p.isBlank()) {
                continue;
            }
            if (i > 0) {
                out.append(' ');
            }
            out.append(Character.toUpperCase(p.charAt(0)));
            if (p.length() > 1) {
                out.append(p.substring(1));
            }
        }
        return out.toString();
    }

    private record SectionDescriptor(String key, String title, String layout, List<FieldRule> fields, List<FieldRule> tableFields) {
        private SectionDescriptor {
            key = key == null ? "" : key;
            title = (title == null || title.isBlank()) ? null : title;
            layout = (layout == null || layout.isBlank()) ? null : layout;
            fields = fields == null ? List.of() : fields;
            tableFields = tableFields == null ? List.of() : tableFields;
        }
    }

    private record FieldRule(String key, String label, String format, boolean visible, Integer order) {
        private FieldRule {
            key = key == null ? "" : key;
            label = (label == null || label.isBlank()) ? null : label;
            format = (format == null || format.isBlank()) ? null : format;
            order = order;
        }

        String labelOrDefault() {
            if (label != null) {
                return label;
            }
            return key.replace('_', ' ').replace('-', ' ').trim();
        }

        int safeOrder() {
            return order != null ? order : 999;
        }
    }
}
