package com.school.erp.modules.leave.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.ApiErrorCode;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.leave.dto.LeaveDTOs;
import com.school.erp.modules.leave.entity.LeaveEntitlementLedgerEntry;
import com.school.erp.modules.leave.entity.LeaveEntitlementPolicy;
import com.school.erp.modules.leave.entity.LeaveRequest;
import com.school.erp.modules.leave.repository.LeaveEntitlementLedgerRepository;
import com.school.erp.modules.leave.repository.LeaveEntitlementPolicyRepository;
import com.school.erp.modules.leave.repository.LeaveRequestRepository;
import com.school.erp.modules.notification.service.NotificationService;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.platform.port.NotificationDispatchPort;
import com.school.erp.security.rbac.AppPermission;
import com.school.erp.security.rbac.EffectivePermissionService;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class LeaveService {

    private static final Logger log = LoggerFactory.getLogger(LeaveService.class);
    private static final String LEAVE_TYPE_ANNUAL = Enums.LeaveTypeCode.ANNUAL.name();
    private static final String LEAVE_TYPE_SICK = Enums.LeaveTypeCode.SICK.name();
    private static final String LEAVE_TYPE_CASUAL = Enums.LeaveTypeCode.CASUAL.name();
    private static final String ENTRY_OPENING_ALLOCATION = "OPENING_ALLOCATION";
    private static final String ENTRY_LEAVE_APPROVED_DEBIT = "LEAVE_APPROVED_DEBIT";
    private static final String ENTRY_LEAVE_APPROVAL_REVERSED = "LEAVE_APPROVAL_REVERSED";
    private static final String REF_BULK_ALLOCATION = "BULK_ALLOCATION";
    private static final String REF_LEAVE_REQUEST = "LEAVE_REQUEST";

    /** Minimum trimmed reason length when {@link Enums.LeaveTypeCode#OTHER} is used (policy; keep in sync with UI). */
    public static final int MIN_REASON_LENGTH_FOR_OTHER = 10;

    private final LeaveRequestRepository repo;
    private final LeaveEntitlementLedgerRepository ledgerRepository;
    private final LeaveEntitlementPolicyRepository policyRepo;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final NotificationDispatchPort notificationDispatchPort;
    private final EffectivePermissionService effectivePermissionService;
    private final TenantConfigRepository tenantConfigRepository;

    public LeaveService(
            LeaveRequestRepository repo,
            LeaveEntitlementLedgerRepository ledgerRepository,
            LeaveEntitlementPolicyRepository policyRepo,
            UserRepository userRepository,
            NotificationService notificationService,
            NotificationDispatchPort notificationDispatchPort,
            EffectivePermissionService effectivePermissionService,
            TenantConfigRepository tenantConfigRepository) {
        this.repo = repo;
        this.ledgerRepository = ledgerRepository;
        this.policyRepo = policyRepo;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.notificationDispatchPort = notificationDispatchPort;
        this.effectivePermissionService = effectivePermissionService;
        this.tenantConfigRepository = tenantConfigRepository;
    }

    @Transactional
    public LeaveDTOs.LeaveResponse submit(LeaveDTOs.CreateLeaveRequest req) {
        log.info("Submitting leave request type={} start={} end={}", req.getLeaveType(), req.getStartDate(), req.getEndDate());
        LeaveRequest e = new LeaveRequest();
        e.setTenantId(TenantContext.getTenantId());
        e.setApplicantUserId(TenantContext.getUserId());
        e.setApplicantRole(TenantContext.getUserRole() != null ? TenantContext.getUserRole() : "USER");
        String typeCode = normalizeLeaveTypeCode(req.getLeaveType());
        requireReasonWhenOther(typeCode, req.getReason());
        e.setLeaveType(typeCode);
        e.setStartDate(req.getStartDate());
        e.setEndDate(req.getEndDate());
        e.setReason(req.getReason());
        e.setStudentId(req.getStudentId());
        e.setTeacherId(req.getTeacherId());
        e.setBalanceSnapshotJson(req.getBalanceSnapshotJson());
        e.setDayUnit(req.getDayUnit() != null ? req.getDayUnit() : Enums.LeaveDayUnit.FULL_DAY);
        e.setStatus(Enums.LeaveStatus.PENDING);
        LeaveRequest saved = repo.save(e);
        log.info("Leave request submitted id={} status=PENDING", saved.getId());
        notifyApproversOnLeaveApplied(saved);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LeaveDTOs.LeaveResponse> listAll() {
        log.debug("Listing all leave requests for tenant");
        List<LeaveDTOs.LeaveResponse> list = repo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(TenantContext.getTenantId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        log.info("Listed {} leave request(s) (all)", list.size());
        return list;
    }

    @Transactional(readOnly = true)
    public List<LeaveDTOs.LeaveResponse> listMine() {
        Long uid = TenantContext.getUserId();
        log.debug("Listing leave requests for current user userId={}", uid);
        List<LeaveDTOs.LeaveResponse> list = repo.findByTenantIdAndApplicantUserIdAndIsDeletedFalseOrderByCreatedAtDesc(
                        TenantContext.getTenantId(), uid)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        log.info("Listed {} leave request(s) for userId={}", list.size(), uid);
        return list;
    }

    @Transactional(readOnly = true)
    public PageResponse<LeaveDTOs.LeaveResponse> listMinePaged(int page, int size, String q) {
        Long uid = TenantContext.getUserId();
        String tenant = TenantContext.getTenantId();
        String qq = q == null ? "" : q.trim();
        Page<LeaveRequest> result = repo.pageMine(tenant, uid, qq, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        List<LeaveDTOs.LeaveResponse> content = result.getContent().stream().map(this::toResponse).collect(Collectors.toList());
        log.info("Leave mine paged page={} size={} total={}", page, size, result.getTotalElements());
        return PageResponse.of(content, page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PageResponse<LeaveDTOs.LeaveResponse> listAllPaged(int page, int size, String q) {
        String tenant = TenantContext.getTenantId();
        String qq = q == null ? "" : q.trim();
        Page<LeaveRequest> result = repo.pageAll(tenant, qq, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        List<LeaveDTOs.LeaveResponse> content = result.getContent().stream().map(this::toResponse).collect(Collectors.toList());
        log.info("Leave all paged page={} size={} total={}", page, size, result.getTotalElements());
        return PageResponse.of(content, page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public LeaveDTOs.LeaveBalanceSummary balanceForCurrentUser() {
        String t = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        log.debug("Computing leave balance snapshot userId={}", uid);
        List<LeaveRequest> mine = repo.findByTenantIdAndApplicantUserIdAndIsDeletedFalseOrderByCreatedAtDesc(t, uid);
        LeaveDTOs.LeaveBalanceSummary s = new LeaveDTOs.LeaveBalanceSummary();
        int annualRemaining = safeSum(ledgerRepository.sumSignedUnitsByUserAndLeaveType(t, uid, LEAVE_TYPE_ANNUAL));
        int sickRemaining = safeSum(ledgerRepository.sumSignedUnitsByUserAndLeaveType(t, uid, LEAVE_TYPE_SICK));
        int casualRemaining = safeSum(ledgerRepository.sumSignedUnitsByUserAndLeaveType(t, uid, LEAVE_TYPE_CASUAL));
        int annualUsed = sumApprovedUnits(mine, LEAVE_TYPE_ANNUAL);
        int sickUsed = sumApprovedUnits(mine, LEAVE_TYPE_SICK);
        int casualUsed = sumApprovedUnits(mine, LEAVE_TYPE_CASUAL);
        s.setAnnualUsed(annualUsed);
        s.setSickUsed(sickUsed);
        s.setCasualUsed(casualUsed);
        s.setAnnualRemaining(annualRemaining);
        s.setSickRemaining(sickRemaining);
        s.setCasualRemaining(casualRemaining);
        s.setAnnualEntitled(annualRemaining + annualUsed);
        s.setSickEntitled(sickRemaining + sickUsed);
        s.setCasualEntitled(casualRemaining + casualUsed);
        log.info("Leave balance for userId={} annualUsed={} sickUsed={} casualUsed={}", uid, s.getAnnualUsed(), s.getSickUsed(), s.getCasualUsed());
        return s;
    }

    @Transactional(readOnly = true)
    public LeaveDTOs.LeaveEntitlementPolicy getLeavePolicy() {
        return toPolicyDto(resolvePolicyEntityOrNull(TenantContext.getTenantId()));
    }

    @Transactional
    public LeaveDTOs.LeaveEntitlementPolicy updateLeavePolicy(LeaveDTOs.LeaveEntitlementPolicy req) {
        String t = TenantContext.getTenantId();
        LeaveEntitlementPolicy e = policyRepo.findByTenantIdAndIsDeletedFalse(t).orElseGet(() -> {
            LeaveEntitlementPolicy p = new LeaveEntitlementPolicy();
            p.setTenantId(t);
            p.setIsActive(true);
            p.setIsDeleted(false);
            return p;
        });
        e.setAnnualEntitled(clampEntitled(req.getAnnualEntitled()));
        e.setSickEntitled(clampEntitled(req.getSickEntitled()));
        e.setCasualEntitled(clampEntitled(req.getCasualEntitled()));
        String label = req.getPolicyYearLabel();
        e.setPolicyYearLabel(label != null && !label.isBlank() ? label.trim() : null);
        LeaveEntitlementPolicy saved = policyRepo.save(e);
        log.info("Updated leave entitlement policy tenant={} annual={} sick={} casual={}", t, saved.getAnnualEntitled(), saved.getSickEntitled(), saved.getCasualEntitled());
        return toPolicyDto(saved);
    }

    @Transactional
    public LeaveDTOs.BulkEntitlementAllocationResponse bulkAllocateEntitlements(LeaveDTOs.BulkEntitlementAllocationRequest req) {
        String tenantId = TenantContext.getTenantId();
        LeaveDTOs.LeaveEntitlementPolicy pol = toPolicyDto(resolvePolicyEntityOrNull(tenantId));
        String policyYearLabel = (req.getPolicyYearLabel() != null && !req.getPolicyYearLabel().isBlank())
                ? req.getPolicyYearLabel().trim()
                : (pol.getPolicyYearLabel() != null && !pol.getPolicyYearLabel().isBlank() ? pol.getPolicyYearLabel().trim() : "CURRENT");
        int annual = req.getAnnualOpening() != null ? Math.max(0, req.getAnnualOpening()) : pol.getAnnualEntitled();
        int sick = req.getSickOpening() != null ? Math.max(0, req.getSickOpening()) : pol.getSickEntitled();
        int casual = req.getCasualOpening() != null ? Math.max(0, req.getCasualOpening()) : pol.getCasualEntitled();
        Set<Enums.Role> roleFilters = normalizeRoleFilters(req.getRoleFilters());
        Set<Long> selectedIds = req.getUserIds() != null ? req.getUserIds().stream().filter(Objects::nonNull).collect(Collectors.toSet()) : Set.of();

        List<User> candidates = userRepository.findByTenantIdAndIsDeletedFalseOrderByNameAsc(tenantId).stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .filter(u -> selectedIds.isEmpty() || selectedIds.contains(u.getId()))
                .filter(u -> roleFilters.isEmpty() || (u.getRole() != null && roleFilters.contains(u.getRole())))
                .toList();

        int allocated = 0;
        int skipped = 0;
        for (User user : candidates) {
            boolean hasOpening = hasOpeningForYear(tenantId, user.getId(), policyYearLabel);
            if (hasOpening && !req.isOverwriteExistingYear()) {
                skipped++;
                continue;
            }
            String note = (req.getNotes() != null && !req.getNotes().isBlank()) ? req.getNotes().trim() : "Bulk opening allocation";
            addLedgerEntry(tenantId, user.getId(), LEAVE_TYPE_ANNUAL, policyYearLabel, ENTRY_OPENING_ALLOCATION, annual, note, REF_BULK_ALLOCATION, 0L, null);
            addLedgerEntry(tenantId, user.getId(), LEAVE_TYPE_SICK, policyYearLabel, ENTRY_OPENING_ALLOCATION, sick, note, REF_BULK_ALLOCATION, 0L, null);
            addLedgerEntry(tenantId, user.getId(), LEAVE_TYPE_CASUAL, policyYearLabel, ENTRY_OPENING_ALLOCATION, casual, note, REF_BULK_ALLOCATION, 0L, null);
            allocated++;
        }
        LeaveDTOs.BulkEntitlementAllocationResponse res = new LeaveDTOs.BulkEntitlementAllocationResponse();
        res.setPolicyYearLabel(policyYearLabel);
        res.setTargetedUsers(candidates.size());
        res.setAllocatedUsers(allocated);
        res.setSkippedUsers(skipped);
        return res;
    }

    @Transactional(readOnly = true)
    public List<LeaveDTOs.EntitlementLedgerEntryResponse> listMyLedgerEntries() {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        return ledgerRepository.findByTenantIdAndUserIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, userId).stream()
                .map(this::toLedgerResponse)
                .toList();
    }

    private static int clampEntitled(int v) {
        return Math.max(0, Math.min(366, v));
    }

    private LeaveEntitlementPolicy resolvePolicyEntityOrNull(String tenantId) {
        return policyRepo.findByTenantIdAndIsDeletedFalse(tenantId).orElse(null);
    }

    private static LeaveDTOs.LeaveEntitlementPolicy defaultPolicyDto() {
        LeaveDTOs.LeaveEntitlementPolicy d = new LeaveDTOs.LeaveEntitlementPolicy();
        d.setAnnualEntitled(24);
        d.setSickEntitled(12);
        d.setCasualEntitled(12);
        d.setPolicyYearLabel("2025-2026");
        return d;
    }

    private static LeaveDTOs.LeaveEntitlementPolicy toPolicyDto(LeaveEntitlementPolicy e) {
        if (e == null) {
            return defaultPolicyDto();
        }
        LeaveDTOs.LeaveEntitlementPolicy d = new LeaveDTOs.LeaveEntitlementPolicy();
        d.setAnnualEntitled(e.getAnnualEntitled());
        d.setSickEntitled(e.getSickEntitled());
        d.setCasualEntitled(e.getCasualEntitled());
        d.setPolicyYearLabel(e.getPolicyYearLabel());
        return d;
    }

    private int sumApprovedUnits(List<LeaveRequest> mine, String typeKeyword) {
        return mine.stream()
                .filter(e -> e.getStatus() == Enums.LeaveStatus.APPROVED
                        && e.getLeaveType() != null
                        && e.getLeaveType().equalsIgnoreCase(typeKeyword))
                .mapToInt(this::effectiveDayUnits)
                .sum();
    }

    private int effectiveDayUnits(LeaveRequest e) {
        int span = (int) ChronoUnit.DAYS.between(e.getStartDate(), e.getEndDate()) + 1;
        if (e.getDayUnit() == null || e.getDayUnit() == Enums.LeaveDayUnit.FULL_DAY) {
            return Math.max(span, 0);
        }
        return span <= 1 ? 1 : Math.max(span, 0);
    }

    @Transactional
    public LeaveDTOs.LeaveResponse decide(Long id, LeaveDTOs.ApproveLeaveRequest req) {
        String t = TenantContext.getTenantId();
        log.info("Deciding leave request id={} approve={}", id, req.isApprove());
        LeaveRequest e = repo.findById(id).filter(x -> t.equals(x.getTenantId()) && !Boolean.TRUE.equals(x.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", id));
        Enums.LeaveStatus previousStatus = e.getStatus();
        e.setStatus(req.isApprove() ? Enums.LeaveStatus.APPROVED : Enums.LeaveStatus.REJECTED);
        e.setApproverUserId(TenantContext.getUserId());
        e.setApproverRemarks(req.getApproverRemarks());
        LeaveRequest saved = repo.save(e);
        reconcileApprovalLedger(saved, previousStatus);
        log.info("Leave request id={} finalStatus={}", id, saved.getStatus());
        notifyApplicantOnDecision(saved);
        return toResponse(saved);
    }

    private void notifyApproversOnLeaveApplied(LeaveRequest leave) {
        String tenantId = TenantContext.getTenantId();
        Long applicantUserId = leave.getApplicantUserId();
        String applicantName = resolveUserDisplayName(applicantUserId);
        String subject = "Leave request submitted";
        String defaultBody = "A new leave request was submitted by " + applicantName + " for "
                + leave.getStartDate() + " to " + leave.getEndDate()
                + ". Please review and approve/reject from the Leave queue.";
        String smsBody = renderLeaveSmsTemplate(
                leaveSmsApplyTemplate(tenantId),
                defaultBody,
                Map.of(
                        "applicantName", applicantName,
                        "startDate", String.valueOf(leave.getStartDate()),
                        "endDate", String.valueOf(leave.getEndDate()),
                        "leaveType", String.valueOf(leave.getLeaveType()),
                        "status", String.valueOf(leave.getStatus())));
        for (User approver : resolveLeaveApprovers(tenantId)) {
            if (approver.getId() == null || approver.getId().equals(applicantUserId)) {
                continue;
            }
            notificationService.createNotification(
                    tenantId,
                    approver.getId(),
                    subject,
                    smsBody,
                    Enums.NotificationType.INFO,
                    "/app/leave");
            if (approver.getPhone() != null && !approver.getPhone().isBlank()) {
                notificationDispatchPort.enqueue(
                        tenantId,
                        "LEAVE_REQUEST_SUBMITTED",
                        "SMS",
                        approver.getId(),
                        approver.getPhone(),
                        subject,
                        smsBody,
                        "leave-submitted-" + leave.getId() + "-to-" + approver.getId(),
                        "leave-" + leave.getId());
            }
        }
    }

    private void notifyApplicantOnDecision(LeaveRequest leave) {
        String tenantId = TenantContext.getTenantId();
        Long applicantUserId = leave.getApplicantUserId();
        if (applicantUserId == null) {
            return;
        }
        User applicant = userRepository.findByIdAndTenantIdAndIsDeletedFalse(applicantUserId, tenantId).orElse(null);
        if (applicant == null) {
            return;
        }
        String subject = leave.getStatus() == Enums.LeaveStatus.APPROVED
                ? "Leave request approved"
                : "Leave request rejected";
        String decision = leave.getStatus() == Enums.LeaveStatus.APPROVED ? "APPROVED" : "REJECTED";
        String defaultBody = leave.getStatus() == Enums.LeaveStatus.APPROVED
                ? "Your leave request for " + leave.getStartDate() + " to " + leave.getEndDate()
                + " was approved. Please check Leave for full details."
                : "Your leave request for " + leave.getStartDate() + " to " + leave.getEndDate()
                + " was rejected. Please check Leave for approver remarks.";
        String smsBody = renderLeaveSmsTemplate(
                leaveSmsDecisionTemplate(tenantId),
                defaultBody,
                Map.of(
                        "decision", decision,
                        "startDate", String.valueOf(leave.getStartDate()),
                        "endDate", String.valueOf(leave.getEndDate()),
                        "leaveType", String.valueOf(leave.getLeaveType()),
                        "status", String.valueOf(leave.getStatus())));
        notificationService.createNotification(
                tenantId,
                applicantUserId,
                subject,
                smsBody,
                Enums.NotificationType.INFO,
                "/app/leave");
        if (applicant.getPhone() != null && !applicant.getPhone().isBlank()) {
            notificationDispatchPort.enqueue(
                    tenantId,
                    "LEAVE_REQUEST_DECIDED",
                    "SMS",
                    applicantUserId,
                    applicant.getPhone(),
                    subject,
                    smsBody,
                    "leave-decision-" + leave.getId() + "-to-" + applicantUserId + "-" + leave.getStatus(),
                    "leave-" + leave.getId());
        }
    }

    private List<User> resolveLeaveApprovers(String tenantId) {
        List<User> activeUsers = userRepository.findByTenantIdAndIsDeletedFalseOrderByNameAsc(tenantId);
        Set<Long> dedupedApproverIds = new LinkedHashSet<>();
        for (User user : activeUsers) {
            if (user == null || user.getId() == null || !Boolean.TRUE.equals(user.getIsActive())) {
                continue;
            }
            Set<AppPermission> perms = effectivePermissionService.resolveEffectivePermissions(user);
            if (perms.contains(AppPermission.SCHOOL_LEAVE_APPROVAL_WRITE)
                    || perms.contains(AppPermission.TENANT_ADMIN)
                    || perms.contains(AppPermission.PLATFORM_ADMIN)) {
                dedupedApproverIds.add(user.getId());
            }
        }
        return activeUsers.stream()
                .filter(u -> u.getId() != null && dedupedApproverIds.contains(u.getId()))
                .toList();
    }

    private String resolveUserDisplayName(Long userId) {
        if (userId == null) {
            return "Staff member";
        }
        return userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, TenantContext.getTenantId())
                .map(User::getName)
                .filter(name -> name != null && !name.isBlank())
                .orElse("Staff member");
    }

    private String leaveSmsApplyTemplate(String tenantId) {
        return tenantConfigRepository.findByTenantId(tenantId)
                .map(TenantConfig::getLeaveSmsApplyTemplate)
                .orElse(null);
    }

    private String leaveSmsDecisionTemplate(String tenantId) {
        return tenantConfigRepository.findByTenantId(tenantId)
                .map(TenantConfig::getLeaveSmsDecisionTemplate)
                .orElse(null);
    }

    private static String renderLeaveSmsTemplate(String template, String fallback, Map<String, String> variables) {
        String resolved = template == null ? "" : template.trim();
        if (resolved.isEmpty()) {
            return fallback;
        }
        String out = resolved;
        for (Map.Entry<String, String> e : variables.entrySet()) {
            String token = "{{" + e.getKey() + "}}";
            out = out.replace(token, e.getValue() == null ? "" : e.getValue());
        }
        return out.isBlank() ? fallback : out;
    }

    private void reconcileApprovalLedger(LeaveRequest request, Enums.LeaveStatus previousStatus) {
        if (request.getApplicantUserId() == null || request.getId() == null) {
            return;
        }
        String tenantId = TenantContext.getTenantId();
        int units = effectiveDayUnits(request);
        if (units <= 0) {
            return;
        }
        String typeCode = normalizeLeaveTypeCode(request.getLeaveType());
        if (request.getStatus() == Enums.LeaveStatus.APPROVED && previousStatus != Enums.LeaveStatus.APPROVED) {
            addLedgerEntry(
                    tenantId,
                    request.getApplicantUserId(),
                    typeCode,
                    resolvePolicyYearLabel(tenantId),
                    ENTRY_LEAVE_APPROVED_DEBIT,
                    -units,
                    "Leave approved",
                    REF_LEAVE_REQUEST,
                    request.getId(),
                    request.getStartDate());
            return;
        }
        if (request.getStatus() != Enums.LeaveStatus.APPROVED && previousStatus == Enums.LeaveStatus.APPROVED) {
            addLedgerEntry(
                    tenantId,
                    request.getApplicantUserId(),
                    typeCode,
                    resolvePolicyYearLabel(tenantId),
                    ENTRY_LEAVE_APPROVAL_REVERSED,
                    units,
                    "Leave approval reversed",
                    REF_LEAVE_REQUEST,
                    request.getId(),
                    request.getStartDate());
        }
    }

    private boolean hasOpeningForYear(String tenantId, Long userId, String policyYearLabel) {
        return ledgerRepository
                .findFirstByTenantIdAndUserIdAndLeaveTypeAndPolicyYearLabelAndEntryTypeAndReferenceTypeAndReferenceIdAndIsDeletedFalse(
                        tenantId, userId, LEAVE_TYPE_ANNUAL, policyYearLabel, ENTRY_OPENING_ALLOCATION, REF_BULK_ALLOCATION, 0L)
                .isPresent();
    }

    private void addLedgerEntry(
            String tenantId,
            Long userId,
            String leaveType,
            String policyYearLabel,
            String entryType,
            int signedUnits,
            String notes,
            String referenceType,
            Long referenceId,
            java.time.LocalDate effectiveDate) {
        if (signedUnits == 0) {
            return;
        }
        LeaveEntitlementLedgerEntry row = new LeaveEntitlementLedgerEntry();
        row.setTenantId(tenantId);
        row.setIsActive(true);
        row.setIsDeleted(false);
        row.setUserId(userId);
        row.setLeaveType(leaveType);
        row.setPolicyYearLabel(policyYearLabel);
        row.setEntryType(entryType);
        row.setSignedUnits(signedUnits);
        row.setNotes(notes);
        row.setReferenceType(referenceType);
        row.setReferenceId(referenceId);
        row.setEffectiveDate(effectiveDate);
        ledgerRepository.save(row);
    }

    private static Set<Enums.Role> normalizeRoleFilters(List<String> rawRoles) {
        if (rawRoles == null || rawRoles.isEmpty()) {
            return Set.of(Enums.Role.TEACHER, Enums.Role.SCHOOL_STAFF, Enums.Role.LIBRARY_STAFF);
        }
        Set<Enums.Role> out = new LinkedHashSet<>();
        for (String raw : rawRoles) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            try {
                out.add(Enums.Role.valueOf(raw.trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ignored) {
                // keep allocation resilient to unknown role filters
            }
        }
        return out;
    }

    private String resolvePolicyYearLabel(String tenantId) {
        LeaveEntitlementPolicy p = resolvePolicyEntityOrNull(tenantId);
        if (p == null || p.getPolicyYearLabel() == null || p.getPolicyYearLabel().isBlank()) {
            return "CURRENT";
        }
        return p.getPolicyYearLabel().trim();
    }

    private static int safeSum(Integer value) {
        return value == null ? 0 : value;
    }

    private LeaveDTOs.EntitlementLedgerEntryResponse toLedgerResponse(LeaveEntitlementLedgerEntry e) {
        LeaveDTOs.EntitlementLedgerEntryResponse d = new LeaveDTOs.EntitlementLedgerEntryResponse();
        d.setId(e.getId());
        d.setUserId(e.getUserId());
        d.setLeaveType(e.getLeaveType());
        d.setPolicyYearLabel(e.getPolicyYearLabel());
        d.setEntryType(e.getEntryType());
        d.setSignedUnits(e.getSignedUnits());
        d.setNotes(e.getNotes());
        d.setReferenceType(e.getReferenceType());
        d.setReferenceId(e.getReferenceId());
        d.setEffectiveDate(e.getEffectiveDate());
        d.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return d;
    }

    private LeaveDTOs.LeaveResponse toResponse(LeaveRequest e) {
        LeaveDTOs.LeaveResponse r = new LeaveDTOs.LeaveResponse();
        r.setId(e.getId());
        r.setApplicantUserId(e.getApplicantUserId());
        r.setApplicantRole(e.getApplicantRole());
        r.setStudentId(e.getStudentId());
        r.setTeacherId(e.getTeacherId());
        r.setLeaveType(e.getLeaveType());
        r.setStartDate(e.getStartDate());
        r.setEndDate(e.getEndDate());
        r.setReason(e.getReason());
        r.setStatus(e.getStatus());
        r.setApproverUserId(e.getApproverUserId());
        r.setApproverRemarks(e.getApproverRemarks());
        r.setDayUnit(e.getDayUnit());
        if (e.getApplicantUserId() != null) {
            userRepository
                    .findByIdAndTenantIdAndIsDeletedFalse(e.getApplicantUserId(), TenantContext.getTenantId())
                    .ifPresent(u -> r.setApplicantDisplayName(u.getName()));
        }
        return r;
    }

    /**
     * Accepts uppercase codes or common legacy casing; persists canonical {@link Enums.LeaveTypeCode} names only.
     */
    static String normalizeLeaveTypeCode(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BusinessException("leaveType is required");
        }
        String code = raw.trim().toUpperCase(Locale.ROOT);
        try {
            Enums.LeaveTypeCode.valueOf(code);
            return code;
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid leaveType; use one of: ANNUAL, SICK, CASUAL, EMERGENCY, OTHER");
        }
    }

    private static void requireReasonWhenOther(String typeCode, String reason) {
        if (!Enums.LeaveTypeCode.OTHER.name().equals(typeCode)) {
            return;
        }
        int len = reason != null ? reason.trim().length() : 0;
        if (len < MIN_REASON_LENGTH_FOR_OTHER) {
            throw new BusinessException(
                    "When leave type is OTHER, describe the leave in reason (at least " + MIN_REASON_LENGTH_FOR_OTHER + " characters).",
                    ApiErrorCode.LEAVE_OTHER_REASON_REQUIRED);
        }
    }
}
