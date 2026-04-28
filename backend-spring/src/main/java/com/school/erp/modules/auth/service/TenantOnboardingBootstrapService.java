package com.school.erp.modules.auth.service;

import com.school.erp.modules.academic.entity.AcademicYear;
import com.school.erp.modules.leave.entity.LeaveEntitlementPolicy;
import com.school.erp.modules.leave.repository.LeaveEntitlementPolicyRepository;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

/**
 * Seeds mandatory tenant defaults immediately after onboarding.
 */
@Service
public class TenantOnboardingBootstrapService {

    private static final String DEFAULT_LIBRARY_BORROWER_POLICY_JSON =
            "{\"allowedBorrowerTypes\":[\"STUDENT\",\"STAFF\"]}";

    private static final String DEFAULT_LEAVE_APPLY_SMS_TEMPLATE =
            "Leave request from {{applicantName}} for {{startDate}} to {{endDate}} ({{leaveType}}). Status: {{status}}.";

    private static final String DEFAULT_LEAVE_DECISION_SMS_TEMPLATE =
            "Your leave for {{startDate}} to {{endDate}} ({{leaveType}}) is {{decision}}. Current status: {{status}}.";

    private final TenantConfigRepository tenantConfigRepository;
    private final LeaveEntitlementPolicyRepository leaveEntitlementPolicyRepository;

    public TenantOnboardingBootstrapService(
            TenantConfigRepository tenantConfigRepository,
            LeaveEntitlementPolicyRepository leaveEntitlementPolicyRepository) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.leaveEntitlementPolicyRepository = leaveEntitlementPolicyRepository;
    }

    @Transactional
    public void bootstrapDefaults(String tenantId, AcademicYear academicYear) {
        seedTenantConfigDefaults(tenantId);
        seedLeaveEntitlementPolicy(tenantId, academicYear);
    }

    private void seedTenantConfigDefaults(String tenantId) {
        TenantConfig config = tenantConfigRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new IllegalStateException("Tenant settings missing for tenant bootstrap: " + tenantId));
        boolean changed = false;
        if (isBlank(config.getLeaveSmsApplyTemplate())) {
            config.setLeaveSmsApplyTemplate(DEFAULT_LEAVE_APPLY_SMS_TEMPLATE);
            changed = true;
        }
        if (isBlank(config.getLeaveSmsDecisionTemplate())) {
            config.setLeaveSmsDecisionTemplate(DEFAULT_LEAVE_DECISION_SMS_TEMPLATE);
            changed = true;
        }
        if (isBlank(config.getLibraryBorrowerPolicyJson())) {
            config.setLibraryBorrowerPolicyJson(DEFAULT_LIBRARY_BORROWER_POLICY_JSON);
            changed = true;
        }
        if (changed) {
            tenantConfigRepository.save(config);
        }
    }

    private void seedLeaveEntitlementPolicy(String tenantId, AcademicYear academicYear) {
        String policyYearLabel = academicYear != null && !isBlank(academicYear.getName())
                ? academicYear.getName().trim()
                : null;
        LeaveEntitlementPolicy existing = leaveEntitlementPolicyRepository.findByTenantIdAndIsDeletedFalse(tenantId).orElse(null);
        if (existing == null) {
            LeaveEntitlementPolicy policy = new LeaveEntitlementPolicy();
            policy.setTenantId(tenantId);
            policy.setIsActive(true);
            policy.setIsDeleted(false);
            policy.setAnnualEntitled(24);
            policy.setSickEntitled(12);
            policy.setCasualEntitled(12);
            policy.setPolicyYearLabel(policyYearLabel);
            leaveEntitlementPolicyRepository.save(policy);
            return;
        }
        if (isBlank(existing.getPolicyYearLabel()) && !Objects.isNull(policyYearLabel)) {
            existing.setPolicyYearLabel(policyYearLabel);
            leaveEntitlementPolicyRepository.save(existing);
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
