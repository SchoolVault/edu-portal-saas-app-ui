package com.school.erp.modules.importexport.service;

import com.school.erp.common.importer.ImportLineOutcome;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.importexport.entity.ImportLedgerEntry;
import com.school.erp.modules.importexport.observability.ImportMetricsRecorder;
import com.school.erp.modules.importexport.repository.ImportLedgerEntryRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Appends one ledger row for each successfully committed import line.
 */
@Service
public class ImportLedgerWriteService {
    private final ImportLedgerEntryRepository importLedgerEntryRepository;
    private final ImportMetricsRecorder importMetricsRecorder;

    public ImportLedgerWriteService(ImportLedgerEntryRepository importLedgerEntryRepository,
                                   ImportMetricsRecorder importMetricsRecorder) {
        this.importLedgerEntryRepository = importLedgerEntryRepository;
        this.importMetricsRecorder = importMetricsRecorder;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void recordLine(
            ImportJob job,
            ImportJobLine line,
            ImportLineOutcome outcome,
            String entityType,
            Long entityId,
            String naturalKey) {
        String tid = TenantContext.getTenantId();
        if (tid == null || tid.isBlank()) {
            return;
        }
        ImportLedgerEntry e = new ImportLedgerEntry();
        e.setTenantId(tid);
        e.setJobId(job.getId());
        e.setJobLineId(line.getId());
        e.setLineIndex(line.getLineIndex());
        e.setOutcome(outcome.name());
        e.setEntityType(entityType);
        e.setEntityId(entityId);
        e.setNaturalKey(naturalKey);
        e.setRollbackGuidance(ImportRollbackGuidanceFactory.build(entityType, outcome, naturalKey));
        e.setIsDeleted(false);
        importLedgerEntryRepository.save(e);
        importMetricsRecorder.incrementLedgerRowsWritten(1);
    }
}
