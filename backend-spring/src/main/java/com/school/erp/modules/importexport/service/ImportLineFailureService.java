package com.school.erp.modules.importexport.service;

import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.importexport.repository.ImportJobLineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

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
        line.setErrorMessage(truncate(message));
        lineRepository.save(line);
    }

    private static String truncate(String message) {
        if (message == null) {
            return null;
        }
        return message.length() <= MAX_ERR ? message : message.substring(0, MAX_ERR) + "…";
    }
}
