package com.school.erp.modules.importexport.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.rbac.repository.SchoolRoleRepository;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.List;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.time.LocalTime;
import java.time.temporal.ChronoField;
import java.util.regex.Pattern;

/**
 * Single source of truth for bulk-import row rules: used by {@link ImportDryRunService} and
 * {@link ImportRowExecutor} so validation matches execution (ERP-style parity).
 */
@Service
public class ImportBulkRowValidator {

    private static final Pattern EMAIL_LENIENT = Pattern.compile("^[\\w.!#$%&'*+/=?^`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$");
    private static final DateTimeFormatter CSV_DMY_DASH = DateTimeFormatter.ofPattern("dd-MM-uuuu");
    private static final DateTimeFormatter CSV_DMY_SLASH = DateTimeFormatter.ofPattern("dd/MM/uuuu");
    /** Accept both 08:00 and 8:00 from spreadsheet exports. */
    private static final DateTimeFormatter CSV_TIME_FLEX = new DateTimeFormatterBuilder()
            .appendValue(ChronoField.HOUR_OF_DAY, 1, 2, java.time.format.SignStyle.NOT_NEGATIVE)
            .appendLiteral(':')
            .appendValue(ChronoField.MINUTE_OF_HOUR, 2)
            .toFormatter();

    private final BulkImportAcademicResolver academicResolver;
    private final TeacherRepository teacherRepository;
    private final SchoolRoleRepository schoolRoleRepository;

    public ImportBulkRowValidator(BulkImportAcademicResolver academicResolver,
                                 TeacherRepository teacherRepository,
                                 SchoolRoleRepository schoolRoleRepository) {
        this.academicResolver = academicResolver;
        this.teacherRepository = teacherRepository;
        this.schoolRoleRepository = schoolRoleRepository;
    }

    /**
     * Validates one logical row. When {@code resolveStudentPlacement} is true (dry-run), also resolves
     * class/section against the database. When false (job execution), the caller resolves once and passes
     * {@link BulkImportAcademicResolver.ResolvedPlacement} to the row executor to avoid duplicate queries.
     */
    public void validateBeforePersist(ImportJobType type, Map<String, String> row, boolean resolveStudentPlacement) {
        switch (type) {
            case STUDENTS -> validateStudentRow(row, resolveStudentPlacement);
            case TEACHERS -> validateTeacherOrStaffRow(row, false);
            case STAFF -> validateTeacherOrStaffRow(row, true);
            case CLASSES -> validateClassRow(row);
            case TIMETABLE -> validateTimetableRow(row, resolveStudentPlacement);
            case FEE_STRUCTURES -> validateFeeStructureRow(row);
            default -> throw new BusinessException("Unsupported job type");
        }
    }

    private void validateFeeStructureRow(Map<String, String> row) {
        String classId = value(row, "class_id", "classid");
        String className = value(row, "class_name", "classname");
        String academicYear = value(row, "academic_year_id", "academicyearid");
        String componentSpecRaw = value(row, "component_spec", "componentspec");
        if (blank(row.get("name"))) {
            throw new BusinessException("name is required");
        }
        if (blankToNull(classId) == null && blankToNull(className) == null) {
            throw new BusinessException("Either classid or classname is required");
        }
        if (academicYear != null) {
            row.put("academicyearid", academicYear);
        }
        if (classId != null) {
            row.put("classid", classId);
        }
        if (className != null) {
            row.put("classname", className);
        }
        academicResolver.resolveClassOnly(row);
        String componentSpec = blankToNull(componentSpecRaw);
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
        TimetableImportCanonicalRow.normalize(row);
        String teacherEmployeeCode = blankToNull(value(row, "teacheremployeecode", "teacher_employee_code"));
        String teacherEmail = blankToNull(value(row, "teacheremail"));
        String teacherPhoneRaw = blankToNull(value(row, "teacherphone"));
        Long teacherId = parseOptionalLongRaw(value(row, "teacherid"), "teacherid");
        String teacherRefType = blankToNull(value(row, "teacher_ref_type"));
        if (teacherRefType != null) {
            String t = teacherRefType.toUpperCase(Locale.ROOT);
            if (!Set.of("ID", "PHONE", "MOBILE", "EMAIL", "EMPLOYEE_CODE", "EMPLOYEE", "EMP_CODE", "CODE").contains(t)) {
                throw new BusinessException("Invalid teacher_ref_type. Use EMPLOYEE_CODE, ID, PHONE, or EMAIL.");
            }
        }
        int refCount = (teacherEmployeeCode != null ? 1 : 0) + (teacherId != null ? 1 : 0) + (teacherEmail != null ? 1 : 0) + (teacherPhoneRaw != null ? 1 : 0);
        if (refCount == 0) {
            throw new BusinessException("Exactly one teacher reference is required (teacher_ref or teacher_employee_code/teacherid/teacherphone/teacheremail).");
        }
        if (refCount > 1) {
            throw new BusinessException("Use only one teacher reference (teacher_employee_code, teacherid, teacherphone, or teacheremail).");
        }
        if (teacherEmail != null && !EMAIL_LENIENT.matcher(teacherEmail).matches()) {
            throw new BusinessException("Invalid email format in teacheremail column");
        }
        if (teacherPhoneRaw != null && InternationalPhone.nationalIndiaMobile10(teacherPhoneRaw) == null) {
            throw new BusinessException(InternationalPhone.importPhoneInvalidMessage());
        }
        if (blankToNull(value(row, "subjectname")) == null) {
            throw new BusinessException("subjectname is required");
        }
        String day = blankToNull(value(row, "dayofweek"));
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
        if (teacherEmployeeCode != null) {
            String normalizedCode = teacherEmployeeCode.trim().toUpperCase(Locale.ROOT);
            teacherRepository.findByTenantIdAndEmployeeCodeAndIsDeletedFalse(tenantId, normalizedCode)
                    .orElseThrow(() -> new BusinessException("Teacher not found for teacher_employee_code: " + normalizedCode));
        } else if (teacherId != null) {
            teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(teacherId, tenantId)
                    .orElseThrow(() -> new BusinessException("Teacher not found for teacherid: " + teacherId));
        } else if (teacherPhoneRaw != null) {
            List<String> keys = InternationalPhone.importPhoneLookupKeys(teacherPhoneRaw);
            teacherRepository.findFirstByTenantIdAndPhoneInAndIsDeletedFalseOrderByIdAsc(tenantId, keys)
                    .orElseThrow(() -> new BusinessException("Teacher not found for teacherphone: " + teacherPhoneRaw));
        } else if (teacherEmail != null) {
            teacherRepository.findByTenantIdAndEmailIgnoreCaseAndIsDeletedFalse(tenantId, teacherEmail)
                    .orElseThrow(() -> new BusinessException("Teacher not found for teacheremail: " + teacherEmail));
        }
    }

    private void validateStudentRow(Map<String, String> row, boolean resolvePlacement) {
        StudentImportCanonicalRow.normalize(row);
        if (blank(value(row, "first_name", "firstname")) || blank(value(row, "last_name", "lastname"))) {
            throw new BusinessException("first_name and last_name are required");
        }
        String studentPhone = blankToNull(value(row, "phone"));
        if (studentPhone != null && InternationalPhone.nationalIndiaMobile10(studentPhone) == null) {
            throw new BusinessException(InternationalPhone.importPhoneInvalidMessage());
        }
        String email = blankToNull(value(row, "email"));
        if (email != null && !EMAIL_LENIENT.matcher(email).matches()) {
            throw new BusinessException("Invalid email format for student_email / email column");
        }
        String parentEmail = blankToNull(value(row, "parentemail"));
        if (parentEmail != null && !EMAIL_LENIENT.matcher(parentEmail).matches()) {
            throw new BusinessException("Invalid email format for primary_guardian_email / parentemail column");
        }
        String parentPhone = blankToNull(value(row, "parentphone"));
        if (parentPhone == null) {
            throw new BusinessException("primary_guardian_phone (or parentphone) is required");
        }
        if (InternationalPhone.nationalIndiaMobile10(parentPhone) == null) {
            throw new BusinessException(InternationalPhone.importPhoneInvalidMessage());
        }
        parseOptionalLocalDate(value(row, "dateofbirth"), "date_of_birth");
        parseOptionalLocalDate(value(row, "admissiondate"), "admission_date");
        parseOptionalGender(value(row, "gender"));
        parseOptionalPrimaryGuardianRelation(StudentImportCanonicalRow.rawPrimaryGuardianRelation(row));
        parseOptionalParentCode(value(row, "parentcode", "parent_code", "primary_guardian_code"));
        parseOptionalLong(value(row, "parentid"), "parent_id");
        if (resolvePlacement) {
            academicResolver.resolveClassAndSection(row);
        }
    }

    /** Optional; used for compliance / household reporting (OTP still uses primary guardian phone above). */
    private static void parseOptionalPrimaryGuardianRelation(String normalized) {
        if (normalized == null) {
            return;
        }
        switch (normalized) {
            case "MOTHER", "FATHER", "GUARDIAN", "PARENT", "LEGAL_GUARDIAN", "OTHER", "LOCAL_GUARDIAN", "NANNY" -> { }
            default ->
                    throw new BusinessException(
                            "Invalid primary_guardian_relation. Use MOTHER, FATHER, PARENT, GUARDIAN, LEGAL_GUARDIAN, OTHER (or omit).");
        }
    }

    private static void parseOptionalParentCode(String raw) {
        String value = blankToNull(raw);
        if (value == null) {
            return;
        }
        String normalized = value.trim();
        if (normalized.length() > 64) {
            throw new BusinessException("parent_code length must be <= 64");
        }
    }

    /**
     * Shared validation for teaching and non-teaching employee imports. Staff rows use the same canonical columns
     * as teachers but must not carry class-teacher placement (use Teachers / class-teacher assignment imports for that).
     */
    private void validateTeacherOrStaffRow(Map<String, String> row, boolean staffImport) {
        if (blank(value(row, "employee_code"))) {
            throw new BusinessException("employee_code is required");
        }
        if (value(row, "employee_code").trim().length() > 64) {
            throw new BusinessException("employee_code length must be <= 64");
        }
        if (blank(value(row, "first_name", "firstname")) || blank(value(row, "last_name", "lastname"))) {
            throw new BusinessException("first_name and last_name are required");
        }
        String phone = blankToNull(value(row, "phone"));
        if (phone == null) {
            throw new BusinessException("phone is required");
        }
        if (InternationalPhone.nationalIndiaMobile10(phone) == null) {
            throw new BusinessException(InternationalPhone.importPhoneInvalidMessage());
        }
        String email = blankToNull(value(row, "email"));
        if (email != null && !EMAIL_LENIENT.matcher(email).matches()) {
            throw new BusinessException("Invalid email format");
        }
        String portalPassword = blankToNull(value(row, "portal_password", "portalpassword"));
        if (portalPassword != null && portalPassword.length() < 8) {
            throw new BusinessException("portal_password must be at least 8 characters when provided");
        }
        if (portalPassword != null && email == null) {
            throw new BusinessException("email is required when portalpassword is provided");
        }
        parseOptionalLocalDate(value(row, "join_date", "joindate"), "join_date");
        parseOptionalTeacherStatus(value(row, "status"));
        parseOptionalLocalDate(value(row, "dob"), "dob");
        parseOptionalBigDecimal(value(row, "salary"), "salary");
        parseOptionalPortalRole(value(row, "portal_role", "portalrole"));
        parseOptionalLibraryRole(value(row, "library_role", "libraryrole"));
        validateOptionalSchoolRoleCodes(row);
        validateSchoolRoleCodePortalPreconditions(row);
        String canClassTeacher = blankToNull(value(row, "can_class_teacher"));
        if (canClassTeacher != null && !Set.of("Y", "N", "YES", "NO", "TRUE", "FALSE", "1", "0")
                .contains(canClassTeacher.toUpperCase(Locale.ROOT))) {
            throw new BusinessException("Invalid can_class_teacher. Use Y/N.");
        }
        if (staffImport) {
            if (isTruthyFlag(canClassTeacher)) {
                throw new BusinessException(
                        "Staff import cannot set can_class_teacher to Y. Use the Teachers import or class-teacher assignment for homeroom duties.");
            }
            if (staffClassTeacherSpecPresent(row)) {
                throw new BusinessException(
                        "Staff import rows cannot assign class-teacher slots. "
                                + "Omit class_teacher_slot and classteacher* columns, or use Teachers / class-teacher assignment imports.");
            }
            return;
        }
        if (blankToNull(row.get("classteacherfor")) == null) {
            String slot = blankToNull(value(row, "class_teacher_slot"));
            if (slot != null) {
                row.put("classteacherfor", slot);
            }
        }
        if (blankToNull(row.get("classteacheracademicyearid")) == null) {
            String ay = blankToNull(value(row, "academic_year_id", "academicyearid"));
            if (ay != null) {
                row.put("classteacheracademicyearid", ay);
            }
        }
        academicResolver.resolveOptionalClassTeacherPlacement(row);
    }

    private static boolean isTruthyFlag(String raw) {
        String n = blankToNull(raw);
        if (n == null) {
            return false;
        }
        return Set.of("Y", "YES", "TRUE", "1").contains(n.toUpperCase(Locale.ROOT));
    }

    private static boolean staffClassTeacherSpecPresent(Map<String, String> row) {
        if (blankToNull(value(row, "class_teacher_slot")) != null) {
            return true;
        }
        if (blankToNull(row.get("classteacherfor")) != null) {
            return true;
        }
        if (blankToNull(row.get("classteacherclassid")) != null) {
            return true;
        }
        if (blankToNull(row.get("classteachersectionid")) != null) {
            return true;
        }
        if (blankToNull(row.get("classteacherclassname")) != null) {
            return true;
        }
        if (blankToNull(row.get("classteachersectionname")) != null) {
            return true;
        }
        return false;
    }

    /**
     * Optional comma-separated {@link com.school.erp.modules.rbac.entity.SchoolRole} codes for the tenant
     * (e.g. {@code FEE_OFFICE,ACADEMIC_STAFF}). Validated against the catalog; applied at import execution when a portal user exists.
     */
    private void validateOptionalSchoolRoleCodes(Map<String, String> row) {
        String raw = blankToNull(value(row, "school_role_codes", "schoolrolecodes"));
        if (raw == null) {
            return;
        }
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new BusinessException("Tenant context required when schoolrolecodes is provided.");
        }
        LinkedHashSet<String> seen = new LinkedHashSet<>();
        for (String token : raw.split(",")) {
            String code = blankToNull(token);
            if (code == null) {
                continue;
            }
            String upper = code.toUpperCase(Locale.ROOT);
            if (!seen.add(upper)) {
                continue;
            }
            schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, upper)
                    .orElseThrow(() -> new BusinessException(
                            "Unknown schoolrolecodes value: " + code.trim()
                                    + ". Use role codes from Settings → access roles (e.g. FEE_OFFICE, ACADEMIC_STAFF)."));
        }
    }

    /**
     * Dry-run/runtime parity: role-code assignment requires a portal user on that row.
     * Runtime throws from ImportRowExecutor when school_role_codes is present but no user exists;
     * validate it here so Dry Run catches the same issue before queueing.
     */
    private void validateSchoolRoleCodePortalPreconditions(Map<String, String> row) {
        String roleCodes = blankToNull(value(row, "school_role_codes", "schoolrolecodes"));
        if (roleCodes == null) {
            return;
        }
        String createPortalRaw = value(row, "create_portal", "createportal");
        if (createPortalRaw != null && !createPortalRaw.isBlank() && !isTruthyFlag(createPortalRaw)) {
            throw new BusinessException(
                    "school_role_codes requires a portal user on this row. Use create_portal Y "
                            + "(with email for email login and phone), or omit school_role_codes until a portal account exists.");
        }
    }

    private void validateClassRow(Map<String, String> row) {
        ClassImportCanonicalRow.normalize(row);
        String classCode = blankToNull(row.get("classcode"));
        String className = blankToNull(row.get("classname"));
        if (classCode == null && className == null) {
            throw new BusinessException("Either classcode or classname is required");
        }
        if (blank(row.get("grade"))) {
            throw new BusinessException("grade is required");
        }
        parseIntStrict(row.get("grade"), "grade");
        academicResolver.resolveAcademicYearId(row.get("academicyearid"));

        String sectionCode = blankToNull(row.get("sectioncode"));
        String sectionName = blankToNull(row.get("sectionname"));
        if (sectionCode != null && sectionName != null && !sectionCode.equalsIgnoreCase(sectionName)) {
            throw new BusinessException("When both sectioncode and sectionname are present, they must refer to the same section.");
        }

        boolean sectionedRow = sectionCode != null || sectionName != null;
        String classCapRaw = blankToNull(row.get("classcapacity"));
        String sectionCapRaw = blankToNull(row.get("sectioncapacity"));

        if (sectionedRow && sectionCapRaw == null) {
            throw new BusinessException("sectioncapacity is required when sectioncode/sectionname is provided.");
        }
        if (!sectionedRow && classCapRaw == null) {
            throw new BusinessException("classcapacity is required for class-only rows (without sections).");
        }
        if (classCapRaw != null) {
            int c = parseIntStrict(classCapRaw, "classcapacity");
            if (c < 1 || c > 200) {
                throw new BusinessException("Class capacity must be between 1 and 200.");
            }
        }
        if (sectionCapRaw != null) {
            int c = parseIntStrict(sectionCapRaw, "sectioncapacity");
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
            case "LIBRARY",
                    "LIBRARY_STAFF",
                    "LIB",
                    "STAFF",
                    "SCHOOL_STAFF",
                    "BASE_STAFF",
                    "TEACHER",
                    "TCH",
                    "T" -> { /* ok */ }
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
            throw new BusinessException("Invalid libraryrole: " + raw + libraryRoleMisplacementHint(normalized));
        }
    }

    /**
     * Common onboarding mistake: tenant RBAC duty codes are placed in library_role instead of school_role_codes.
     * Valid library_role values when set: ASSISTANT, LIBRARIAN, HEAD, AUTO ({@link Enums.LibraryStaffRole}).
     */
    private static String libraryRoleMisplacementHint(String normalized) {
        if (dutyCodesOftenPlacedInLibraryRoleColumn.contains(normalized)) {
            return " — use school_role_codes for RBAC duties (comma-separated); leave library_role blank"
                    + " unless portal_role is LIBRARY_STAFF (then use ASSISTANT / LIBRARIAN / HEAD / AUTO).";
        }
        return "";
    }

    private static final Set<String> dutyCodesOftenPlacedInLibraryRoleColumn = Set.of(
            "BASE_SCHOOL_STAFF",
            "FEE_OFFICE",
            "TRANSPORT_LOGISTICS",
            "LIBRARY_OPERATIONS",
            "ACADEMIC_STAFF",
            "EXAM_OFFICE",
            "OPERATIONS_DESK");

    private static void parseOptionalTeacherStatus(String raw) {
        String n = blankToNull(raw);
        if (n == null) {
            return;
        }
        try {
            Enums.TeacherStatus.valueOf(n.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid status. Use ACTIVE, INACTIVE, or RESIGNED.");
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
            return;
        } catch (DateTimeParseException ignored) {
        }
        try {
            LocalDate.parse(n, CSV_DMY_DASH);
            return;
        } catch (DateTimeParseException ignored) {
        }
        try {
            LocalDate.parse(n, CSV_DMY_SLASH);
            return;
        } catch (DateTimeParseException ignored) {
        }
        throw new BusinessException("Invalid date for " + column + " (use yyyy-MM-dd or dd-MM-yyyy): " + raw);
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
            return LocalTime.parse(raw.trim(), CSV_TIME_FLEX);
        } catch (Exception ex) {
            throw new BusinessException("Invalid time for " + column + " (use HH:mm or H:mm): " + raw);
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

    private static String value(Map<String, String> row, String... keys) {
        for (String key : keys) {
            if (row.containsKey(key)) {
                String v = row.get(key);
                if (v != null) {
                    return v;
                }
            }
        }
        return null;
    }
}
