package com.school.erp.modules.auth.repository;

import com.school.erp.modules.auth.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findFirstByTokenHashAndIsDeletedFalseAndConsumedAtIsNullOrderByIdDesc(String tokenHash);

    Optional<EmailVerificationToken> findFirstByTenantIdAndUserIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long userId);
}
