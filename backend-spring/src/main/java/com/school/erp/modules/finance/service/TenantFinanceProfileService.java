package com.school.erp.modules.finance.service;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.audit.service.AuditService;
import com.school.erp.modules.finance.domain.FeeSettlementMode;
import com.school.erp.modules.finance.domain.PaymentRoutingOnboardingStatus;
import com.school.erp.modules.finance.dto.TenantFinanceProfileDTOs;
import com.school.erp.modules.finance.entity.TenantFinanceProfile;
import com.school.erp.modules.finance.repository.TenantFinanceProfileRepository;
import com.school.erp.tenant.TenantContext;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantFinanceProfileService {

    private static final int DECLARATION_MIN_LEN = 30;
    private static final int DECLARATION_MAX_LEN = 2000;

    private final TenantFinanceProfileRepository repository;
    private final AuditService auditService;

    public TenantFinanceProfileService(TenantFinanceProfileRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public TenantFinanceProfileDTOs.FinanceProfileResponse getCurrentTenantProfile() {
        String tenantId = TenantContext.getTenantId();
        return repository.findByTenantIdAndIsDeletedFalse(tenantId).map(r -> toResponse(r, false)).orElseGet(() -> emptyResponse(tenantId));
    }

    /** Platform operator read (full linked account id for verification). */
    @Transactional(readOnly = true)
    public TenantFinanceProfileDTOs.FinanceProfileResponse getProfileForTenant(String tenantId) {
        TenantFinanceProfile row =
                repository.findByTenantIdAndIsDeletedFalse(tenantId).orElseThrow(() -> new ResourceNotFoundException("Finance profile"));
        return toResponse(row, true);
    }

    @Transactional
    public TenantFinanceProfileDTOs.FinanceProfileResponse upsert(TenantFinanceProfileDTOs.FinanceProfileUpdateRequest req) {
        String tenantId = TenantContext.getTenantId();
        TenantFinanceProfile row = repository.findByTenantIdAndIsDeletedFalse(tenantId).orElseGet(() -> {
            TenantFinanceProfile n = new TenantFinanceProfile();
            n.setTenantId(tenantId);
            n.setIsActive(true);
            n.setIsDeleted(false);
            n.setPaymentRoutingOnboardingStatus(PaymentRoutingOnboardingStatus.NOT_REQUIRED.name());
            n.setPlatformCommissionBps(0);
            n.setParentOnlineFeeCheckoutEnabled(true);
            n.setPayrollDigitalPayoutEnabled(false);
            return n;
        });

        String prevMode = row.getFeeSettlementMode();
        String prevAcc = row.getRazorpayRouteLinkedAccountId();
        int prevBps = row.getPlatformCommissionBps();
        String prevOnboarding = normalizeOnboardingStatus(row.getPaymentRoutingOnboardingStatus());
        boolean prevParentOnline = row.isParentOnlineFeeCheckoutEnabled();
        boolean prevPayrollDigitalPayout = row.isPayrollDigitalPayoutEnabled();

        if (req.getFeeSettlementMode() != null && !req.getFeeSettlementMode().isBlank()) {
            FeeSettlementMode mode = parseMode(req.getFeeSettlementMode());
            row.setFeeSettlementMode(mode.name());
        }
        if (req.getRazorpayRouteLinkedAccountId() != null) {
            String acc = req.getRazorpayRouteLinkedAccountId().trim();
            if (!acc.isEmpty() && !acc.startsWith("acc_")) {
                throw new BusinessException("Razorpay linked account id must look like acc_…");
            }
            row.setRazorpayRouteLinkedAccountId(acc.isEmpty() ? null : acc);
        }
        if (req.getPlatformCommissionBps() != null) {
            int bps = req.getPlatformCommissionBps();
            if (bps < 0 || bps > 10000) {
                throw new BusinessException("platformCommissionBps must be between 0 and 10000 (100.00%)");
            }
            row.setPlatformCommissionBps(bps);
        }
        if (req.getFinanceNotes() != null) {
            row.setFinanceNotes(trimNotes(req.getFinanceNotes()));
        }
        // parent_online_fee_checkout_enabled is derived from fee_settlement_mode (see sync below).

        if (FeeSettlementMode.ROUTE_LINKED_ACCOUNT.name().equals(row.getFeeSettlementMode())) {
            if (row.getRazorpayRouteLinkedAccountId() == null || row.getRazorpayRouteLinkedAccountId().isBlank()) {
                throw new BusinessException("Route settlement requires razorpayRouteLinkedAccountId");
            }
        }

        reconcileOnboardingAfterSchoolEdit(row, prevMode, prevAcc, prevBps, prevOnboarding);
        syncParentOnlineCheckoutWithSettlementMode(row);
        if (req.getPayrollDigitalPayoutEnabled() != null) {
            row.setPayrollDigitalPayoutEnabled(req.getPayrollDigitalPayoutEnabled());
        }

        TenantFinanceProfile saved = repository.save(row);
        String narrative =
                describeFinanceUpsertChange(
                        prevMode,
                        prevAcc,
                        prevBps,
                        prevOnboarding,
                        prevParentOnline,
                        prevPayrollDigitalPayout,
                        saved);
        auditService.logUpdate(
                "Fees",
                narrative,
                saved.getId(),
                summarize(prevMode, prevAcc, prevBps, prevOnboarding, prevParentOnline, prevPayrollDigitalPayout),
                summarize(
                        saved.getFeeSettlementMode(),
                        saved.getRazorpayRouteLinkedAccountId(),
                        saved.getPlatformCommissionBps(),
                        saved.getPaymentRoutingOnboardingStatus(),
                        saved.isParentOnlineFeeCheckoutEnabled(),
                        saved.isPayrollDigitalPayoutEnabled()));
        return toResponse(saved, false);
    }

    @Transactional
    public TenantFinanceProfileDTOs.FinanceProfileResponse submitForReview(TenantFinanceProfileDTOs.FinanceProfileSubmitRequest req) {
        if (req == null || req.getDeclaration() == null) {
            throw new BusinessException("declaration is required");
        }
        String tenantId = TenantContext.getTenantId();
        TenantFinanceProfile row = repository
                .findByTenantIdAndIsDeletedFalse(tenantId)
                .orElseThrow(() -> new BusinessException("Save finance settings once before submitting for review"));
        if (!FeeSettlementMode.ROUTE_LINKED_ACCOUNT.name().equals(row.getFeeSettlementMode())) {
            throw new BusinessException("Submit for review applies only when fee settlement mode is ROUTE_LINKED_ACCOUNT");
        }
        if (row.getRazorpayRouteLinkedAccountId() == null || row.getRazorpayRouteLinkedAccountId().isBlank()) {
            throw new BusinessException("Linked account id is required before submit");
        }
        String st = normalizeOnboardingStatus(row.getPaymentRoutingOnboardingStatus());
        if (PaymentRoutingOnboardingStatus.SUBMITTED.name().equals(st)) {
            throw new BusinessException(
                    "This setup is already submitted for platform review. Wait for approval, or withdraw submission to edit.");
        }
        if (!PaymentRoutingOnboardingStatus.DRAFT.name().equals(st)
                && !PaymentRoutingOnboardingStatus.PENDING_CHANGES.name().equals(st)) {
            throw new BusinessException("Cannot submit from status " + st + ". Save Route settings or contact support.");
        }
        String decl = req.getDeclaration().trim();
        if (decl.length() < DECLARATION_MIN_LEN) {
            throw new BusinessException("Declaration must be at least " + DECLARATION_MIN_LEN + " characters");
        }
        if (decl.length() > DECLARATION_MAX_LEN) {
            throw new BusinessException("Declaration must be at most " + DECLARATION_MAX_LEN + " characters");
        }
        row.setPaymentRoutingOnboardingDeclaration(decl);
        row.setPaymentRoutingSubmittedAt(LocalDateTime.now());
        row.setPaymentRoutingOnboardingStatus(PaymentRoutingOnboardingStatus.SUBMITTED.name());
        TenantFinanceProfile saved = repository.save(row);
        auditService.logUpdate(
                "Fees",
                "Payment routing: submitted for platform review (declaration recorded)",
                saved.getId(),
                st,
                PaymentRoutingOnboardingStatus.SUBMITTED.name());
        return toResponse(saved, false);
    }

    @Transactional
    public TenantFinanceProfileDTOs.FinanceProfileResponse withdrawSubmission() {
        String tenantId = TenantContext.getTenantId();
        TenantFinanceProfile row =
                repository.findByTenantIdAndIsDeletedFalse(tenantId).orElseThrow(() -> new ResourceNotFoundException("Finance profile"));
        if (!PaymentRoutingOnboardingStatus.SUBMITTED.name().equals(normalizeOnboardingStatus(row.getPaymentRoutingOnboardingStatus()))) {
            throw new BusinessException("Withdraw is only available while status is SUBMITTED");
        }
        row.setPaymentRoutingOnboardingStatus(PaymentRoutingOnboardingStatus.DRAFT.name());
        row.setPaymentRoutingSubmittedAt(null);
        row.setPaymentRoutingOnboardingDeclaration(null);
        TenantFinanceProfile saved = repository.save(row);
        auditService.logUpdate(
                "Fees",
                "Payment routing: school withdrew submission (back to draft for edits)",
                saved.getId(),
                "SUBMITTED",
                "DRAFT");
        return toResponse(saved, false);
    }

    @Transactional
    public TenantFinanceProfileDTOs.FinanceProfileResponse approveLiveForTenant(String tenantId, Long platformUserId) {
        TenantFinanceProfile row =
                repository.findByTenantIdAndIsDeletedFalse(tenantId).orElseThrow(() -> new ResourceNotFoundException("Finance profile"));
        if (!FeeSettlementMode.ROUTE_LINKED_ACCOUNT.name().equals(row.getFeeSettlementMode())) {
            throw new BusinessException("Tenant is not configured for Route settlement");
        }
        if (!PaymentRoutingOnboardingStatus.SUBMITTED.name().equals(normalizeOnboardingStatus(row.getPaymentRoutingOnboardingStatus()))) {
            throw new BusinessException("Can only approve LIVE from SUBMITTED; current=" + row.getPaymentRoutingOnboardingStatus());
        }
        if (row.getRazorpayRouteLinkedAccountId() == null || row.getRazorpayRouteLinkedAccountId().isBlank()) {
            throw new BusinessException("Missing linked account id");
        }
        row.setPaymentRoutingOnboardingStatus(PaymentRoutingOnboardingStatus.LIVE.name());
        row.setPaymentRoutingLiveAt(LocalDateTime.now());
        row.setPaymentRoutingLiveByUserId(platformUserId);
        TenantFinanceProfile saved = repository.save(row);
        String prevTenant = TenantContext.getTenantId();
        try {
            TenantContext.setTenantId(tenantId);
            auditService.logUpdate(
                    "Fees",
                    "Payment routing: platform approved Route settlement as LIVE for workspace " + tenantId,
                    saved.getId(),
                    "SUBMITTED",
                    "LIVE");
        } finally {
            if (prevTenant != null) {
                TenantContext.setTenantId(prevTenant);
            } else {
                TenantContext.clear();
            }
        }
        return toResponse(saved, true);
    }

    /**
     * Online parent checkout is allowed only when settlement is not {@link FeeSettlementMode#OFFLINE_SCHOOL_COLLECTION}.
     * No finance row yet: treat as legacy/open (true) until the school saves Finance & payments once.
     * Schools may use offline/counter for parents while keeping Route metadata for a future go-live.
     */
    @Transactional(readOnly = true)
    public boolean isParentOnlineFeeCheckoutEnabled(String tenantId) {
        return repository
                .findByTenantIdAndIsDeletedFalse(tenantId)
                .map(p -> !FeeSettlementMode.OFFLINE_SCHOOL_COLLECTION.name().equals(p.getFeeSettlementMode()))
                .orElse(true);
    }

    /** Gate for parent fee checkout API before env provider checks and Route LIVE rules. */
    @Transactional(readOnly = true)
    public void assertParentOnlineFeeCheckoutAllowed(String tenantId) {
        if (!isParentOnlineFeeCheckoutEnabled(tenantId)) {
            throw new BusinessException(
                    "Online fee payment is turned off for this school. Parents should pay at the school; "
                            + "balances update when staff records the payment in Fees.");
        }
    }

    /**
     * In-app salary initiation via the configured {@link com.school.erp.modules.payroll.payout.PayrollPayoutGatewayClient} is
     * opt-in per tenant (default: off — external payout + mark paid in app).
     */
    @Transactional(readOnly = true)
    public boolean isPayrollDigitalPayoutEnabled(String tenantId) {
        return repository
                .findByTenantIdAndIsDeletedFalse(tenantId)
                .map(TenantFinanceProfile::isPayrollDigitalPayoutEnabled)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public void assertPayrollDigitalPayoutInitiationAllowed(String tenantId) {
        if (!isPayrollDigitalPayoutEnabled(tenantId)) {
            throw new BusinessException(
                    "Digital salary payout is turned off for this school. Pay teachers via your bank or usual process, "
                            + "then use Payroll → mark paid. Enable the digital salary payout option in Settings → "
                            + "Finance & payments when your school is ready to use the in-app transfer.");
        }
    }

    /**
     * Blocks parent Razorpay checkout when Route is selected but platform has not approved LIVE yet.
     */
    @Transactional(readOnly = true)
    public void assertRazorpayRouteParentCheckoutAllowed(String tenantId) {
        TenantFinanceProfile p = repository.findByTenantIdAndIsDeletedFalse(tenantId).orElse(null);
        if (p == null || !FeeSettlementMode.ROUTE_LINKED_ACCOUNT.name().equals(p.getFeeSettlementMode())) {
            return;
        }
        String st = normalizeOnboardingStatus(p.getPaymentRoutingOnboardingStatus());
        if (!PaymentRoutingOnboardingStatus.LIVE.name().equals(st)) {
            String hint =
                    switch (st) {
                        case "SUBMITTED" ->
                                "The school has submitted Route settlement for platform review. Parents cannot pay online on this path until a platform administrator marks it LIVE.";
                        case "PENDING_CHANGES" ->
                                "Route settlement was edited after going LIVE. The school must submit again for platform review before parents can pay online on this path.";
                        case "DRAFT" ->
                                "Route settlement is not active yet. The school must save settings, submit for review, and receive a LIVE approval.";
                        default ->
                                "Razorpay Route settlement is not ready for parent checkout.";
                    };
            throw new BusinessException(
                    "Online fee payments on the Route path are paused. " + hint + " Current status: " + st + ".");
        }
    }

    private void syncParentOnlineCheckoutWithSettlementMode(TenantFinanceProfile row) {
        if (FeeSettlementMode.OFFLINE_SCHOOL_COLLECTION.name().equals(row.getFeeSettlementMode())) {
            row.setParentOnlineFeeCheckoutEnabled(false);
        } else {
            row.setParentOnlineFeeCheckoutEnabled(true);
        }
    }

    private void reconcileOnboardingAfterSchoolEdit(
            TenantFinanceProfile row, String prevMode, String prevAcc, int prevBps, String prevOnboarding) {
        if (FeeSettlementMode.PLATFORM_MERCHANT.name().equals(row.getFeeSettlementMode())
                || FeeSettlementMode.OFFLINE_SCHOOL_COLLECTION.name().equals(row.getFeeSettlementMode())) {
            row.setPaymentRoutingOnboardingStatus(PaymentRoutingOnboardingStatus.NOT_REQUIRED.name());
            row.setPaymentRoutingSubmittedAt(null);
            row.setPaymentRoutingLiveAt(null);
            row.setPaymentRoutingLiveByUserId(null);
            row.setPaymentRoutingOnboardingDeclaration(null);
            return;
        }
        // ROUTE
        if (PaymentRoutingOnboardingStatus.LIVE.name().equals(prevOnboarding)) {
            boolean financialTouch =
                    !Objects.equals(prevAcc, row.getRazorpayRouteLinkedAccountId()) || prevBps != row.getPlatformCommissionBps() || !Objects.equals(prevMode, row.getFeeSettlementMode());
            if (financialTouch) {
                row.setPaymentRoutingOnboardingStatus(PaymentRoutingOnboardingStatus.PENDING_CHANGES.name());
                row.setPaymentRoutingSubmittedAt(null);
                row.setPaymentRoutingLiveAt(null);
                row.setPaymentRoutingLiveByUserId(null);
                row.setPaymentRoutingOnboardingDeclaration(null);
            }
            return;
        }
        if (PaymentRoutingOnboardingStatus.SUBMITTED.name().equals(prevOnboarding)) {
            boolean financialTouch =
                    !Objects.equals(prevAcc, row.getRazorpayRouteLinkedAccountId()) || prevBps != row.getPlatformCommissionBps() || !Objects.equals(prevMode, row.getFeeSettlementMode());
            if (financialTouch) {
                row.setPaymentRoutingOnboardingStatus(PaymentRoutingOnboardingStatus.DRAFT.name());
                row.setPaymentRoutingSubmittedAt(null);
                row.setPaymentRoutingOnboardingDeclaration(null);
            }
            return;
        }
        if (!PaymentRoutingOnboardingStatus.LIVE.name().equals(normalizeOnboardingStatus(row.getPaymentRoutingOnboardingStatus()))) {
            row.setPaymentRoutingOnboardingStatus(PaymentRoutingOnboardingStatus.DRAFT.name());
        }
    }

    private static String normalizeOnboardingStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return PaymentRoutingOnboardingStatus.NOT_REQUIRED.name();
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    /** Short, human-oriented summary for the audit log description (details stay in old/new snapshots). */
    private static String describeFinanceUpsertChange(
            String prevMode,
            String prevAcc,
            int prevBps,
            String prevOnboarding,
            boolean prevParentOnline,
            boolean prevPayrollDigital,
            TenantFinanceProfile saved) {
        List<String> parts = new ArrayList<>();
        String mode = saved.getFeeSettlementMode();
        if (!Objects.equals(prevMode, mode)) {
            parts.add("Fee settlement " + feeModeLabel(prevMode) + " → " + feeModeLabel(mode));
        }
        String nextOnb = normalizeOnboardingStatus(saved.getPaymentRoutingOnboardingStatus());
        if (!Objects.equals(prevOnboarding, nextOnb)) {
            parts.add("Route onboarding " + prevOnboarding + " → " + nextOnb);
        }
        if (prevBps != saved.getPlatformCommissionBps()) {
            parts.add("Platform commission " + formatBps(prevBps) + " → " + formatBps(saved.getPlatformCommissionBps()));
        }
        if (!Objects.equals(nullToEmpty(prevAcc), nullToEmpty(saved.getRazorpayRouteLinkedAccountId()))) {
            parts.add("Razorpay linked account id updated");
        }
        if (prevParentOnline != saved.isParentOnlineFeeCheckoutEnabled()) {
            parts.add(
                    "Parent online fee checkout "
                            + (prevParentOnline ? "on" : "off")
                            + " → "
                            + (saved.isParentOnlineFeeCheckoutEnabled() ? "on" : "off"));
        }
        if (prevPayrollDigital != saved.isPayrollDigitalPayoutEnabled()) {
            parts.add(
                    "Digital salary payout "
                            + (prevPayrollDigital ? "on" : "off")
                            + " → "
                            + (saved.isPayrollDigitalPayoutEnabled() ? "on" : "off"));
        }
        if (parts.isEmpty()) {
            parts.add("Finance & payments settings saved (no tracked fields changed)");
        }
        return trimAuditSentence(String.join(" · ", parts), 500);
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    private static String feeModeLabel(String raw) {
        if (raw == null || raw.isBlank()) {
            return "unset";
        }
        try {
            return switch (FeeSettlementMode.valueOf(raw.trim().toUpperCase(Locale.ROOT))) {
                case OFFLINE_SCHOOL_COLLECTION -> "offline (school collects)";
                case ROUTE_LINKED_ACCOUNT -> "Razorpay Route";
                case PLATFORM_MERCHANT -> "platform merchant";
            };
        } catch (IllegalArgumentException e) {
            return raw;
        }
    }

    private static String formatBps(int bps) {
        if (bps % 100 == 0) {
            return (bps / 100) + "%";
        }
        return String.format(Locale.ROOT, "%.2f%%", bps / 100.0);
    }

    private static String trimAuditSentence(String s, int max) {
        if (s == null) {
            return "";
        }
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, max - 1) + "…";
    }

    private static String summarize(
            String mode, String acc, int bps, String onboarding, boolean parentOnlineCheckout, boolean payrollDigital) {
        return "mode="
                + mode
                + ",bps="
                + bps
                + ",onb="
                + onboarding
                + ",parentOnline="
                + parentOnlineCheckout
                + ",payrollPayout="
                + payrollDigital
                + ",accLen="
                + (acc == null ? 0 : acc.length());
    }

    private static FeeSettlementMode parseMode(String raw) {
        String n = raw.trim().toUpperCase(Locale.ROOT);
        try {
            return FeeSettlementMode.valueOf(n);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Unknown feeSettlementMode: " + raw);
        }
    }

    private static String trimNotes(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.length() > 500 ? t.substring(0, 500) : t;
    }

    private TenantFinanceProfileDTOs.FinanceProfileResponse toResponse(TenantFinanceProfile row, boolean revealLinkedAccountId) {
        TenantFinanceProfileDTOs.FinanceProfileResponse o = new TenantFinanceProfileDTOs.FinanceProfileResponse();
        o.setTenantId(row.getTenantId());
        o.setFeeSettlementMode(row.getFeeSettlementMode());
        o.setRazorpayRouteLinkedAccountMasked(maskLinkedAccount(row.getRazorpayRouteLinkedAccountId()));
        boolean showPlain = revealLinkedAccountId || shouldRevealPlainLinkedId(row.getPaymentRoutingOnboardingStatus());
        if (showPlain) {
            o.setRazorpayRouteLinkedAccountId(row.getRazorpayRouteLinkedAccountId());
        } else {
            o.setRazorpayRouteLinkedAccountId(null);
        }
        o.setPlatformCommissionBps(row.getPlatformCommissionBps());
        o.setFinanceNotes(row.getFinanceNotes());
        o.setPaymentRoutingOnboardingStatus(normalizeOnboardingStatus(row.getPaymentRoutingOnboardingStatus()));
        o.setPaymentRoutingSubmittedAt(formatTs(row.getPaymentRoutingSubmittedAt()));
        o.setPaymentRoutingLiveAt(formatTs(row.getPaymentRoutingLiveAt()));
        o.setPaymentRoutingLiveByUserId(row.getPaymentRoutingLiveByUserId());
        o.setPaymentRoutingOnboardingDeclaration(row.getPaymentRoutingOnboardingDeclaration());
        o.setParentOnlineFeeCheckoutEnabled(!FeeSettlementMode.OFFLINE_SCHOOL_COLLECTION.name().equals(row.getFeeSettlementMode()));
        o.setPayrollDigitalPayoutEnabled(row.isPayrollDigitalPayoutEnabled());
        return o;
    }

    private static boolean shouldRevealPlainLinkedId(String onboardingStatus) {
        String s = normalizeOnboardingStatus(onboardingStatus);
        return PaymentRoutingOnboardingStatus.DRAFT.name().equals(s) || PaymentRoutingOnboardingStatus.PENDING_CHANGES.name().equals(s);
    }

    private static String formatTs(LocalDateTime t) {
        return t == null ? null : t.toString();
    }

    static String maskLinkedAccount(String acc) {
        if (acc == null || acc.isBlank()) {
            return null;
        }
        String t = acc.trim();
        if (t.length() <= 10) {
            return "acc_****";
        }
        return t.substring(0, 7) + "…" + t.substring(t.length() - 4);
    }

    private TenantFinanceProfileDTOs.FinanceProfileResponse emptyResponse(String tenantId) {
        TenantFinanceProfileDTOs.FinanceProfileResponse o = new TenantFinanceProfileDTOs.FinanceProfileResponse();
        o.setTenantId(tenantId);
        o.setFeeSettlementMode(FeeSettlementMode.OFFLINE_SCHOOL_COLLECTION.name());
        o.setRazorpayRouteLinkedAccountId(null);
        o.setRazorpayRouteLinkedAccountMasked(null);
        o.setPlatformCommissionBps(0);
        o.setFinanceNotes(null);
        o.setPaymentRoutingOnboardingStatus(PaymentRoutingOnboardingStatus.NOT_REQUIRED.name());
        o.setPaymentRoutingSubmittedAt(null);
        o.setPaymentRoutingLiveAt(null);
        o.setPaymentRoutingLiveByUserId(null);
        o.setPaymentRoutingOnboardingDeclaration(null);
        o.setParentOnlineFeeCheckoutEnabled(false);
        o.setPayrollDigitalPayoutEnabled(false);
        return o;
    }
}
