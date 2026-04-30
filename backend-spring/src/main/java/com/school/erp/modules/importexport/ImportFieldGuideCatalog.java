package com.school.erp.modules.importexport;

import com.school.erp.modules.importexport.dto.ImportExportDTOs;

import java.util.List;
import java.util.Map;

/**
 * Sales/operator-friendly import field guide (required vs optional + concise meaning).
 */
public final class ImportFieldGuideCatalog {

    private static final Map<ImportJobType, List<ImportExportDTOs.ImportFieldGuide>> BY_TYPE = Map.of(
            ImportJobType.TEACHERS, teacherOrStaffGuides(),
            ImportJobType.STAFF, teacherOrStaffGuides(),
            ImportJobType.CLASSES, classGuides(),
            ImportJobType.TIMETABLE, timetableGuides(),
            ImportJobType.STUDENTS, studentGuides());

    private ImportFieldGuideCatalog() {
    }

    public static List<ImportExportDTOs.ImportFieldGuide> fieldGuides(ImportJobType jobType) {
        return BY_TYPE.getOrDefault(jobType, List.of());
    }

    private static List<ImportExportDTOs.ImportFieldGuide> teacherOrStaffGuides() {
        return List.of(
                guide("academic_year_id", true, "Target academic year id or CURRENT.", "CURRENT"),
                guide("import_mode", false, "UPSERT / CREATE_ONLY / SKIP_IF_EXISTS.", "UPSERT"),
                guide("employee_code", true, "Unique employee code in school.", "T001"),
                guide("first_name", true, "Employee first name.", "Amit"),
                guide("last_name", true, "Employee last name.", "Sharma"),
                guide("phone", true, "Mobile number for OTP / contact.", "9876000001"),
                guide("join_date", false, "Joining date (yyyy-MM-dd).", "2024-04-01"),
                guide("status", false, "ACTIVE / INACTIVE / RESIGNED.", "ACTIVE"),
                guide("email", false, "Email for portal login if used.", "amit@school.in"),
                guide("gender", false, "Gender enum.", "male"),
                guide("dob", false, "Date of birth (yyyy-MM-dd).", "1992-02-18"),
                guide("qualification", false, "Qualification text.", "B.Ed"),
                guide("specialization", false, "Teaching or work specialization.", "Mathematics"),
                guide("department", false, "Department label.", "Academics"),
                guide("subjects", false, "Pipe/comma separated subjects.", "Mathematics|Science"),
                guide("can_class_teacher", false, "Y/N (teachers); keep N for staff.", "Y"),
                guide("class_teacher_slot", false, "Class slot token (teachers only).", "6A"),
                guide("create_portal", false, "Y/N portal account creation.", "Y"),
                guide("portal_password", false, "Optional initial password.", "School@2026"),
                guide("portal_role", false, "TEACHER / SCHOOL_STAFF / LIBRARY_STAFF.", "TEACHER"),
                guide("library_role", false, "Library role when portal_role is library.", "LIBRARIAN"),
                guide("school_role_codes", false, "Comma-separated RBAC role codes.", "ACADEMIC_STAFF,FEE_OFFICE"),
                guide("notify_credentials", false, "Y/N credential notification.", "N"),
                guide("salary", false, "Numeric salary amount.", "45000"),
                guide("bank_account_holder", false, "Bank account holder name.", "Amit Sharma"),
                guide("bank_name", false, "Bank name.", "HDFC Bank"),
                guide("bank_account_number", false, "Bank account number.", "1234567890"),
                guide("bank_ifsc", false, "Bank IFSC code.", "HDFC0001234"));
    }

    private static List<ImportExportDTOs.ImportFieldGuide> classGuides() {
        return List.of(
                guide("academicyearid", true, "Target academic year id or CURRENT.", "CURRENT"),
                guide("classcode", false, "Short class code.", "6"),
                guide("classname", true, "Class display name.", "Class 6"),
                guide("grade", true, "Numeric grade.", "6"),
                guide("sectioncode", false, "Section code (sectioned classes).", "A"),
                guide("sectionname", false, "Section name (sectioned classes).", "A"),
                guide("classcapacity", false, "Class capacity for class-only rows.", "40"),
                guide("sectioncapacity", false, "Section capacity when section rows are used.", "35"),
                guide("importmode", false, "UPSERT / CREATE_ONLY / SKIP_IF_EXISTS.", "UPSERT"));
    }

    private static List<ImportExportDTOs.ImportFieldGuide> timetableGuides() {
        return List.of(
                guide("academic_year_id", true, "Target academic year id or CURRENT.", "CURRENT"),
                guide("import_mode", false, "UPSERT / CREATE_ONLY / SKIP_IF_EXISTS.", "UPSERT"),
                guide("teacher_ref_type", true, "Teacher ref type: EMPLOYEE_CODE (preferred) / PHONE / EMAIL / ID.", "EMPLOYEE_CODE"),
                guide("teacher_ref", true, "Teacher reference value based on teacher_ref_type.", "T001"),
                guide("class_ref", true, "Class id/code/name reference.", "Class 6"),
                guide("section_ref", false, "Section id/name (required when class has sections).", "A"),
                guide("subject_code", true, "Subject name/code.", "Mathematics"),
                guide("day_of_week", true, "MONDAY..SATURDAY.", "MONDAY"),
                guide("period_no", true, "Period number (1-12).", "1"),
                guide("start_time", true, "Start time HH:mm.", "08:00"),
                guide("end_time", true, "End time HH:mm.", "08:40"),
                guide("room_code", false, "Room label/code.", "R-6A-01"));
    }

    private static List<ImportExportDTOs.ImportFieldGuide> studentGuides() {
        return List.of(
                guide("academic_year_id", true, "Target academic year id or CURRENT.", "CURRENT"),
                guide("import_mode", false, "UPSERT / CREATE_ONLY / SKIP_IF_EXISTS.", "UPSERT"),
                guide("first_name", true, "Student first name.", "Riya"),
                guide("last_name", true, "Student last name.", "Sharma"),
                guide("gender", false, "male/female/other.", "female"),
                guide("date_of_birth", false, "Date of birth (yyyy-MM-dd).", "2012-06-15"),
                guide("student_email", false, "Student email if available.", "riya@example.com"),
                guide("class_id", false, "Class id (or AUTO when using classname).", "AUTO"),
                guide("section_id", false, "Section id (or AUTO when using sectionname).", "AUTO"),
                guide("classname", true, "Class name reference.", "Class 6"),
                guide("sectionname", false, "Section name reference when required.", "A"),
                guide("roll_number", false, "Class roll number.", "21"),
                guide("admission_number", true, "School admission number.", "ADM2027-0001"),
                guide("admission_date", false, "Admission date (yyyy-MM-dd).", "2027-04-04"),
                guide("primary_guardian_relation", false, "MOTHER / FATHER / GUARDIAN / OTHER.", "MOTHER"),
                guide("primary_guardian_name", true, "Primary guardian full name.", "Pooja Sharma"),
                guide("primary_guardian_email", false, "Primary guardian email.", "pooja@example.com"),
                guide("primary_guardian_phone", true, "Primary guardian mobile (portal anchor).", "9817000001"),
                guide("parent_code", false, "Optional. Immutable parent key for UPSERT; omit to auto-generate a unique code per school.", "P7K2M9NQ4X"),
                guide("parent_id", false, "Existing parent id or AUTO for resolver flow.", "AUTO"),
                guide("create_parent_portal", false, "Y/N parent portal creation/link.", "Y"),
                guide("notify_credentials", false, "Y/N parent credential notification.", "Y"),
                guide("address", false, "Student address text.", "11 Model Town"),
                guide("blood_group", false, "Blood group.", "O+"));
    }

    private static ImportExportDTOs.ImportFieldGuide guide(
            String fieldKey,
            boolean required,
            String description,
            String sampleValue) {
        ImportExportDTOs.ImportFieldGuide g = new ImportExportDTOs.ImportFieldGuide();
        g.setFieldKey(fieldKey);
        g.setRequired(required);
        g.setRequirement(required ? "R" : "O");
        g.setDescription(description);
        g.setSampleValue(sampleValue);
        return g;
    }
}
