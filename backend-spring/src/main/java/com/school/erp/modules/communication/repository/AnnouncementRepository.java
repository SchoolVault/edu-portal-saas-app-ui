package com.school.erp.modules.communication.repository;
import com.school.erp.modules.communication.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    @Query("""
            select a from Announcement a
            where a.tenantId = :tenantId and a.isDeleted = false
              and (
                a.targetAudience = 'ALL'
                or (a.targetAudience = 'TEACHERS' and :role = 'TEACHER')
                or (a.targetAudience = 'PARENTS' and :role = 'PARENT')
                or (a.targetAudience = 'CLASS' and a.targetClassId in :classIds)
                or (a.targetAudience = 'SECTION' and a.targetSectionId in :sectionIds)
              )
            order by a.createdAt desc
            """)
    List<Announcement> findForAudience(@Param("tenantId") String tenantId,
                                      @Param("role") String role,
                                      @Param("classIds") List<Long> classIds,
                                      @Param("sectionIds") List<Long> sectionIds);
}
