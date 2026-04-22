package com.school.erp.modules.importexport.service;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.academic.entity.AcademicYear;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.AcademicYearRepository;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Resolves {@code classId}/{@code sectionId} from bulk rows that may use human-readable class/section names.
 */
@Service
public class BulkImportAcademicResolver {
    private static final Pattern CLASS_SECTION_COMPACT_TOKEN = Pattern.compile("^(\\d{1,2})([A-Za-z])$");
    public enum AcademicYearResolutionMode {
        EXPLICIT,
        CURRENT,
        LATEST_FALLBACK
    }

    public record ResolvedAcademicYear(Long id, String name, AcademicYearResolutionMode mode) {
    }

    private final AcademicYearRepository academicYearRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;

    public BulkImportAcademicResolver(AcademicYearRepository academicYearRepository,
                                     SchoolClassRepository schoolClassRepository,
                                     SectionRepository sectionRepository) {
        this.academicYearRepository = academicYearRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
    }

    public record ResolvedPlacement(Long classId, Long sectionId) {
    }

    /**
     * Resolves academic year from CSV value; when blank, falls back to the current academic year.
     */
    public Long resolveAcademicYearId(String academicYearRaw) {
        return resolveAcademicYear(academicYearRaw).id();
    }

    public ResolvedAcademicYear resolveAcademicYear(String academicYearRaw) {
        String tenantId = TenantContext.getTenantId();
        Long academicYearId = parseLong(blankToNull(academicYearRaw));
        if (academicYearId == null) {
            return resolveDefaultAcademicYearId(tenantId);
        }
        Long ay = academicYearId;
        AcademicYear year = academicYearRepository.findByIdAndTenantIdAndIsDeletedFalse(ay, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("AcademicYear", ay));
        return new ResolvedAcademicYear(year.getId(), year.getName(), AcademicYearResolutionMode.EXPLICIT);
    }

    public boolean usesAutomaticAcademicYear(String academicYearRaw) {
        return parseLong(blankToNull(academicYearRaw)) == null;
    }

    public String buildAcademicYearResolutionMessage(String academicYearRaw) {
        ResolvedAcademicYear resolved = resolveAcademicYear(academicYearRaw);
        return switch (resolved.mode()) {
            case EXPLICIT -> "Using academic year from file: " + resolved.name() + " (ID " + resolved.id() + ").";
            case CURRENT -> "Academic year not specified in file; using current academic year: " + resolved.name() + " (ID " + resolved.id() + ").";
            case LATEST_FALLBACK -> "No current academic year set; using latest academic year: " + resolved.name() + " (ID " + resolved.id() + ").";
        };
    }

    /**
     * Default academic year for imports:
     * 1) current year when flagged
     * 2) otherwise latest tenant year by endDate/startDate/id (most recent configured year).
     */
    private ResolvedAcademicYear resolveDefaultAcademicYearId(String tenantId) {
        return academicYearRepository.findFirstByTenantIdAndIsCurrentTrueAndIsDeletedFalse(tenantId)
                .map(y -> new ResolvedAcademicYear(y.getId(), y.getName(), AcademicYearResolutionMode.CURRENT))
                .orElseGet(() ->
                        academicYearRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                                .max(Comparator
                                        .comparing((AcademicYear y) -> y.getEndDate() != null ? y.getEndDate() : y.getStartDate())
                                        .thenComparing(y -> y.getStartDate() != null ? y.getStartDate() : y.getEndDate())
                                        .thenComparing(AcademicYear::getId))
                                .map(y -> new ResolvedAcademicYear(y.getId(), y.getName(), AcademicYearResolutionMode.LATEST_FALLBACK))
                                .orElseThrow(() -> new BusinessException(
                                        "No academic year found for current workspace (tenant: " + tenantId + "). "
                                                + "If using Super Admin import, verify target school code and retry. "
                                                + "Or create one in Academic module / set academicyearid in file."
                                )));
    }

    public ResolvedPlacement resolveClassAndSection(Map<String, String> row) {
        String tenantId = TenantContext.getTenantId();
        Long classId = parseLong(blankToNull(row.get("classid")));
        Long sectionId = parseLong(blankToNull(row.get("sectionid")));
        if (classId != null) {
            schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(classId, tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Class", classId));
            Long resolvedSection = resolveSectionForClass(tenantId, classId, sectionId, blankToNull(row.get("sectionname")));
            return new ResolvedPlacement(classId, resolvedSection);
        }
        String className = blankToNull(row.get("classname"));
        if (className == null) {
            throw new BusinessException("Either classid or classname is required");
        }
        Long academicYearId = resolveAcademicYearId(row.get("academicyearid"));
        final Long resolvedYearId = academicYearId;
        Optional<SchoolClass> exactByName = schoolClassRepository
                .findFirstByTenantIdAndAcademicYearIdAndNameIgnoreCaseAndIsDeletedFalse(tenantId, resolvedYearId, className)
                .map(c -> c);
        SchoolClass cls = exactByName.orElseGet(() -> resolveClassByGradeToken(tenantId, resolvedYearId, className)
                .orElseThrow(() -> new BusinessException(
                        "Could not match class '" + className + "' in this academic year. "
                                + "Use the exact class name from Academic module (for example: Class 6) "
                                + "or provide classid in the file."
                )));
        Long resolvedSection = resolveSectionForClass(tenantId, cls.getId(), sectionId, blankToNull(row.get("sectionname")));
        return new ResolvedPlacement(cls.getId(), resolvedSection);
    }

    /**
     * Resolves only class identity from row fields ({@code classid} or {@code classname + academicyearid}).
     * Unlike {@link #resolveClassAndSection(Map)}, this does not require section columns even when class has sections.
     */
    public SchoolClass resolveClassOnly(Map<String, String> row) {
        String tenantId = TenantContext.getTenantId();
        Long classId = parseLong(blankToNull(row.get("classid")));
        if (classId != null) {
            return schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(classId, tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Class", classId));
        }
        String className = blankToNull(row.get("classname"));
        if (className == null) {
            throw new BusinessException("Either classid or classname is required");
        }
        Long academicYearId = resolveAcademicYearId(row.get("academicyearid"));
        return schoolClassRepository
                .findFirstByTenantIdAndAcademicYearIdAndNameIgnoreCaseAndIsDeletedFalse(tenantId, academicYearId, className)
                .orElseGet(() -> resolveClassByGradeToken(tenantId, academicYearId, className)
                        .orElseThrow(() -> new BusinessException(
                                "Could not match class '" + className + "' in this academic year. "
                                        + "Use exact class name from Academic module or provide classid."
                        )));
    }

    /**
     * Optional class-teacher placement parser for teacher import rows.
     *
     * <p>Supported inputs:
     * <ul>
     *   <li>{@code classteacherfor=Class 6-A} (or {@code 6-A})</li>
     *   <li>{@code classteacherfor=6A} (compact grade+section)</li>
     *   <li>explicit columns: {@code classteacherclassid/classteachersectionid} or
     *   {@code classteacherclassname/classteachersectionname}</li>
     * </ul>
     */
    public Optional<ResolvedPlacement> resolveOptionalClassTeacherPlacement(Map<String, String> row) {
        String slotToken = blankToNull(row.get("classteacherfor"));
        String classIdRaw = blankToNull(row.get("classteacherclassid"));
        String sectionIdRaw = blankToNull(row.get("classteachersectionid"));
        String classNameRaw = blankToNull(row.get("classteacherclassname"));
        String sectionNameRaw = blankToNull(row.get("classteachersectionname"));

        boolean hasExplicit = classIdRaw != null || sectionIdRaw != null || classNameRaw != null || sectionNameRaw != null;
        if (slotToken == null && !hasExplicit) {
            return Optional.empty();
        }

        Map<String, String> placementRow = new java.util.HashMap<>();
        placementRow.put("academicyearid", row.get("classteacheracademicyearid"));
        if (hasExplicit) {
            placementRow.put("classid", classIdRaw);
            placementRow.put("sectionid", sectionIdRaw);
            placementRow.put("classname", classNameRaw);
            placementRow.put("sectionname", sectionNameRaw);
        } else {
            parseClassTeacherSlotToken(slotToken, placementRow);
        }
        return Optional.of(resolveClassAndSection(placementRow));
    }

    private static void parseClassTeacherSlotToken(String tokenRaw, Map<String, String> placementRow) {
        String token = blankToNull(tokenRaw);
        if (token == null) {
            throw new BusinessException("classteacherfor cannot be blank");
        }
        String normalized = token.trim().replaceAll("\\s+", " ");
        if (normalized.contains("-")) {
            int idx = normalized.lastIndexOf('-');
            String classPart = normalized.substring(0, idx).trim();
            String sectionPart = normalized.substring(idx + 1).trim();
            if (classPart.isEmpty() || sectionPart.isEmpty()) {
                throw new BusinessException("Invalid classteacherfor format. Use Class 6-A or 6-A.");
            }
            placementRow.put("classname", classPart);
            placementRow.put("sectionname", sectionPart);
            return;
        }

        Matcher compact = CLASS_SECTION_COMPACT_TOKEN.matcher(normalized);
        if (compact.matches()) {
            placementRow.put("classname", compact.group(1));
            placementRow.put("sectionname", compact.group(2).toUpperCase(Locale.ROOT));
            return;
        }

        throw new BusinessException(
                "Invalid classteacherfor format. Use Class 6-A (recommended), 6-A, or 6A."
        );
    }

    /**
     * Sales-friendly fallback for timetable/onboarding imports:
     * if file has {@code classname=6} but actual row is {@code Class 6}, match by grade token when unique.
     */
    private Optional<SchoolClass> resolveClassByGradeToken(String tenantId, Long academicYearId, String classNameRaw) {
        Integer gradeToken = extractNumericGrade(classNameRaw);
        if (gradeToken == null) {
            return Optional.empty();
        }
        List<SchoolClass> byYear = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .filter(c -> c.getAcademicYearId() != null && c.getAcademicYearId().equals(academicYearId))
                .filter(c -> c.getGrade() != null && c.getGrade().equals(gradeToken))
                .toList();
        if (byYear.size() == 1) {
            return Optional.of(byYear.get(0));
        }
        if (byYear.isEmpty()) {
            return Optional.empty();
        }
        String normalizedRaw = normalizeName(classNameRaw);
        return byYear.stream()
                .filter(c -> normalizeName(c.getName()).contains(normalizedRaw) || normalizedRaw.contains(normalizeName(c.getName())))
                .findFirst();
    }

    private static Integer extractNumericGrade(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        StringBuilder digits = new StringBuilder();
        for (char ch : value.toCharArray()) {
            if (Character.isDigit(ch)) {
                digits.append(ch);
            }
        }
        if (digits.isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(digits.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String normalizeName(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private Long resolveSectionForClass(String tenantId, Long classId, Long sectionId, String sectionName) {
        List<Section> classSections = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classId);
        if (classSections.isEmpty()) {
            if (sectionId != null || sectionName != null) {
                throw new BusinessException("Section provided but this class has no sections configured");
            }
            return null;
        }
        if (sectionId != null) {
            Section sec = sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(sectionId, tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));
            if (!classId.equals(sec.getClassId())) {
                throw new BusinessException("sectionid does not belong to the resolved class");
            }
            return sectionId;
        }
        if (sectionName != null && !sectionName.isBlank()) {
            return sectionRepository.findFirstByTenantIdAndClassIdAndNameIgnoreCaseAndIsDeletedFalse(tenantId, classId, sectionName)
                    .map(Section::getId)
                    .orElseThrow(() -> new BusinessException(
                            "Section '" + sectionName + "' was not found in the selected class. "
                                    + "Please use the exact section name from Academic module (for example: A or B)."
                    ));
        }
        throw new BusinessException(
                "This class has sections configured, so section information is required. "
                        + "Please provide sectionname (recommended) or sectionid in the file."
        );
    }

    private static Long parseLong(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            throw new BusinessException("Invalid numeric value for classid, sectionid, or academicyearid: " + value);
        }
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        String upper = normalized.toUpperCase();
        if (upper.equals("AUTO") || upper.equals("CURRENT") || upper.equals("N/A") || upper.equals("NA")
                || upper.equals("NULL") || upper.equals("-")) {
            return null;
        }
        return normalized;
    }
}
