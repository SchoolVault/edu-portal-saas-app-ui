package com.school.erp.modules.leave.job;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.leave.entity.LeaveEntitlementPolicy;
import com.school.erp.modules.leave.repository.LeaveEntitlementLedgerRepository;
import com.school.erp.modules.leave.repository.LeaveEntitlementPolicyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@ConditionalOnProperty(prefix = "app.leave.reliability", name = "enabled", havingValue = "true", matchIfMissing = true)
public class LeaveEntitlementHealthJob {

    private static final Logger log = LoggerFactory.getLogger(LeaveEntitlementHealthJob.class);
    private static final String LEAVE_TYPE_ANNUAL = Enums.LeaveTypeCode.ANNUAL.name();
    private static final String ENTRY_OPENING_ALLOCATION = "OPENING_ALLOCATION";
    private static final String REF_BULK_ALLOCATION = "BULK_ALLOCATION";

    private final UserRepository userRepository;
    private final LeaveEntitlementPolicyRepository policyRepository;
    private final LeaveEntitlementLedgerRepository ledgerRepository;

    public LeaveEntitlementHealthJob(
            UserRepository userRepository,
            LeaveEntitlementPolicyRepository policyRepository,
            LeaveEntitlementLedgerRepository ledgerRepository) {
        this.userRepository = userRepository;
        this.policyRepository = policyRepository;
        this.ledgerRepository = ledgerRepository;
    }

    @Scheduled(cron = "${app.leave.reliability.cron:0 0 3 * * MON}")
    public void auditMissingOpeningAllocations() {
        List<User> activeUsers = userRepository.findAll().stream()
                .filter(u -> u.getTenantId() != null && !u.getTenantId().isBlank())
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()))
                .filter(u -> u.getRole() == Enums.Role.TEACHER || u.getRole() == Enums.Role.SCHOOL_STAFF || u.getRole() == Enums.Role.LIBRARY_STAFF)
                .toList();
        Map<String, List<User>> byTenant = activeUsers.stream().collect(Collectors.groupingBy(User::getTenantId));
        for (Map.Entry<String, List<User>> entry : byTenant.entrySet()) {
            String tenantId = entry.getKey();
            String policyYearLabel = resolvePolicyYearLabel(tenantId);
            long missing = entry.getValue().stream()
                    .filter(u -> u.getId() != null)
                    .filter(u -> !ledgerRepository.existsByTenantIdAndUserIdAndLeaveTypeAndPolicyYearLabelAndEntryTypeAndReferenceTypeAndReferenceIdAndIsDeletedFalse(
                            tenantId,
                            u.getId(),
                            LEAVE_TYPE_ANNUAL,
                            policyYearLabel,
                            ENTRY_OPENING_ALLOCATION,
                            REF_BULK_ALLOCATION,
                            0L))
                    .count();
            if (missing > 0) {
                log.warn("Leave entitlement health: tenant={} has {} active users without opening allocation for policyYearLabel={}",
                        tenantId, missing, policyYearLabel);
            } else {
                log.info("Leave entitlement health: tenant={} allocation coverage is healthy for policyYearLabel={}",
                        tenantId, policyYearLabel);
            }
        }
    }

    private String resolvePolicyYearLabel(String tenantId) {
        LeaveEntitlementPolicy policy = policyRepository.findByTenantIdAndIsDeletedFalse(tenantId).orElse(null);
        if (policy == null || policy.getPolicyYearLabel() == null || policy.getPolicyYearLabel().isBlank()) {
            return "CURRENT";
        }
        return policy.getPolicyYearLabel().trim().toUpperCase(Locale.ROOT);
    }
}
