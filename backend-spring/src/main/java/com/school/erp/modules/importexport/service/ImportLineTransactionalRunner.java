package com.school.erp.modules.importexport.service;

import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.importexport.repository.ImportJobLineRepository;
import com.school.erp.modules.importexport.repository.ImportJobRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ImportLineTransactionalRunner {
    private final ImportJobRepository jobRepository;
    private final ImportJobLineRepository lineRepository;
    private final ImportRowExecutor rowExecutor;

    public ImportLineTransactionalRunner(ImportJobRepository jobRepository,
                                         ImportJobLineRepository lineRepository,
                                         ImportRowExecutor rowExecutor) {
        this.jobRepository = jobRepository;
        this.lineRepository = lineRepository;
        this.rowExecutor = rowExecutor;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public void runLine(Long jobId, Long lineId, String tenantId) throws Exception {
        ImportJob job = jobRepository.findByIdAndTenantIdAndIsDeletedFalse(jobId, tenantId).orElseThrow();
        ImportJobLine line = lineRepository.findById(lineId).orElseThrow();
        if (!tenantId.equals(line.getTenantId()) || !jobId.equals(line.getJobId())) {
            throw new IllegalStateException("Import line does not belong to job/tenant");
        }
        rowExecutor.execute(job, line);
        line.setStatus(ImportJobConstants.LINE_SUCCESS);
        line.setErrorMessage(null);
        lineRepository.save(line);
    }
}
