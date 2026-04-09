package com.school.erp.modules.academic.repository;

import com.school.erp.modules.academic.entity.SubjectTeacherAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SubjectTeacherAssignmentRepository extends JpaRepository<SubjectTeacherAssignment, Long> {

    @Query(
            "SELECT a FROM SubjectTeacherAssignment a WHERE a.tenantId = :t AND a.isDeleted = false AND a.classId = :classId "
                    + "AND (:sectionId IS NULL OR a.sectionId IS NULL OR a.sectionId = :sectionId) "
                    + "AND (a.effectiveTo IS NULL OR a.effectiveTo >= :d)")
    List<SubjectTeacherAssignment> findActiveForClass(
            @Param("t") String tenantId, @Param("classId") Long classId, @Param("sectionId") Long sectionId, @Param("d") LocalDate d);

    @Query(
            "SELECT a FROM SubjectTeacherAssignment a WHERE a.tenantId = :t AND a.isDeleted = false AND a.teacherId = :tid "
                    + "AND (a.effectiveTo IS NULL OR a.effectiveTo >= :d)")
    List<SubjectTeacherAssignment> findActiveForTeacher(@Param("t") String tenantId, @Param("tid") Long teacherId, @Param("d") LocalDate d);
}
