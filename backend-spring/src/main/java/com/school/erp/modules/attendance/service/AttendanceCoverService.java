package com.school.erp.modules.attendance.service;

import com.school.erp.common.exception.ApiErrorCode;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.SchedulingConflictException;
import com.school.erp.modules.attendance.dto.AttendanceCoverDTOs;
import com.school.erp.modules.attendance.entity.AttendanceCoverAssignment;
import com.school.erp.modules.attendance.policy.AttendanceCoverSlotOverlapPolicy;
import com.school.erp.modules.attendance.repository.AttendanceCoverAssignmentRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AttendanceCoverService {

    private final AttendanceCoverAssignmentRepository coverRepo;
    private final TeacherRepository teacherRepository;

    public AttendanceCoverService(AttendanceCoverAssignmentRepository coverRepo, TeacherRepository teacherRepository) {
        this.coverRepo = coverRepo;
        this.teacherRepository = teacherRepository;
    }

    @Transactional(readOnly = true)
    public List<AttendanceCoverDTOs.Response> listForDate(LocalDate date) {
        String t = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        String role = TenantContext.getUserRole();
        if (role != null && role.trim().equalsIgnoreCase("TEACHER") && uid != null) {
            return teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(t, uid)
                    .map(pk -> coverRepo.findByTenantIdAndCoverDateAndCoveringTeacherIdAndStatusAndIsDeletedFalse(t, date, pk.getId(), "ACTIVE"))
                    .orElse(List.of())
                    .stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        return coverRepo.findByTenantIdAndCoverDateAndIsDeletedFalseOrderByIdAsc(t, date).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceCoverDTOs.Response> listAllActiveOnDate(LocalDate date) {
        String t = TenantContext.getTenantId();
        return coverRepo.findByTenantIdAndCoverDateAndIsDeletedFalseOrderByIdAsc(t, date).stream()
                .filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Creates an active cover row. Enforces at most one <em>logically overlapping</em> active cover per class slice
     * (date + class + section scope + period scope) for different covering teachers. Callers may pass
     * {@link AttendanceCoverDTOs.CreateRequest#getReplaceCoverAssignmentId()} to atomically cancel the blocking row.
     */
    @Transactional
    public AttendanceCoverDTOs.Response create(AttendanceCoverDTOs.CreateRequest req) {
        String t = TenantContext.getTenantId();
        List<AttendanceCoverAssignment> sameClassDay = coverRepo.findByTenantIdAndCoverDateAndClassIdAndIsDeletedFalseOrderByIdAsc(
                t, req.getCoverDate(), req.getClassId());

        Optional<AttendanceCoverAssignment> identical = AttendanceCoverSlotOverlapPolicy.findIdenticalActiveCover(
                sameClassDay, req.getSectionId(), req.getPeriodNumber(), req.getCoveringTeacherId());
        if (identical.isPresent()) {
            return toResponse(identical.get());
        }

        Optional<AttendanceCoverAssignment> blocking = AttendanceCoverSlotOverlapPolicy.findBlockingActiveCover(
                sameClassDay, req.getSectionId(), req.getPeriodNumber(), req.getCoveringTeacherId());

        if (req.getReplaceCoverAssignmentId() != null && blocking.isEmpty()) {
            throw new BusinessException("No active conflicting cover to replace — refresh the cover list and try again.");
        }

        if (blocking.isPresent()) {
            AttendanceCoverAssignment block = blocking.get();
            if (req.getReplaceCoverAssignmentId() == null) {
                throw new SchedulingConflictException(
                        "Another teacher is already assigned as cover for this class, section scope, and period on the selected date.",
                        ApiErrorCode.SCHEDULING_CONFLICT,
                        buildConflictPayload(t, block, req.getCoverDate()));
            }
            if (!Objects.equals(req.getReplaceCoverAssignmentId(), block.getId())) {
                throw new BusinessException(
                        "The replace confirmation does not match the active conflicting cover. Refresh and try again.");
            }
            block.setStatus("CANCELLED");
            coverRepo.save(block);
        }

        AttendanceCoverAssignment e = new AttendanceCoverAssignment();
        e.setTenantId(t);
        e.setCoverDate(req.getCoverDate());
        e.setPeriodNumber(req.getPeriodNumber());
        e.setClassId(req.getClassId());
        e.setSectionId(req.getSectionId());
        e.setRegularTeacherId(req.getRegularTeacherId());
        e.setCoveringTeacherId(req.getCoveringTeacherId());
        e.setReason(req.getReason());
        e.setTimetableEntryId(req.getTimetableEntryId());
        e.setStatus("ACTIVE");
        e.setCreatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        coverRepo.save(e);
        return toResponse(e);
    }

    @Transactional
    public void cancel(Long id) {
        String t = TenantContext.getTenantId();
        AttendanceCoverAssignment e = coverRepo.findById(id)
                .filter(x -> t.equals(x.getTenantId()) && !Boolean.TRUE.equals(x.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Attendance cover", id));
        e.setStatus("CANCELLED");
        coverRepo.save(e);
    }

    private AttendanceCoverDTOs.ConflictPayload buildConflictPayload(String tenantId, AttendanceCoverAssignment block, LocalDate coverDate) {
        AttendanceCoverDTOs.ConflictPayload p = new AttendanceCoverDTOs.ConflictPayload();
        p.setExistingCoverAssignmentId(block.getId());
        p.setExistingCoveringTeacherId(block.getCoveringTeacherId());
        p.setCoverDate(coverDate != null ? coverDate.toString() : null);
        p.setClassId(block.getClassId());
        p.setSectionId(block.getSectionId());
        p.setPeriodNumber(block.getPeriodNumber());
        teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(block.getCoveringTeacherId(), tenantId)
                .map(this::teacherDisplayName)
                .ifPresent(p::setExistingCoveringTeacherName);
        return p;
    }

    private String teacherDisplayName(Teacher te) {
        return (te.getFirstName() + " " + te.getLastName()).trim();
    }

    private AttendanceCoverDTOs.Response toResponse(AttendanceCoverAssignment e) {
        AttendanceCoverDTOs.Response r = new AttendanceCoverDTOs.Response();
        r.setId(e.getId());
        r.setCoverDate(e.getCoverDate() != null ? e.getCoverDate().toString() : null);
        r.setPeriodNumber(e.getPeriodNumber());
        r.setClassId(e.getClassId());
        r.setSectionId(e.getSectionId());
        r.setRegularTeacherId(e.getRegularTeacherId());
        r.setCoveringTeacherId(e.getCoveringTeacherId());
        r.setReason(e.getReason());
        r.setStatus(e.getStatus());
        r.setTimetableEntryId(e.getTimetableEntryId());
        return r;
    }
}
