package com.school.erp.modules.importexport.service;

import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.importexport.repository.ImportJobLineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class ImportLineFailureService {
    private static final int MAX_ERR = 3800;
    private final ImportJobLineRepository lineRepository;

    public ImportLineFailureService(ImportJobLineRepository lineRepository) {
        this.lineRepository = lineRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markLineFailed(Long lineId, String tenantId, String message) {
        ImportJobLine line = lineRepository.findById(lineId).orElseThrow();
        if (!tenantId.equals(line.getTenantId())) {
            throw new IllegalStateException("Line tenant mismatch");
        }
        line.setStatus(ImportJobConstants.LINE_FAILED);
        String category = categorize(message);
        line.setErrorMessage(truncate("[" + category + "] " + (message != null ? message : "Unknown import error")));
        lineRepository.save(line);
    }

    private static String categorize(String message) {
        String m = message != null ? message.toLowerCase(Locale.ROOT) : "";
        if (m.contains("duplicate") || m.contains("already exists") || m.contains("unique")) {
            return "DUPLICATE_KEY";
        }
        if (m.contains("not found")) {
            return "FK_NOT_FOUND";
        }
        if (m.contains("conflict") || m.contains("double-booked") || m.contains("overlap")) {
            return "CONFLICT_SLOT";
        }
        if (m.contains("required") || m.contains("missing")) {
            return "REQUIRED_FIELD";
        }
        if (m.contains("invalid")) {
            return "INVALID_VALUE";
        }
        return "PROCESSING_ERROR";
    }

    private static String truncate(String message) {
        if (message == null) {
            return null;
        }
        return message.length() <= MAX_ERR ? message : message.substring(0, MAX_ERR) + "…";
    }
}
