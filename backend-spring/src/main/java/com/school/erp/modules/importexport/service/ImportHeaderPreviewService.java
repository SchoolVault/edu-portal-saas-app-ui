package com.school.erp.modules.importexport.service;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.importer.TabularImportStreamReader;
import com.school.erp.modules.importexport.ImportCanonicalFieldCatalog;
import com.school.erp.modules.importexport.ImportFieldGuideCatalog;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.importexport.dto.ImportExportDTOs;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Detects file headers and suggests canonical column mappings for the mapping wizard step.
 */
@Service
public class ImportHeaderPreviewService {

    public ImportExportDTOs.FileHeaderPreviewResponse preview(MultipartFile file, String jobTypeParam) {
        ImportJobType jobType = ImportJobType.fromParam(jobTypeParam);
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Import file is required");
        }
        final Path temp;
        try {
            temp = Files.createTempFile("import-preview-", ".upload");
        } catch (IOException e) {
            throw new BusinessException("Could not prepare temp file: " + e.getMessage());
        }
        try {
            try {
                file.transferTo(temp);
            } catch (IOException e) {
                throw new BusinessException("Could not read upload: " + e.getMessage());
            }
            List<String> detected = TabularImportStreamReader.readHeaders(
                    temp,
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload",
                    jobType.csvEntryName());
            List<String> canonical = ImportCanonicalFieldCatalog.canonicalFields(jobType);
            Map<String, String> suggested = suggestMapping(detected, canonical);
            ImportExportDTOs.FileHeaderPreviewResponse res = new ImportExportDTOs.FileHeaderPreviewResponse();
            res.setJobType(jobType.name());
            res.setDetectedHeaders(detected);
            res.setCanonicalFields(canonical);
            res.setCanonicalFieldGuides(ImportFieldGuideCatalog.fieldGuides(jobType));
            res.setSuggestedMapping(suggested);
            return res;
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException("Could not read file headers: " + (ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName()));
        } finally {
            try {
                Files.deleteIfExists(temp);
            } catch (Exception ignored) {
                // best-effort
            }
        }
    }

    /**
     * For each detected header, try to match a canonical field by normalized comparison (e.g. {@code first_name} → firstname).
     */
    static Map<String, String> suggestMapping(List<String> detectedHeaders, List<String> canonicalFields) {
        Map<String, String> out = new LinkedHashMap<>();
        for (String fileHeader : detectedHeaders) {
            String normFile = normalizeForMatch(fileHeader);
            String best = null;
            for (String canon : canonicalFields) {
                if (normFile.equals(normalizeForMatch(canon))) {
                    best = canon;
                    break;
                }
            }
            if (best != null) {
                out.put(fileHeader, best);
            }
        }
        return out;
    }

    static String normalizeForMatch(String raw) {
        if (raw == null) {
            return "";
        }
        String normalized = raw.trim();
        int bracketIdx = normalized.indexOf('[');
        if (bracketIdx >= 0) {
            normalized = normalized.substring(0, bracketIdx);
        }
        int markerIdx = normalized.indexOf("__");
        if (markerIdx >= 0) {
            normalized = normalized.substring(0, markerIdx);
        }
        int reqIdx = normalized.indexOf('(');
        if (reqIdx >= 0) {
            normalized = normalized.substring(0, reqIdx);
        }
        return normalized.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }
}
