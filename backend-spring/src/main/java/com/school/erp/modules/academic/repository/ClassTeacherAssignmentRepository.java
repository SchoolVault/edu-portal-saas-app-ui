package com.school.erp.modules.academic.repository;

import com.school.erp.modules.academic.entity.ClassTeacherAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ClassTeacherAssignmentRepository extends JpaRepository<ClassTeacherAssignment, Long> {

    @Query(
            "SELECT a FROM ClassTeacherAssignment a WHERE a.tenantId = :t AND a.isDeleted = false "
                    + "AND a.classId = :classId AND (:sectionId IS NULL OR a.sectionId IS NULL OR a.sectionId = :sectionId) "
                    + "AND (a.effectiveTo IS NULL OR a.effectiveTo >= :d)")
    List<ClassTeacherAssignment> findActiveForClass(
            @Param("t") String tenantId, @Param("classId") Long classId, @Param("sectionId") Long sectionId, @Param("d") LocalDate d);

    @Query(
            "SELECT a FROM ClassTeacherAssignment a WHERE a.tenantId = :t AND a.isDeleted = false AND a.teacherId = :tid "
                    + "AND a.effectiveFrom <= :d AND (a.effectiveTo IS NULL OR a.effectiveTo >= :d)")
    List<ClassTeacherAssignment> findActiveForTeacher(@Param("t") String tenantId, @Param("tid") Long teacherId, @Param("d") LocalDate d);

    /**
     * All homeroom assignments active on calendar date {@code d} (one query for teacher-directory homeroom labels).
     */
    @Query(
            "SELECT a FROM ClassTeacherAssignment a WHERE a.tenantId = :t AND a.isDeleted = false "
                    + "AND a.effectiveFrom <= :d AND (a.effectiveTo IS NULL OR a.effectiveTo >= :d)")
    List<ClassTeacherAssignment> findAllActiveOnOrAfter(@Param("t") String tenantId, @Param("d") LocalDate d);

    /** Whole-class slot uses {@code sectionId == null}; section slot uses concrete section id. */
    @Query(
            "SELECT a FROM ClassTeacherAssignment a WHERE a.tenantId = :t AND a.isDeleted = false "
                    + "AND a.classId = :classId "
                    + "AND ((:sectionId IS NULL AND a.sectionId IS NULL) OR (:sectionId IS NOT NULL AND a.sectionId = :sectionId)) "
                    + "AND (a.effectiveTo IS NULL OR a.effectiveTo >= :d)")
    List<ClassTeacherAssignment> findActiveHomeroomSlot(
            @Param("t") String tenantId,
            @Param("classId") Long classId,
            @Param("sectionId") Long sectionId,
            @Param("d") LocalDate d);
}
