package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ExamScheduleSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ExamScheduleSlotRepository extends JpaRepository<ExamScheduleSlot, Long> {
    List<ExamScheduleSlot> findByTenantIdAndExamIdAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(String tenantId, Long examId);

    List<ExamScheduleSlot> findByTenantIdAndExamIdInAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(String tenantId, Collection<Long> examIds);
}
