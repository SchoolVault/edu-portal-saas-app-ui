package com.school.erp.modules.attendance.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.attendance.dto.AttendanceDTOs;
import com.school.erp.modules.attendance.entity.AttendanceRecord;
import com.school.erp.modules.attendance.repository.AttendanceRepository;
import com.school.erp.modules.student.service.TeacherRosterScopeService;
import com.school.erp.tenant.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AttendanceService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AttendanceService.class);
    private final AttendanceRepository repo;
    private final TeacherRosterScopeService teacherRosterScopeService;

    private void assertTeacherAttendanceScope(Long classId, Long sectionId, LocalDate date) {
        if (!teacherRosterScopeService.teacherMayMarkAttendance(classId, sectionId, date)) {
            throw new UnauthorizedException("Not allowed to access or mark attendance for this class/section");
        }
    }

    @Transactional(readOnly = true)
    public List<AttendanceDTOs.AttendanceResponse> getByClassSectionDate(Long classId, Long sectionId, LocalDate date) {
        assertTeacherAttendanceScope(classId, sectionId, date);
        return repo.findByTenantIdAndClassIdAndSectionIdAndDate(TenantContext.getTenantId(), classId, sectionId, date).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<AttendanceDTOs.AttendanceResponse> getByClassSectionDatePaged(Long classId, Long sectionId, LocalDate date, int page, int size) {
        assertTeacherAttendanceScope(classId, sectionId, date);
        Pageable pageable = PageRequest.of(page, size, Sort.by("studentId"));
        Page<AttendanceRecord> pg = repo.findByTenantIdAndClassIdAndSectionIdAndDateAndIsDeletedFalseOrderByStudentIdAsc(
                TenantContext.getTenantId(), classId, sectionId, date, pageable);
        return PageResponse.fromSpringPage(pg.map(this::toResponse));
    }

    @Transactional
    public List<AttendanceDTOs.AttendanceResponse> markAttendance(AttendanceDTOs.BulkMarkRequest request) {
        String t = TenantContext.getTenantId();
        Long markedBy = TenantContext.getUserId();
        LocalDate date = LocalDate.parse(request.getDate());
        assertTeacherAttendanceScope(request.getClassId(), request.getSectionId(), date);
        String role = TenantContext.getUserRole();
        // Class / cover teachers may save only for the current calendar day; once the day has passed, only administrators may change records.
        if (role != null && "TEACHER".equalsIgnoreCase(role) && !date.equals(LocalDate.now())) {
            throw new BusinessException(
                    "Teachers may record or correct attendance only for today. After the day ends, contact an administrator to change historical attendance.");
        }
        List<AttendanceRecord> records = 
        // Check if record exists for this student+date - update or create
        request.getRecords().stream().map(r -> {
            List<AttendanceRecord> existing = repo.findByTenantIdAndClassIdAndSectionIdAndDate(t, request.getClassId(), request.getSectionId(), date);
            AttendanceRecord existingRec = existing.stream().filter(e -> e.getStudentId().equals(r.getStudentId())).findFirst().orElse(null);
            if (existingRec != null) {
                existingRec.setStatus(Enums.AttendanceStatus.valueOf(r.getStatus().toUpperCase()));
                existingRec.setMarkedBy(markedBy);
                existingRec.setRemarks(r.getRemarks());
                return existingRec;
            } else {
                AttendanceRecord rec = AttendanceRecord.builder().studentId(r.getStudentId()).studentName(r.getStudentName()).classId(request.getClassId()).sectionId(request.getSectionId()).date(date).status(Enums.AttendanceStatus.valueOf(r.getStatus().toUpperCase())).markedBy(markedBy).remarks(r.getRemarks()).build();
                rec.setTenantId(t);
                return rec;
            }
        }).collect(Collectors.toList());
        repo.saveAll(records);
        log.info("Attendance marked for class={} section={} date={} students={}", request.getClassId(), request.getSectionId(), date, records.size());
        return records.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AttendanceDTOs.AttendanceStatsResponse getStudentStats(Long studentId, LocalDate from, LocalDate to) {
        List<AttendanceRecord> records = repo.findByTenantIdAndStudentIdAndDateBetween(TenantContext.getTenantId(), studentId, from, to);
        long present = records.stream().filter(r -> r.getStatus() == Enums.AttendanceStatus.PRESENT).count();
        long absent = records.stream().filter(r -> r.getStatus() == Enums.AttendanceStatus.ABSENT).count();
        long late = records.stream().filter(r -> r.getStatus() == Enums.AttendanceStatus.LATE).count();
        long excused = records.stream().filter(r -> r.getStatus() == Enums.AttendanceStatus.EXCUSED).count();
        long total = records.size();
        double pct = total > 0 ? (double) (present + late) / total * 100 : 0;
        return AttendanceDTOs.AttendanceStatsResponse.builder().studentId(studentId).totalDays(total).present(present).absent(absent).late(late).excused(excused).attendancePercentage(Math.round(pct * 10) / 10.0).build();
    }

    @Transactional(readOnly = true)
    public AttendanceDTOs.ClassAttendanceStatsResponse getClassStats(Long classId, Long sectionId, LocalDate date) {
        assertTeacherAttendanceScope(classId, sectionId, date);
        List<AttendanceRecord> records = repo.findByTenantIdAndClassIdAndSectionIdAndDate(TenantContext.getTenantId(), classId, sectionId, date);
        long present = records.stream().filter(r -> r.getStatus() == Enums.AttendanceStatus.PRESENT).count();
        long absent = records.stream().filter(r -> r.getStatus() == Enums.AttendanceStatus.ABSENT).count();
        long late = records.stream().filter(r -> r.getStatus() == Enums.AttendanceStatus.LATE).count();
        long total = records.size();
        return AttendanceDTOs.ClassAttendanceStatsResponse.builder().classId(classId).sectionId(sectionId).date(date.toString()).totalStudents(total).present(present).absent(absent).late(late).attendancePercentage(total > 0 ? Math.round((double) (present + late) / total * 1000) / 10.0 : 0).build();
    }

    @Transactional(readOnly = true)
    public List<AttendanceDTOs.MonthlyAttendanceRow> getMonthlyReport(Long classId, Long sectionId, int year, int month) {
        assertTeacherAttendanceScope(classId, sectionId, LocalDate.now());
        String t = TenantContext.getTenantId();
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
        // Get all records for this class/section in the month
        List<AttendanceRecord> allRecords = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (d.getDayOfWeek().getValue() <= 6) {
                // Mon-Sat working days
                allRecords.addAll(repo.findByTenantIdAndClassIdAndSectionIdAndDate(t, classId, sectionId, d));
            }
        }
        // Group by student
        Map<Long, List<AttendanceRecord>> byStudent = allRecords.stream().collect(Collectors.groupingBy(AttendanceRecord::getStudentId));
        return byStudent.entrySet().stream().map(entry -> {
            List<AttendanceRecord> recs = entry.getValue();
            String studentName = recs.isEmpty() ? "" : recs.get(0).getStudentName();
            long p = recs.stream().filter(r -> r.getStatus() == Enums.AttendanceStatus.PRESENT).count();
            long a = recs.stream().filter(r -> r.getStatus() == Enums.AttendanceStatus.ABSENT).count();
            long l = recs.stream().filter(r -> r.getStatus() == Enums.AttendanceStatus.LATE).count();
            long total = recs.size();
            return AttendanceDTOs.MonthlyAttendanceRow.builder().studentId(entry.getKey()).studentName(studentName).present(p).absent(a).late(l).totalDays(total).attendancePercentage(total > 0 ? Math.round((double) (p + l) / total * 1000) / 10.0 : 0).build();
        }).sorted((a, b) -> Double.compare(b.getAttendancePercentage(), a.getAttendancePercentage())).collect(Collectors.toList());
    }

    private AttendanceDTOs.AttendanceResponse toResponse(AttendanceRecord r) {
        return AttendanceDTOs.AttendanceResponse.builder().id(r.getId()).studentId(r.getStudentId()).studentName(r.getStudentName()).classId(r.getClassId()).sectionId(r.getSectionId()).date(r.getDate().toString()).status(r.getStatus().name().toLowerCase()).markedBy(r.getMarkedBy()).remarks(r.getRemarks()).build();
    }

    public AttendanceService(final AttendanceRepository repo, final TeacherRosterScopeService teacherRosterScopeService) {
        this.repo = repo;
        this.teacherRosterScopeService = teacherRosterScopeService;
    }
}
