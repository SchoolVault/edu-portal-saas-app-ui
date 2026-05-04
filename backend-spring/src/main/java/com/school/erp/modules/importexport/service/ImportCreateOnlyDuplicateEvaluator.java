package com.school.erp.modules.importexport.service;

import com.school.erp.common.importer.BulkImportRowPolicy;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.modules.fees.repository.FeeStructureRepository;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.modules.timetable.repository.TimetableRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * For dry-run: estimates whether CREATE-only rows would collide with data already in the school database.
 * Used for duplicate-ratio SLOs / guardrails (not a substitute for the full per-row import validator).
 */
@Component
public class ImportCreateOnlyDuplicateEvaluator {

    private final BulkImportAcademicResolver academicResolver;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final FeeStructureRepository feeStructureRepository;
    private final TimetableRepository timetableRepository;

    public ImportCreateOnlyDuplicateEvaluator(BulkImportAcademicResolver academicResolver,
                                              StudentRepository studentRepository,
                                              TeacherRepository teacherRepository,
                                              FeeStructureRepository feeStructureRepository,
                                              TimetableRepository timetableRepository) {
        this.academicResolver = academicResolver;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.feeStructureRepository = feeStructureRepository;
        this.timetableRepository = timetableRepository;
    }

    /**
     * @return true if this row would be rejected in CREATE_ONLY import due to an existing key.
     */
    public boolean wouldCreateOnlyCollide(ImportJobType jobType, Map<String, String> row) {
        if (jobType == ImportJobType.STUDENTS) {
            StudentImportCanonicalRow.normalize(row);
        } else if (jobType == ImportJobType.TIMETABLE) {
            TimetableImportCanonicalRow.normalize(row);
        } else if (jobType == ImportJobType.FEE_STRUCTURES) {
            normalizeFeeRow(row);
        }
        BulkImportRowPolicy policy = BulkImportRowPolicy.fromCsv(value(row, "import_mode", "importmode"));
        if (policy != BulkImportRowPolicy.CREATE_ONLY) {
            return false;
        }
        String tenant = TenantContext.getTenantId();
        if (tenant == null || tenant.isBlank()) {
            return false;
        }
        return switch (jobType) {
            case STUDENTS -> studentCreateOnlyWouldCollide(tenant, row);
            case TEACHERS, STAFF -> teacherCreateOnlyWouldCollide(tenant, row);
            case FEE_STRUCTURES -> feeCreateOnlyWouldCollide(tenant, row);
            case TIMETABLE -> timetableCreateOnlyWouldCollide(tenant, row);
            default -> false;
        };
    }

    public boolean isEvaluateableForRatio(ImportJobType jobType, Map<String, String> row) {
        if (jobType == ImportJobType.STUDENTS) {
            StudentImportCanonicalRow.normalize(row);
        } else if (jobType == ImportJobType.TIMETABLE) {
            TimetableImportCanonicalRow.normalize(row);
        } else if (jobType == ImportJobType.FEE_STRUCTURES) {
            normalizeFeeRow(row);
        }
        BulkImportRowPolicy policy = BulkImportRowPolicy.fromCsv(value(row, "import_mode", "importmode"));
        if (policy != BulkImportRowPolicy.CREATE_ONLY) {
            return false;
        }
        return switch (jobType) {
            case STUDENTS -> {
                String adm = trimToNull(value(row, "admissionnumber", "admission_number"));
                yield adm != null;
            }
            case TEACHERS, STAFF -> {
                String phone = trimToNull(row.get("phone"));
                String national = phone != null ? InternationalPhone.nationalIndiaMobile10(phone) : null;
                yield national != null;
            }
            case FEE_STRUCTURES -> {
                try {
                    com.school.erp.modules.academic.entity.SchoolClass cls = academicResolver.resolveClassOnly(row);
                    Long ay = academicResolver.resolveAcademicYearId(value(row, "academic_year_id", "academicyearid"));
                    String name = trimToNull(row.get("name"));
                    yield name != null && cls != null && cls.getId() != null && ay != null;
                } catch (Exception e) {
                    yield false;
                }
            }
            case TIMETABLE -> {
                try {
                    Integer period = parseInt(trimToNull(value(row, "period")));
                    String day = trimToNull(value(row, "dayofweek"));
                    var placement = academicResolver.resolveClassAndSection(row);
                    yield period != null && day != null && placement.classId() != null;
                } catch (Exception e) {
                    yield false;
                }
            }
            default -> false;
        };
    }

    private boolean studentCreateOnlyWouldCollide(String tenant, Map<String, String> row) {
        String adm = trimToNull(value(row, "admissionnumber", "admission_number"));
        if (adm == null) {
            return false;
        }
        return studentRepository.findByTenantIdAndAdmissionNumberAndIsDeletedFalse(tenant, adm.trim()).isPresent();
    }

    private boolean teacherCreateOnlyWouldCollide(String tenant, Map<String, String> row) {
        String phone = trimToNull(row.get("phone"));
        if (phone == null) {
            return false;
        }
        List<String> keys = InternationalPhone.importPhoneLookupKeys(phone);
        if (keys.isEmpty()) {
            return false;
        }
        return teacherRepository.findFirstByTenantIdAndPhoneInAndIsDeletedFalseOrderByIdAsc(tenant, keys).isPresent();
    }

    private boolean feeCreateOnlyWouldCollide(String tenant, Map<String, String> row) {
        try {
            com.school.erp.modules.academic.entity.SchoolClass cls = academicResolver.resolveClassOnly(row);
            Long academicYearId = academicResolver.resolveAcademicYearId(value(row, "academic_year_id", "academicyearid"));
            String name = trimToNull(row.get("name"));
            if (name == null) {
                return false;
            }
            return feeStructureRepository
                    .findFirstByTenantIdAndIsDeletedFalseAndClassIdAndAcademicYearIdAndNameIgnoreCase(
                            tenant, cls.getId(), academicYearId, name.trim())
                    .isPresent();
        } catch (Exception e) {
            return false;
        }
    }

    private static void normalizeFeeRow(Map<String, String> row) {
        String classId = value(row, "class_id", "classid");
        String className = value(row, "class_name", "classname");
        String academicYearId = value(row, "academic_year_id", "academicyearid");
        if (classId != null) {
            row.put("classid", classId);
        }
        if (className != null) {
            row.put("classname", className);
        }
        if (academicYearId != null) {
            row.put("academicyearid", academicYearId);
        }
    }

    private boolean timetableCreateOnlyWouldCollide(String tenant, Map<String, String> row) {
        try {
            var placement = academicResolver.resolveClassAndSection(row);
            String dayRaw = trimToNull(value(row, "dayofweek"));
            Integer period = parseInt(trimToNull(value(row, "period")));
            if (dayRaw == null || period == null) {
                return false;
            }
            Enums.DayOfWeek day = Enums.DayOfWeek.valueOf(dayRaw.toUpperCase(Locale.ROOT));
            return timetableRepository
                    .findFirstByTenantAndClassSectionDayPeriod(tenant, placement.classId(), placement.sectionId(), day, period)
                    .isPresent();
        } catch (Exception e) {
            return false;
        }
    }

    private static Integer parseInt(String value) {
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
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

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        if (t.isEmpty()) {
            return null;
        }
        String u = t.toUpperCase(Locale.ROOT);
        if (u.equals("NULL") || u.equals("N/A") || u.equals("NA") || u.equals("AUTO") || u.equals("CURRENT")
                || u.equals("-")) {
            return null;
        }
        return t;
    }
}
