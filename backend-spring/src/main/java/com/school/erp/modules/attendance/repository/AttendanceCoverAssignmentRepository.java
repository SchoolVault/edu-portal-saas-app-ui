package com.school.erp.modules.attendance.repository;

import com.school.erp.modules.attendance.entity.AttendanceCoverAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceCoverAssignmentRepository extends JpaRepository<AttendanceCoverAssignment, Long> {

    List<AttendanceCoverAssignment> findByTenantIdAndCoverDateAndIsDeletedFalseOrderByIdAsc(String tenantId, LocalDate coverDate);

    List<AttendanceCoverAssignment> findByTenantIdAndCoverDateAndCoveringTeacherIdAndStatusAndIsDeletedFalse(
            String tenantId, LocalDate coverDate, Long coveringTeacherId, String status);

    @Query("SELECT c FROM AttendanceCoverAssignment c WHERE c.tenantId = :t AND c.isDeleted = false AND c.status = 'ACTIVE' "
            + "AND c.coverDate = :d AND c.coveringTeacherId = :tid AND c.classId = :classId "
            + "AND (c.sectionId IS NULL OR c.sectionId = :sectionId)")
    List<AttendanceCoverAssignment> findActiveCoversForMarking(
            @Param("t") String tenantId,
            @Param("d") LocalDate date,
            @Param("tid") Long coveringTeacherPk,
            @Param("classId") Long classId,
            @Param("sectionId") Long sectionId);
}
