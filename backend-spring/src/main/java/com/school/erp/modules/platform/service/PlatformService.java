package com.school.erp.modules.platform.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.modules.notification.repository.NotificationRepository;
import com.school.erp.modules.platform.dto.PlatformDTOs;
import com.school.erp.modules.platform.entity.PlatformTenantPurgeJob;
import com.school.erp.modules.platform.repository.PlatformTenantPurgeJobRepository;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.nio.file.FileStore;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class PlatformService {
    private final TenantConfigRepository tenantConfigRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final PlatformTenantPurgeJobRepository purgeJobRepository;
    private final TenantPurgeJobProcessor tenantPurgeJobProcessor;
    private final NotificationRepository notificationRepository;

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

    /**
     * Lightweight runtime snapshot (extend later with Actuator / Redis ping / external probes).
     */
    public PlatformDTOs.PlatformHealthResponse getHealthSnapshot() {
        PlatformDTOs.PlatformHealthResponse out = new PlatformDTOs.PlatformHealthResponse();
        out.setCheckedAt(Instant.now().toString());
        MemoryMXBean mem = ManagementFactory.getMemoryMXBean();
        long used = mem.getHeapMemoryUsage().getUsed();
        long max = Math.max(mem.getHeapMemoryUsage().getMax(), 1L);
        int pct = (int) Math.min(100, (used * 100) / max);
        PlatformDTOs.JvmMemory jvm = new PlatformDTOs.JvmMemory();
        jvm.setHeapUsedBytes(used);
        jvm.setHeapMaxBytes(max);
        jvm.setHeapUsagePercent(pct);
        out.setJvm(jvm);
        Path root = Path.of(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        PlatformDTOs.DiskSpace disk = new PlatformDTOs.DiskSpace();
        disk.setPath(root.toString());
        try {
            FileStore store = Files.getFileStore(root);
            long total = store.getTotalSpace();
            long usable = store.getUsableSpace();
            disk.setTotalBytes(total);
            disk.setUsableBytes(usable);
            if (total > 0) {
                disk.setUsagePercent((int) Math.min(100, ((total - usable) * 100) / total));
            } else {
                disk.setUsagePercent(0);
            }
        } catch (IOException e) {
            disk.setTotalBytes(0);
            disk.setUsableBytes(0);
            disk.setUsagePercent(0);
        }
        out.setDisk(disk);
        List<PlatformDTOs.ComponentHealth> comps = new ArrayList<>();
        comps.add(new PlatformDTOs.ComponentHealth("API runtime", "UP", "Spring Boot process responding"));
        comps.add(new PlatformDTOs.ComponentHealth("Database pool", "UP", "HikariCP active (tenant queries use this pool)"));
        comps.add(new PlatformDTOs.ComponentHealth("Object storage", "WARN", "Attach S3/MinIO health when media module is enabled"));
        out.setComponents(comps);
        return out;
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
    public PlatformDTOs.SchoolDetailResponse getSchoolDetail(String tenantId) {
        TenantConfig tc = requireTenant(tenantId);
        PlatformDTOs.SchoolDetailResponse out = new PlatformDTOs.SchoolDetailResponse();
        out.setSchool(toSchoolSummary(tc));
        out.setAdmins(getSchoolAdmins(tenantId));
        out.setParentUserCount(userRepository.countByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.PARENT));
        return out;
    }

    @Transactional
    public void suspendSchoolWorkspace(String tenantId) {
        TenantConfig tc = requireTenant(tenantId);
        tc.setIsActive(false);
        tenantConfigRepository.save(tc);
        userRepository.deactivateAllByTenantId(tenantId);
    }

    @Transactional
    public void activateSchoolWorkspace(String tenantId) {
        TenantConfig tc = requireTenant(tenantId);
        tc.setIsActive(true);
        tenantConfigRepository.save(tc);
    }

    @Transactional
    public PlatformDTOs.PurgeJobSummary requestTenantDataPurge(String tenantId, PlatformDTOs.PurgeSchoolDataRequest request) {
        TenantConfig tc = requireTenant(tenantId);
        if (Boolean.TRUE.equals(tc.getIsActive())) {
            throw new BusinessException("Suspend the school workspace before requesting a data purge.");
        }
        String confirm = request.getConfirmSchoolCode() != null
                ? request.getConfirmSchoolCode().trim().toUpperCase(Locale.ROOT)
                : "";
        if (!tc.getSchoolCode().equalsIgnoreCase(confirm)) {
            throw new BusinessException("School code confirmation does not match this workspace.");
        }
        PlatformTenantPurgeJob job = new PlatformTenantPurgeJob();
        job.setTenantId(tenantId);
        job.setSchoolCode(tc.getSchoolCode());
        job.setStatus("QUEUED");
        job = purgeJobRepository.save(job);
        Long jobId = job.getId();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    tenantPurgeJobProcessor.processJobAsync(jobId);
                }
            });
        } else {
            tenantPurgeJobProcessor.processJobAsync(jobId);
        }
        return toPurgeJobSummary(job);
    }

    @Transactional(readOnly = true)
    public List<PlatformDTOs.PurgeJobSummary> listPurgeJobsForTenant(String tenantId) {
        // Do not require tenant_configs row — after a completed purge the workspace row is gone but job history remains.
        return purgeJobRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toPurgeJobSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PlatformDTOs.SubscriptionPlanRow> listSubscriptionPlans() {
        List<PlatformDTOs.SubscriptionPlanRow> rows = new ArrayList<>();
        rows.add(plan("STARTER", "Starter", "Ideal for a single campus validating digital attendance, fees, and parent engagement.", 4900, "USD",
                List.of("Guided onboarding checklist", "Standard uptime targets", "Community knowledge base"),
                "Up to 300 active students", "Email & chat (business hours)",
                List.of("Students & classes", "Attendance", "Timetable (read)", "Fees (core)", "Parent portal (read)", "Announcements", "Basic reports"),
                false));
        rows.add(plan("STANDARD", "Standard", "The default production tier for schools running academics, finance, and operations in one place.", 12900, "USD",
                List.of("Quarterly success review", "Data export APIs", "Optional SSO add-on"),
                "Up to 2,000 active students", "Priority support (12×5)",
                List.of("Everything in Starter", "Exams & gradebook", "Library", "Transport & routes", "Hostel", "Payroll (standard)", "Documents", "Audit trail (90 days)", "Chat"),
                true));
        rows.add(plan("ENTERPRISE", "Enterprise", "Regional groups, compliance-heavy boards, and multi-branch governance with custom limits.", 0, "USD",
                List.of("Custom MSA & DPA", "Dedicated technical account lead", "Optional on-prem / VPC"),
                "Custom (unlimited branches)", "Named CSM + 24×7 hotline",
                List.of("Everything in Standard", "Multi-branch roll-up", "Advanced audit (retention policies)", "Custom integrations", "Sandbox tenant", "DR runbooks"),
                false));
        return rows;
    }

    private static PlatformDTOs.SubscriptionPlanRow plan(
            String code,
            String name,
            String desc,
            int minor,
            String cur,
            List<String> highlights,
            String maxStudentsLabel,
            String supportTier,
            List<String> modules,
            boolean recommended
    ) {
        PlatformDTOs.SubscriptionPlanRow r = new PlatformDTOs.SubscriptionPlanRow();
        r.setCode(code);
        r.setName(name);
        r.setDescription(desc);
        r.setMonthlyPriceMinorUnits(minor);
        r.setCurrency(cur);
        r.setHighlights(new ArrayList<>(highlights));
        r.setMaxStudentsLabel(maxStudentsLabel);
        r.setSupportTier(supportTier);
        r.setBillingCadence("Billed monthly per active workspace");
        r.setModules(new ArrayList<>(modules));
        r.setRecommended(recommended);
        return r;
    }

    @Transactional
    public PlatformDTOs.PlatformBroadcastResult broadcastToSchoolAdmins(PlatformDTOs.PlatformBroadcastRequest request) {
        Enums.NotificationType type = parseNotificationType(request.getNotificationType());
        List<TenantConfig> targets;
        if (request.getTargetTenantId() != null && !request.getTargetTenantId().isBlank()) {
            targets = List.of(requireTenant(request.getTargetTenantId().trim()));
        } else {
            targets = tenantConfigRepository.findAll().stream()
                    .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                    .toList();
        }
        int rows = 0;
        for (TenantConfig tc : targets) {
            List<User> admins = userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tc.getTenantId(), Enums.Role.ADMIN);
            List<Notification> batch = new ArrayList<>();
            for (User admin : admins) {
                Notification n = new Notification();
                n.setTenantId(tc.getTenantId());
                n.setTitle(request.getTitle().trim());
                n.setMessage(request.getMessage().trim());
                n.setType(type);
                n.setIsRead(false);
                n.setUserId(admin.getId());
                n.setLink("/app/dashboard");
                n.setIsActive(true);
                n.setIsDeleted(false);
                batch.add(n);
            }
            if (!batch.isEmpty()) {
                notificationRepository.saveAll(batch);
                rows += batch.size();
            }
        }
        return new PlatformDTOs.PlatformBroadcastResult(rows, targets.size());
    }

    private static Enums.NotificationType parseNotificationType(String raw) {
        if (raw == null || raw.isBlank()) {
            return Enums.NotificationType.INFO;
        }
        try {
            return Enums.NotificationType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return Enums.NotificationType.INFO;
        }
    }

    private PlatformDTOs.PurgeJobSummary toPurgeJobSummary(PlatformTenantPurgeJob job) {
        PlatformDTOs.PurgeJobSummary s = new PlatformDTOs.PurgeJobSummary();
        s.setId(job.getId());
        s.setTenantId(job.getTenantId());
        s.setSchoolCode(job.getSchoolCode());
        s.setStatus(job.getStatus());
        s.setErrorMessage(job.getErrorMessage());
        s.setRowsDeletedEstimate(job.getRowsDeletedEstimate());
        s.setCreatedAt(job.getCreatedAt() != null ? job.getCreatedAt().toString() : null);
        s.setStartedAt(job.getStartedAt() != null ? job.getStartedAt().toString() : null);
        s.setCompletedAt(job.getCompletedAt() != null ? job.getCompletedAt().toString() : null);
        return s;
    }

    private TenantConfig requireTenant(String tenantId) {
        return tenantConfigRepository.findByTenantId(tenantId)
                .filter(config -> !Boolean.TRUE.equals(config.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("School workspace not found for tenant: " + tenantId));
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

    public PlatformService(
            TenantConfigRepository tenantConfigRepository,
            UserRepository userRepository,
            StudentRepository studentRepository,
            TeacherRepository teacherRepository,
            PlatformTenantPurgeJobRepository purgeJobRepository,
            TenantPurgeJobProcessor tenantPurgeJobProcessor,
            NotificationRepository notificationRepository
    ) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.purgeJobRepository = purgeJobRepository;
        this.tenantPurgeJobProcessor = tenantPurgeJobProcessor;
        this.notificationRepository = notificationRepository;
    }
}
