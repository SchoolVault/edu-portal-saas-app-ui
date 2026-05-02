package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.StudentLedgerEntryV2;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentLedgerEntryV2Repository extends JpaRepository<StudentLedgerEntryV2, Long> {
    List<StudentLedgerEntryV2> findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByTxnTimeAscIdAsc(
            String tenantId, Long academicYearId, Long studentId);
}
