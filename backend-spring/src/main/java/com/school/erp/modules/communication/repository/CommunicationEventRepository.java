package com.school.erp.modules.communication.repository;

import com.school.erp.modules.communication.entity.CommunicationEvent;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunicationEventRepository extends JpaRepository<CommunicationEvent, Long> {
    @Query("select distinct e.tenantId from CommunicationEvent e where e.isDeleted = false")
    List<String> findDistinctTenantIds();

    @Query("""
            select e from CommunicationEvent e
            where e.tenantId = :tenantId and e.isDeleted = false
            order by e.eventStartAt asc, e.createdAt desc
            """)
    Page<CommunicationEvent> pageForTenant(@Param("tenantId") String tenantId, Pageable pageable);

    @Query("""
            select e from CommunicationEvent e
            where e.tenantId = :tenantId and e.isDeleted = false
              and (
                e.audienceScope = 'ALL'
                or (e.audienceScope = 'TEACHERS' and (:role = 'TEACHER' or :role = 'ADMIN' or :role = 'LIBRARY_STAFF' or :role = 'SUPER_ADMIN'))
                or (e.audienceScope = 'PARENTS' and (:role = 'PARENT' or :role = 'ADMIN' or :role = 'LIBRARY_STAFF' or :role = 'SUPER_ADMIN'))
                or (e.audienceScope = 'CLASS' and e.targetClassId in :classIds)
                or (e.audienceScope = 'SECTION' and e.targetSectionId in :sectionIds)
              )
            order by e.eventStartAt asc, e.createdAt desc
            """)
    Page<CommunicationEvent> pageForAudience(
            @Param("tenantId") String tenantId,
            @Param("role") String role,
            @Param("classIds") List<Long> classIds,
            @Param("sectionIds") List<Long> sectionIds,
            Pageable pageable);

    @Query("""
            select e from CommunicationEvent e
            where e.tenantId = :tenantId and e.isDeleted = false
              and e.status in ('SCHEDULED', 'PUBLISHED')
              and e.eventStartAt >= :now
            order by e.eventStartAt asc
            """)
    Page<CommunicationEvent> pageUpcoming(@Param("tenantId") String tenantId, @Param("now") LocalDateTime now, Pageable pageable);

    @Query("""
            select e from CommunicationEvent e
            where e.tenantId = :tenantId and e.isDeleted = false
              and e.status = 'SCHEDULED'
              and e.publishAt is not null
              and e.publishAt <= :now
            order by e.publishAt asc
            """)
    List<CommunicationEvent> findReadyToPublish(@Param("tenantId") String tenantId, @Param("now") LocalDateTime now, Pageable pageable);

    @Query("""
            select e from CommunicationEvent e
            where e.tenantId = :tenantId and e.isDeleted = false
              and e.status in ('SCHEDULED','PUBLISHED')
              and e.eventStartAt > :fromTs and e.eventStartAt <= :toTs
              and e.reminder1dSentAt is null
            order by e.eventStartAt asc
            """)
    List<CommunicationEvent> findDueForOneDayReminder(
            @Param("tenantId") String tenantId,
            @Param("fromTs") LocalDateTime fromTs,
            @Param("toTs") LocalDateTime toTs,
            Pageable pageable);

    @Query("""
            select e from CommunicationEvent e
            where e.tenantId = :tenantId and e.isDeleted = false
              and e.status in ('SCHEDULED','PUBLISHED')
              and e.eventStartAt > :fromTs and e.eventStartAt <= :toTs
              and e.reminder1hSentAt is null
            order by e.eventStartAt asc
            """)
    List<CommunicationEvent> findDueForOneHourReminder(
            @Param("tenantId") String tenantId,
            @Param("fromTs") LocalDateTime fromTs,
            @Param("toTs") LocalDateTime toTs,
            Pageable pageable);

    /**
     * Runs in its own transaction so {@code flushAutomatically} is safe when invoked from schedulers
     * (no enclosing Spring transaction).
     */
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update CommunicationEvent e
            set e.status = 'COMPLETED', e.completedAt = :now
            where e.tenantId = :tenantId and e.isDeleted = false
              and e.status in ('SCHEDULED','PUBLISHED')
              and e.eventEndAt is not null
              and e.eventEndAt < :now
            """)
    int markCompletedPastEvents(@Param("tenantId") String tenantId, @Param("now") LocalDateTime now);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update CommunicationEvent e
            set e.isDeleted = true, e.deletedAt = :now
            where e.tenantId = :tenantId and e.isDeleted = false
              and (
                (e.status in ('COMPLETED','CANCELLED') and coalesce(e.completedAt, e.cancelledAt, e.updatedAt, e.createdAt) < :cutoff)
                or (e.status = 'PUBLISHED' and coalesce(e.eventEndAt, e.eventStartAt, e.publishedAt, e.createdAt) < :cutoff)
              )
            """)
    int softDeleteTenantEventsOlderThan(
            @Param("tenantId") String tenantId,
            @Param("cutoff") LocalDateTime cutoff,
            @Param("now") LocalDateTime now);
}
