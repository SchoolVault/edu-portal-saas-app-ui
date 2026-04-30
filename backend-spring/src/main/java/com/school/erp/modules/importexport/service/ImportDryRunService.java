package com.school.erp.modules.importexport.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.importer.ImportColumnMappingApplier;
import com.school.erp.common.importer.TabularImportStreamReader;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.config.ImportRuntimeProperties;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.importexport.dto.ImportExportDTOs;
import com.school.erp.modules.importexport.observability.ImportMetricsRecorder;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Validates a bulk file without persisting job rows (streams rows — no full in-memory list for 50k+ rows).
 */
@Service
public class ImportDryRunService {

    private static final Logger log = LoggerFactory.getLogger(ImportDryRunService.class);

    private final ImportRuntimeProperties importRuntimeProperties;
    private final ImportBulkRowValidator bulkRowValidator;
    private final BulkImportAcademicResolver academicResolver;
    private final ObjectMapper objectMapper;
    private final ImportMetricsRecorder importMetricsRecorder;
    private final ImportCreateOnlyDuplicateEvaluator createOnlyDuplicateEvaluator;

    public ImportDryRunService(ImportRuntimeProperties importRuntimeProperties,
                              ImportBulkRowValidator bulkRowValidator,
                              BulkImportAcademicResolver academicResolver,
                              ObjectMapper objectMapper,
                              ImportMetricsRecorder importMetricsRecorder,
                              ImportCreateOnlyDuplicateEvaluator createOnlyDuplicateEvaluator) {
        this.importRuntimeProperties = importRuntimeProperties;
        this.bulkRowValidator = bulkRowValidator;
        this.academicResolver = academicResolver;
        this.objectMapper = objectMapper;
        this.importMetricsRecorder = importMetricsRecorder;
        this.createOnlyDuplicateEvaluator = createOnlyDuplicateEvaluator;
    }

    public ImportExportDTOs.DryRunResponse validate(MultipartFile file, String jobTypeParam, String columnMappingJson) {
        ImportJobType jobType = ImportJobType.fromParam(jobTypeParam);
        java.util.Map<String, String> columnMapping = ImportColumnMappingApplier.parseMappingJson(objectMapper, columnMappingJson);
        int maxRows = importRuntimeProperties.getMaxRowsPerFile();
        int batchSize = Math.max(100, importRuntimeProperties.getPersistJobLinesBatchSize());

        if (file == null || file.isEmpty()) {
            throw new BusinessException("Import file is required");
        }

        ImportExportDTOs.DryRunResponse res = new ImportExportDTOs.DryRunResponse();
        res.setJobType(jobType.name());
        res.setValidRows(0);
        res.setInvalidRows(0);
        res.setSampleErrors(new ArrayList<>());

        final Path temp;
        try {
            temp = Files.createTempFile("import-dryrun-", ".upload");
        } catch (IOException e) {
            throw new BusinessException("Could not prepare temp file: " + e.getMessage());
        }
        try {
            try {
                file.transferTo(temp);
            } catch (IOException e) {
                throw new BusinessException("Could not read upload: " + e.getMessage());
            }
            int maxSamples = Math.max(50, importRuntimeProperties.getDryRunMaxSampleErrors());
            final int[] valid = {0};
            final int[] invalid = {0};
            final int[] totalRows = {0};
            final int[] createOnlyEval = {0};
            final int[] createOnlyHit = {0};
            final boolean[] autoAcademicYearSeen = {false};
            final Map<String, Integer> seenStudentAdmission = new HashMap<>();
            final Map<String, Integer> seenTeacherPhone = new HashMap<>();
            final Map<String, Integer> seenTimetableClassSlot = new HashMap<>();
            final Map<String, Integer> seenTimetableTeacherSlot = new HashMap<>();
            final Map<String, Integer> seenClassTeacherSlot = new HashMap<>();
            final Map<String, Integer> seenClassKey = new HashMap<>();
            final Map<String, Integer> seenSectionKey = new HashMap<>();
            final Map<String, String> seenClassMode = new HashMap<>();
            final Map<String, String> parentPhoneToEmail = new HashMap<>();
            final Map<String, Integer> timetableRowsPerSlot = new HashMap<>();
            final Map<String, java.util.Set<String>> timetableTeachersPerSlot = new HashMap<>();
            final Map<String, java.util.Set<String>> timetableTeachersPerDay = new HashMap<>();

            TabularImportStreamReader.streamDataRows(
                    temp,
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload",
                    jobType.csvEntryName(),
                    maxRows,
                    batchSize,
                    (batch, firstRowIndex) -> {
                        for (int i = 0; i < batch.size(); i++) {
                            Map<String, String> row = ImportColumnMappingApplier.applyMapping(batch.get(i), columnMapping);
                            if (jobType == ImportJobType.STUDENTS) {
                                StudentImportCanonicalRow.normalize(row);
                            } else if (jobType == ImportJobType.CLASSES) {
                                ClassImportCanonicalRow.normalize(row);
                            } else if (jobType == ImportJobType.TIMETABLE) {
                                TimetableImportCanonicalRow.normalize(row);
                            }
                            int lineIndex = firstRowIndex + i;
                            totalRows[0]++;
                            collectTimetableSlotDiagnostics(
                                    jobType,
                                    row,
                                    timetableRowsPerSlot,
                                    timetableTeachersPerSlot,
                                    timetableTeachersPerDay);
                            if ((jobType == ImportJobType.CLASSES || jobType == ImportJobType.STUDENTS)
                                    && academicResolver.usesAutomaticAcademicYear(row.get("academicyearid"))) {
                                autoAcademicYearSeen[0] = true;
                            }
                            String inFileError = detectInFileConflict(jobType, row, lineIndex,
                                    seenStudentAdmission, seenTeacherPhone, seenTimetableClassSlot, seenTimetableTeacherSlot,
                                    seenClassTeacherSlot, seenClassKey, seenSectionKey, seenClassMode, parentPhoneToEmail);
                            if (inFileError != null) {
                                invalid[0]++;
                                if (res.getSampleErrors().size() < maxSamples) {
                                    ImportExportDTOs.DryRunRowError err = new ImportExportDTOs.DryRunRowError();
                                    err.setLineIndex(lineIndex);
                                    err.setErrorCode("DUPLICATE_IN_FILE");
                                    err.setMessage(inFileError);
                                    err.setDedupeKey(extractDedupeKey(jobType, row));
                                    res.getSampleErrors().add(err);
                                }
                                continue;
                            }
                            try {
                                bulkRowValidator.validateBeforePersist(jobType, row, true);
                                if (importRuntimeProperties.isCreateOnlyDuplicateBlockEnabled()
                                        && createOnlyDuplicateEvaluator.isEvaluateableForRatio(jobType, row)) {
                                    createOnlyEval[0]++;
                                    if (createOnlyDuplicateEvaluator.wouldCreateOnlyCollide(jobType, row)) {
                                        createOnlyHit[0]++;
                                    }
                                }
                                valid[0]++;
                            } catch (Exception ex) {
                                invalid[0]++;
                                if (res.getSampleErrors().size() < maxSamples) {
                                    ImportExportDTOs.DryRunRowError err = new ImportExportDTOs.DryRunRowError();
                                    err.setLineIndex(lineIndex);
                                    err.setErrorCode(categorizeDryRunError(ex.getMessage()));
                                    err.setMessage(ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName());
                                    err.setDedupeKey(extractDedupeKey(jobType, row));
                                    res.getSampleErrors().add(err);
                                }
                            }
                        }
                    });
            res.setTotalRows(totalRows[0]);
            res.setValidRows(valid[0]);
            res.setInvalidRows(invalid[0]);
            if (autoAcademicYearSeen[0] && (jobType == ImportJobType.CLASSES || jobType == ImportJobType.STUDENTS)) {
                res.setAdvisoryMessage(academicResolver.buildAcademicYearResolutionMessage("CURRENT"));
            }
            if (jobType == ImportJobType.TIMETABLE) {
                String timetableAdvisory = buildTimetableTeacherCapacityAdvisory(
                        timetableRowsPerSlot,
                        timetableTeachersPerSlot,
                        timetableTeachersPerDay);
                if (timetableAdvisory != null) {
                    String existing = trimToNull(res.getAdvisoryMessage());
                    res.setAdvisoryMessage(existing == null ? timetableAdvisory : existing + " " + timetableAdvisory);
                }
            }
            if (importRuntimeProperties.isCreateOnlyDuplicateBlockEnabled() && createOnlyEval[0] > 0) {
                double ratio = (double) createOnlyHit[0] / (double) createOnlyEval[0];
                res.setCreateOnlyEvaluatedRows(createOnlyEval[0]);
                res.setCreateOnlyCollisionRows(createOnlyHit[0]);
                res.setCreateOnlyDuplicateRatio(ratio);
                if (ratio > importRuntimeProperties.getCreateOnlyDuplicateMaxRatio()) {
                    res.setImportBlocked(true);
                    res.setImportBlockCode("CREATE_ONLY_DUPLICATE_RATIO");
                    res.setImportBlockMessage(String.format(
                            "CREATE-only mode would fail on about %d of %d evaluated rows (%.0f%%). "
                                    + "This usually means the file was already imported. Fix importmode (UPSERT/SKIP), "
                                    + "or clear test data, before queueing a job.",
                            createOnlyHit[0], createOnlyEval[0], ratio * 100.0d));
                    importMetricsRecorder.incrementCreateOnlyDuplicateStops();
                }
            } else {
                res.setCreateOnlyEvaluatedRows(createOnlyEval[0]);
                res.setCreateOnlyCollisionRows(createOnlyHit[0]);
                if (createOnlyEval[0] > 0) {
                    res.setCreateOnlyDuplicateRatio((double) createOnlyHit[0] / (double) createOnlyEval[0]);
                }
            }
            importMetricsRecorder.recordDryRun(totalRows[0]);
            log.debug("Dry-run done tenant={} type={} total={} valid={} invalid={}",
                    TenantContext.getTenantId(), jobType.name(), totalRows[0], valid[0], invalid[0]);
            return res;
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Dry-run failed: {}", ex.toString());
            throw new BusinessException("Dry-run failed: " + (ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName()));
        } finally {
            try {
                Files.deleteIfExists(temp);
            } catch (Exception ignored) {
                // best-effort
            }
        }
    }

    private String detectInFileConflict(
            ImportJobType jobType,
            Map<String, String> row,
            int lineIndex,
            Map<String, Integer> seenStudentAdmission,
            Map<String, Integer> seenTeacherPhone,
            Map<String, Integer> seenTimetableClassSlot,
            Map<String, Integer> seenTimetableTeacherSlot,
            Map<String, Integer> seenClassTeacherSlot,
            Map<String, Integer> seenClassKey,
            Map<String, Integer> seenSectionKey,
            Map<String, String> seenClassMode,
            Map<String, String> parentPhoneToEmail) {
        if (jobType == ImportJobType.STUDENTS) {
            String admission = trimToNull(value(row, "admissionnumber", "admission_number"));
            if (admission != null) {
                String key = admission.toLowerCase(Locale.ROOT);
                Integer previous = seenStudentAdmission.putIfAbsent(key, lineIndex);
                if (previous != null) {
                    return "Duplicate admission number in file (line #" + previous + ").";
                }
            }
            String parentPhone = trimToNull(value(row, "parentphone", "primary_guardian_phone"));
            if (parentPhone != null) {
                String canonical = InternationalPhone.canonical(parentPhone);
                if (canonical != null) {
                    String email = trimToNull(value(row, "parentemail", "primary_guardian_email"));
                    String priorEmail = parentPhoneToEmail.putIfAbsent(canonical, email != null ? email.toLowerCase(Locale.ROOT) : "");
                    if (priorEmail != null && email != null && !priorEmail.isBlank() && !priorEmail.equalsIgnoreCase(email)) {
                        return "Same parentphone appears with different parentemail values in file; keep one household identity.";
                    }
                }
            }
        } else if (jobType == ImportJobType.TEACHERS || jobType == ImportJobType.STAFF) {
            String phone = trimToNull(value(row, "phone"));
            String canonical = phone != null ? InternationalPhone.canonical(phone) : null;
            if (canonical != null) {
                Integer previous = seenTeacherPhone.putIfAbsent(canonical, lineIndex);
                if (previous != null) {
                    String kind = jobType == ImportJobType.STAFF ? "staff" : "teacher";
                    return "Duplicate " + kind + " phone in file (line #" + previous + ").";
                }
            }
            try {
                if (jobType == ImportJobType.TEACHERS && hasTeacherClassTeacherSpec(row)) {
                    Map<String, String> placementRow = new java.util.HashMap<>(row);
                    if (trimToNull(placementRow.get("classteacherfor")) == null) {
                        String slot = trimToNull(value(placementRow, "class_teacher_slot"));
                        if (slot != null) {
                            placementRow.put("classteacherfor", slot);
                        }
                    }
                    if (trimToNull(placementRow.get("classteacheracademicyearid")) == null) {
                        String ay = trimToNull(value(placementRow, "academic_year_id", "academicyearid"));
                        if (ay != null) {
                            placementRow.put("classteacheracademicyearid", ay);
                        }
                    }
                    if (trimToNull(placementRow.get("classteacherfor")) != null || trimToNull(placementRow.get("classteacherclassid")) != null || trimToNull(placementRow.get("classteacherclassname")) != null) {
                        var placement = academicResolver.resolveOptionalClassTeacherPlacement(placementRow).orElse(null);
                        if (placement != null) {
                            String key = placement.classId() + ":" + (placement.sectionId() != null ? placement.sectionId() : 0L);
                            Integer prevSlot = seenClassTeacherSlot.putIfAbsent(key, lineIndex);
                            if (prevSlot != null && !prevSlot.equals(lineIndex)) {
                                throw new BusinessException("Duplicate class-teacher slot in file (line #" + prevSlot + ").");
                            }
                        }
                    }
                }
            } catch (BusinessException ex) {
                return ex.getMessage();
            }
        } else if (jobType == ImportJobType.CLASSES) {
            String classCode = trimToNull(row.get("classcode"));
            String className = trimToNull(row.get("classname"));
            String grade = trimToNull(row.get("grade"));
            String academicYearId = trimToNull(row.get("academicyearid"));
            String classKey = (academicYearId != null ? academicYearId : "_")
                    + "|" + (classCode != null ? classCode.toUpperCase(Locale.ROOT)
                    : (className != null ? className.toUpperCase(Locale.ROOT) : "_"))
                    + "|" + (grade != null ? grade : "_");
            String sectionCode = trimToNull(row.get("sectioncode"));
            String sectionName = trimToNull(row.get("sectionname"));
            boolean sectioned = sectionCode != null || sectionName != null;
            String mode = sectioned ? "SECTIONED" : "CLASS_ONLY";
            String previousMode = seenClassMode.putIfAbsent(classKey, mode);
            if (previousMode != null && !previousMode.equals(mode)) {
                return "Mixed-mode class rows in file for key " + classKey + " (cannot mix sectioned and class-only rows).";
            }
            if (!sectioned) {
                Integer prev = seenClassKey.putIfAbsent(classKey, lineIndex);
                if (prev != null) {
                    return "Duplicate class row in file (line #" + prev + ").";
                }
            } else {
                String sectionToken = sectionCode != null ? sectionCode : sectionName;
                String sectionKey = classKey + "|SEC:" + sectionToken.toUpperCase(Locale.ROOT);
                Integer prev = seenSectionKey.putIfAbsent(sectionKey, lineIndex);
                if (prev != null) {
                    return "Duplicate section row in file (line #" + prev + ").";
                }
            }
        } else if (jobType == ImportJobType.TIMETABLE) {
            String classId = trimToNull(row.get("classid"));
            String className = trimToNull(row.get("classname"));
            String sectionId = trimToNull(row.get("sectionid"));
            String sectionName = trimToNull(row.get("sectionname"));
            String day = trimToNull(row.get("dayofweek"));
            String period = trimToNull(row.get("period"));
            if (day != null && period != null && (classId != null || className != null)) {
                String classSlot = (classId != null ? "id:" + classId : "name:" + className.toLowerCase(Locale.ROOT))
                        + "|sec:" + (sectionId != null ? sectionId : (sectionName != null ? sectionName.toLowerCase(Locale.ROOT) : "_"))
                        + "|day:" + day.toUpperCase(Locale.ROOT) + "|p:" + period;
                Integer previousClass = seenTimetableClassSlot.putIfAbsent(classSlot, lineIndex);
                if (previousClass != null) {
                    return "Duplicate timetable class slot in file for key [" + classSlot + "] (line #" + previousClass + ").";
                }
                String teacherKey = trimToNull(row.get("teacheremployeecode"));
                if (teacherKey != null) {
                    teacherKey = "emp:" + teacherKey.toUpperCase(Locale.ROOT);
                }
                if (teacherKey == null) {
                    teacherKey = trimToNull(row.get("teacherid"));
                    if (teacherKey != null) {
                        teacherKey = "id:" + teacherKey;
                    }
                }
                if (teacherKey == null) {
                    teacherKey = trimToNull(row.get("teacherphone"));
                    if (teacherKey != null) {
                        teacherKey = "ph:" + teacherKey;
                    }
                }
                if (teacherKey == null) {
                    teacherKey = trimToNull(row.get("teacheremail"));
                    if (teacherKey != null) {
                        teacherKey = "em:" + teacherKey.toLowerCase(Locale.ROOT);
                    }
                }
                if (teacherKey != null) {
                    String teacherSlot = teacherKey + "|day:" + day.toUpperCase(Locale.ROOT) + "|p:" + period;
                    Integer previousTeacher = seenTimetableTeacherSlot.putIfAbsent(teacherSlot, lineIndex);
                    if (previousTeacher != null) {
                        return "Teacher double-booked in file for key [" + teacherSlot + "] (line #" + previousTeacher + ").";
                    }
                }
            }
        }
        return null;
    }

    private static String categorizeDryRunError(String message) {
        String m = message != null ? message.toLowerCase(Locale.ROOT) : "";
        if (m.contains("already exists") || m.contains("duplicate")) {
            return "DUPLICATE_KEY";
        }
        if (m.contains("not found")) {
            return "FK_NOT_FOUND";
        }
        if (m.contains("conflict") || m.contains("double-booked")) {
            return "CONFLICT_SLOT";
        }
        if (m.contains("required") || m.contains("missing")) {
            return "REQUIRED_FIELD";
        }
        if (m.contains("invalid")) {
            return "INVALID_VALUE";
        }
        return "VALIDATION_ERROR";
    }

    private static String extractDedupeKey(ImportJobType jobType, Map<String, String> row) {
        return switch (jobType) {
            case STUDENTS -> "admission_number=" + safe(value(row, "admissionnumber", "admission_number"));
            case TEACHERS, STAFF -> "employee_code=" + safe(value(row, "employee_code"))
                    + ",phone=" + safe(value(row, "phone")) + ",email=" + safe(value(row, "email"));
            case TIMETABLE -> "teacher=emp:" + safe(value(row, "teacheremployeecode")) + "/id:" + safe(value(row, "teacherid"))
                    + "/ph:" + safe(value(row, "teacherphone")) + "/em:" + safe(value(row, "teacheremail"))
                    + ",class=" + safe(value(row, "classid")) + "/" + safe(value(row, "classname"))
                    + ",section=" + safe(value(row, "sectionid")) + "/" + safe(value(row, "sectionname"))
                    + ",day=" + safe(value(row, "dayofweek")) + ",period=" + safe(value(row, "period"));
            case FEE_STRUCTURES -> "class=" + safe(value(row, "class_id", "classid")) + "/" + safe(value(row, "class_name", "classname"))
                    + ",academic_year_id=" + safe(value(row, "academic_year_id", "academicyearid")) + ",name=" + safe(row.get("name"));
            case CLASSES -> "classcode=" + safe(row.get("classcode")) + ",classname=" + safe(row.get("classname"))
                    + ",grade=" + safe(row.get("grade")) + ",sectioncode=" + safe(row.get("sectioncode"))
                    + ",sectionname=" + safe(row.get("sectionname")) + ",academicyearid=" + safe(row.get("academicyearid"));
            default -> "";
        };
    }

    private static String safe(String value) {
        String v = trimToNull(value);
        return v != null ? v : "_";
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String v = value.trim();
        return v.isEmpty() ? null : v;
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

    /** True when the row might resolve a homeroom slot (Teachers import dry-run duplicate detection only). */
    private static boolean hasTeacherClassTeacherSpec(Map<String, String> row) {
        return trimToNull(row.get("classteacherfor")) != null
                || trimToNull(row.get("classteacherclassid")) != null
                || trimToNull(row.get("classteachersectionid")) != null
                || trimToNull(row.get("classteacherclassname")) != null
                || trimToNull(row.get("classteachersectionname")) != null
                || trimToNull(value(row, "class_teacher_slot")) != null;
    }

    private static void collectTimetableSlotDiagnostics(
            ImportJobType jobType,
            Map<String, String> row,
            Map<String, Integer> timetableRowsPerSlot,
            Map<String, java.util.Set<String>> timetableTeachersPerSlot,
            Map<String, java.util.Set<String>> timetableTeachersPerDay) {
        if (jobType != ImportJobType.TIMETABLE) {
            return;
        }
        String day = trimToNull(row.get("dayofweek"));
        String period = trimToNull(row.get("period"));
        if (day == null || period == null) {
            return;
        }
        String slotKey = day.toUpperCase(Locale.ROOT) + "|P" + period;
        timetableRowsPerSlot.put(slotKey, timetableRowsPerSlot.getOrDefault(slotKey, 0) + 1);
        String teacherRef = trimToNull(row.get("teacheremployeecode"));
        if (teacherRef != null) {
            teacherRef = "emp:" + teacherRef.toUpperCase(Locale.ROOT);
        }
        if (teacherRef == null) {
            teacherRef = trimToNull(row.get("teacherid"));
            if (teacherRef != null) {
                teacherRef = "id:" + teacherRef;
            }
        }
        if (teacherRef == null) {
            teacherRef = trimToNull(row.get("teacherphone"));
            if (teacherRef != null) {
                teacherRef = "ph:" + teacherRef;
            }
        }
        if (teacherRef == null) {
            teacherRef = trimToNull(row.get("teacheremail"));
            if (teacherRef != null) {
                teacherRef = "em:" + teacherRef.toLowerCase(Locale.ROOT);
            }
        }
        if (teacherRef != null) {
            timetableTeachersPerSlot.computeIfAbsent(slotKey, ignored -> new java.util.HashSet<>())
                    .add(teacherRef);
            timetableTeachersPerDay.computeIfAbsent(day.toUpperCase(Locale.ROOT), ignored -> new java.util.HashSet<>())
                    .add(teacherRef);
        }
    }

    private static String buildTimetableTeacherCapacityAdvisory(
            Map<String, Integer> timetableRowsPerSlot,
            Map<String, java.util.Set<String>> timetableTeachersPerSlot,
            Map<String, java.util.Set<String>> timetableTeachersPerDay) {
        if (timetableRowsPerSlot.isEmpty()) {
            return null;
        }
        int maxRowsInAnySlot = 0;
        int maxDistinctTeachersInAnySlot = 0;
        String hottestSlot = null;
        for (Map.Entry<String, Integer> entry : timetableRowsPerSlot.entrySet()) {
            int rowsInSlot = entry.getValue() != null ? entry.getValue() : 0;
            int teachersInSlot = timetableTeachersPerSlot.getOrDefault(entry.getKey(), java.util.Set.of()).size();
            if (rowsInSlot > maxRowsInAnySlot) {
                maxRowsInAnySlot = rowsInSlot;
                maxDistinctTeachersInAnySlot = teachersInSlot;
                hottestSlot = entry.getKey();
            }
        }
        if (maxRowsInAnySlot <= maxDistinctTeachersInAnySlot) {
            int busiestDistinctTeachers = timetableTeachersPerDay.values().stream()
                    .mapToInt(set -> set != null ? set.size() : 0)
                    .max()
                    .orElse(0);
            return String.format(
                    Locale.ROOT,
                    "Timetable dry-run checks passed: no same-slot teacher overload. Teacher matching uses employee_code first (fallback: phone/email/id). Peak distinct teachers scheduled in a day: %d.",
                    busiestDistinctTeachers);
        }
        int busiestDistinctTeachers = timetableTeachersPerDay.values().stream()
                .mapToInt(set -> set != null ? set.size() : 0)
                .max()
                .orElse(0);
        int slotClashCount = 0;
        for (Map.Entry<String, Integer> entry : timetableRowsPerSlot.entrySet()) {
            int rowsInSlot = entry.getValue() != null ? entry.getValue() : 0;
            int teachersInSlot = timetableTeachersPerSlot.getOrDefault(entry.getKey(), java.util.Set.of()).size();
            if (rowsInSlot > teachersInSlot) {
                slotClashCount++;
            }
        }
        return String.format(
                Locale.ROOT,
                "Timetable capacity check: slot %s has %d classes but only %d unique teacher references. "
                        + "One teacher cannot teach two classes in the same period, so split those lines across different periods or add more teachers. "
                        + "Dry-run guardrails: overloaded slot count=%d; peak distinct teachers scheduled in a day=%d.",
                hottestSlot != null ? hottestSlot : "N/A",
                maxRowsInAnySlot,
                maxDistinctTeachersInAnySlot,
                slotClashCount,
                busiestDistinctTeachers);
    }
}
