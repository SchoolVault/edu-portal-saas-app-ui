package com.school.erp.modules.payroll.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.payroll.dto.PayrollDTOs;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
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

    @Cacheable(cacheNames = CacheConfig.PAYROLL_STRUCTURES, keyGenerator = "tenantKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<PayrollDTOs.SalaryStructureResponse> getStructures() {
        String t = TenantContext.getTenantId();
        return ssRepo.findByTenantIdAndIsDeletedFalse(t).stream().map(ss -> {
            List<SalaryComponent> comps = scRepo.findByTenantIdAndSalaryStructureId(t, ss.getId());
            BigDecimal totalAllowances = comps.stream().filter(c -> c.getType() == Enums.SalaryComponentType.ALLOWANCE).map(SalaryComponent::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalDeductions = comps.stream().filter(c -> c.getType() == Enums.SalaryComponentType.DEDUCTION).map(SalaryComponent::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            return PayrollDTOs.SalaryStructureResponse.builder().id(ss.getId()).teacherId(ss.getTeacherId()).teacherName(ss.getTeacherName()).basicSalary(ss.getBasicSalary()).netSalary(ss.getNetSalary()).totalAllowances(totalAllowances).totalDeductions(totalDeductions).components(comps.stream().map(c -> PayrollDTOs.SalaryComponentDTO.builder().id(c.getId()).name(c.getName()).amount(c.getAmount()).type(c.getType().name().toLowerCase()).build()).collect(Collectors.toList())).build();
        }).collect(Collectors.toList());
    }

    @CacheEvict(cacheNames = CacheConfig.PAYROLL_STRUCTURES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public PayrollDTOs.SalaryStructureResponse createStructure(PayrollDTOs.CreateSalaryStructureRequest req) {
        String t = TenantContext.getTenantId();
        BigDecimal totalAllow = req.getAllowances().stream().map(PayrollDTOs.SalaryComponentDTO::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDeduct = req.getDeductions().stream().map(PayrollDTOs.SalaryComponentDTO::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netSalary = req.getBasicSalary().add(totalAllow).subtract(totalDeduct);
        SalaryStructure ss = SalaryStructure.builder().teacherId(req.getTeacherId()).teacherName(req.getTeacherName()).basicSalary(req.getBasicSalary()).netSalary(netSalary).build();
        ss.setTenantId(t);
        ssRepo.save(ss);
        req.getAllowances().forEach(a -> {
            SalaryComponent sc = SalaryComponent.builder().salaryStructureId(ss.getId()).name(a.getName()).amount(a.getAmount()).type(Enums.SalaryComponentType.ALLOWANCE).build();
            sc.setTenantId(t);
            scRepo.save(sc);
        });
        req.getDeductions().forEach(d -> {
            SalaryComponent sc = SalaryComponent.builder().salaryStructureId(ss.getId()).name(d.getName()).amount(d.getAmount()).type(Enums.SalaryComponentType.DEDUCTION).build();
            sc.setTenantId(t);
            scRepo.save(sc);
        });
        log.info("Salary structure created for teacher={} net={}", req.getTeacherId(), netSalary);
        return getStructures().stream().filter(s -> s.getId().equals(ss.getId())).findFirst().orElse(null);
    }

    @Transactional
    public List<Payslip> generatePayslips(String month, int year) {
        String t = TenantContext.getTenantId();
        String payrollMonth = toPayrollMonthKey(month, year);
        if (psRepo.existsByTenantIdAndPayrollMonthAndIsDeletedFalse(t, payrollMonth)) {
            throw new BusinessException("Payslips already generated for " + payrollMonth + ". Refresh the list or choose another month.");
        }
        List<SalaryStructure> structures = ssRepo.findByTenantIdAndIsDeletedFalse(t);
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
        return teacher.getBankAccountHolder() != null && !teacher.getBankAccountHolder().isBlank()
                && teacher.getBankName() != null && !teacher.getBankName().isBlank()
                && teacher.getBankAccountNumber() != null && !teacher.getBankAccountNumber().isBlank()
                && teacher.getBankIfsc() != null && !teacher.getBankIfsc().isBlank();
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

    /**
     * Records a disbursement hand-off to the bank (reference id for reconciliation).
     * Does not change payslip status; admin marks paid after settlement.
     */
    @Transactional
    public PayrollDTOs.DisburseSalaryResponse initiateSalaryDisbursement(PayrollDTOs.DisburseSalaryRequest req) {
        String t = TenantContext.getTenantId();
        Long teacherId = req.getTeacherId();
        int year = req.getYear();
        String month = req.getMonth() != null ? req.getMonth().trim() : "";
        String methodRaw = req.getPaymentMethod() != null ? req.getPaymentMethod().trim().toUpperCase(Locale.ROOT) : "NETBANKING";
        if (!methodRaw.matches("NETBANKING|UPI|NEFT|IMPS")) {
            methodRaw = "NETBANKING";
        }
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
        String ref = methodRaw + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        log.info("Salary disbursement initiated ref={} teacherId={} net={} method={}", ref, teacherId, p.getNetSalary(), methodRaw);
        SalaryDisbursementAttempt att = new SalaryDisbursementAttempt();
        att.setTenantId(t);
        att.setPayslipId(p.getId());
        att.setTeacherId(teacherId);
        att.setAmount(p.getNetSalary());
        att.setPaymentMethod(methodRaw);
        att.setReferenceId(ref);
        att.setStatus("SUBMITTED");
        att.setGatewayPayload("{\"mock\":true,\"rail\":\"" + methodRaw + "\"}");
        salaryDisbursementAttemptRepository.save(att);

        Long staffUserId = teacher.getUserId();
        if (staffUserId != null) {
            notificationService.createNotification(
                    t,
                    staffUserId,
                    "Salary disbursement initiated",
                    methodRaw + " transfer " + ref + " for " + month + " " + year + " (" + p.getTeacherName() + ").",
                    Enums.NotificationType.INFO,
                    "/app/payroll");
            String body = "Salary " + methodRaw + " initiated. Ref " + ref + ". Net " + p.getNetSalary() + " INR. Mark payslip paid after settlement.";
            notificationDispatchPort.enqueue(
                    t, "SALARY_DISBURSE", "SMS", staffUserId, null, "Salary transfer", body,
                    "SALDIS:" + p.getId() + ":" + ref, "payroll-" + p.getId());
            notificationDispatchPort.enqueue(
                    t, "SALARY_DISBURSE", "WHATSAPP", staffUserId, null, "Salary transfer", body,
                    "SALDIS:" + p.getId() + ":" + ref + ":WA", "payroll-" + p.getId());
        }

        PayrollDTOs.DisburseSalaryResponse out = new PayrollDTOs.DisburseSalaryResponse();
        out.setReferenceId(ref);
        out.setAmount(p.getNetSalary());
        out.setTeacherName(p.getTeacherName());
        out.setPaymentMethod(methodRaw);
        out.setMessage("Transfer submitted to bank pipeline (connect your PSP). Mark paid after funds settle.");
        return out;
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

    public PayrollService(
            final SalaryStructureRepository ssRepo,
            final SalaryComponentRepository scRepo,
            final PayslipRepository psRepo,
            final TeacherRepository teacherRepository,
            final TenantConfigRepository tenantConfigRepository,
            final PayslipPdfService payslipPdfService,
            final SalaryDisbursementAttemptRepository salaryDisbursementAttemptRepository,
            final NotificationService notificationService,
            final NotificationDispatchPort notificationDispatchPort) {
        this.ssRepo = ssRepo;
        this.scRepo = scRepo;
        this.psRepo = psRepo;
        this.teacherRepository = teacherRepository;
        this.tenantConfigRepository = tenantConfigRepository;
        this.payslipPdfService = payslipPdfService;
        this.salaryDisbursementAttemptRepository = salaryDisbursementAttemptRepository;
        this.notificationService = notificationService;
        this.notificationDispatchPort = notificationDispatchPort;
    }
}
