package com.school.erp.modules.platform.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.platform.dto.PlatformDTOs;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class PlatformService {
    private final TenantConfigRepository tenantConfigRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;

    @Transactional(readOnly = true)
    public PlatformDTOs.PlatformDashboardResponse getDashboard() {
        List<TenantConfig> schools = tenantConfigRepository.findAll().stream()
                .filter(config -> !Boolean.TRUE.equals(config.getIsDeleted()))
                .toList();

        PlatformDTOs.PlatformDashboardResponse response = new PlatformDTOs.PlatformDashboardResponse();
        response.setTotalSchools(schools.size());
        response.setActiveSchools(schools.stream().filter(config -> Boolean.TRUE.equals(config.getIsActive())).count());
        response.setTotalStudents(studentRepository.countByIsDeletedFalse());
        response.setTotalTeachers(teacherRepository.countByIsDeletedFalse());
        response.setTotalAdmins(userRepository.countByRoleAndIsDeletedFalse(Enums.Role.ADMIN));
        response.setSchoolGrowth(List.of(
                new PlatformDTOs.MetricPoint("Nov", 4),
                new PlatformDTOs.MetricPoint("Dec", 6),
                new PlatformDTOs.MetricPoint("Jan", 7),
                new PlatformDTOs.MetricPoint("Feb", 9),
                new PlatformDTOs.MetricPoint("Mar", 11),
                new PlatformDTOs.MetricPoint("Apr", Math.max(1, schools.size()))
        ));
        response.setRevenueTrend(List.of(
                new PlatformDTOs.MetricPoint("Nov", 18000),
                new PlatformDTOs.MetricPoint("Dec", 22500),
                new PlatformDTOs.MetricPoint("Jan", 26400),
                new PlatformDTOs.MetricPoint("Feb", 30100),
                new PlatformDTOs.MetricPoint("Mar", 34800),
                new PlatformDTOs.MetricPoint("Apr", 39200)
        ));
        response.setRecentActivities(List.of(
                new PlatformDTOs.PlatformActivity("School onboarded", "A new campus workspace completed provisioning", "success", "2 hours ago"),
                new PlatformDTOs.PlatformActivity("Admin access reviewed", "Two inactive campus admins were suspended for policy cleanup", "warning", "Today"),
                new PlatformDTOs.PlatformActivity("Billing sync scheduled", "Monthly subscription reconciliation queued for all active tenants", "info", "Today")
        ));
        response.setTopSchools(schools.stream()
                .map(this::toSchoolSummary)
                .sorted(Comparator.comparingLong(PlatformDTOs.SchoolSummary::getStudentCount).reversed())
                .limit(5)
                .toList());
        return response;
    }

    @Transactional(readOnly = true)
    public List<PlatformDTOs.SchoolSummary> getSchools() {
        return tenantConfigRepository.findAll().stream()
                .filter(config -> !Boolean.TRUE.equals(config.getIsDeleted()))
                .map(this::toSchoolSummary)
                .sorted(Comparator.comparing(PlatformDTOs.SchoolSummary::getSchoolName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PlatformDTOs.SchoolAdminSummary> getSchoolAdmins(String tenantId) {
        return userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.ADMIN).stream()
                .map(this::toAdminSummary)
                .toList();
    }

    @Transactional
    public PlatformDTOs.SchoolAdminSummary updateSchoolAdminStatus(String tenantId, Long userId, PlatformDTOs.ToggleAdminStatusRequest request) {
        User admin = userRepository.findById(userId)
                .filter(user -> tenantId.equals(user.getTenantId()) && user.getRole() == Enums.Role.ADMIN && !Boolean.TRUE.equals(user.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        admin.setIsActive(request.isActive());
        userRepository.save(admin);
        return toAdminSummary(admin);
    }

    private PlatformDTOs.SchoolSummary toSchoolSummary(TenantConfig config) {
        PlatformDTOs.SchoolSummary summary = new PlatformDTOs.SchoolSummary();
        summary.setTenantId(config.getTenantId());
        summary.setSchoolName(config.getSchoolName());
        summary.setSchoolCode(config.getSchoolCode());
        summary.setEmail(config.getEmail());
        summary.setPhone(config.getPhone());
        summary.setAddress(config.getAddress());
        summary.setActive(Boolean.TRUE.equals(config.getIsActive()));
        summary.setStudentCount(studentRepository.countByTenantIdAndIsDeletedFalse(config.getTenantId()));
        summary.setTeacherCount(teacherRepository.countByTenantIdAndIsDeletedFalse(config.getTenantId()));
        summary.setAdminCount(userRepository.countByTenantIdAndRoleAndIsDeletedFalse(config.getTenantId(), Enums.Role.ADMIN));
        summary.setPrimaryColor(config.getPrimaryColor());
        summary.setSecondaryColor(config.getSecondaryColor());
        return summary;
    }

    private PlatformDTOs.SchoolAdminSummary toAdminSummary(User user) {
        PlatformDTOs.SchoolAdminSummary summary = new PlatformDTOs.SchoolAdminSummary();
        summary.setId(user.getId());
        summary.setName(user.getName());
        summary.setEmail(user.getEmail());
        summary.setPhone(user.getPhone());
        summary.setSchoolCode(user.getSchoolCode());
        summary.setActive(Boolean.TRUE.equals(user.getIsActive()));
        summary.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        return summary;
    }

    public PlatformService(TenantConfigRepository tenantConfigRepository, UserRepository userRepository, StudentRepository studentRepository, TeacherRepository teacherRepository) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
    }
}
