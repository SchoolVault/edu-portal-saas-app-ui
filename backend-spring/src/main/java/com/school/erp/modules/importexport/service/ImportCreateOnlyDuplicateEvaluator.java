package com.school.erp.modules.importexport.service;

import com.school.erp.common.importer.BulkImportRowPolicy;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.modules.fees.repository.FeeStructureRepository;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Component;

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

    public ImportCreateOnlyDuplicateEvaluator(BulkImportAcademicResolver academicResolver,
                                              StudentRepository studentRepository,
                                              TeacherRepository teacherRepository,
                                              FeeStructureRepository feeStructureRepository) {
        this.academicResolver = academicResolver;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.feeStructureRepository = feeStructureRepository;
    }

    /**
     * @return true if this row would be rejected in CREATE_ONLY import due to an existing key.
     */
    public boolean wouldCreateOnlyCollide(ImportJobType jobType, Map<String, String> row) {
        BulkImportRowPolicy policy = BulkImportRowPolicy.fromCsv(row.get("importmode"));
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
            default -> false;
        };
    }

    public boolean isEvaluateableForRatio(ImportJobType jobType, Map<String, String> row) {
        BulkImportRowPolicy policy = BulkImportRowPolicy.fromCsv(row.get("importmode"));
        if (policy != BulkImportRowPolicy.CREATE_ONLY) {
            return false;
        }
        return switch (jobType) {
            case STUDENTS -> {
                String adm = trimToNull(row.get("admissionnumber"));
                yield adm != null;
            }
            case TEACHERS, STAFF -> {
                String phone = trimToNull(row.get("phone"));
                String canonical = phone != null ? InternationalPhone.canonical(phone) : null;
                yield canonical != null;
            }
            case FEE_STRUCTURES -> {
                try {
                    com.school.erp.modules.academic.entity.SchoolClass cls = academicResolver.resolveClassOnly(row);
                    Long ay = academicResolver.resolveAcademicYearId(row.get("academicyearid"));
                    String name = trimToNull(row.get("name"));
                    yield name != null && cls != null && cls.getId() != null && ay != null;
                } catch (Exception e) {
                    yield false;
                }
            }
            default -> false;
        };
    }

    private boolean studentCreateOnlyWouldCollide(String tenant, Map<String, String> row) {
        String adm = trimToNull(row.get("admissionnumber"));
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
        String canonical = InternationalPhone.canonical(phone);
        if (canonical == null) {
            return false;
        }
        return teacherRepository.findByTenantIdAndPhoneAndIsDeletedFalse(tenant, canonical).isPresent();
    }

    private boolean feeCreateOnlyWouldCollide(String tenant, Map<String, String> row) {
        try {
            com.school.erp.modules.academic.entity.SchoolClass cls = academicResolver.resolveClassOnly(row);
            Long academicYearId = academicResolver.resolveAcademicYearId(row.get("academicyearid"));
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
