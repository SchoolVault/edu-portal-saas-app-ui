package com.school.erp.modules.payroll.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.common.lock.TenantRedisLockService;
import com.school.erp.modules.finance.audit.service.FinancialAuditService;
import com.school.erp.modules.payroll.domain.PayrollDisbursementStatus;
import com.school.erp.modules.payroll.dto.PayrollDTOs;
import com.school.erp.modules.payroll.payout.PayrollPayoutGatewayClient;
import com.school.erp.platform.port.NotificationDispatchPort;
import com.school.erp.modules.notification.service.NotificationService;
import com.school.erp.modules.payroll.entity.*;
import com.school.erp.modules.payroll.repository.*;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.config.CacheConfig;
import com.school.erp.tenant.TenantContext;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.YearMonth;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class PayrollService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PayrollService.class);
    private final SalaryStructureRepository ssRepo;
    private final SalaryComponentRepository scRepo;
    private final PayslipRepository psRepo;
    private final TeacherRepository teacherRepository;
    private final TenantConfigRepository tenantConfigRepository;
    private final PayslipPdfService payslipPdfService;
    private final SalaryDisbursementAttemptRepository salaryDisbursementAttemptRepository;
    private final NotificationService notificationService;
    private final NotificationDispatchPort notificationDispatchPort;
    private final TenantRedisLockService tenantRedisLockService;
    private final FinancialAuditService financialAuditService;
    private final PayrollPayoutGatewayClient payrollPayoutGatewayClient;

    @Cacheable(cacheNames = CacheConfig.PAYROLL_STRUCTURES, keyGenerator = "tenantKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<PayrollDTOs.SalaryStructureResponse> getStructures() {
        String t = TenantContext.getTenantId();
        return ssRepo.findByTenantIdAndIsDeletedFalse(t).stream().map(ss -> toSalaryStructureResponse(t, ss)).collect(Collectors.toList());
    }

    /** DB-paged grid; not Redis-cached (avoid huge single-key payloads). */
    @Transactional(readOnly = true)
    public PageResponse<PayrollDTOs.SalaryStructureResponse> getStructuresPaged(int page, int size) {
        String t = TenantContext.getTenantId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("teacherName"));
        Page<SalaryStructure> sp = ssRepo.findByTenantIdAndIsDeletedFalse(t, pageable);
        return PageResponse.fromSpringPage(sp.map(ss -> toSalaryStructureResponse(t, ss)));
    }

    private PayrollDTOs.SalaryStructureResponse toSalaryStructureResponse(String t, SalaryStructure ss) {
        List<SalaryComponent> comps = scRepo.findByTenantIdAndSalaryStructureId(t, ss.getId());
        BigDecimal totalAllowances = comps.stream().filter(c -> c.getType() == Enums.SalaryComponentType.ALLOWANCE).map(SalaryComponent::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDeductions = comps.stream().filter(c -> c.getType() == Enums.SalaryComponentType.DEDUCTION).map(SalaryComponent::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return PayrollDTOs.SalaryStructureResponse.builder().id(ss.getId()).teacherId(ss.getTeacherId()).teacherName(ss.getTeacherName()).basicSalary(ss.getBasicSalary()).netSalary(ss.getNetSalary()).totalAllowances(totalAllowances).totalDeductions(totalDeductions).components(comps.stream().map(c -> PayrollDTOs.SalaryComponentDTO.builder().id(c.getId()).name(c.getName()).amount(c.getAmount()).type(c.getType().name().toLowerCase()).build()).collect(Collectors.toList())).build();
    }

    @CacheEvict(cacheNames = CacheConfig.PAYROLL_STRUCTURES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public PayrollDTOs.SalaryStructureResponse createStructure(PayrollDTOs.CreateSalaryStructureRequest req) {
        String t = TenantContext.getTenantId();
        if (req.getTeacherId() == null) {
            throw new BusinessException("Teacher is required");
        }
        if (req.getBasicSalary() == null || req.getBasicSalary().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Basic salary must be greater than zero");
        }
        if (ssRepo.existsByTenantIdAndIsDeletedFalseAndTeacherId(t, req.getTeacherId())) {
            throw new BusinessException("Salary structure already exists for this teacher");
        }
        List<PayrollDTOs.SalaryComponentDTO> allowanceRows = req.getAllowances() != null ? req.getAllowances() : List.of();
        List<PayrollDTOs.SalaryComponentDTO> deductionRows = req.getDeductions() != null ? req.getDeductions() : List.of();
        validateSalaryComponents("allowance", allowanceRows);
        validateSalaryComponents("deduction", deductionRows);
        BigDecimal totalAllow = allowanceRows.stream().map(PayrollDTOs.SalaryComponentDTO::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDeduct = deductionRows.stream().map(PayrollDTOs.SalaryComponentDTO::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netSalary = req.getBasicSalary().add(totalAllow).subtract(totalDeduct);
        SalaryStructure ss = SalaryStructure.builder().teacherId(req.getTeacherId()).teacherName(req.getTeacherName()).basicSalary(req.getBasicSalary()).netSalary(netSalary).build();
        ss.setTenantId(t);
        ssRepo.save(ss);
        allowanceRows.forEach(a -> {
            SalaryComponent sc = SalaryComponent.builder().salaryStructureId(ss.getId()).name(a.getName()).amount(a.getAmount()).type(Enums.SalaryComponentType.ALLOWANCE).build();
            sc.setTenantId(t);
            scRepo.save(sc);
        });
        deductionRows.forEach(d -> {
            SalaryComponent sc = SalaryComponent.builder().salaryStructureId(ss.getId()).name(d.getName()).amount(d.getAmount()).type(Enums.SalaryComponentType.DEDUCTION).build();
            sc.setTenantId(t);
            scRepo.save(sc);
        });
        log.info("Salary structure created for teacher={} net={}", req.getTeacherId(), netSalary);
        return getStructures().stream().filter(s -> s.getId().equals(ss.getId())).findFirst().orElse(null);
    }

    private void validateSalaryComponents(String kind, List<PayrollDTOs.SalaryComponentDTO> rows) {
        List<String> names = new ArrayList<>();
        for (PayrollDTOs.SalaryComponentDTO row : rows) {
            String name = row.getName() == null ? "" : row.getName().trim();
            if (name.isEmpty()) {
                throw new BusinessException("Salary " + kind + " name is required");
            }
            if (names.stream().anyMatch(n -> n.equalsIgnoreCase(name))) {
                throw new BusinessException("Duplicate salary " + kind + " component name: " + name);
            }
            names.add(name);
            if (row.getAmount() == null || row.getAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException("Salary " + kind + " amount cannot be negative");
            }
        }
    }

    @Transactional
    public List<Payslip> generatePayslips(String month, int year) {
        String t = TenantContext.getTenantId();
        String payrollMonth = normalizePayrollMonthKey(month, year);
        if (psRepo.existsByTenantIdAndPayrollMonthAndIsDeletedFalse(t, payrollMonth)) {
            throw new BusinessException("Payslips already generated for " + payrollMonth + ". Refresh the list or choose another month.");
        }
        List<SalaryStructure> structures = ssRepo.findByTenantIdAndIsDeletedFalse(t);
        if (structures.isEmpty()) {
            throw new BusinessException("No salary structures found. Configure salary structures before generating payslips.");
        }
        List<Payslip> payslips = structures.stream().map(ss -> {
            List<SalaryComponent> comps = scRepo.findByTenantIdAndSalaryStructureId(t, ss.getId());
            BigDecimal allow = comps.stream().filter(c -> c.getType() == Enums.SalaryComponentType.ALLOWANCE).map(SalaryComponent::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal deduct = comps.stream().filter(c -> c.getType() == Enums.SalaryComponentType.DEDUCTION).map(SalaryComponent::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            Payslip ps = Payslip.builder().teacherId(ss.getTeacherId()).teacherName(ss.getTeacherName()).month(month).year(year).basicSalary(ss.getBasicSalary()).totalAllowances(allow).totalDeductions(deduct).netSalary(ss.getBasicSalary().add(allow).subtract(deduct)).status(Enums.PayslipStatus.GENERATED).build();
            ps.setTenantId(t);
            ps.setPayrollMonth(payrollMonth);
            return ps;
        }).collect(Collectors.toList());
        psRepo.saveAll(payslips);
        log.info("Generated {} payslips for {}/{}", payslips.size(), month, year);
        return payslips;
    }

    @Transactional(readOnly = true)
    public List<PayrollDTOs.TeacherPaymentDetailsResponse> listTeacherPaymentDetails() {
        String t = TenantContext.getTenantId();
        List<PayrollDTOs.TeacherPaymentDetailsResponse> out = new ArrayList<>();
        for (SalaryStructure ss : ssRepo.findByTenantIdAndIsDeletedFalse(t)) {
            PayrollDTOs.TeacherPaymentDetailsResponse row = new PayrollDTOs.TeacherPaymentDetailsResponse();
            row.setTeacherId(ss.getTeacherId());
            row.setTeacherName(ss.getTeacherName());
            row.setMonthlyNetSalary(ss.getNetSalary());
            teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(ss.getTeacherId(), t).ifPresent(teacher -> {
                row.setBankAccountHolder(teacher.getBankAccountHolder());
                row.setBankName(teacher.getBankName());
                row.setBankIfsc(teacher.getBankIfsc());
                row.setBankAccountMasked(maskBankAccount(teacher.getBankAccountNumber()));
                row.setBankDetailsComplete(isBankProfileComplete(teacher));
            });
            out.add(row);
        }
        return out;
    }

    private static String maskBankAccount(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String d = raw.replaceAll("\\s+", "");
        if (d.length() <= 4) {
            return "****";
        }
        return "****" + d.substring(d.length() - 4);
    }

    private static boolean isBankProfileComplete(Teacher teacher) {
        if (teacher.getBankAccountHolder() == null || teacher.getBankAccountHolder().isBlank()) {
            return false;
        }
        if (teacher.getBankName() == null || teacher.getBankName().isBlank()) {
            return false;
        }
        String ifsc = teacher.getBankIfsc() != null ? teacher.getBankIfsc().trim().toUpperCase(Locale.ROOT) : "";
        if (!ifsc.matches("^[A-Z]{4}0[A-Z0-9]{6}$")) {
            return false;
        }
        String account = teacher.getBankAccountNumber() != null ? teacher.getBankAccountNumber().replaceAll("\\s+", "") : "";
        return account.matches("^[0-9]{6,22}$");
    }

    private static void validateBankProfileForPayout(Teacher teacher, String teacherName) {
        String ifsc = teacher.getBankIfsc() != null ? teacher.getBankIfsc().trim().toUpperCase(Locale.ROOT) : "";
        String account = teacher.getBankAccountNumber() != null ? teacher.getBankAccountNumber().replaceAll("\\s+", "") : "";
        if (!ifsc.matches("^[A-Z]{4}0[A-Z0-9]{6}$")) {
            throw new BusinessException("Invalid IFSC for " + teacherName + ". Use a valid 11-character IFSC code.");
        }
        if (!account.matches("^[0-9]{6,22}$")) {
            throw new BusinessException("Invalid bank account number for " + teacherName + ". Use 6 to 22 digits.");
        }
    }

    @Transactional(readOnly = true)
    public List<Payslip> getPayslips(Integer year, String month) {
        List<Payslip> all = psRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        if (year != null) {
            all = all.stream().filter(p -> p.getYear() != null && p.getYear().equals(year)).collect(Collectors.toList());
        }
        if (month != null) {
            final String mth = month.trim();
            all = all.stream()
                    .filter(p -> p.getMonth() != null && mth.equalsIgnoreCase(p.getMonth().trim()))
                    .collect(Collectors.toList());
        }
        return all;
    }

    @Transactional(readOnly = true)
    public PageResponse<Payslip> getPayslipsPaged(int page, int size, Integer year, String month) {
        String t = TenantContext.getTenantId();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "year", "payrollMonth"));
        String m = month != null && !month.isBlank() ? month.trim() : null;
        return PageResponse.fromSpringPage(psRepo.pageByTenantAndPeriod(t, year, m, pageable));
    }

    @Transactional(readOnly = true)
    public PageResponse<Payslip> getMyPayslipsPaged(int page, int size, Integer year, String month) {
        String t = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        Teacher teacher = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(t, uid).orElseThrow(() -> new UnauthorizedException("Only staff with a linked teacher profile can view payslips."));
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "year", "payrollMonth"));
        String m = month != null && !month.isBlank() ? month.trim() : null;
        return PageResponse.fromSpringPage(psRepo.pageByTenantTeacherAndPeriod(t, teacher.getId(), year, m, pageable));
    }

    /**
     * Records a disbursement hand-off to the bank (reference id for reconciliation).
     * Does not change payslip status; admin marks paid after settlement.
     */
    @Transactional
    public PayrollDTOs.DisburseSalaryResponse initiateSalaryDisbursement(PayrollDTOs.DisburseSalaryRequest req, String operationKey, String idempotencyKey) {
        String t = TenantContext.getTenantId();
        Long teacherId = req.getTeacherId();
        int year = req.getYear() != null ? req.getYear() : 0;
        String month = req.getMonth() != null ? req.getMonth().trim() : "";
        normalizePayrollMonthKey(month, year);
        String methodRaw = req.getPaymentMethod() != null ? req.getPaymentMethod().trim().toUpperCase(Locale.ROOT) : "NETBANKING";
        if (!methodRaw.matches("NETBANKING|UPI|NEFT|IMPS")) {
            methodRaw = "NETBANKING";
        }
        final String paymentMethod = methodRaw;
        Payslip p = psRepo.findByTenantIdAndIsDeletedFalse(t).stream()
                .filter(x -> teacherId.equals(x.getTeacherId())
                        && Objects.equals(x.getYear(), year)
                        && x.getMonth() != null && month.equalsIgnoreCase(x.getMonth().trim()))
                .findFirst()
                .orElseThrow(() -> new BusinessException("No payslip found for this teacher and period. Generate payslips first."));
        if (p.getStatus() != Enums.PayslipStatus.GENERATED) {
            throw new BusinessException("Payslip is not awaiting payment (already settled or invalid).");
        }
        Teacher teacher = teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(teacherId, t)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", teacherId));
        if (!isBankProfileComplete(teacher)) {
            throw new BusinessException("Bank details incomplete for " + p.getTeacherName() + ". Update the teacher profile before disbursement.");
        }
        validateBankProfileForPayout(teacher, p.getTeacherName());
        String effectiveOperationKey = normalizedOperationKey(operationKey, "PAYROLL_DISBURSE", p.getId());
        var existing = salaryDisbursementAttemptRepository.findByTenantIdAndOperationKeyAndIsDeletedFalse(t, effectiveOperationKey);
        if (existing.isPresent()) {
            return toDisburseResponse(existing.get(), p.getTeacherName());
        }
        SalaryDisbursementAttempt att = tenantRedisLockService.withBestEffortLock(
                "payroll:initiate:" + t + ":" + p.getId(), Duration.ofSeconds(30), () -> {
                    PayrollPayoutGatewayClient.PayoutInitiationResult providerResult = payrollPayoutGatewayClient.initiate(
                            new PayrollPayoutGatewayClient.PayoutInitiationRequest(
                                    t, teacherId, p.getTeacherName(), p.getNetSalary(), "INR", paymentMethod,
                                    teacher.getBankAccountHolder(), teacher.getBankAccountNumber(), teacher.getBankIfsc(), teacher.getBankName(),
                                    effectiveOperationKey));
                    String referenceId = providerResult.providerReferenceId();
                    log.info("Salary disbursement initiated ref={} teacherId={} net={} method={}",
                            referenceId, teacherId, p.getNetSalary(), paymentMethod);
                    SalaryDisbursementAttempt row = new SalaryDisbursementAttempt();
                    row.setTenantId(t);
                    row.setPayslipId(p.getId());
                    row.setTeacherId(teacherId);
                    row.setAmount(p.getNetSalary());
                    row.setPaymentMethod(paymentMethod);
                    row.setReferenceId(referenceId);
                    row.setOperationKey(effectiveOperationKey);
                    row.setStatus(PayrollDisbursementStatus.INITIATED.name());
                    row.setGatewayPayload(providerResult.payloadJson());
                    salaryDisbursementAttemptRepository.save(row);
                    String nextStatus = normalizeDisbursementStatus(providerResult.status());
                    row.setStatus(nextStatus);
                    if (PayrollDisbursementStatus.PROCESSED.name().equals(nextStatus)
                            || PayrollDisbursementStatus.FAILED.name().equals(nextStatus)
                            || PayrollDisbursementStatus.RECONCILED.name().equals(nextStatus)) {
                        row.setCompletedAt(LocalDateTime.now());
                    }
                    return salaryDisbursementAttemptRepository.save(row);
                });
        financialAuditService.record(
                "PAYROLL", "INITIATE_DISBURSEMENT", "SALARY_DISBURSEMENT_ATTEMPT", att.getId(),
                effectiveOperationKey, idempotencyKey, PayrollDisbursementStatus.INITIATED.name(),
                att.getStatus(), "SUCCESS", payoutProviderFromPayload(att.getGatewayPayload()), att.getReferenceId(), "INR", att.getAmount(), att.getGatewayPayload());

        Long staffUserId = teacher.getUserId();
        if (staffUserId != null) {
            notificationService.createNotification(
                    t,
                    staffUserId,
                    "Salary disbursement initiated",
                    paymentMethod + " transfer " + att.getReferenceId() + " for " + month + " " + year + " (" + p.getTeacherName() + ").",
                    Enums.NotificationType.INFO,
                    "/app/payroll");
            String body = "Salary " + paymentMethod + " initiated. Ref " + att.getReferenceId() + ". Net " + p.getNetSalary() + " INR. Mark payslip paid after settlement.";
            notificationDispatchPort.enqueue(
                    t, "SALARY_DISBURSE", "SMS", staffUserId, null, "Salary transfer", body,
                    "SALDIS:" + p.getId() + ":" + att.getReferenceId(), "payroll-" + p.getId());
            notificationDispatchPort.enqueue(
                    t, "SALARY_DISBURSE", "WHATSAPP", staffUserId, null, "Salary transfer", body,
                    "SALDIS:" + p.getId() + ":" + att.getReferenceId() + ":WA", "payroll-" + p.getId());
        }

        return toDisburseResponse(att, p.getTeacherName());
    }

    @Transactional(readOnly = true)
    public PageResponse<PayrollDTOs.DisbursementAttemptResponse> getDisbursementAttemptsPaged(
            int page, int size, String status) {
        String t = TenantContext.getTenantId();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(size, 1), 200), Sort.by(Sort.Direction.DESC, "createdAt"));
        String normalizedStatus = status != null ? status.trim().toUpperCase(Locale.ROOT) : "";
        if ("COMPLETED".equals(normalizedStatus)) {
            normalizedStatus = PayrollDisbursementStatus.PROCESSED.name();
        }
        Page<SalaryDisbursementAttempt> rows = normalizedStatus.isEmpty()
                ? salaryDisbursementAttemptRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(t, pageable)
                : salaryDisbursementAttemptRepository.findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(t, normalizedStatus, pageable);
        Map<Long, Payslip> payslipMap = psRepo.findByTenantIdAndIsDeletedFalse(t).stream()
                .collect(Collectors.toMap(Payslip::getId, p -> p, (a, b) -> a, HashMap::new));
        return PageResponse.fromSpringPage(rows.map(a -> toAttemptResponse(a, payslipMap.get(a.getPayslipId()))));
    }

    @Transactional(readOnly = true)
    public PayrollDTOs.DisbursementQueueSummaryResponse getDisbursementSummary() {
        String t = TenantContext.getTenantId();
        List<SalaryDisbursementAttempt> rows = salaryDisbursementAttemptRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(t);
        PayrollDTOs.DisbursementQueueSummaryResponse out = new PayrollDTOs.DisbursementQueueSummaryResponse();
        out.setTotalAttempts(rows.size());
        out.setSubmittedCount(rows.stream().filter(r -> PayrollDisbursementStatus.SUBMITTED.name().equalsIgnoreCase(r.getStatus())).count());
        out.setCompletedCount(rows.stream().filter(r -> PayrollDisbursementStatus.PROCESSED.name().equalsIgnoreCase(r.getStatus())
                || "COMPLETED".equalsIgnoreCase(r.getStatus())).count());
        out.setFailedCount(rows.stream().filter(r -> "FAILED".equalsIgnoreCase(r.getStatus())).count());
        out.setSubmittedAmount(sumByStatus(rows, PayrollDisbursementStatus.SUBMITTED.name()));
        out.setCompletedAmount(sumByStatus(rows, PayrollDisbursementStatus.PROCESSED.name()).add(sumByStatus(rows, "COMPLETED")));
        out.setFailedAmount(sumByStatus(rows, PayrollDisbursementStatus.FAILED.name()));
        return out;
    }

    @Transactional
    public PayrollDTOs.DisbursementAttemptResponse updateDisbursementStatus(
            Long attemptId, PayrollDTOs.UpdateDisbursementStatusRequest req, String operationKey, String idempotencyKey) {
        String t = TenantContext.getTenantId();
        return tenantRedisLockService.withBestEffortLock("payroll:status:" + t + ":" + attemptId, Duration.ofSeconds(30), () -> {
            SalaryDisbursementAttempt attempt = salaryDisbursementAttemptRepository.findByIdAndTenantIdAndIsDeletedFalse(attemptId, t)
                    .orElseThrow(() -> new ResourceNotFoundException("SalaryDisbursementAttempt", attemptId));
            String targetStatus = req.getStatus().trim().toUpperCase(Locale.ROOT);
            if ("COMPLETED".equals(targetStatus)) {
                targetStatus = PayrollDisbursementStatus.PROCESSED.name();
            }
            if (!targetStatus.matches("SUBMITTED|PROCESSED|FAILED|RECONCILED")) {
                throw new BusinessException("Invalid disbursement status");
            }
            String fromState = attempt.getStatus();
            attempt.setStatus(targetStatus);
            if (req.getMessage() != null && !req.getMessage().trim().isEmpty()) {
                attempt.setGatewayPayload(req.getMessage().trim());
            }
            Payslip payslip = psRepo.findByIdAndTenantIdAndIsDeletedFalse(attempt.getPayslipId(), t)
                    .orElseThrow(() -> new ResourceNotFoundException("Payslip", attempt.getPayslipId()));
            applyDisbursementOutcome(attempt, payslip, targetStatus);
            salaryDisbursementAttemptRepository.save(attempt);
            psRepo.save(payslip);
            financialAuditService.record(
                    "PAYROLL", "UPDATE_DISBURSEMENT_STATUS", "SALARY_DISBURSEMENT_ATTEMPT", attempt.getId(),
                    normalizedOperationKey(operationKey, "PAYROLL_STATUS", attemptId), idempotencyKey,
                    fromState, targetStatus, "SUCCESS", "mock_payout", attempt.getReferenceId(), "INR", attempt.getAmount(), attempt.getGatewayPayload());
            return toAttemptResponse(attempt, payslip);
        });
    }

    @Transactional
    public int reconcilePendingDisbursements(int maxBatchSize) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return 0;
        }
        return reconcilePendingDisbursementsForTenant(tenantId, maxBatchSize);
    }

    @Transactional
    public int reconcilePendingDisbursementsForAllTenants(int maxBatchSizePerTenant) {
        int totalProcessed = 0;
        for (String tenantId : salaryDisbursementAttemptRepository.findDistinctTenantIdByIsDeletedFalse()) {
            totalProcessed += reconcilePendingDisbursementsForTenant(tenantId, maxBatchSizePerTenant);
        }
        return totalProcessed;
    }

    @Transactional
    public boolean applyWebhookDisbursementStatus(String referenceId, String providerStatus, String providerPayload, String idempotencyKey) {
        if (referenceId == null || referenceId.isBlank()) {
            return false;
        }
        String normalized = normalizeDisbursementStatus(providerStatus);
        return tenantRedisLockService.withBestEffortLock("payroll:webhook:ref:" + referenceId, Duration.ofSeconds(30), () -> {
            var optionalAttempt = salaryDisbursementAttemptRepository
                    .findFirstByReferenceIdAndIsDeletedFalseOrderByCreatedAtDesc(referenceId);
            if (optionalAttempt.isEmpty()) {
                return false;
            }
            SalaryDisbursementAttempt attempt = optionalAttempt.get();
            String tenantId = attempt.getTenantId();
            Payslip payslip = psRepo.findByIdAndTenantIdAndIsDeletedFalse(attempt.getPayslipId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Payslip", attempt.getPayslipId()));
            String fromStatus = attempt.getStatus();
            if (normalized.equalsIgnoreCase(fromStatus)) {
                return true;
            }
            attempt.setStatus(normalized);
            if (providerPayload != null && !providerPayload.isBlank()) {
                attempt.setGatewayPayload(providerPayload);
            }
            applyDisbursementOutcome(attempt, payslip, normalized);
            salaryDisbursementAttemptRepository.save(attempt);
            psRepo.save(payslip);
            financialAuditService.record(
                    "PAYROLL", "WEBHOOK_DISBURSEMENT_STATUS", "SALARY_DISBURSEMENT_ATTEMPT", attempt.getId(),
                    "PAYROLL_WEBHOOK:" + tenantId + ":" + attempt.getId(), idempotencyKey,
                    fromStatus, normalized, "SUCCESS", payoutProviderFromPayload(attempt.getGatewayPayload()),
                    attempt.getReferenceId(), "INR", attempt.getAmount(), attempt.getGatewayPayload());
            return true;
        });
    }

    private int reconcilePendingDisbursementsForTenant(String tenantId, int maxBatchSize) {
        List<String> activeStatuses = List.of(
                PayrollDisbursementStatus.INITIATED.name(),
                PayrollDisbursementStatus.SUBMITTED.name());
        List<SalaryDisbursementAttempt> candidates = salaryDisbursementAttemptRepository
                .findByTenantIdAndStatusInAndIsDeletedFalseOrderByCreatedAtAsc(tenantId, activeStatuses);
        int processed = 0;
        for (SalaryDisbursementAttempt attempt : candidates) {
            if (processed >= maxBatchSize) {
                break;
            }
            PayrollPayoutGatewayClient.PayoutStatusResult providerStatus = payrollPayoutGatewayClient.fetchStatus(attempt.getReferenceId());
            String nextStatus = normalizeDisbursementStatus(providerStatus.status());
            if (nextStatus.equalsIgnoreCase(attempt.getStatus())) {
                continue;
            }
            Payslip payslip = psRepo.findByIdAndTenantIdAndIsDeletedFalse(attempt.getPayslipId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Payslip", attempt.getPayslipId()));
            String fromStatus = attempt.getStatus();
            attempt.setStatus(nextStatus);
            attempt.setGatewayPayload(providerStatus.payloadJson());
            applyDisbursementOutcome(attempt, payslip, nextStatus);
            salaryDisbursementAttemptRepository.save(attempt);
            psRepo.save(payslip);
            financialAuditService.record(
                    "PAYROLL", "RECONCILE_DISBURSEMENT", "SALARY_DISBURSEMENT_ATTEMPT", attempt.getId(),
                    "PAYROLL_RECON:" + tenantId + ":" + attempt.getId(), null,
                    fromStatus, nextStatus, "SUCCESS", providerStatus.providerName(),
                    attempt.getReferenceId(), "INR", attempt.getAmount(), providerStatus.payloadJson());
            processed++;
        }
        return processed;
    }

    @Transactional(readOnly = true)
    public List<Payslip> getMyPayslips(Integer year, String month) {
        String t = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        Teacher teacher = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(t, uid).orElseThrow(() -> new UnauthorizedException("Only staff with a linked teacher profile can view payslips."));
        return getPayslips(year, month).stream().filter(p -> p.getTeacherId().equals(teacher.getId())).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Payslip getPayslipForTenant(Long id) {
        return psRepo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Payslip", id));
    }

    @Transactional
    public Payslip markPayslipPaid(Long id) {
        String t = TenantContext.getTenantId();
        Payslip p = psRepo.findByIdAndTenantIdAndIsDeletedFalse(id, t).orElseThrow(() -> new ResourceNotFoundException("Payslip", id));
        p.setStatus(Enums.PayslipStatus.PAID);
        p.setPaymentDate(LocalDate.now());
        return psRepo.save(p);
    }

    @Transactional(readOnly = true)
    public void assertCurrentUserCanViewPayslip(Long payslipId) {
        String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole() : "";
        if ("ADMIN".equalsIgnoreCase(role) || "SUPER_ADMIN".equalsIgnoreCase(role)) {
            getPayslipForTenant(payslipId);
            return;
        }
        Payslip p = getPayslipForTenant(payslipId);
        Teacher teacher = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(TenantContext.getTenantId(), TenantContext.getUserId())
                .orElseThrow(() -> new UnauthorizedException("No teacher profile linked to this account."));
        if (!p.getTeacherId().equals(teacher.getId())) {
            throw new UnauthorizedException("You cannot access this payslip.");
        }
    }

    @Transactional(readOnly = true)
    public byte[] getPayslipPdf(Long id) {
        assertCurrentUserCanViewPayslip(id);
        Payslip p = getPayslipForTenant(id);
        String school = tenantConfigRepository.findByTenantId(TenantContext.getTenantId()).map(c -> c.getSchoolName()).orElse("School");
        return payslipPdfService.build(p, school);
    }

    private static String toPayrollMonthKey(String month, int year) {
        Month m = Month.valueOf(month.trim().toUpperCase(Locale.ENGLISH));
        return YearMonth.of(year, m).toString();
    }

    private static BigDecimal sumByStatus(List<SalaryDisbursementAttempt> rows, String status) {
        return rows.stream()
                .filter(r -> status.equalsIgnoreCase(r.getStatus()))
                .map(r -> r.getAmount() != null ? r.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private PayrollDTOs.DisbursementAttemptResponse toAttemptResponse(SalaryDisbursementAttempt attempt, Payslip payslip) {
        PayrollDTOs.DisbursementAttemptResponse out = new PayrollDTOs.DisbursementAttemptResponse();
        out.setId(attempt.getId());
        out.setPayslipId(attempt.getPayslipId());
        out.setTeacherId(attempt.getTeacherId());
        out.setTeacherName(payslip != null ? payslip.getTeacherName() : null);
        out.setPeriodLabel(payslip != null ? (payslip.getMonth() + " " + payslip.getYear()) : null);
        out.setAmount(attempt.getAmount());
        out.setPaymentMethod(attempt.getPaymentMethod());
        out.setReferenceId(attempt.getReferenceId());
        out.setStatus(PayrollDisbursementStatus.PROCESSED.name().equalsIgnoreCase(attempt.getStatus()) ? "COMPLETED" : attempt.getStatus());
        out.setCreatedAt(attempt.getCreatedAt() != null ? attempt.getCreatedAt().toString() : null);
        out.setCompletedAt(attempt.getCompletedAt() != null ? attempt.getCompletedAt().toString() : null);
        out.setLastMessage(attempt.getGatewayPayload());
        return out;
    }

    private static String normalizePayrollMonthKey(String month, int year) {
        int currentYear = LocalDate.now().getYear();
        if (year < 2000 || year > currentYear) {
            throw new BusinessException("Invalid payroll year. Please use a valid year.");
        }
        if (month == null || month.trim().isEmpty()) {
            throw new BusinessException("Payroll month is required.");
        }
        try {
            String payrollMonth = toPayrollMonthKey(month, year);
            YearMonth selected = YearMonth.parse(payrollMonth);
            YearMonth current = YearMonth.now();
            YearMonth previous = current.minusMonths(1);
            if (!(selected.equals(current) || selected.equals(previous))) {
                throw new BusinessException("Payroll period must be current month or previous month only.");
            }
            return payrollMonth;
        } catch (Exception ex) {
            if (ex instanceof BusinessException be) {
                throw be;
            }
            throw new BusinessException("Invalid payroll month. Use full month name, e.g. April.");
        }
    }

    public PayrollService(
            final SalaryStructureRepository ssRepo,
            final SalaryComponentRepository scRepo,
            final PayslipRepository psRepo,
            final TeacherRepository teacherRepository,
            final TenantConfigRepository tenantConfigRepository,
            final PayslipPdfService payslipPdfService,
            final SalaryDisbursementAttemptRepository salaryDisbursementAttemptRepository,
            final NotificationService notificationService,
            final NotificationDispatchPort notificationDispatchPort,
            final TenantRedisLockService tenantRedisLockService,
            final FinancialAuditService financialAuditService,
            final PayrollPayoutGatewayClient payrollPayoutGatewayClient) {
        this.ssRepo = ssRepo;
        this.scRepo = scRepo;
        this.psRepo = psRepo;
        this.teacherRepository = teacherRepository;
        this.tenantConfigRepository = tenantConfigRepository;
        this.payslipPdfService = payslipPdfService;
        this.salaryDisbursementAttemptRepository = salaryDisbursementAttemptRepository;
        this.notificationService = notificationService;
        this.notificationDispatchPort = notificationDispatchPort;
        this.tenantRedisLockService = tenantRedisLockService;
        this.financialAuditService = financialAuditService;
        this.payrollPayoutGatewayClient = payrollPayoutGatewayClient;
    }

    private String normalizedOperationKey(String incoming, String prefix, Long id) {
        String trimmed = incoming != null ? incoming.trim() : "";
        if (!trimmed.isEmpty()) {
            return trimmed;
        }
        return prefix + ":" + TenantContext.getTenantId() + ":" + id;
    }

    private PayrollDTOs.DisburseSalaryResponse toDisburseResponse(SalaryDisbursementAttempt attempt, String teacherName) {
        PayrollDTOs.DisburseSalaryResponse out = new PayrollDTOs.DisburseSalaryResponse();
        out.setReferenceId(attempt.getReferenceId());
        out.setAmount(attempt.getAmount());
        out.setTeacherName(teacherName);
        out.setPaymentMethod(attempt.getPaymentMethod());
        out.setMessage("Transfer submitted to bank pipeline (connect your PSP). Mark paid after funds settle.");
        return out;
    }

    private static String normalizeDisbursementStatus(String sourceStatus) {
        String normalized = sourceStatus != null ? sourceStatus.trim().toUpperCase(Locale.ROOT) : "";
        if ("COMPLETED".equals(normalized)) {
            return PayrollDisbursementStatus.PROCESSED.name();
        }
        if (!normalized.matches("INITIATED|SUBMITTED|PROCESSED|FAILED|RECONCILED")) {
            return PayrollDisbursementStatus.SUBMITTED.name();
        }
        return normalized;
    }

    private void applyDisbursementOutcome(SalaryDisbursementAttempt attempt, Payslip payslip, String targetStatus) {
        if (PayrollDisbursementStatus.PROCESSED.name().equals(targetStatus)
                || PayrollDisbursementStatus.FAILED.name().equals(targetStatus)
                || PayrollDisbursementStatus.RECONCILED.name().equals(targetStatus)) {
            attempt.setCompletedAt(LocalDateTime.now());
        } else {
            attempt.setCompletedAt(null);
        }
        if (PayrollDisbursementStatus.PROCESSED.name().equals(targetStatus)
                || PayrollDisbursementStatus.RECONCILED.name().equals(targetStatus)) {
            payslip.setStatus(Enums.PayslipStatus.PAID);
            payslip.setPaymentDate(LocalDate.now());
        } else if (PayrollDisbursementStatus.FAILED.name().equals(targetStatus) && payslip.getStatus() == Enums.PayslipStatus.PAID) {
            payslip.setStatus(Enums.PayslipStatus.GENERATED);
            payslip.setPaymentDate(null);
        }
    }

    private static String payoutProviderFromPayload(String payload) {
        if (payload != null && payload.contains("razorpayx")) {
            return "razorpayx";
        }
        return "mock_payout";
    }
}
