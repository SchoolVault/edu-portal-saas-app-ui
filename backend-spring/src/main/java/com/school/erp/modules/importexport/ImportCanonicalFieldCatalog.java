package com.school.erp.modules.importexport;

import java.util.List;
import java.util.Map;

/**
 * Canonical CSV column keys (lowercase) for bulk import — aligned with export templates and row executors.
 */
public final class ImportCanonicalFieldCatalog {

    private static final Map<ImportJobType, List<String>> BY_TYPE = Map.of(
            ImportJobType.STUDENTS, List.of(
                    "academic_year_id", "import_mode",
                    "admission_number", "admission_date", "roll_number",
                    "first_name", "last_name", "gender", "date_of_birth",
                    "student_email",
                    "class_id", "section_id", "classname", "sectionname",
                    "primary_guardian_relation", "primary_guardian_name", "primary_guardian_email", "primary_guardian_phone",
                    "parent_id", "create_parent_portal", "notify_credentials",
                    "address", "blood_group"),
            ImportJobType.TEACHERS, List.of(
                    "academic_year_id", "import_mode",
                    "employee_code", "first_name", "last_name", "phone", "join_date", "status",
                    "email", "gender", "dob", "qualification", "specialization", "department",
                    "subjects", "can_class_teacher", "class_teacher_slot",
                    "create_portal", "portal_password", "portal_role", "library_role", "school_role_codes", "notify_credentials",
                    "salary", "bank_account_holder", "bank_name", "bank_account_number", "bank_ifsc"),
            ImportJobType.STAFF, List.of(
                    "academic_year_id", "import_mode",
                    "employee_code", "first_name", "last_name", "phone", "join_date", "status",
                    "email", "gender", "dob", "qualification", "specialization", "department",
                    "subjects", "can_class_teacher", "class_teacher_slot",
                    "create_portal", "portal_password", "portal_role", "library_role", "school_role_codes", "notify_credentials",
                    "salary", "bank_account_holder", "bank_name", "bank_account_number", "bank_ifsc"),
            ImportJobType.CLASSES, List.of(
                    "academic_year", "class_code", "class_name", "grade",
                    "section_code", "section_name", "class_capacity", "section_capacity",
                    "import_mode"),
            ImportJobType.TIMETABLE, List.of(
                    "academic_year_id", "import_mode",
                    "teacher_ref_type", "teacher_ref",
                    "class_ref", "section_ref", "subject_code",
                    "day_of_week", "period_no", "start_time", "end_time", "room_code"),
            ImportJobType.FEE_STRUCTURES, List.of(
                    "name", "class_id", "class_name", "academic_year_id",
                    "component_spec", "import_mode"));

    private ImportCanonicalFieldCatalog() {
    }

    public static List<String> canonicalFields(ImportJobType jobType) {
        return BY_TYPE.getOrDefault(jobType, List.of());
    }
}
