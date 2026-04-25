package com.school.erp.modules.importexport;

import java.util.List;
import java.util.Map;

/**
 * Canonical CSV column keys (lowercase) for bulk import — aligned with export templates and row executors.
 */
public final class ImportCanonicalFieldCatalog {

    private static final Map<ImportJobType, List<String>> BY_TYPE = Map.of(
            ImportJobType.STUDENTS, List.of(
                    "firstname", "lastname", "email", "phone", "dateofbirth", "gender",
                    "classid", "sectionid", "classname", "sectionname", "academicyearid",
                    "rollnumber", "admissionnumber", "admissiondate",
                    "parentid", "parentname", "parentemail", "parentphone", "createparentportal",
                    "notifycredentials", "importmode", "address", "bloodgroup"),
            ImportJobType.TEACHERS, List.of(
                    "firstname", "lastname", "email", "phone", "qualification", "specialization",
                    "joindate", "salary", "subjects", "createportal", "portalpassword", "portalrole", "libraryrole",
                    "importmode", "bankaccountholder", "bankname", "bankaccountnumber", "bankifsc", "notifycredentials",
                    "classteacherfor", "classteacherclassid", "classteachersectionid",
                    "classteacherclassname", "classteachersectionname", "classteacheracademicyearid"),
            ImportJobType.STAFF, List.of(
                    "firstname", "lastname", "email", "phone", "qualification", "specialization",
                    "joindate", "salary", "subjects", "createportal", "portalpassword", "portalrole", "libraryrole",
                    "importmode", "bankaccountholder", "bankname", "bankaccountnumber", "bankifsc", "notifycredentials",
                    "classteacherfor", "classteacherclassid", "classteachersectionid",
                    "classteacherclassname", "classteachersectionname", "classteacheracademicyearid"),
            ImportJobType.CLASSES, List.of(
                    "name", "grade", "academicyearid", "sections", "sectioncapacity"),
            ImportJobType.TIMETABLE, List.of(
                    "teacheremail", "teacherphone", "teacherid",
                    "classname", "classid", "sectionname", "sectionid",
                    "subjectname", "dayofweek", "period", "starttime", "endtime",
                    "room", "academicyearid"),
            ImportJobType.FEE_STRUCTURES, List.of(
                    "name", "classid", "classname", "academicyearid",
                    "componentspec", "importmode"));

    private ImportCanonicalFieldCatalog() {
    }

    public static List<String> canonicalFields(ImportJobType jobType) {
        return BY_TYPE.getOrDefault(jobType, List.of());
    }
}
