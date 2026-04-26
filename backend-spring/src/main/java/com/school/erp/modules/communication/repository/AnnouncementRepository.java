package com.school.erp.modules.communication.repository;
import com.school.erp.modules.communication.entity.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    Page<Announcement> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Pageable pageable);

    @Query("""
            SELECT a FROM Announcement a WHERE a.tenantId = :t AND a.isDeleted = false
              AND (:q = '' OR LOWER(a.title) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(COALESCE(a.content, '')) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY a.createdAt DESC
            """)
    Page<Announcement> pageTenantSearch(@Param("t") String t, @Param("q") String q, Pageable pageable);

    Optional<Announcement> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    boolean existsByTenantIdAndIsDeletedFalseAndTitleIgnoreCaseAndTargetAudienceAndTargetClassIdAndTargetSectionIdAndCreatedAtAfter(
            String tenantId,
            String title,
            com.school.erp.common.enums.Enums.TargetAudience targetAudience,
            Long targetClassId,
            Long targetSectionId,
            LocalDateTime createdAtAfter);

    boolean existsByTenantIdAndIsDeletedFalseAndTitleIgnoreCaseAndTargetAudienceAndTargetClassIdAndTargetSectionId(
            String tenantId,
            String title,
            com.school.erp.common.enums.Enums.TargetAudience targetAudience,
            Long targetClassId,
            Long targetSectionId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Announcement a SET a.isDeleted = true, a.deletedAt = :now
            WHERE a.tenantId = :tenantId AND a.isDeleted = false AND a.createdAt < :cutoff
            """)
    int softDeleteTenantAnnouncementsOlderThan(
            @Param("tenantId") String tenantId,
            @Param("cutoff") LocalDateTime cutoff,
            @Param("now") LocalDateTime now);

    @Query("""
            select a from Announcement a
            where a.tenantId = :tenantId and a.isDeleted = false
              and (
                a.targetAudience = 'ALL'
                or (a.targetAudience = 'TEACHERS' and (:role = 'TEACHER' or :role = 'ADMIN' or :role = 'LIBRARY_STAFF' or :role = 'SCHOOL_STAFF' or :role = 'SUPER_ADMIN'))
                or (a.targetAudience = 'PARENTS' and (:role = 'PARENT' or :role = 'ADMIN' or :role = 'LIBRARY_STAFF' or :role = 'SCHOOL_STAFF' or :role = 'SUPER_ADMIN'))
                or (a.targetAudience = 'CLASS' and a.targetClassId in :classIds)
                or (a.targetAudience = 'SECTION' and a.targetSectionId in :sectionIds)
              )
            order by a.createdAt desc
            """)
    List<Announcement> findForAudience(@Param("tenantId") String tenantId,
                                      @Param("role") String role,
                                      @Param("classIds") List<Long> classIds,
                                      @Param("sectionIds") List<Long> sectionIds);

    @Query(value = """
            select a from Announcement a
            where a.tenantId = :tenantId and a.isDeleted = false
              and (
                a.targetAudience = 'ALL'
                or (a.targetAudience = 'TEACHERS' and (:role = 'TEACHER' or :role = 'ADMIN' or :role = 'LIBRARY_STAFF' or :role = 'SCHOOL_STAFF' or :role = 'SUPER_ADMIN'))
                or (a.targetAudience = 'PARENTS' and (:role = 'PARENT' or :role = 'ADMIN' or :role = 'LIBRARY_STAFF' or :role = 'SCHOOL_STAFF' or :role = 'SUPER_ADMIN'))
                or (a.targetAudience = 'CLASS' and a.targetClassId in :classIds)
                or (a.targetAudience = 'SECTION' and a.targetSectionId in :sectionIds)
              )
              and (:q = '' OR LOWER(a.title) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(COALESCE(a.content, '')) LIKE LOWER(CONCAT('%', :q, '%')))
            """,
            countQuery = """
            select count(a) from Announcement a
            where a.tenantId = :tenantId and a.isDeleted = false
              and (
                a.targetAudience = 'ALL'
                or (a.targetAudience = 'TEACHERS' and (:role = 'TEACHER' or :role = 'ADMIN' or :role = 'LIBRARY_STAFF' or :role = 'SCHOOL_STAFF' or :role = 'SUPER_ADMIN'))
                or (a.targetAudience = 'PARENTS' and (:role = 'PARENT' or :role = 'ADMIN' or :role = 'LIBRARY_STAFF' or :role = 'SCHOOL_STAFF' or :role = 'SUPER_ADMIN'))
                or (a.targetAudience = 'CLASS' and a.targetClassId in :classIds)
                or (a.targetAudience = 'SECTION' and a.targetSectionId in :sectionIds)
              )
              and (:q = '' OR LOWER(a.title) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(COALESCE(a.content, '')) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<Announcement> findForAudiencePaged(@Param("tenantId") String tenantId,
                                           @Param("role") String role,
                                           @Param("classIds") List<Long> classIds,
                                           @Param("sectionIds") List<Long> sectionIds,
                                           @Param("q") String q,
                                           Pageable pageable);
}
