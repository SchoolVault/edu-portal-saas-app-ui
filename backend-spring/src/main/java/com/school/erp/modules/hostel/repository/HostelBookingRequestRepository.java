package com.school.erp.modules.hostel.repository;

import com.school.erp.modules.hostel.entity.HostelBookingRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface HostelBookingRequestRepository extends JpaRepository<HostelBookingRequest, Long> {
    List<HostelBookingRequest> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    List<HostelBookingRequest> findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, String status);

    List<HostelBookingRequest> findByTenantIdAndParentUserIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long parentUserId);

    @Query("""
            select h from HostelBookingRequest h
            where h.tenantId = :tenantId
              and h.isDeleted = false
              and (:status is null or upper(h.status) = upper(:status))
              and (:studentId is null or h.studentId = :studentId)
              and (
                    :query is null
                    or lower(coalesce(h.studentName, '')) like lower(concat('%', :query, '%'))
                    or lower(coalesce(h.preferredRoomType, '')) like lower(concat('%', :query, '%'))
                    or lower(coalesce(h.requestNote, '')) like lower(concat('%', :query, '%'))
                  )
            order by h.createdAt desc
            """)
    Page<HostelBookingRequest> searchDeskBookings(
            String tenantId,
            String status,
            Long studentId,
            String query,
            Pageable pageable);

    Optional<HostelBookingRequest> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
