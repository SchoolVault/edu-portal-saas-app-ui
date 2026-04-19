package com.school.erp.modules.leave.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.ApiErrorCode;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.leave.dto.LeaveDTOs;
import com.school.erp.modules.leave.entity.LeaveRequest;
import com.school.erp.modules.leave.repository.LeaveRequestRepository;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class LeaveService {

    private static final Logger log = LoggerFactory.getLogger(LeaveService.class);

    /** Minimum trimmed reason length when {@link Enums.LeaveTypeCode#OTHER} is used (policy; keep in sync with UI). */
    public static final int MIN_REASON_LENGTH_FOR_OTHER = 10;

    private final LeaveRequestRepository repo;
    private final UserRepository userRepository;

    public LeaveService(LeaveRequestRepository repo, UserRepository userRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
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
        s.setAnnualUsed(sumApprovedUnits(mine, "annual"));
        s.setSickUsed(sumApprovedUnits(mine, "sick"));
        s.setCasualUsed(sumApprovedUnits(mine, "casual"));
        log.info("Leave balance for userId={} annualUsed={} sickUsed={} casualUsed={}", uid, s.getAnnualUsed(), s.getSickUsed(), s.getCasualUsed());
        return s;
    }

    private int sumApprovedUnits(List<LeaveRequest> mine, String typeKeyword) {
        return mine.stream()
                .filter(e -> e.getStatus() == Enums.LeaveStatus.APPROVED
                        && e.getLeaveType() != null
                        && e.getLeaveType().toLowerCase().contains(typeKeyword))
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
        e.setStatus(req.isApprove() ? Enums.LeaveStatus.APPROVED : Enums.LeaveStatus.REJECTED);
        e.setApproverUserId(TenantContext.getUserId());
        e.setApproverRemarks(req.getApproverRemarks());
        LeaveRequest saved = repo.save(e);
        log.info("Leave request id={} finalStatus={}", id, saved.getStatus());
        return toResponse(saved);
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
