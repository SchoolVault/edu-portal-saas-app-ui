package com.school.erp.modules.auth.repository;

import com.school.erp.modules.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenAndIsDeletedFalse(String token);
    List<RefreshToken> findByTenantIdAndUserIdAndIsDeletedFalse(String tenantId, Long userId);
}
