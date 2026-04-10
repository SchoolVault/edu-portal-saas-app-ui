package com.school.erp.modules.attendance.service;

import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.attendance.dto.AttendanceCoverDTOs;
import com.school.erp.modules.attendance.entity.AttendanceCoverAssignment;
import com.school.erp.modules.attendance.repository.AttendanceCoverAssignmentRepository;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
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

    @Transactional
    public AttendanceCoverDTOs.Response create(AttendanceCoverDTOs.CreateRequest req) {
        String t = TenantContext.getTenantId();
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
