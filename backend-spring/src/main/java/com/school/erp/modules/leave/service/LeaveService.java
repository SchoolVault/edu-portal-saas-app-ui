package com.school.erp.modules.leave.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.leave.dto.LeaveDTOs;
import com.school.erp.modules.leave.entity.LeaveRequest;
import com.school.erp.modules.leave.repository.LeaveRequestRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeaveService {

    private final LeaveRequestRepository repo;

    public LeaveService(LeaveRequestRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public LeaveDTOs.LeaveResponse submit(LeaveDTOs.CreateLeaveRequest req) {
        LeaveRequest e = new LeaveRequest();
        e.setTenantId(TenantContext.getTenantId());
        e.setApplicantUserId(TenantContext.getUserId());
        e.setApplicantRole(TenantContext.getUserRole() != null ? TenantContext.getUserRole() : "USER");
        e.setLeaveType(req.getLeaveType());
        e.setStartDate(req.getStartDate());
        e.setEndDate(req.getEndDate());
        e.setReason(req.getReason());
        e.setStudentId(req.getStudentId());
        e.setTeacherId(req.getTeacherId());
        e.setBalanceSnapshotJson(req.getBalanceSnapshotJson());
        e.setDayUnit(req.getDayUnit() != null ? req.getDayUnit() : Enums.LeaveDayUnit.FULL_DAY);
        e.setStatus(Enums.LeaveStatus.PENDING);
        return toResponse(repo.save(e));
    }

    @Transactional(readOnly = true)
    public List<LeaveDTOs.LeaveResponse> listAll() {
        return repo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(TenantContext.getTenantId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveDTOs.LeaveResponse> listMine() {
        return repo.findByTenantIdAndApplicantUserIdAndIsDeletedFalseOrderByCreatedAtDesc(
                        TenantContext.getTenantId(), TenantContext.getUserId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LeaveDTOs.LeaveBalanceSummary balanceForCurrentUser() {
        String t = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        List<LeaveRequest> mine = repo.findByTenantIdAndApplicantUserIdAndIsDeletedFalseOrderByCreatedAtDesc(t, uid);
        LeaveDTOs.LeaveBalanceSummary s = new LeaveDTOs.LeaveBalanceSummary();
        s.setAnnualUsed(sumApprovedUnits(mine, "annual"));
        s.setSickUsed(sumApprovedUnits(mine, "sick"));
        s.setCasualUsed(sumApprovedUnits(mine, "casual"));
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
        LeaveRequest e = repo.findById(id).filter(x -> t.equals(x.getTenantId()) && !Boolean.TRUE.equals(x.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", id));
        e.setStatus(req.isApprove() ? Enums.LeaveStatus.APPROVED : Enums.LeaveStatus.REJECTED);
        e.setApproverUserId(TenantContext.getUserId());
        e.setApproverRemarks(req.getApproverRemarks());
        return toResponse(repo.save(e));
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
        r.setStatus(e.getStatus() != null ? e.getStatus().name() : null);
        r.setApproverUserId(e.getApproverUserId());
        r.setApproverRemarks(e.getApproverRemarks());
        r.setDayUnit(e.getDayUnit());
        return r;
    }
}
