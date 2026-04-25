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
            final Map<String, String> parentPhoneToEmail = new HashMap<>();
            final Map<String, Integer> timetableRowsPerSlot = new HashMap<>();
            final Map<String, java.util.Set<String>> timetableTeachersPerSlot = new HashMap<>();

            TabularImportStreamReader.streamDataRows(
                    temp,
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload",
                    jobType.csvEntryName(),
                    maxRows,
                    batchSize,
                    (batch, firstRowIndex) -> {
                        for (int i = 0; i < batch.size(); i++) {
                            Map<String, String> row = ImportColumnMappingApplier.applyMapping(batch.get(i), columnMapping);
                            int lineIndex = firstRowIndex + i;
                            totalRows[0]++;
                            collectTimetableSlotDiagnostics(jobType, row, timetableRowsPerSlot, timetableTeachersPerSlot);
                            if ((jobType == ImportJobType.CLASSES || jobType == ImportJobType.STUDENTS)
                                    && academicResolver.usesAutomaticAcademicYear(row.get("academicyearid"))) {
                                autoAcademicYearSeen[0] = true;
                            }
                            String inFileError = detectInFileConflict(jobType, row, lineIndex,
                                    seenStudentAdmission, seenTeacherPhone, seenTimetableClassSlot, seenTimetableTeacherSlot,
                                    seenClassTeacherSlot, parentPhoneToEmail);
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
                String timetableAdvisory = buildTimetableTeacherCapacityAdvisory(timetableRowsPerSlot, timetableTeachersPerSlot);
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
            Map<String, String> parentPhoneToEmail) {
        if (jobType == ImportJobType.STUDENTS) {
            String admission = trimToNull(row.get("admissionnumber"));
            if (admission != null) {
                String key = admission.toLowerCase(Locale.ROOT);
                Integer previous = seenStudentAdmission.putIfAbsent(key, lineIndex);
                if (previous != null) {
                    return "Duplicate admissionnumber in file (line #" + previous + ").";
                }
            }
            String parentPhone = trimToNull(row.get("parentphone"));
            if (parentPhone != null) {
                String canonical = InternationalPhone.canonical(parentPhone);
                if (canonical != null) {
                    String email = trimToNull(row.get("parentemail"));
                    String priorEmail = parentPhoneToEmail.putIfAbsent(canonical, email != null ? email.toLowerCase(Locale.ROOT) : "");
                    if (priorEmail != null && email != null && !priorEmail.isBlank() && !priorEmail.equalsIgnoreCase(email)) {
                        return "Same parentphone appears with different parentemail values in file; keep one household identity.";
                    }
                }
            }
        } else if (jobType == ImportJobType.TEACHERS || jobType == ImportJobType.STAFF) {
            String phone = trimToNull(row.get("phone"));
            String canonical = phone != null ? InternationalPhone.canonical(phone) : null;
            if (canonical != null) {
                Integer previous = seenTeacherPhone.putIfAbsent(canonical, lineIndex);
                if (previous != null) {
                    return "Duplicate teacher phone in file (line #" + previous + ").";
                }
            }
            try {
                if (trimToNull(row.get("classteacherfor")) != null || trimToNull(row.get("classteacherclassid")) != null || trimToNull(row.get("classteacherclassname")) != null) {
                    var placement = academicResolver.resolveOptionalClassTeacherPlacement(row).orElse(null);
                    if (placement != null) {
                        String key = placement.classId() + ":" + (placement.sectionId() != null ? placement.sectionId() : 0L);
                        Integer previous = seenClassTeacherSlot.putIfAbsent(key, lineIndex);
                        if (previous != null && !previous.equals(lineIndex)) {
                            throw new BusinessException("Duplicate class-teacher slot in file (line #" + previous + ").");
                        }
                    }
                }
            } catch (BusinessException ex) {
                return ex.getMessage();
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
                    return "Duplicate timetable class slot in file (line #" + previousClass + ").";
                }
                String teacherKey = trimToNull(row.get("teacherid"));
                if (teacherKey == null) {
                    teacherKey = trimToNull(row.get("teacheremail"));
                }
                if (teacherKey != null) {
                    String teacherSlot = teacherKey.toLowerCase(Locale.ROOT) + "|day:" + day.toUpperCase(Locale.ROOT) + "|p:" + period;
                    Integer previousTeacher = seenTimetableTeacherSlot.putIfAbsent(teacherSlot, lineIndex);
                    if (previousTeacher != null) {
                        return "Teacher double-booked in file for same day/period (line #" + previousTeacher + ").";
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
            case STUDENTS -> "admissionnumber=" + safe(row.get("admissionnumber"));
            case TEACHERS, STAFF -> "phone=" + safe(row.get("phone"));
            case TIMETABLE -> "teacher=" + safe(row.get("teacherid")) + "/ph:" + safe(row.get("teacherphone")) + "/em:" + safe(row.get("teacheremail"))
                    + ",class=" + safe(row.get("classid")) + "/" + safe(row.get("classname"))
                    + ",section=" + safe(row.get("sectionid")) + "/" + safe(row.get("sectionname"))
                    + ",day=" + safe(row.get("dayofweek")) + ",period=" + safe(row.get("period"));
            case FEE_STRUCTURES -> "class=" + safe(row.get("classid")) + "/" + safe(row.get("classname"))
                    + ",academicyearid=" + safe(row.get("academicyearid")) + ",name=" + safe(row.get("name"));
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

    private static void collectTimetableSlotDiagnostics(
            ImportJobType jobType,
            Map<String, String> row,
            Map<String, Integer> timetableRowsPerSlot,
            Map<String, java.util.Set<String>> timetableTeachersPerSlot) {
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
        String teacherRef = trimToNull(row.get("teacherid"));
        if (teacherRef == null) {
            teacherRef = trimToNull(row.get("teacherphone"));
        }
        if (teacherRef == null) {
            teacherRef = trimToNull(row.get("teacheremail"));
        }
        if (teacherRef != null) {
            timetableTeachersPerSlot.computeIfAbsent(slotKey, ignored -> new java.util.HashSet<>())
                    .add(teacherRef.toLowerCase(Locale.ROOT));
        }
    }

    private static String buildTimetableTeacherCapacityAdvisory(
            Map<String, Integer> timetableRowsPerSlot,
            Map<String, java.util.Set<String>> timetableTeachersPerSlot) {
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
            return null;
        }
        return String.format(
                Locale.ROOT,
                "Timetable capacity check: slot %s has %d classes but only %d unique teacher references. "
                        + "One teacher cannot teach two classes in the same period, so split those lines across different periods or add more teachers.",
                hottestSlot != null ? hottestSlot : "N/A",
                maxRowsInAnySlot,
                maxDistinctTeachersInAnySlot);
    }
}
