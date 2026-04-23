package com.school.erp.modules.importexport.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.time.LocalTime;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Single source of truth for bulk-import row rules: used by {@link ImportDryRunService} and
 * {@link ImportRowExecutor} so validation matches execution (ERP-style parity).
 */
@Service
public class ImportBulkRowValidator {

    private static final Pattern EMAIL_LENIENT = Pattern.compile("^[\\w.!#$%&'*+/=?^`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$");

    private final BulkImportAcademicResolver academicResolver;
    private final TeacherRepository teacherRepository;

    public ImportBulkRowValidator(BulkImportAcademicResolver academicResolver,
                                 TeacherRepository teacherRepository) {
        this.academicResolver = academicResolver;
        this.teacherRepository = teacherRepository;
    }

    /**
     * Validates one logical row. When {@code resolveStudentPlacement} is true (dry-run), also resolves
     * class/section against the database. When false (job execution), the caller resolves once and passes
     * {@link BulkImportAcademicResolver.ResolvedPlacement} to the row executor to avoid duplicate queries.
     */
    public void validateBeforePersist(ImportJobType type, Map<String, String> row, boolean resolveStudentPlacement) {
        switch (type) {
            case STUDENTS -> validateStudentRow(row, resolveStudentPlacement);
            case TEACHERS, STAFF -> validateTeacherRow(row);
            case CLASSES -> validateClassRow(row);
            case TIMETABLE -> validateTimetableRow(row, resolveStudentPlacement);
            case FEE_STRUCTURES -> validateFeeStructureRow(row);
            default -> throw new BusinessException("Unsupported job type");
        }
    }

    private void validateFeeStructureRow(Map<String, String> row) {
        if (blank(row.get("name"))) {
            throw new BusinessException("name is required");
        }
        if (blankToNull(row.get("classid")) == null && blankToNull(row.get("classname")) == null) {
            throw new BusinessException("Either classid or classname is required");
        }
        academicResolver.resolveClassOnly(row);
        String componentSpec = blankToNull(row.get("componentspec"));
        if (componentSpec == null) {
            throw new BusinessException("componentspec is required");
        }
        String[] parts = componentSpec.split("\\|");
        Set<String> names = new HashSet<>();
        BigDecimal total = BigDecimal.ZERO;
        for (String raw : parts) {
            String token = raw == null ? "" : raw.trim();
            if (token.isEmpty()) {
                continue;
            }
            String[] fields = token.split(":");
            if (fields.length < 2) {
                throw new BusinessException("Invalid componentspec token '" + token + "'. Use name:amount[:type].");
            }
            String componentName = fields[0].trim();
            if (componentName.isEmpty()) {
                throw new BusinessException("Fee component name is required in componentspec.");
            }
            String normalized = componentName.toLowerCase(Locale.ROOT);
            if (!names.add(normalized)) {
                throw new BusinessException("Fee component names must be unique within one structure row.");
            }
            BigDecimal amount;
            try {
                amount = new BigDecimal(fields[1].trim());
            } catch (NumberFormatException ex) {
                throw new BusinessException("Invalid fee component amount for '" + componentName + "'.");
            }
            if (amount.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException("Fee component amount cannot be negative.");
            }
            total = total.add(amount);
        }
        if (names.isEmpty()) {
            throw new BusinessException("componentspec must include at least one component.");
        }
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Total fee amount must be greater than zero.");
        }
    }

    private void validateTimetableRow(Map<String, String> row, boolean resolvePlacement) {
        String teacherEmail = blankToNull(row.get("teacheremail"));
        String teacherPhoneRaw = blankToNull(row.get("teacherphone"));
        Long teacherId = parseOptionalLongRaw(row.get("teacherid"), "teacherid");
        int refCount = (teacherId != null ? 1 : 0) + (teacherEmail != null ? 1 : 0) + (teacherPhoneRaw != null ? 1 : 0);
        if (refCount == 0) {
            throw new BusinessException("Exactly one of teacherid, teacherphone, or teacheremail is required");
        }
        if (refCount > 1) {
            throw new BusinessException("Use only one of teacherid, teacherphone, or teacheremail (not multiple)");
        }
        if (teacherEmail != null && !EMAIL_LENIENT.matcher(teacherEmail).matches()) {
            throw new BusinessException("Invalid email format in teacheremail column");
        }
        if (teacherPhoneRaw != null && InternationalPhone.canonical(teacherPhoneRaw) == null) {
            throw new BusinessException(InternationalPhone.invalidMessage());
        }
        if (blankToNull(row.get("subjectname")) == null) {
            throw new BusinessException("subjectname is required");
        }
        String day = blankToNull(row.get("dayofweek"));
        if (day == null) {
            throw new BusinessException("dayofweek is required");
        }
        try {
            Enums.DayOfWeek.valueOf(day.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid dayofweek. Use MONDAY..SATURDAY");
        }
        int period = parseIntStrict(requiredCell(row, "period"), "period");
        if (period < 1 || period > 12) {
            throw new BusinessException("period must be between 1 and 12");
        }
        LocalTime start = parseRequiredTime(requiredCell(row, "starttime"), "starttime");
        LocalTime end = parseRequiredTime(requiredCell(row, "endtime"), "endtime");
        if (!start.isBefore(end)) {
            throw new BusinessException("starttime must be earlier than endtime");
        }
        academicResolver.resolveAcademicYearId(row.get("academicyearid"));
        if (resolvePlacement) {
            academicResolver.resolveClassAndSection(row);
        }
        String tenantId = TenantContext.getTenantId();
        if (teacherId != null) {
            teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(teacherId, tenantId)
                    .orElseThrow(() -> new BusinessException("Teacher not found for teacherid: " + teacherId));
        } else if (teacherPhoneRaw != null) {
            String canon = InternationalPhone.canonical(teacherPhoneRaw);
            teacherRepository.findByTenantIdAndPhoneAndIsDeletedFalse(tenantId, canon)
                    .orElseThrow(() -> new BusinessException("Teacher not found for teacherphone: " + canon));
        } else if (teacherEmail != null) {
            teacherRepository.findByTenantIdAndEmailIgnoreCaseAndIsDeletedFalse(tenantId, teacherEmail)
                    .orElseThrow(() -> new BusinessException("Teacher not found for teacheremail: " + teacherEmail));
        }
    }

    private void validateStudentRow(Map<String, String> row, boolean resolvePlacement) {
        if (blank(row.get("firstname")) || blank(row.get("lastname"))) {
            throw new BusinessException("firstname and lastname are required");
        }
        String email = blankToNull(row.get("email"));
        if (email != null && !EMAIL_LENIENT.matcher(email).matches()) {
            throw new BusinessException("Invalid email format in email column");
        }
        String parentEmail = blankToNull(row.get("parentemail"));
        if (parentEmail != null && !EMAIL_LENIENT.matcher(parentEmail).matches()) {
            throw new BusinessException("Invalid email format in parentemail column");
        }
        String parentPhone = blankToNull(row.get("parentphone"));
        if (parentPhone == null) {
            throw new BusinessException("parentphone is required");
        }
        parseOptionalLocalDate(row.get("dateofbirth"), "dateofbirth");
        parseOptionalLocalDate(row.get("admissiondate"), "admissiondate");
        parseOptionalGender(row.get("gender"));
        parseOptionalLong(row.get("parentid"), "parentid");
        if (resolvePlacement) {
            academicResolver.resolveClassAndSection(row);
        }
    }

    private void validateTeacherRow(Map<String, String> row) {
        if (blank(row.get("firstname")) || blank(row.get("lastname"))) {
            throw new BusinessException("firstname and lastname are required");
        }
        String phone = blankToNull(row.get("phone"));
        if (phone == null) {
            throw new BusinessException("phone is required");
        }
        if (InternationalPhone.canonical(phone) == null) {
            throw new BusinessException(InternationalPhone.invalidMessage());
        }
        String email = blankToNull(row.get("email"));
        if (email != null && !EMAIL_LENIENT.matcher(email).matches()) {
            throw new BusinessException("Invalid email format");
        }
        String portalPassword = blankToNull(row.get("portalpassword"));
        if (portalPassword != null && portalPassword.length() < 8) {
            throw new BusinessException("portalpassword must be at least 8 characters when provided");
        }
        if (portalPassword != null && email == null) {
            throw new BusinessException("email is required when portalpassword is provided");
        }
        parseOptionalLocalDate(row.get("joindate"), "joindate");
        parseOptionalBigDecimal(row.get("salary"), "salary");
        parseOptionalPortalRole(row.get("portalrole"));
        parseOptionalLibraryRole(row.get("libraryrole"));
        academicResolver.resolveOptionalClassTeacherPlacement(row);
    }

    private void validateClassRow(Map<String, String> row) {
        if (blank(row.get("name")) || blank(row.get("grade"))) {
            throw new BusinessException("name and grade are required");
        }
        parseIntStrict(row.get("grade"), "grade");
        academicResolver.resolveAcademicYearId(row.get("academicyearid"));

        String className = row.get("name").trim();
        if (className.isEmpty()) {
            throw new BusinessException("name and grade are required");
        }
        // Existing classes are valid in re-import flows. Runtime import logic decides create/update/skip safely.

        String rawSections = row.get("sections");
        if (rawSections != null && !rawSections.isBlank()) {
            var parts = java.util.Arrays.stream(rawSections.split("\\|"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
            Set<String> seen = new HashSet<>();
            for (String p : parts) {
                if (!seen.add(p.toLowerCase(Locale.ROOT))) {
                    throw new BusinessException("Section names must be unique within a class.");
                }
            }
        }

        String cap = blankToNull(row.get("sectioncapacity"));
        if (cap != null) {
            int c = parseIntStrict(cap, "sectioncapacity");
            if (c < 1 || c > 200) {
                throw new BusinessException("Section capacity must be between 1 and 200.");
            }
        }
    }

    private static void parseOptionalPortalRole(String raw) {
        String n = blankToNull(raw);
        if (n == null) {
            return;
        }
        switch (n.toUpperCase(Locale.ROOT)) {
            case "LIBRARY", "LIBRARY_STAFF", "LIB", "TEACHER", "TCH", "T" -> { /* ok */ }
            default -> throw new BusinessException("Invalid portalrole: " + raw);
        }
    }

    private static void parseOptionalLibraryRole(String raw) {
        String n = blankToNull(raw);
        if (n == null) {
            return;
        }
        String normalized = n.trim().toUpperCase(Locale.ROOT);
        if (normalized.equals("AUTO")) {
            return;
        }
        try {
            Enums.LibraryStaffRole.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid libraryrole: " + raw);
        }
    }

    private static void parseOptionalGender(String raw) {
        String n = blankToNull(raw);
        if (n == null) {
            return;
        }
        try {
            Enums.Gender.valueOf(n.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid gender (use male, female, other): " + raw);
        }
    }

    private static void parseOptionalLocalDate(String raw, String column) {
        String n = blankToNull(raw);
        if (n == null) {
            return;
        }
        try {
            LocalDate.parse(n);
        } catch (DateTimeParseException ex) {
            throw new BusinessException("Invalid date for " + column + " (use ISO format yyyy-MM-dd): " + raw);
        }
    }

    private static void parseOptionalBigDecimal(String raw, String column) {
        String n = blankToNull(raw);
        if (n == null) {
            return;
        }
        try {
            new BigDecimal(n);
        } catch (NumberFormatException ex) {
            throw new BusinessException("Invalid number for " + column + ": " + raw);
        }
    }

    private static void parseOptionalLong(String raw, String column) {
        String n = blankToNull(raw);
        if (n == null) {
            return;
        }
        parseLongStrict(n, column);
    }

    private static Long parseOptionalLongRaw(String raw, String column) {
        String n = blankToNull(raw);
        if (n == null) {
            return null;
        }
        return parseLongStrict(n, column);
    }

    private static long parseLongStrict(String raw, String column) {
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException ex) {
            throw new BusinessException("Invalid integer for " + column + ": " + raw);
        }
    }

    private static int parseIntStrict(String raw, String column) {
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ex) {
            throw new BusinessException("Invalid integer for " + column + ": " + raw);
        }
    }

    private static LocalTime parseRequiredTime(String raw, String column) {
        try {
            return LocalTime.parse(raw.trim());
        } catch (Exception ex) {
            throw new BusinessException("Invalid time for " + column + " (use HH:mm): " + raw);
        }
    }

    private static String requiredCell(Map<String, String> row, String key) {
        String value = blankToNull(row.get(key));
        if (value == null) {
            throw new BusinessException("Missing required column value: " + key);
        }
        return value;
    }

    private static boolean blank(String v) {
        return v == null || v.isBlank();
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        String upper = normalized.toUpperCase(Locale.ROOT);
        if (upper.equals("AUTO") || upper.equals("CURRENT") || upper.equals("N/A") || upper.equals("NA")
                || upper.equals("NULL") || upper.equals("-")) {
            return null;
        }
        return normalized;
    }
}
