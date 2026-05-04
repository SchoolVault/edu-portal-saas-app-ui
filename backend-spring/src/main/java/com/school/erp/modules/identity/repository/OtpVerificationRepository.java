package com.school.erp.modules.identity.repository;

import com.school.erp.modules.identity.entity.OtpVerification;
import com.school.erp.modules.identity.enums.OtpPurpose;
import com.school.erp.modules.identity.enums.OtpStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    /**
     * Find latest pending OTP for phone and purpose.
     */
    @Query("SELECT o FROM OtpVerification o " +
           "WHERE o.phone IN :phones AND o.tenantId = :tenantId " +
           "AND o.purpose = :purpose AND o.status = :status " +
           "AND o.expiresAt > :now AND o.isDeleted = false " +
           "ORDER BY o.createdAt DESC LIMIT 1")
    Optional<OtpVerification> findLatestPendingOtp(
        @Param("phones") Collection<String> phones,
        @Param("tenantId") String tenantId,
        @Param("purpose") OtpPurpose purpose,
        @Param("status") OtpStatus status,
        @Param("now") LocalDateTime now);

    /**
     * Find all OTPs for a phone number (for rate limiting).
     */
    @Query("SELECT o FROM OtpVerification o " +
           "WHERE o.phone IN :phones AND o.tenantId = :tenantId " +
           "AND o.createdAt > :since AND o.isDeleted = false " +
           "ORDER BY o.createdAt DESC")
    List<OtpVerification> findRecentOtpsByPhoneIn(
        @Param("phones") Collection<String> phones,
        @Param("tenantId") String tenantId,
        @Param("since") LocalDateTime since);

    /**
     * Mark expired OTPs.
     */
    @Modifying
    @Query("UPDATE OtpVerification o SET o.status = :expiredStatus, o.updatedAt = :now " +
           "WHERE o.status = :pendingStatus AND o.expiresAt <= :now")
    int markExpiredOtps(
        @Param("pendingStatus") OtpStatus pendingStatus,
        @Param("expiredStatus") OtpStatus expiredStatus,
        @Param("now") LocalDateTime now);

    /**
     * Delete old OTP records (cleanup job).
     */
    @Modifying
    @Query("UPDATE OtpVerification o SET o.isDeleted = true " +
           "WHERE o.createdAt < :cutoffDate")
    int cleanupOldOtps(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Soft-delete rows that can no longer be used for verification:
     * <ul>
     *   <li>{@code PENDING} where {@code expiresAt} is in the past (expired)</li>
     *   <li>Terminal statuses ({@code VERIFIED}, {@code FAILED}, {@code EXPIRED}) older than {@code terminalCutoff}</li>
     * </ul>
     * Active {@code PENDING} OTPs (not yet expired) are never touched.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE OtpVerification o SET o.isDeleted = true, o.updatedAt = :now WHERE o.isDeleted = false AND ("
            + "(o.status = com.school.erp.modules.identity.enums.OtpStatus.PENDING AND o.expiresAt < :now) OR "
            + "(o.status IN (com.school.erp.modules.identity.enums.OtpStatus.VERIFIED, "
            + "com.school.erp.modules.identity.enums.OtpStatus.FAILED, "
            + "com.school.erp.modules.identity.enums.OtpStatus.EXPIRED) AND o.updatedAt < :terminalCutoff))")
    int softDeleteNonActionable(@Param("now") LocalDateTime now, @Param("terminalCutoff") LocalDateTime terminalCutoff);

    /**
     * Count OTPs by status for monitoring.
     */
    long countByTenantIdAndStatusAndCreatedAtAfter(
        String tenantId, OtpStatus status, LocalDateTime after);

    /**
     * Find OTP by request ID (for tracing).
     */
    Optional<OtpVerification> findByRequestIdAndIsDeletedFalse(String requestId);

    Optional<OtpVerification> findByExchangeTokenAndPhoneInAndTenantIdAndIsDeletedFalse(
            String exchangeToken, Collection<String> phones, String tenantId);
}
