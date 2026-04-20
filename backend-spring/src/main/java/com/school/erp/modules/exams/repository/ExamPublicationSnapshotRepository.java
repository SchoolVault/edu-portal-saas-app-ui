package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ExamPublicationSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExamPublicationSnapshotRepository extends JpaRepository<ExamPublicationSnapshot, Long> {
    List<ExamPublicationSnapshot> findByTenantIdAndExamIdAndIsDeletedFalseOrderByVersionNoDesc(String tenantId, Long examId);
    Optional<ExamPublicationSnapshot> findByTenantIdAndExamIdAndVersionNoAndIsDeletedFalse(String tenantId, Long examId, Integer versionNo);
}
