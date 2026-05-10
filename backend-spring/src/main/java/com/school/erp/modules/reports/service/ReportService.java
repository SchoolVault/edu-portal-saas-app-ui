package com.school.erp.modules.reports.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.config.CacheConfig;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.notification.service.NotificationService;
import com.school.erp.modules.reports.dto.AdminAttendanceOverviewScope;
import com.school.erp.modules.reports.dto.ParentDashboardDtos;
import com.school.erp.modules.reports.dto.ReportDashboardDTOs;
import com.school.erp.modules.reports.dto.ReportModuleDTOs;
import com.school.erp.modules.reports.entity.ReportAnalyticsPackConfig;
import com.school.erp.modules.reports.entity.ReportGenerationJob;
import com.school.erp.modules.reports.entity.ReportNotificationTemplate;
import com.school.erp.modules.reports.entity.ReportPublicationSnapshot;
import com.school.erp.modules.reports.entity.ReportShareDispatch;
import com.school.erp.modules.reports.entity.ReportTemplate;
import com.school.erp.modules.reports.entity.ReportWorkflowEventLog;
import com.school.erp.modules.reports.port.ReportQueryPort;
import com.school.erp.modules.reports.repository.ReportAnalyticsPackConfigRepository;
import com.school.erp.modules.reports.repository.ReportGenerationJobRepository;
import com.school.erp.modules.reports.repository.ReportNotificationTemplateRepository;
import com.school.erp.modules.reports.repository.ReportPublicationSnapshotRepository;
import com.school.erp.modules.reports.repository.ReportShareDispatchRepository;
import com.school.erp.modules.reports.repository.ReportTemplateRepository;
import com.school.erp.modules.reports.repository.ReportWorkflowEventLogRepository;
import com.school.erp.modules.reports.repository.DashboardSnapshotRepository;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.tenant.TenantContext;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * Facade for report/dashboard HTTP layer. Heavy lifting lives in {@link ReportQueryPort}
 * ({@code oltp} vs {@code warehouse} via {@code app.reports.backend}).
 * <p>
 * Dashboard payloads are persisted in {@code dashboard_snapshot} (see {@link DashboardSnapshotService})
 * with optional microcache / age rules; drill-down reports use {@link CacheConfig#REPORT_RESULTS} via
 * {@code @Cacheable} when Redis is enabled. Paged endpoints delegate through {@link #self} so list methods stay cache hits.
 */
@Service
public class ReportService {

    private final ReportQueryPort reportQueryPort;
    private final ReportTemplateRepository reportTemplateRepository;
    private final ReportGenerationJobRepository reportGenerationJobRepository;
    private final ReportNotificationTemplateRepository reportNotificationTemplateRepository;
    private final ReportShareDispatchRepository reportShareDispatchRepository;
    private final ReportPublicationSnapshotRepository reportPublicationSnapshotRepository;
    private final ReportWorkflowEventLogRepository reportWorkflowEventLogRepository;
    private final ReportAnalyticsPackConfigRepository reportAnalyticsPackConfigRepository;
    private final ReportExportService reportExportService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final ObjectMapper objectMapper;
    private final DashboardSnapshotService dashboardSnapshotService;
    private final DashboardSnapshotRepository dashboardSnapshotRepository;
    private final ReportPerformanceMetricsService reportPerformanceMetricsService;
    private final ReportBinaryStorageService reportBinaryStorageService;

    public ReportService(
            ReportQueryPort reportQueryPort,
            ReportTemplateRepository reportTemplateRepository,
            ReportGenerationJobRepository reportGenerationJobRepository,
            ReportNotificationTemplateRepository reportNotificationTemplateRepository,
            ReportShareDispatchRepository reportShareDispatchRepository,
            ReportPublicationSnapshotRepository reportPublicationSnapshotRepository,
            ReportWorkflowEventLogRepository reportWorkflowEventLogRepository,
            ReportAnalyticsPackConfigRepository reportAnalyticsPackConfigRepository,
            ReportExportService reportExportService,
            NotificationService notificationService,
            UserRepository userRepository,
            StudentRepository studentRepository,
            ObjectMapper objectMapper,
            DashboardSnapshotService dashboardSnapshotService,
            DashboardSnapshotRepository dashboardSnapshotRepository,
            ReportPerformanceMetricsService reportPerformanceMetricsService,
            ReportBinaryStorageService reportBinaryStorageService) {
        this.reportQueryPort = reportQueryPort;
        this.reportTemplateRepository = reportTemplateRepository;
        this.reportGenerationJobRepository = reportGenerationJobRepository;
        this.reportNotificationTemplateRepository = reportNotificationTemplateRepository;
        this.reportShareDispatchRepository = reportShareDispatchRepository;
        this.reportPublicationSnapshotRepository = reportPublicationSnapshotRepository;
        this.reportWorkflowEventLogRepository = reportWorkflowEventLogRepository;
        this.reportAnalyticsPackConfigRepository = reportAnalyticsPackConfigRepository;
        this.reportExportService = reportExportService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.objectMapper = objectMapper;
        this.dashboardSnapshotService = dashboardSnapshotService;
        this.dashboardSnapshotRepository = dashboardSnapshotRepository;
        this.reportPerformanceMetricsService = reportPerformanceMetricsService;
        this.reportBinaryStorageService = reportBinaryStorageService;
    }

    @Transactional
    public Map<String, Object> getDashboardKPIs() {
        return timedReportRead("dashboard.kpis", () ->
                dashboardSnapshotService.getKpiSnapshotOrRefresh(TenantContext.getUserRole(), reportQueryPort::getDashboardKPIs),
                map -> map != null ? map.size() : 0);
    }

    @Transactional
    public ReportDashboardDTOs.AdminDashboardResponse getAdminDashboard(
            String attendanceOverviewScopeRaw,
            String attendanceOverviewMonth) {
        AdminAttendanceOverviewScope scope = AdminAttendanceOverviewScope.fromQueryParam(attendanceOverviewScopeRaw);
        String monthToken = normalizeMonth(attendanceOverviewMonth);
        return timedReportRead(
                "dashboard.admin",
                () ->
                        dashboardSnapshotService.getAdminSnapshotOrRefresh(
                                scope.name() + "|" + monthToken,
                                () -> reportQueryPort.getAdminDashboard(scope, monthToken)),
                out -> out != null && out.getRecentActivities() != null ? out.getRecentActivities().size() : 0);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportDashboardDTOs.ActivityItem> getAdminRecentActivitiesPaged(
            int page,
            int size,
            String q,
            String eventType,
            String fromDate,
            String toDate) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        return PageResponse.fromSpringPage(reportQueryPort.getAdminRecentActivities(
                q, eventType, fromDate, toDate, PageRequest.of(safePage, safeSize)));
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportDashboardDTOs.UpcomingEvent> getAdminUpcomingEventsPaged(
            int page,
            int size,
            String q,
            String eventType,
            String fromDate,
            String toDate) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        return PageResponse.fromSpringPage(reportQueryPort.getAdminUpcomingEvents(
                q, eventType, fromDate, toDate, PageRequest.of(safePage, safeSize)));
    }

    @Transactional
    public ReportDashboardDTOs.TeacherDashboardResponse getTeacherDashboard(String month) {
        return timedReportRead("dashboard.teacher", () ->
                dashboardSnapshotService.getTeacherSnapshotOrRefresh(month, () -> reportQueryPort.getTeacherDashboard(month)),
                out -> out != null && out.getTodaySchedule() != null ? out.getTodaySchedule().size() : 0);
    }

    @Transactional
    public ParentDashboardDtos.Response getParentDashboard(String from, String to, Long childId) {
        return timedReportRead("dashboard.parent", () ->
                dashboardSnapshotService.getParentSnapshotOrRefresh(from, to, childId, () -> reportQueryPort.getParentDashboard(from, to, childId)),
                out -> out != null && out.getChildren() != null ? out.getChildren().size() : 0);
    }

    @Cacheable(cacheNames = CacheConfig.REPORT_RESULTS, keyGenerator = "tenantMethodParamsKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStudentPerformanceReport(Long classId, Long examId, Long sectionId) {
        return filterRowsBySection(reportQueryPort.getStudentPerformanceReport(classId, examId), classId, sectionId);
    }

    @Cacheable(cacheNames = CacheConfig.REPORT_RESULTS, keyGenerator = "tenantMethodParamsKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAttendanceSummary(Long classId, String month, Long sectionId) {
        return filterRowsBySection(reportQueryPort.getAttendanceSummary(classId, month), classId, sectionId);
    }

    @Cacheable(cacheNames = CacheConfig.REPORT_RESULTS, keyGenerator = "tenantMethodParamsKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public Map<String, Object> getFeeCollectionReport(Long classId, Long sectionId) {
        return reportQueryPort.getFeeCollectionReport(classId);
    }

    @Cacheable(cacheNames = CacheConfig.REPORT_RESULTS, keyGenerator = "tenantUserRoleKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getClassSummary() {
        return reportQueryPort.getClassSummary();
    }

    @Cacheable(cacheNames = CacheConfig.REPORT_RESULTS, keyGenerator = "tenantUserRoleKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSectionSummary() {
        return reportQueryPort.getSectionSummary();
    }

    @Cacheable(cacheNames = CacheConfig.REPORT_RESULTS, keyGenerator = "tenantUserRoleKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTeacherWorkload() {
        return reportQueryPort.getTeacherWorkload();
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> getClassSummaryPaged(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        return PageResponse.fromSpringPage(reportQueryPort.getClassSummaryPaged(safePage, safeSize));
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> getSectionSummaryPaged(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        return PageResponse.fromSpringPage(reportQueryPort.getSectionSummaryPaged(safePage, safeSize));
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> getTeacherWorkloadPaged(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        return PageResponse.fromSpringPage(reportQueryPort.getTeacherWorkloadPaged(safePage, safeSize));
    }

    @Transactional(readOnly = true)
    public List<ReportModuleDTOs.TemplateResponse> listTemplates() {
        String tenantId = TenantContext.getTenantId();
        return reportTemplateRepository.findByTenantIdAndIsDeletedFalseOrderByNameAsc(tenantId).stream().map(this::toTemplateOut).toList();
    }

    @Transactional
    public ReportModuleDTOs.TemplateResponse upsertTemplate(ReportModuleDTOs.UpsertTemplateRequest req) {
        String tenantId = TenantContext.getTenantId();
        String reportType = normalizeReportType(req.getReportType());
        String code = normalizeTemplateCode(req.getTemplateCode());
        validateTemplateConfig(req);
        ReportTemplate row = req.getId() != null
                ? reportTemplateRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("ReportTemplate", req.getId()))
                : new ReportTemplate();
        reportTemplateRepository.findByTenantIdAndTemplateCodeAndIsDeletedFalse(tenantId, code).ifPresent(existing -> {
            if (row.getId() == null || !existing.getId().equals(row.getId())) {
                throw new BusinessException("Template code already exists for this school.");
            }
        });
        row.setTenantId(tenantId);
        row.setTemplateCode(code);
        row.setName(req.getName().trim());
        row.setReportType(reportType);
        row.setDefaultFormat(normalizeFormat(req.getDefaultFormat() != null ? req.getDefaultFormat() : "PDF"));
        row.setPackCode(req.getPackCode() != null ? req.getPackCode().trim().toUpperCase(Locale.ROOT) : null);
        row.setLayoutConfigJson(writeJson(enrichLayoutConfig(req)));
        row.setFilterSchemaJson(writeJson(req.getFilterSchema()));
        reportTemplateRepository.save(row);
        return toTemplateOut(row);
    }

    @Transactional
    public ReportModuleDTOs.ReportJobResponse generateReport(ReportModuleDTOs.GenerateReportRequest req) {
        String tenantId = TenantContext.getTenantId();
        String reportType = normalizeReportType(req.getReportType());
        String format = normalizeFormat(req.getFormat());
        Map<String, Object> filters = req.getFilters() != null ? req.getFilters() : Map.of();
        String requestId = req.getRequestId() != null && !req.getRequestId().isBlank()
                ? req.getRequestId().trim()
                : "report-" + System.currentTimeMillis();
        reportGenerationJobRepository.findByTenantIdAndRequestIdAndIsDeletedFalse(tenantId, requestId)
                .ifPresent(existing -> { throw new BusinessException("Duplicate report requestId for tenant."); });
        LocalDateTime scheduleAt = parseScheduleAt(req.getScheduleAt());
        if (req.getTemplateId() != null) {
            reportTemplateRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getTemplateId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("ReportTemplate", req.getTemplateId()));
        }
        ReportGenerationJob job = new ReportGenerationJob();
        job.setTenantId(tenantId);
        job.setRequestId(requestId);
        job.setTemplateId(req.getTemplateId());
        job.setReportType(reportType);
        job.setFormat(format);
        job.setFilterJson(writeJson(filters));
        job.setShareConfigJson(writeJson(req.getShareConfig()));
        job.setScheduleAt(scheduleAt);
        job.setStatus(scheduleAt == null ? "RUNNING" : "QUEUED");
        job.setWorkflowState("DRAFT");
        job.setWorkflowNote(null);
        job.setCreatorUserId(TenantContext.getUserId());
        job.setApproverUserId(null);
        job.setPublisherUserId(null);
        job.setAttempts(0);
        job.setMaxAttempts(3);
        reportGenerationJobRepository.save(job);
        logWorkflowEvent(job, "JOB_CREATED", null, "DRAFT", "Report request accepted", Map.of("requestId", requestId));
        if (scheduleAt == null) {
            executeJobNow(job);
        }
        return toReportJobOut(job);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportModuleDTOs.ReportJobResponse> listGeneratedReports(int page, int size) {
        return PageResponse.fromSpringPage(
                reportGenerationJobRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(
                        TenantContext.getTenantId(),
                        PageRequest.of(page, size))
                        .map(this::toReportJobOut));
    }

    @Transactional(readOnly = true)
    public ReportGenerationJob getGeneratedReportFile(Long id) {
        return reportGenerationJobRepository.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("ReportGenerationJob", id));
    }

    @Transactional(readOnly = true)
    public byte[] getGeneratedReportContent(Long id) {
        ReportGenerationJob job = getGeneratedReportFile(id);
        if (job.getFileStoragePath() != null && !job.getFileStoragePath().isBlank()) {
            return reportBinaryStorageService.read(job.getFileStoragePath());
        }
        return job.getFileContent() != null ? job.getFileContent() : new byte[0];
    }

    @Transactional
    public ReportModuleDTOs.ReportJobResponse retryReportJob(Long id) {
        ReportGenerationJob job = reportGenerationJobRepository.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("ReportGenerationJob", id));
        job.setStatus("QUEUED");
        job.setWorkflowState("DRAFT");
        job.setApproverUserId(null);
        job.setPublisherUserId(null);
        job.setAttempts(0);
        job.setLastError(null);
        job.setNextRetryAt(null);
        job.setScheduleAt(LocalDateTime.now());
        reportGenerationJobRepository.save(job);
        logWorkflowEvent(job, "JOB_RETRY_QUEUED", null, "DRAFT", "Retry requested", Map.of());
        return toReportJobOut(job);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportModuleDTOs.ShareDispatchResponse> listDispatches(Long jobId, int page, int size) {
        return PageResponse.fromSpringPage(
                reportShareDispatchRepository.findByTenantIdAndReportJobIdAndIsDeletedFalseOrderByCreatedAtDesc(
                        TenantContext.getTenantId(),
                        jobId,
                        PageRequest.of(page, size)).map(this::toDispatchOut));
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportModuleDTOs.WorkflowEventLogResponse> listWorkflowEvents(Long jobId, int page, int size) {
        requireJob(jobId);
        return PageResponse.fromSpringPage(
                reportWorkflowEventLogRepository
                        .findByTenantIdAndReportJobIdAndIsDeletedFalseOrderByOccurredAtDesc(
                                TenantContext.getTenantId(),
                                jobId,
                                PageRequest.of(page, size))
                        .map(this::toWorkflowEventOut));
    }

    @Transactional
    public ReportModuleDTOs.AnalyticsPackConfigResponse upsertAnalyticsPackConfig(ReportModuleDTOs.AnalyticsPackConfigRequest req) {
        String tenantId = TenantContext.getTenantId();
        String packCode = normalizePackCode(req.getPackCode());
        validateAnalyticsConfig(req);
        ReportAnalyticsPackConfig row = reportAnalyticsPackConfigRepository
                .findByTenantIdAndPackCodeAndIsDeletedFalse(tenantId, packCode)
                .orElseGet(ReportAnalyticsPackConfig::new);
        row.setTenantId(tenantId);
        row.setPackCode(packCode);
        row.setConfigJson(writeJson(req.getConfig()));
        row.setFormulaJson(writeJson(req.getFormulas()));
        reportAnalyticsPackConfigRepository.save(row);
        return toAnalyticsConfigOut(row);
    }

    @Transactional(readOnly = true)
    public List<ReportModuleDTOs.AnalyticsPackConfigResponse> listAnalyticsPackConfigs() {
        return reportAnalyticsPackConfigRepository
                .findByTenantIdAndIsDeletedFalseOrderByPackCodeAsc(TenantContext.getTenantId())
                .stream()
                .map(this::toAnalyticsConfigOut)
                .toList();
    }

    @Transactional
    public int processQueuedJobs(int batchSize) {
        int safeBatch = Math.max(1, Math.min(batchSize, 50));
        LocalDateTime now = LocalDateTime.now();
        int processed = 0;
        List<ReportGenerationJob> due = new ArrayList<>();
        due.addAll(reportGenerationJobRepository.findByStatusInAndIsDeletedFalseAndScheduleAtLessThanEqualOrderByScheduleAtAscCreatedAtAsc(
                List.of("QUEUED"), now, PageRequest.of(0, safeBatch)));
        if (due.size() < safeBatch) {
            due.addAll(reportGenerationJobRepository.findByStatusInAndIsDeletedFalseAndNextRetryAtLessThanEqualOrderByNextRetryAtAscCreatedAtAsc(
                    List.of("RETRY"), now, PageRequest.of(0, safeBatch - due.size())));
        }
        Set<Long> dedupe = new HashSet<>();
        for (ReportGenerationJob job : due) {
            if (job.getId() == null || !dedupe.add(job.getId())) continue;
            processed++;
            executeJobNow(job);
        }
        return processed;
    }

    @Transactional
    public int processDispatches(int batchSize) {
        int safeBatch = Math.max(1, Math.min(batchSize, 100));
        LocalDateTime now = LocalDateTime.now();
        int processed = 0;
        List<ReportShareDispatch> due = new ArrayList<>();
        due.addAll(reportShareDispatchRepository.findByStatusInAndIsDeletedFalseAndNextRetryAtIsNullOrderByCreatedAtAsc(
                List.of("PENDING", "RETRY"), PageRequest.of(0, safeBatch)));
        if (due.size() < safeBatch) {
            due.addAll(reportShareDispatchRepository.findByStatusInAndIsDeletedFalseAndNextRetryAtLessThanEqualOrderByNextRetryAtAscCreatedAtAsc(
                    List.of("PENDING", "RETRY"), now, PageRequest.of(0, safeBatch - due.size())));
        }
        Set<Long> dedupe = new HashSet<>();
        for (ReportShareDispatch d : due) {
            if (d.getId() == null || !dedupe.add(d.getId())) continue;
            processed++;
            processDispatch(d, now);
        }
        if (!due.isEmpty()) {
            reportShareDispatchRepository.saveAll(due);
        }
        return processed;
    }

    @Transactional
    public int seedDefaultPacks() {
        String tenantId = TenantContext.getTenantId();
        int count = 0;
        count += ensureTemplateSeed(tenantId, "CBSE_SUMMATIVE_V1", "CBSE Performance Report", "CBSE");
        count += ensureTemplateSeed(tenantId, "ICSE_TERMWISE_V1", "ICSE Term Report", "ICSE");
        count += ensureTemplateSeed(tenantId, "STATE_BOARD_CORE_V1", "State Board Consolidated", "STATE");
        ensureNotificationTemplateSeed(tenantId, "REPORT_SHARED_DEFAULT", "IN_APP", "PARENT", "en",
                "Report available: {{reportType}}", "Your school shared {{reportType}}. Download from reports.");
        ensureNotificationTemplateSeed(tenantId, "REPORT_SHARED_DEFAULT", "IN_APP", "PARENT", "hi",
                "रिपोर्ट उपलब्ध: {{reportType}}", "स्कूल ने {{reportType}} साझा किया है। रिपोर्ट अनुभाग से डाउनलोड करें।");
        ensureNotificationTemplateSeed(tenantId, "REPORT_SHARED_DEFAULT", "IN_APP", "TEACHER", "en",
                "Report shared: {{reportType}}", "A {{reportType}} report has been generated and shared.");
        ensureNotificationTemplateSeed(tenantId, "REPORT_SHARED_DEFAULT", "IN_APP", "ADMIN", "en",
                "Report shared: {{reportType}}", "A {{reportType}} report has been generated and shared.");
        return count;
    }

    @Transactional
    public ReportModuleDTOs.ReportJobResponse approveJob(Long jobId, ReportModuleDTOs.WorkflowActionRequest req) {
        ReportGenerationJob job = requireJob(jobId);
        assertExpectedUpdatedAt(job, req != null ? req.getExpectedUpdatedAt() : null);
        String idempotencyKey = normalizeIdempotencyKey(req != null ? req.getIdempotencyKey() : null);
        if (idempotencyKey != null && idempotencyKey.equals(job.getLastApproveIdempotencyKey())) {
            return toReportJobOut(job);
        }
        if (!"COMPLETED".equalsIgnoreCase(job.getStatus())) {
            throw new BusinessException("Only completed jobs can be approved.");
        }
        ensureWorkflowState(job, "DRAFT", "REJECTED");
        Long actorUserId = TenantContext.getUserId();
        if (actorUserId != null && actorUserId.equals(job.getCreatorUserId())) {
            throw new BusinessException("Maker-checker validation failed: creator cannot approve own report.");
        }
        job.setWorkflowState("APPROVED");
        job.setWorkflowNote(trimNote(req != null ? req.getNote() : null));
        job.setApprovedAt(LocalDateTime.now());
        job.setApproverUserId(actorUserId);
        job.setLastApproveIdempotencyKey(idempotencyKey);
        reportGenerationJobRepository.save(job);
        logWorkflowEvent(job, "JOB_APPROVED", "DRAFT", "APPROVED", job.getWorkflowNote(), Map.of());
        return toReportJobOut(job);
    }

    @Transactional
    public ReportModuleDTOs.ReportJobResponse publishJob(Long jobId, ReportModuleDTOs.WorkflowActionRequest req) {
        ReportGenerationJob job = requireJob(jobId);
        assertExpectedUpdatedAt(job, req != null ? req.getExpectedUpdatedAt() : null);
        String idempotencyKey = normalizeIdempotencyKey(req != null ? req.getIdempotencyKey() : null);
        if (idempotencyKey != null && idempotencyKey.equals(job.getLastPublishIdempotencyKey())) {
            return toReportJobOut(job);
        }
        if (!"COMPLETED".equalsIgnoreCase(job.getStatus())) {
            throw new BusinessException("Only completed jobs can be published.");
        }
        ensureWorkflowState(job, "APPROVED", "PUBLISHED");
        Long actorUserId = TenantContext.getUserId();
        if (actorUserId != null && actorUserId.equals(job.getCreatorUserId())) {
            throw new BusinessException("Maker-checker validation failed: creator cannot publish own report.");
        }
        if (actorUserId != null && actorUserId.equals(job.getApproverUserId())) {
            throw new BusinessException("Maker-checker validation failed: approver cannot publish same report.");
        }
        job.setWorkflowState("PUBLISHED");
        job.setWorkflowNote(trimNote(req != null ? req.getNote() : null));
        job.setPublishedAt(LocalDateTime.now());
        job.setPublisherUserId(actorUserId);
        job.setLastPublishIdempotencyKey(idempotencyKey);
        reportGenerationJobRepository.save(job);
        createPublicationSnapshot(job, "PUBLISH", job.getWorkflowNote());
        logWorkflowEvent(job, "JOB_PUBLISHED", "APPROVED", "PUBLISHED", job.getWorkflowNote(), Map.of());
        return toReportJobOut(job);
    }

    @Transactional(readOnly = true)
    public List<ReportModuleDTOs.PublicationSnapshotResponse> listPublicationSnapshots(Long jobId) {
        requireJob(jobId);
        return reportPublicationSnapshotRepository
                .findByTenantIdAndReportJobIdAndIsDeletedFalseOrderByVersionNoDesc(TenantContext.getTenantId(), jobId)
                .stream()
                .map(this::toSnapshotOut)
                .toList();
    }

    @Transactional
    public ReportModuleDTOs.ReportJobResponse rollbackToSnapshot(Long jobId, ReportModuleDTOs.RollbackSnapshotRequest req) {
        if (req == null || req.getVersionNo() == null) {
            throw new BusinessException("versionNo is required.");
        }
        ReportGenerationJob job = requireJob(jobId);
        ReportPublicationSnapshot snap = reportPublicationSnapshotRepository
                .findByTenantIdAndReportJobIdAndVersionNoAndIsDeletedFalse(TenantContext.getTenantId(), jobId, req.getVersionNo())
                .orElseThrow(() -> new ResourceNotFoundException("ReportPublicationSnapshot", Long.valueOf(req.getVersionNo())));
        Map<String, Object> payload = readJsonMap(snap.getSnapshotJson());
        Object fileName = payload.get("fileName");
        Object contentType = payload.get("contentType");
        Object workflowState = payload.get("workflowState");
        Object workflowNote = payload.get("workflowNote");
        if (fileName instanceof String s) job.setFileName(s);
        if (contentType instanceof String s) job.setContentType(s);
        if (workflowState instanceof String s) job.setWorkflowState(s);
        if (workflowNote instanceof String s) job.setWorkflowNote(s);
        job.setWorkflowNote(trimNote(req.getNote() != null ? req.getNote() : job.getWorkflowNote()));
        reportGenerationJobRepository.save(job);
        createPublicationSnapshot(job, "ROLLBACK", req.getNote());
        logWorkflowEvent(job, "JOB_ROLLBACK", null, job.getWorkflowState(), trimNote(req.getNote()), Map.of("versionNo", req.getVersionNo()));
        return toReportJobOut(job);
    }

    @Transactional(readOnly = true)
    public ReportModuleDTOs.AnalyticsPackResponse getAnalyticsPack(String packCode, Long classId, Long sectionId, Long examId, String month) {
        String resolvedPack = normalizePackCode(packCode);
        Long cid = classId != null ? classId : 0L;
        Long eid = examId != null ? examId : 0L;
        String mm = (month == null || month.isBlank()) ? java.time.YearMonth.now().toString() : month.trim();
        Map<String, Object> guardrails = defaultGuardrailsForPack(resolvedPack);
        reportAnalyticsPackConfigRepository.findByTenantIdAndPackCodeAndIsDeletedFalse(TenantContext.getTenantId(), resolvedPack)
                .ifPresent(cfg -> {
                    Map<String, Object> config = readJsonMap(cfg.getConfigJson());
                    Map<String, Object> formulas = readJsonMap(cfg.getFormulaJson());
                    if (!config.isEmpty()) {
                        guardrails.putAll(config);
                    }
                    if (!formulas.isEmpty()) {
                        guardrails.put("formulas", formulas);
                    }
                });
        List<Map<String, Object>> perf = filterRowsBySection(reportQueryPort.getStudentPerformanceReport(cid, eid), classId, sectionId);
        List<Map<String, Object>> att = filterRowsBySection(reportQueryPort.getAttendanceSummary(cid, mm), classId, sectionId);
        double excellentPct = readDouble(guardrails, "excellentPct");
        double laggingPct = readDouble(guardrails, "laggingPct");
        double promotionMinAttendance = readDouble(guardrails, "promotionMinAttendance");
        String promotionFormula = readString(guardrails, "promotionFormula", false);

        List<Map<String, Object>> trend = new ArrayList<>();
        trend.add(Map.of("band", "excellent", "range", ">=" + excellentPct, "count", perf.stream().filter(r -> readDouble(r, "percentage") >= excellentPct).count()));
        trend.add(Map.of("band", "average", "range", laggingPct + "-" + (excellentPct - 0.1), "count", perf.stream().filter(r -> readDouble(r, "percentage") >= laggingPct && readDouble(r, "percentage") < excellentPct).count()));
        trend.add(Map.of("band", "risk", "range", "<" + laggingPct, "count", perf.stream().filter(r -> readDouble(r, "percentage") < laggingPct).count()));

        List<Map<String, Object>> lagging = new ArrayList<>();
        for (Map<String, Object> p : perf) {
            double pct = readDouble(p, "percentage");
            if (pct < laggingPct) {
                java.util.LinkedHashMap<String, Object> row = new java.util.LinkedHashMap<>();
                row.put("studentId", readLong(p, "studentId", false));
                row.put("studentName", String.valueOf(p.getOrDefault("studentName", "")));
                row.put("performancePct", pct);
                row.put("riskLevel", pct < Math.max(40, laggingPct - 15) ? "HIGH" : "MEDIUM");
                lagging.add(row);
            }
        }

        Map<Long, Double> attPctByStudent = new java.util.HashMap<>();
        for (Map<String, Object> a : att) {
            Long sid = readLong(a, "studentId", false);
            if (sid != null) {
                attPctByStudent.put(sid, readDouble(a, "attendancePercentage"));
            }
        }
        List<Map<String, Object>> promotion = new ArrayList<>();
        for (Map<String, Object> p : perf) {
            Long sid = readLong(p, "studentId", false);
            double performancePct = readDouble(p, "percentage");
            double attendancePct = sid != null ? attPctByStudent.getOrDefault(sid, 0d) : 0d;
            boolean eligible = evaluatePromotionFormula(promotionFormula, performancePct, attendancePct, promotionMinAttendance);
            java.util.LinkedHashMap<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("studentId", sid != null ? sid : 0L);
            row.put("studentName", String.valueOf(p.getOrDefault("studentName", "")));
            row.put("performancePct", performancePct);
            row.put("attendancePct", attendancePct);
            row.put("eligible", eligible);
            promotion.add(row);
        }

        ReportModuleDTOs.AnalyticsPackResponse out = new ReportModuleDTOs.AnalyticsPackResponse();
        out.setPackCode(resolvedPack);
        out.setTrendBands(trend);
        out.setLaggingStudents(lagging);
        out.setPromotionEligibility(promotion);
        out.setGuardrails(guardrails);
        return out;
    }

    private <T> T timedReportRead(String operation, Supplier<T> supplier, Function<T, Integer> rowsExtractor) {
        long startedAt = System.nanoTime();
        T value = supplier.get();
        long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
        int rows = 0;
        try {
            rows = Math.max(0, rowsExtractor.apply(value));
        } catch (Exception ignored) {
            rows = 0;
        }
        reportPerformanceMetricsService.recordReportRead(operation, elapsedMs, rows);
        if (elapsedMs >= 500) {
            org.slf4j.LoggerFactory.getLogger(ReportService.class)
                    .warn("Report read op={} tenantId={} elapsedMs={} rows={}",
                            operation, TenantContext.getTenantId(), elapsedMs, rows);
        } else {
            org.slf4j.LoggerFactory.getLogger(ReportService.class)
                    .debug("Report read op={} tenantId={} elapsedMs={} rows={}",
                            operation, TenantContext.getTenantId(), elapsedMs, rows);
        }
        return value;
    }

    @Transactional
    public int warmupDashboardSnapshots(int tenantLimit) {
        int safeLimit = Math.max(1, Math.min(tenantLimit, 200));
        List<String> tenantIds = dashboardSnapshotRepository.findDistinctTenantIds();
        int warmed = 0;
        for (String tenantId : tenantIds.stream().limit(safeLimit).toList()) {
            com.school.erp.tenant.TenantScopedExecution.run(tenantId, null, "ADMIN", () -> {
                selfWarmupForTenant();
            });
            warmed++;
        }
        return warmed;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPerformanceMetrics() {
        return reportPerformanceMetricsService.readMetricsSnapshot();
    }

    private void selfWarmupForTenant() {
        this.getDashboardKPIs();
        this.getAdminDashboard(null, null);
    }

    private String normalizeMonth(String raw) {
        if (raw == null || raw.isBlank()) {
            return java.time.YearMonth.now().toString();
        }
        try {
            return java.time.YearMonth.parse(raw.trim()).toString();
        } catch (Exception ex) {
            return java.time.YearMonth.now().toString();
        }
    }

    private List<Map<String, Object>> resolveReportRows(String reportType, Map<String, Object> filters) {
        return switch (reportType) {
            case "STUDENT_PERFORMANCE" -> {
                Long classId = readLong(filters, "classId", true);
                Long sectionId = readLong(filters, "sectionId", false);
                yield filterRowsBySection(
                        reportQueryPort.getStudentPerformanceReport(classId, readLong(filters, "examId", true)),
                        classId,
                        sectionId);
            }
            case "ATTENDANCE_SUMMARY" -> {
                Long classId = readLong(filters, "classId", true);
                Long sectionId = readLong(filters, "sectionId", false);
                yield filterRowsBySection(
                        reportQueryPort.getAttendanceSummary(classId, readString(filters, "month", true)),
                        classId,
                        sectionId);
            }
            case "FEE_COLLECTION" -> List.of(reportQueryPort.getFeeCollectionReport(readLong(filters, "classId", false)));
            case "CLASS_SUMMARY" -> reportQueryPort.getClassSummary();
            case "SECTION_SUMMARY" -> reportQueryPort.getSectionSummary();
            case "TEACHER_WORKLOAD" -> reportQueryPort.getTeacherWorkload();
            case "REPORT_CARD" -> {
                Long studentId = readLong(filters, "studentId", true);
                Long examId = readLong(filters, "examId", false);
                var card = reportQueryPort.getStudentPerformanceReport(readLong(filters, "classId", false) != null ? readLong(filters, "classId", false) : 0L, examId != null ? examId : 0L);
                yield card.stream().filter(x -> studentId.equals(readLong(x, "studentId", false))).toList();
            }
            default -> throw new BusinessException("Unsupported report type: " + reportType);
        };
    }

    private ReportModuleDTOs.TemplateResponse toTemplateOut(ReportTemplate row) {
        ReportModuleDTOs.TemplateResponse out = new ReportModuleDTOs.TemplateResponse();
        out.setId(row.getId());
        out.setTemplateCode(row.getTemplateCode());
        out.setName(row.getName());
        out.setReportType(row.getReportType());
        out.setDefaultFormat(row.getDefaultFormat());
        Map<String, Object> layout = readJsonMap(row.getLayoutConfigJson());
        out.setLayoutConfig(layout);
        out.setBoardSections(readJsonList(layout.get("boardSections")));
        out.setRemarksConfig(readMap(layout.get("remarksConfig")));
        out.setPromotionConfig(readMap(layout.get("promotionConfig")));
        out.setPackCode(row.getPackCode());
        out.setFilterSchema(readJsonMap(row.getFilterSchemaJson()));
        return out;
    }

    private ReportModuleDTOs.ReportJobResponse toReportJobOut(ReportGenerationJob job) {
        ReportModuleDTOs.ReportJobResponse out = new ReportModuleDTOs.ReportJobResponse();
        out.setId(job.getId());
        out.setRequestId(job.getRequestId());
        out.setReportType(job.getReportType());
        out.setFormat(job.getFormat());
        out.setStatus(job.getStatus());
        out.setFileName(job.getFileName());
        out.setContentType(job.getContentType());
        out.setContentSizeBytes(job.getContentSizeBytes());
        out.setCreatedAt(job.getCreatedAt() != null ? job.getCreatedAt().toString() : null);
        out.setGeneratedAt(job.getGeneratedAt() != null ? job.getGeneratedAt().toString() : null);
        out.setScheduleAt(job.getScheduleAt() != null ? job.getScheduleAt().toString() : null);
        out.setNextRetryAt(job.getNextRetryAt() != null ? job.getNextRetryAt().toString() : null);
        out.setAttempts(job.getAttempts());
        out.setMaxAttempts(job.getMaxAttempts());
        out.setWorkflowState(job.getWorkflowState());
        out.setWorkflowNote(job.getWorkflowNote());
        out.setApprovedAt(job.getApprovedAt() != null ? job.getApprovedAt().toString() : null);
        out.setPublishedAt(job.getPublishedAt() != null ? job.getPublishedAt().toString() : null);
        out.setCreatorUserId(job.getCreatorUserId());
        out.setApproverUserId(job.getApproverUserId());
        out.setPublisherUserId(job.getPublisherUserId());
        out.setUpdatedAt(job.getUpdatedAt() != null ? job.getUpdatedAt().toString() : null);
        return out;
    }

    private ReportModuleDTOs.ShareDispatchResponse toDispatchOut(ReportShareDispatch d) {
        ReportModuleDTOs.ShareDispatchResponse out = new ReportModuleDTOs.ShareDispatchResponse();
        out.setId(d.getId());
        out.setChannel(d.getChannel());
        out.setTargetRole(d.getTargetRole());
        out.setLocaleCode(d.getLocaleCode());
        out.setStatus(d.getStatus());
        out.setAttempts(d.getAttempts());
        out.setDeliveredCount(d.getDeliveredCount());
        out.setNextRetryAt(d.getNextRetryAt() != null ? d.getNextRetryAt().toString() : null);
        out.setLastError(d.getLastError());
        out.setCreatedAt(d.getCreatedAt() != null ? d.getCreatedAt().toString() : null);
        return out;
    }

    private String normalizeReportType(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException("Report type is required.");
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeTemplateCode(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException("Template code is required.");
        }
        return value.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_\\-]", "_");
    }

    private String normalizeFormat(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException("Format is required.");
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (!"PDF".equals(normalized) && !"CSV".equals(normalized)) {
            throw new BusinessException("Only PDF/CSV formats are supported.");
        }
        return normalized;
    }

    private LocalDateTime parseScheduleAt(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return LocalDateTime.parse(raw.trim());
        } catch (DateTimeParseException ex) {
            throw new BusinessException("Invalid scheduleAt timestamp format.");
        }
    }

    private void executeJobNow(ReportGenerationJob job) {
        try {
            job.setStatus("RUNNING");
            List<Map<String, Object>> rows = resolveReportRows(job.getReportType(), readJsonMap(job.getFilterJson()));
            ReportExportService.RenderedReport rendered =
                    reportExportService.render(job.getReportType(), job.getFormat(), rows, job.getTenantId());
            job.setFileName(rendered.fileName());
            job.setContentType(rendered.contentType());
            ReportBinaryStorageService.StoredBinary storedBinary = reportBinaryStorageService.store(
                    job.getTenantId(),
                    job.getId(),
                    rendered.fileName(),
                    rendered.content());
            job.setStorageProvider(storedBinary.provider());
            job.setFileStoragePath(storedBinary.path());
            job.setContentSizeBytes(storedBinary.sizeBytes());
            if (reportBinaryStorageService.keepDbCopy()) {
                job.setFileContent(rendered.content());
            } else {
                job.setFileContent(null);
            }
            job.setGeneratedAt(LocalDateTime.now());
            job.setStatus("COMPLETED");
            if (job.getWorkflowState() == null || job.getWorkflowState().isBlank()) {
                job.setWorkflowState("DRAFT");
            }
            job.setLastError(null);
            job.setNextRetryAt(null);
            reportGenerationJobRepository.save(job);
            logWorkflowEvent(job, "JOB_COMPLETED", null, job.getWorkflowState(), null, Map.of("rows", rows.size()));
            createDispatchesForJob(job);
        } catch (Exception ex) {
            int nextAttempts = (job.getAttempts() != null ? job.getAttempts() : 0) + 1;
            job.setAttempts(nextAttempts);
            String err = trimError(ex.getMessage());
            job.setLastError(err);
            if (nextAttempts >= (job.getMaxAttempts() != null ? job.getMaxAttempts() : 3)) {
                job.setStatus("FAILED");
                job.setNextRetryAt(null);
            } else {
                job.setStatus("RETRY");
                job.setNextRetryAt(LocalDateTime.now().plusMinutes(backoffMinutes(nextAttempts)));
            }
            reportGenerationJobRepository.save(job);
            logWorkflowEvent(job, "JOB_FAILED", null, job.getWorkflowState(), err, Map.of("attempts", nextAttempts, "status", job.getStatus()));
        }
    }

    private void createDispatchesForJob(ReportGenerationJob job) {
        Map<String, Object> cfg = readJsonMap(job.getShareConfigJson());
        if (cfg.isEmpty()) return;
        List<String> channels = readStringList(cfg.get("channels"), List.of("IN_APP"));
        List<String> roles = readStringList(cfg.get("targetRoles"), List.of("PARENT"));
        List<String> locales = readStringList(cfg.get("locales"), List.of("en"));
        String templateCode = cfg.get("templateCode") != null ? String.valueOf(cfg.get("templateCode")).trim() : "REPORT_SHARED_DEFAULT";
        for (String c : channels) {
            for (String r : roles) {
                for (String l : locales) {
                    ReportShareDispatch d = new ReportShareDispatch();
                    d.setTenantId(job.getTenantId());
                    d.setReportJobId(job.getId());
                    d.setChannel(c.toUpperCase(Locale.ROOT));
                    d.setTargetRole(r.toUpperCase(Locale.ROOT));
                    d.setLocaleCode(l.toLowerCase(Locale.ROOT));
                    d.setTemplateCode(templateCode);
                    d.setStatus("PENDING");
                    d.setAttempts(0);
                    d.setMaxAttempts(5);
                    reportShareDispatchRepository.save(d);
                }
            }
        }
    }

    private void processDispatch(ReportShareDispatch d, LocalDateTime now) {
        try {
            ReportGenerationJob job = reportGenerationJobRepository.findByIdAndTenantIdAndIsDeletedFalse(d.getReportJobId(), d.getTenantId())
                    .orElseThrow(() -> new ResourceNotFoundException("ReportGenerationJob", d.getReportJobId()));
            String templateCode = d.getTemplateCode() != null ? d.getTemplateCode() : "REPORT_SHARED_DEFAULT";
            ReportNotificationTemplate tpl = reportNotificationTemplateRepository
                    .findByTenantIdAndTemplateCodeAndTargetRoleAndLocaleCodeAndChannelAndIsDeletedFalse(
                            d.getTenantId(), templateCode, d.getTargetRole(), d.getLocaleCode(), d.getChannel())
                    .orElseGet(() -> defaultNotificationTemplate(d.getTenantId(), templateCode, d.getTargetRole(), d.getLocaleCode(), d.getChannel()));
            Enums.Role role = Enums.Role.valueOf(d.getTargetRole().toUpperCase(Locale.ROOT));
            var users = userRepository.findByTenantIdAndRoleAndIsDeletedFalse(d.getTenantId(), role);
            int delivered = 0;
            for (var u : users) {
                if (u.getId() == null) continue;
                String title = tpl.getTitleTemplate().replace("{{reportType}}", job.getReportType());
                String message = tpl.getMessageTemplate().replace("{{reportType}}", job.getReportType());
                notificationService.createNotification(d.getTenantId(), u.getId(), title, message, Enums.NotificationType.INFO, "/app/reports");
                delivered++;
            }
            d.setDeliveredCount(delivered);
            d.setStatus("SENT");
            d.setLastError(null);
            d.setNextRetryAt(null);
            d.setAttempts((d.getAttempts() != null ? d.getAttempts() : 0) + 1);
        } catch (Exception ex) {
            int nextAttempts = (d.getAttempts() != null ? d.getAttempts() : 0) + 1;
            d.setAttempts(nextAttempts);
            d.setLastError(trimError(ex.getMessage()));
            if (nextAttempts >= (d.getMaxAttempts() != null ? d.getMaxAttempts() : 5)) {
                d.setStatus("FAILED");
                d.setNextRetryAt(null);
            } else {
                d.setStatus("RETRY");
                d.setNextRetryAt(now.plusMinutes(backoffMinutes(nextAttempts)));
            }
        }
    }

    private ReportNotificationTemplate defaultNotificationTemplate(String tenantId, String templateCode, String role, String locale, String channel) {
        ReportNotificationTemplate t = new ReportNotificationTemplate();
        t.setTenantId(tenantId);
        t.setTemplateCode(templateCode);
        t.setTargetRole(role);
        t.setLocaleCode(locale);
        t.setChannel(channel);
        t.setTitleTemplate("Report shared: {{reportType}}");
        t.setMessageTemplate("A {{reportType}} report is ready. Open reports to download.");
        return reportNotificationTemplateRepository.save(t);
    }

    private int ensureTemplateSeed(String tenantId, String code, String name, String packCode) {
        if (reportTemplateRepository.findByTenantIdAndTemplateCodeAndIsDeletedFalse(tenantId, code).isPresent()) return 0;
        ReportTemplate row = new ReportTemplate();
        row.setTenantId(tenantId);
        row.setTemplateCode(code);
        row.setName(name);
        row.setReportType("STUDENT_PERFORMANCE");
        row.setDefaultFormat("PDF");
        row.setPackCode(packCode);
        row.setSystemTemplate(true);
        row.setLayoutConfigJson(writeJson(Map.of(
                "columns", List.of("studentName", "totalMarks", "percentage", "grade"),
                "boardSections", List.of(Map.of("name", "Scholastic", "order", 1)),
                "remarksConfig", Map.of("enabled", true),
                "promotionConfig", Map.of("enabled", true, "minOverallPct", 33)
        )));
        row.setFilterSchemaJson(writeJson(Map.of("required", List.of("classId", "examId"))));
        reportTemplateRepository.save(row);
        return 1;
    }

    private void ensureNotificationTemplateSeed(String tenantId, String code, String channel, String role, String locale, String title, String message) {
        if (reportNotificationTemplateRepository.findByTenantIdAndTemplateCodeAndTargetRoleAndLocaleCodeAndChannelAndIsDeletedFalse(
                tenantId, code, role, locale, channel).isPresent()) return;
        ReportNotificationTemplate t = new ReportNotificationTemplate();
        t.setTenantId(tenantId);
        t.setTemplateCode(code);
        t.setChannel(channel);
        t.setTargetRole(role);
        t.setLocaleCode(locale);
        t.setTitleTemplate(title);
        t.setMessageTemplate(message);
        reportNotificationTemplateRepository.save(t);
    }

    private void validateTemplateConfig(ReportModuleDTOs.UpsertTemplateRequest req) {
        if (req.getLayoutConfig() != null) {
            Object colsObj = req.getLayoutConfig().get("columns");
            if (colsObj instanceof List<?> cols && cols.size() > 50) {
                throw new BusinessException("Too many columns configured. Max 50.");
            }
        }
    }

    private Map<String, Object> enrichLayoutConfig(ReportModuleDTOs.UpsertTemplateRequest req) {
        Map<String, Object> base = req.getLayoutConfig() != null ? new java.util.LinkedHashMap<>(req.getLayoutConfig()) : new java.util.LinkedHashMap<>();
        if (req.getBoardSections() != null) base.put("boardSections", req.getBoardSections());
        if (req.getRemarksConfig() != null) base.put("remarksConfig", req.getRemarksConfig());
        if (req.getPromotionConfig() != null) base.put("promotionConfig", req.getPromotionConfig());
        return base;
    }

    private List<Map<String, Object>> readJsonList(Object value) {
        if (value instanceof List<?> list) {
            List<Map<String, Object>> out = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    out.add(readMap(m));
                }
            }
            return out;
        }
        return List.of();
    }

    private Map<String, Object> readMap(Object value) {
        if (!(value instanceof Map<?, ?> m)) return Map.of();
        java.util.LinkedHashMap<String, Object> out = new java.util.LinkedHashMap<>();
        for (Map.Entry<?, ?> e : m.entrySet()) {
            if (e.getKey() instanceof String k) {
                out.put(k, e.getValue());
            }
        }
        return out;
    }

    private List<String> readStringList(Object obj, List<String> fallback) {
        if (!(obj instanceof List<?> list) || list.isEmpty()) return fallback;
        List<String> out = new ArrayList<>();
        for (Object x : list) {
            String s = String.valueOf(x).trim();
            if (!s.isBlank()) out.add(s);
        }
        return out.isEmpty() ? fallback : out;
    }

    private String trimError(String msg) {
        if (msg == null || msg.isBlank()) return "Unknown processing error";
        return msg.length() > 500 ? msg.substring(0, 500) : msg;
    }

    private long backoffMinutes(int attempts) {
        if (attempts <= 1) return 1;
        if (attempts == 2) return 3;
        return 10;
    }

    private ReportGenerationJob requireJob(Long id) {
        return reportGenerationJobRepository.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("ReportGenerationJob", id));
    }

    private void ensureWorkflowState(ReportGenerationJob job, String... states) {
        String current = job.getWorkflowState() != null ? job.getWorkflowState().trim().toUpperCase(Locale.ROOT) : "DRAFT";
        for (String s : states) {
            if (current.equalsIgnoreCase(s)) return;
        }
        throw new BusinessException("Invalid workflow transition from " + current);
    }

    private void createPublicationSnapshot(ReportGenerationJob job, String type, String note) {
        List<ReportPublicationSnapshot> existing = reportPublicationSnapshotRepository
                .findByTenantIdAndReportJobIdAndIsDeletedFalseOrderByVersionNoDesc(job.getTenantId(), job.getId());
        int nextVersion = existing.isEmpty() ? 1 : existing.get(0).getVersionNo() + 1;
        java.util.LinkedHashMap<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("fileName", job.getFileName());
        payload.put("contentType", job.getContentType());
        payload.put("workflowState", job.getWorkflowState());
        payload.put("workflowNote", job.getWorkflowNote());
        payload.put("generatedAt", job.getGeneratedAt() != null ? job.getGeneratedAt().toString() : null);
        ReportPublicationSnapshot snap = new ReportPublicationSnapshot();
        snap.setTenantId(job.getTenantId());
        snap.setReportJobId(job.getId());
        snap.setVersionNo(nextVersion);
        snap.setSnapshotType(type);
        snap.setNote(trimNote(note));
        snap.setPublishedAt(LocalDateTime.now());
        snap.setSnapshotJson(writeJson(payload));
        reportPublicationSnapshotRepository.save(snap);
    }

    private ReportModuleDTOs.PublicationSnapshotResponse toSnapshotOut(ReportPublicationSnapshot snap) {
        ReportModuleDTOs.PublicationSnapshotResponse out = new ReportModuleDTOs.PublicationSnapshotResponse();
        out.setId(snap.getId());
        out.setVersionNo(snap.getVersionNo());
        out.setSnapshotType(snap.getSnapshotType());
        out.setNote(snap.getNote());
        out.setPublishedAt(snap.getPublishedAt() != null ? snap.getPublishedAt().toString() : null);
        return out;
    }

    private ReportModuleDTOs.WorkflowEventLogResponse toWorkflowEventOut(ReportWorkflowEventLog row) {
        ReportModuleDTOs.WorkflowEventLogResponse out = new ReportModuleDTOs.WorkflowEventLogResponse();
        out.setId(row.getId());
        out.setEventCode(row.getEventCode());
        out.setFromState(row.getFromState());
        out.setToState(row.getToState());
        out.setActorUserId(row.getActorUserId());
        out.setActorRole(row.getActorRole());
        out.setNote(row.getNote());
        out.setOccurredAt(row.getOccurredAt() != null ? row.getOccurredAt().toString() : null);
        return out;
    }

    private ReportModuleDTOs.AnalyticsPackConfigResponse toAnalyticsConfigOut(ReportAnalyticsPackConfig row) {
        ReportModuleDTOs.AnalyticsPackConfigResponse out = new ReportModuleDTOs.AnalyticsPackConfigResponse();
        out.setId(row.getId());
        out.setPackCode(row.getPackCode());
        out.setConfig(readJsonMap(row.getConfigJson()));
        out.setFormulas(readJsonMap(row.getFormulaJson()));
        return out;
    }

    private String normalizePackCode(String raw) {
        String code = (raw == null || raw.isBlank()) ? "CUSTOM" : raw.trim().toUpperCase(Locale.ROOT);
        if (!List.of("CBSE", "ICSE", "STATE", "CUSTOM").contains(code)) {
            throw new BusinessException("Unsupported packCode.");
        }
        return code;
    }

    private void validateAnalyticsConfig(ReportModuleDTOs.AnalyticsPackConfigRequest req) {
        if (req == null || req.getConfig() == null || req.getFormulas() == null) {
            throw new BusinessException("Analytics config and formulas are required.");
        }
        double excellentPct = readDouble(req.getConfig(), "excellentPct");
        double laggingPct = readDouble(req.getConfig(), "laggingPct");
        if (excellentPct < 50 || excellentPct > 100) {
            throw new BusinessException("excellentPct must be in range 50-100.");
        }
        if (laggingPct < 0 || laggingPct >= excellentPct) {
            throw new BusinessException("laggingPct must be >=0 and less than excellentPct.");
        }
        String formula = readString(req.getFormulas(), "promotionFormula", true);
        validatePromotionFormula(formula);
    }

    private Map<String, Object> defaultGuardrailsForPack(String packCode) {
        java.util.LinkedHashMap<String, Object> map = new java.util.LinkedHashMap<>();
        if ("CBSE".equals(packCode)) {
            map.put("excellentPct", 85d);
            map.put("laggingPct", 60d);
            map.put("promotionMinAttendance", 75d);
        } else if ("ICSE".equals(packCode)) {
            map.put("excellentPct", 80d);
            map.put("laggingPct", 55d);
            map.put("promotionMinAttendance", 75d);
        } else if ("STATE".equals(packCode)) {
            map.put("excellentPct", 75d);
            map.put("laggingPct", 50d);
            map.put("promotionMinAttendance", 70d);
        } else {
            map.put("excellentPct", 80d);
            map.put("laggingPct", 55d);
            map.put("promotionMinAttendance", 75d);
        }
        map.put("promotionFormula", "performancePct >= 33 && attendancePct >= promotionMinAttendance");
        return map;
    }

    private void logWorkflowEvent(ReportGenerationJob job, String eventCode, String fromState, String toState, String note, Map<String, Object> meta) {
        if (job == null || job.getId() == null) return;
        ReportWorkflowEventLog row = new ReportWorkflowEventLog();
        row.setTenantId(job.getTenantId());
        row.setReportJobId(job.getId());
        row.setActorUserId(TenantContext.getUserId());
        row.setActorRole(TenantContext.getUserRole());
        row.setEventCode(eventCode);
        row.setFromState(fromState);
        row.setToState(toState);
        row.setNote(trimNote(note));
        row.setEventMetaJson(writeJson(meta != null ? meta : Map.of()));
        row.setOccurredAt(LocalDateTime.now());
        reportWorkflowEventLogRepository.save(row);
    }

    private void validatePromotionFormula(String formula) {
        if (formula == null || formula.isBlank()) {
            throw new BusinessException("promotionFormula is required.");
        }
        String cleaned = formula.replaceAll("\\s+", "");
        if (!cleaned.matches("[a-zA-Z0-9_\\.><=!&|()+\\-*/ ]+")) {
            throw new BusinessException("promotionFormula contains unsupported characters.");
        }
        String[] allowed = {"performancePct", "attendancePct", "promotionMinAttendance"};
        String tokenized = cleaned.replaceAll(">=|<=|==|!=|>|<|\\&\\&|\\|\\||\\(|\\)|\\+|\\-|\\*|/", " ");
        for (String token : tokenized.split("\\s+")) {
            if (token.isBlank() || token.matches("\\d+(\\.\\d+)?")) continue;
            boolean ok = false;
            for (String a : allowed) {
                if (a.equals(token)) {
                    ok = true;
                    break;
                }
            }
            if (!ok) {
                throw new BusinessException("promotionFormula has unsupported token: " + token);
            }
        }
    }

    private boolean evaluatePromotionFormula(String formula, double performancePct, double attendancePct, double promotionMinAttendance) {
        String expr = (formula == null || formula.isBlank())
                ? "performancePct >= 33 && attendancePct >= promotionMinAttendance"
                : formula;
        validatePromotionFormula(expr);
        String[] orSegments = expr.split("\\|\\|");
        for (String orPart : orSegments) {
            boolean andResult = true;
            for (String andPart : orPart.split("&&")) {
                if (!evaluateComparison(andPart.trim(), performancePct, attendancePct, promotionMinAttendance)) {
                    andResult = false;
                    break;
                }
            }
            if (andResult) return true;
        }
        return false;
    }

    private boolean evaluateComparison(String raw, double performancePct, double attendancePct, double promotionMinAttendance) {
        String expr = raw.replace("(", "").replace(")", "").trim();
        String[] ops = {">=", "<=", "==", "!=", ">", "<"};
        for (String op : ops) {
            int idx = expr.indexOf(op);
            if (idx > 0) {
                double left = resolveFormulaOperand(expr.substring(0, idx).trim(), performancePct, attendancePct, promotionMinAttendance);
                double right = resolveFormulaOperand(expr.substring(idx + op.length()).trim(), performancePct, attendancePct, promotionMinAttendance);
                return switch (op) {
                    case ">=" -> left >= right;
                    case "<=" -> left <= right;
                    case "==" -> Math.abs(left - right) < 0.0001;
                    case "!=" -> Math.abs(left - right) >= 0.0001;
                    case ">" -> left > right;
                    case "<" -> left < right;
                    default -> false;
                };
            }
        }
        throw new BusinessException("Unsupported formula segment: " + raw);
    }

    private double resolveFormulaOperand(String token, double performancePct, double attendancePct, double promotionMinAttendance) {
        return switch (token) {
            case "performancePct" -> performancePct;
            case "attendancePct" -> attendancePct;
            case "promotionMinAttendance" -> promotionMinAttendance;
            default -> {
                try {
                    yield Double.parseDouble(token);
                } catch (Exception ex) {
                    throw new BusinessException("Unsupported formula operand: " + token);
                }
            }
        };
    }

    private String trimNote(String raw) {
        if (raw == null) return null;
        String t = raw.trim();
        if (t.isEmpty()) return null;
        return t.length() > 500 ? t.substring(0, 500) : t;
    }

    private String normalizeIdempotencyKey(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String key = raw.trim();
        if (key.length() > 120) {
            throw new BusinessException("idempotencyKey max length is 120.");
        }
        return key;
    }

    private void assertExpectedUpdatedAt(ReportGenerationJob job, String expectedUpdatedAt) {
        if (expectedUpdatedAt == null || expectedUpdatedAt.isBlank()) {
            return;
        }
        if (job.getUpdatedAt() == null) {
            throw new BusinessException("Record state could not be validated. Please refresh and try again.");
        }
        LocalDateTime expected;
        try {
            expected = LocalDateTime.parse(expectedUpdatedAt.trim());
        } catch (Exception ex) {
            throw new BusinessException("Invalid expectedUpdatedAt timestamp.");
        }
        if (!job.getUpdatedAt().equals(expected)) {
            throw new BusinessException("Stale update detected. Please refresh latest report status.");
        }
    }

    private double readDouble(Map<String, Object> map, String key) {
        Object value = map != null ? map.get(key) : null;
        if (value == null) return 0d;
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ex) {
            return 0d;
        }
    }

    private Long readLong(Map<String, Object> map, String key, boolean required) {
        Object value = map != null ? map.get(key) : null;
        if (value == null || String.valueOf(value).isBlank()) {
            if (required) throw new BusinessException("Missing required filter: " + key);
            return null;
        }
        try {
            return Long.valueOf(String.valueOf(value));
        } catch (Exception ex) {
            throw new BusinessException("Invalid number for filter: " + key);
        }
    }

    private String readString(Map<String, Object> map, String key, boolean required) {
        Object value = map != null ? map.get(key) : null;
        String str = value != null ? String.valueOf(value).trim() : "";
        if (str.isBlank() && required) {
            throw new BusinessException("Missing required filter: " + key);
        }
        return str.isBlank() ? null : str;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value != null ? value : Map.of());
        } catch (Exception e) {
            throw new BusinessException("Invalid JSON payload.");
        }
    }

    private Map<String, Object> readJsonMap(String value) {
        if (value == null || value.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(value, new TypeReference<>() {});
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private List<Map<String, Object>> filterRowsBySection(List<Map<String, Object>> rows, Long classId, Long sectionId) {
        if (sectionId == null) {
            return rows;
        }
        String tenantId = TenantContext.getTenantId();
        Set<Long> allowedStudentIds = new HashSet<>();
        if (classId != null && classId > 0) {
            studentRepository.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tenantId, classId, sectionId)
                    .forEach(s -> allowedStudentIds.add(s.getId()));
        } else {
            studentRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                    .filter(s -> sectionId.equals(s.getSectionId()))
                    .forEach(s -> allowedStudentIds.add(s.getId()));
        }
        if (allowedStudentIds.isEmpty()) {
            return List.of();
        }
        return rows.stream()
                .filter(r -> {
                    Long sid = readLong(r, "studentId", false);
                    return sid != null && allowedStudentIds.contains(sid);
                })
                .toList();
    }
}
