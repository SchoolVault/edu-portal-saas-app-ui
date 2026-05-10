package com.school.erp.modules.ai.service;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class AiEntityResolver {
    private static final Pattern CLASS_PATTERN = Pattern.compile("\\bclass\\s*([a-z0-9-]+)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SECTION_PATTERN = Pattern.compile("\\bsection\\s*([a-z0-9-]+)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern CLASS_SECTION_PATTERN = Pattern.compile("\\bclass\\s*([a-z0-9]+)\\s*[-/]\\s*([a-z0-9]+)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern TERM_PATTERN = Pattern.compile("\\b(term\\s*[0-9]+|semester\\s*[0-9]+)\\b", Pattern.CASE_INSENSITIVE);

    public Optional<String> resolveClassName(String prompt) {
        Matcher cs = CLASS_SECTION_PATTERN.matcher(safe(prompt));
        if (cs.find()) {
            return Optional.of("Class " + cs.group(1).toUpperCase(Locale.ROOT));
        }
        Matcher m = CLASS_PATTERN.matcher(safe(prompt));
        if (m.find()) {
            return Optional.of("Class " + m.group(1).toUpperCase(Locale.ROOT));
        }
        return Optional.empty();
    }

    public Optional<String> resolveSectionName(String prompt) {
        Matcher cs = CLASS_SECTION_PATTERN.matcher(safe(prompt));
        if (cs.find()) {
            return Optional.of(cs.group(2).toUpperCase(Locale.ROOT));
        }
        Matcher m = SECTION_PATTERN.matcher(safe(prompt));
        if (m.find()) {
            return Optional.of(m.group(1).toUpperCase(Locale.ROOT));
        }
        return Optional.empty();
    }

    public Optional<String> resolveTerm(String prompt) {
        Matcher m = TERM_PATTERN.matcher(safe(prompt));
        if (m.find()) {
            return Optional.of(m.group(1).replaceAll("\\s+", " ").trim());
        }
        return Optional.empty();
    }

    public String resolveMonthOrDefault(String prompt, String fallback) {
        String p = safe(prompt).toLowerCase(Locale.ROOT);
        if (p.contains("current month") || p.contains("this month")) {
            return YearMonth.now().toString();
        }
        for (String month : new String[]{"january","february","march","april","may","june","july","august","september","october","november","december"}) {
            if (p.contains(month)) {
                int idx = java.util.Arrays.asList("january","february","march","april","may","june","july","august","september","october","november","december").indexOf(month) + 1;
                return String.format("%d-%02d", YearMonth.now().getYear(), idx);
            }
        }
        if (p.matches(".*\\b\\d{4}-\\d{2}\\b.*")) {
            Matcher m = Pattern.compile("(\\d{4}-\\d{2})").matcher(p);
            if (m.find()) {
                try {
                    YearMonth.parse(m.group(1), DateTimeFormatter.ofPattern("yyyy-MM"));
                    return m.group(1);
                } catch (DateTimeParseException ignored) {
                    // fall through
                }
            }
        }
        return fallback;
    }

    public Optional<String> resolveTeacherStatus(String prompt) {
        String p = safe(prompt).toLowerCase(Locale.ROOT);
        if (p.contains("on leave") || p.contains("leave teachers") || p.contains("teachers on leave")) {
            return Optional.of("ON_LEAVE");
        }
        if (p.contains("inactive teacher") || p.contains("inactive teachers")) {
            return Optional.of("INACTIVE");
        }
        if (p.contains("active teacher") || p.contains("active teachers")) {
            return Optional.of("ACTIVE");
        }
        return Optional.empty();
    }

    public Optional<String> resolveTeacherSubject(String prompt) {
        String p = safe(prompt).toLowerCase(Locale.ROOT);
        if (p.contains("math")) return Optional.of("Mathematics");
        if (p.contains("science")) return Optional.of("Science");
        if (p.contains("english")) return Optional.of("English");
        if (p.contains("hindi")) return Optional.of("Hindi");
        if (p.contains("computer")) return Optional.of("Computer Science");
        if (p.contains("physics")) return Optional.of("Physics");
        if (p.contains("chemistry")) return Optional.of("Chemistry");
        if (p.contains("biology")) return Optional.of("Biology");
        if (p.contains("history")) return Optional.of("History");
        if (p.contains("geography")) return Optional.of("Geography");
        return Optional.empty();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
