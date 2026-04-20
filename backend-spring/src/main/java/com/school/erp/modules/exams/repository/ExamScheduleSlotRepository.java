package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ExamScheduleSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.time.LocalDate;
import java.util.List;

public interface ExamScheduleSlotRepository extends JpaRepository<ExamScheduleSlot, Long> {
    List<ExamScheduleSlot> findByTenantIdAndExamIdAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(String tenantId, Long examId);

    List<ExamScheduleSlot> findByTenantIdAndExamIdInAndIsDeletedFalseOrderByExamDateAscStartTimeAsc(String tenantId, Collection<Long> examIds);

    @Query("SELECT s FROM ExamScheduleSlot s WHERE s.tenantId = :tenantId AND s.isDeleted = false AND s.examDate = :examDate AND s.examId <> :examId")
    List<ExamScheduleSlot> findByTenantIdAndExamDateAndOtherExam(@Param("tenantId") String tenantId, @Param("examDate") LocalDate examDate, @Param("examId") Long examId);
}
