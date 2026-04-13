package com.school.erp.modules.attendance.port;

import com.school.erp.modules.attendance.entity.AttendanceRecord;
import com.school.erp.modules.attendance.repository.AttendanceRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class AttendancePersistenceJpaAdapter implements AttendancePersistencePort {

    private final AttendanceRepository delegate;

    public AttendancePersistenceJpaAdapter(AttendanceRepository delegate) {
        this.delegate = delegate;
    }

    @Override
    public List<AttendanceRecord> findByTenantIdAndClassIdAndSectionIdAndDate(String tenantId, Long classId, Long sectionId, LocalDate date) {
        return delegate.findByTenantIdAndClassIdAndSectionIdAndDate(tenantId, classId, sectionId, date);
    }

    @Override
    public List<AttendanceRecord> saveAll(Iterable<AttendanceRecord> records) {
        return delegate.saveAll(records);
    }

    @Override
    public List<AttendanceRecord> findByTenantIdAndStudentIdAndDateBetween(String tenantId, Long studentId, LocalDate from, LocalDate to) {
        return delegate.findByTenantIdAndStudentIdAndDateBetween(tenantId, studentId, from, to);
    }

    @Override
    public List<Object[]> getClassAttendanceStats(String tenantId, Long classId, LocalDate date) {
        return delegate.getClassAttendanceStats(tenantId, classId, date);
    }

    @Override
    public List<Object[]> getStudentAttendanceStats(String tenantId, Long studentId, LocalDate from, LocalDate to) {
        return delegate.getStudentAttendanceStats(tenantId, studentId, from, to);
    }
}
