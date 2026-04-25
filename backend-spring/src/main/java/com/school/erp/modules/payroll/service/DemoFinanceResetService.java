package com.school.erp.modules.payroll.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.ApiErrorCode;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.academic.entity.AcademicYear;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.repository.AcademicYearRepository;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.fees.entity.FeeComponent;
import com.school.erp.modules.fees.entity.FeePayment;
import com.school.erp.modules.fees.entity.FeeStructure;
import com.school.erp.modules.fees.repository.FeeComponentRepository;
import com.school.erp.modules.fees.repository.FeePaymentRepository;
import com.school.erp.modules.fees.repository.FeeStructureRepository;
import com.school.erp.modules.payroll.entity.Payslip;
import com.school.erp.modules.payroll.entity.SalaryComponent;
import com.school.erp.modules.payroll.entity.SalaryDisbursementAttempt;
import com.school.erp.modules.payroll.entity.SalaryStructure;
import com.school.erp.modules.payroll.repository.PayslipRepository;
import com.school.erp.modules.payroll.repository.SalaryComponentRepository;
import com.school.erp.modules.payroll.repository.SalaryDisbursementAttemptRepository;
import com.school.erp.modules.payroll.repository.SalaryStructureRepository;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class DemoFinanceResetService {

    private final FeeStructureRepository feeStructureRepository;
    private final FeeComponentRepository feeComponentRepository;
    private final FeePaymentRepository feePaymentRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final SalaryComponentRepository salaryComponentRepository;
    private final PayslipRepository payslipRepository;
    private final SalaryDisbursementAttemptRepository salaryDisbursementAttemptRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final AcademicYearRepository academicYearRepository;
    private final boolean demoSeedEnabled;

    public DemoFinanceResetService(
            FeeStructureRepository feeStructureRepository,
            FeeComponentRepository feeComponentRepository,
            FeePaymentRepository feePaymentRepository,
            SalaryStructureRepository salaryStructureRepository,
            SalaryComponentRepository salaryComponentRepository,
            PayslipRepository payslipRepository,
            SalaryDisbursementAttemptRepository salaryDisbursementAttemptRepository,
            StudentRepository studentRepository,
            TeacherRepository teacherRepository,
            SchoolClassRepository schoolClassRepository,
            AcademicYearRepository academicYearRepository,
            @Value("${app.demo-seed.enabled:false}") boolean demoSeedEnabled) {
        this.feeStructureRepository = feeStructureRepository;
        this.feeComponentRepository = feeComponentRepository;
        this.feePaymentRepository = feePaymentRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.salaryComponentRepository = salaryComponentRepository;
        this.payslipRepository = payslipRepository;
        this.salaryDisbursementAttemptRepository = salaryDisbursementAttemptRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.academicYearRepository = academicYearRepository;
        this.demoSeedEnabled = demoSeedEnabled;
    }

    @Transactional
    public Map<String, Long> resetDemoFinanceData() {
        if (!demoSeedEnabled) {
            throw new BusinessException(
                    "Demo finance reset is disabled outside demo mode.",
                    ApiErrorCode.PAYROLL_DISBURSEMENT_BLOCKED);
        }
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new BusinessException("Tenant context is missing.", ApiErrorCode.BUSINESS_RULE_VIOLATION);
        }

        long archivedFeePayments = archiveFeePayments(tenantId);
        long archivedFeeComponents = archiveFeeComponents(tenantId);
        long archivedFeeStructures = archiveFeeStructures(tenantId);
        long archivedDisbursementAttempts = archiveDisbursementAttempts(tenantId);
        long archivedPayslips = archivePayslips(tenantId);
        long archivedSalaryComponents = archiveSalaryComponents(tenantId);
        long archivedSalaryStructures = archiveSalaryStructures(tenantId);

        long seededFeePayments = seedFeeDemoData(tenantId);
        long seededPayslips = seedPayrollDemoData(tenantId);

        Map<String, Long> out = new LinkedHashMap<>();
        out.put("archivedFeeStructures", archivedFeeStructures);
        out.put("archivedFeeComponents", archivedFeeComponents);
        out.put("archivedFeePayments", archivedFeePayments);
        out.put("archivedSalaryStructures", archivedSalaryStructures);
        out.put("archivedSalaryComponents", archivedSalaryComponents);
        out.put("archivedPayslips", archivedPayslips);
        out.put("archivedDisbursementAttempts", archivedDisbursementAttempts);
        out.put("seededFeePayments", seededFeePayments);
        out.put("seededPayslips", seededPayslips);
        return out;
    }

    private long archiveFeeStructures(String tenantId) {
        List<FeeStructure> rows = feeStructureRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        rows.forEach(FeeStructure::markSoftDeleted);
        feeStructureRepository.saveAll(rows);
        return rows.size();
    }

    private long archiveFeeComponents(String tenantId) {
        List<FeeStructure> structures = feeStructureRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        long count = 0;
        for (FeeStructure structure : structures) {
            List<FeeComponent> rows = feeComponentRepository.findByTenantIdAndFeeStructureId(tenantId, structure.getId());
            for (FeeComponent row : rows) {
                if (!Boolean.TRUE.equals(row.getIsDeleted())) {
                    row.markSoftDeleted();
                    count++;
                }
            }
            feeComponentRepository.saveAll(rows);
        }
        return count;
    }

    private long archiveFeePayments(String tenantId) {
        List<FeePayment> rows = feePaymentRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        rows.forEach(FeePayment::markSoftDeleted);
        feePaymentRepository.saveAll(rows);
        return rows.size();
    }

    private long archiveSalaryStructures(String tenantId) {
        List<SalaryStructure> rows = salaryStructureRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        rows.forEach(SalaryStructure::markSoftDeleted);
        salaryStructureRepository.saveAll(rows);
        return rows.size();
    }

    private long archiveSalaryComponents(String tenantId) {
        List<SalaryStructure> structures = salaryStructureRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        long count = 0;
        for (SalaryStructure structure : structures) {
            List<SalaryComponent> rows = salaryComponentRepository.findByTenantIdAndSalaryStructureId(tenantId, structure.getId());
            for (SalaryComponent row : rows) {
                if (!Boolean.TRUE.equals(row.getIsDeleted())) {
                    row.markSoftDeleted();
                    count++;
                }
            }
            salaryComponentRepository.saveAll(rows);
        }
        return count;
    }

    private long archivePayslips(String tenantId) {
        List<Payslip> rows = payslipRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        rows.forEach(Payslip::markSoftDeleted);
        payslipRepository.saveAll(rows);
        return rows.size();
    }

    private long archiveDisbursementAttempts(String tenantId) {
        List<SalaryDisbursementAttempt> rows = salaryDisbursementAttemptRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId);
        rows.forEach(SalaryDisbursementAttempt::markSoftDeleted);
        salaryDisbursementAttemptRepository.saveAll(rows);
        return rows.size();
    }

    private long seedFeeDemoData(String tenantId) {
        SchoolClass schoolClass = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .findFirst()
                .orElseThrow(() -> new BusinessException("No class found for demo fee reset.", ApiErrorCode.FEES_OPERATION_BLOCKED));
        AcademicYear year = academicYearRepository.findFirstByTenantIdAndIsCurrentTrueAndIsDeletedFalse(tenantId)
                .orElseGet(() -> academicYearRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream().findFirst().orElse(null));
        if (year == null) {
            throw new BusinessException("No academic year found for demo fee reset.", ApiErrorCode.FEES_OPERATION_BLOCKED);
        }

        FeeStructure fs = new FeeStructure();
        fs.setTenantId(tenantId);
        fs.setName("Demo Reset Plan - " + schoolClass.getName());
        fs.setClassId(schoolClass.getId());
        fs.setClassName(schoolClass.getName());
        fs.setAcademicYearId(year.getId());
        fs.setTotalAmount(new BigDecimal("5000"));
        fs = feeStructureRepository.save(fs);

        saveFeeComponent(tenantId, fs.getId(), "Tuition", new BigDecimal("4200"), Enums.FeeComponentType.TUITION);
        saveFeeComponent(tenantId, fs.getId(), "Transport", new BigDecimal("500"), Enums.FeeComponentType.TRANSPORT);
        saveFeeComponent(tenantId, fs.getId(), "Library", new BigDecimal("300"), Enums.FeeComponentType.LIBRARY);

        List<Student> students = studentRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream().limit(8).toList();
        LocalDate today = LocalDate.now();
        for (int i = 0; i < students.size(); i++) {
            Student student = students.get(i);
            FeePayment payment = new FeePayment();
            payment.setTenantId(tenantId);
            payment.setStudentId(student.getId());
            payment.setStudentName((student.getFirstName() + " " + student.getLastName()).trim());
            payment.setFeeStructureId(fs.getId());
            payment.setAmount(fs.getTotalAmount());
            payment.setDiscount(BigDecimal.ZERO);
            payment.setLateFee(BigDecimal.ZERO);
            payment.setDueDate(today.plusDays(15L - i));
            payment.setReceiptNumber("DEMO-RESET-FEE-" + System.currentTimeMillis() + "-" + i);
            switch (i % 4) {
                case 0 -> {
                    payment.setStatus(Enums.FeeStatus.PAID);
                    payment.setPaidAmount(fs.getTotalAmount());
                    payment.setDueAmount(BigDecimal.ZERO);
                    payment.setPaymentDate(today.minusDays(2));
                    payment.setPaymentMethod("UPI");
                }
                case 1 -> {
                    payment.setStatus(Enums.FeeStatus.PARTIAL);
                    payment.setPaidAmount(new BigDecimal("2500"));
                    payment.setDueAmount(new BigDecimal("2500"));
                    payment.setPaymentDate(today.minusDays(1));
                    payment.setPaymentMethod("NETBANKING");
                }
                case 2 -> {
                    payment.setStatus(Enums.FeeStatus.OVERDUE);
                    payment.setPaidAmount(BigDecimal.ZERO);
                    payment.setDueAmount(fs.getTotalAmount());
                    payment.setDueDate(today.minusDays(4));
                    payment.setLateFee(new BigDecimal("150"));
                }
                default -> {
                    payment.setStatus(Enums.FeeStatus.UNPAID);
                    payment.setPaidAmount(BigDecimal.ZERO);
                    payment.setDueAmount(fs.getTotalAmount());
                }
            }
            feePaymentRepository.save(payment);
        }
        return students.size();
    }

    private long seedPayrollDemoData(String tenantId) {
        List<Teacher> teachers = teacherRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream().limit(3).toList();
        if (teachers.isEmpty()) {
            throw new BusinessException("No teachers found for demo payroll reset.", ApiErrorCode.PAYROLL_DISBURSEMENT_BLOCKED);
        }

        // Seed only historical month so admins can generate current/previous month during demos.
        YearMonth seededMonth = YearMonth.now().minusMonths(2);
        long payslipCount = 0;
        for (int i = 0; i < teachers.size(); i++) {
            Teacher teacher = teachers.get(i);
            BigDecimal basic = new BigDecimal("42000").add(new BigDecimal(i * 1800L));
            BigDecimal allowance = new BigDecimal("4500");
            BigDecimal deduction = new BigDecimal("3200");
            BigDecimal net = basic.add(allowance).subtract(deduction);

            SalaryStructure structure = new SalaryStructure();
            structure.setTenantId(tenantId);
            structure.setTeacherId(teacher.getId());
            structure.setTeacherName((teacher.getFirstName() + " " + teacher.getLastName()).trim());
            structure.setBasicSalary(basic);
            structure.setNetSalary(net);
            structure = salaryStructureRepository.save(structure);

            saveSalaryComponent(tenantId, structure.getId(), "HRA", allowance, Enums.SalaryComponentType.ALLOWANCE);
            saveSalaryComponent(tenantId, structure.getId(), "Tax", deduction, Enums.SalaryComponentType.DEDUCTION);

            Payslip payslip = new Payslip();
            payslip.setTenantId(tenantId);
            payslip.setTeacherId(teacher.getId());
            payslip.setTeacherName(structure.getTeacherName());
            payslip.setPayrollMonth(seededMonth.toString());
            payslip.setMonth(seededMonth.getMonth().name().toLowerCase(Locale.ROOT));
            payslip.setYear(seededMonth.getYear());
            payslip.setBasicSalary(basic);
            payslip.setTotalAllowances(allowance);
            payslip.setTotalDeductions(deduction);
            payslip.setNetSalary(net);
            payslip.setStatus(Enums.PayslipStatus.PAID);
            payslip.setPaymentDate(seededMonth.atEndOfMonth());
            payslip = payslipRepository.save(payslip);
            payslipCount++;

            SalaryDisbursementAttempt attempt = new SalaryDisbursementAttempt();
            attempt.setTenantId(tenantId);
            attempt.setPayslipId(payslip.getId());
            attempt.setTeacherId(teacher.getId());
            attempt.setAmount(net);
            attempt.setPaymentMethod(i == 0 ? "NETBANKING" : (i == 1 ? "UPI" : "NEFT"));
            attempt.setReferenceId("DEMO-RESET-SAL-" + (i + 1) + "-" + System.currentTimeMillis());
            attempt.setStatus(i == 0 ? "COMPLETED" : (i == 1 ? "FAILED" : "COMPLETED"));
            attempt.setGatewayPayload(i == 1 ? "Validation failed at bank rail." : "Demo reset seeded.");
            attempt.setCompletedAt(i == 0 ? null : LocalDateTime.now().minusHours(i + 1L));
            salaryDisbursementAttemptRepository.save(attempt);
        }
        return payslipCount;
    }

    private void saveFeeComponent(String tenantId, Long feeStructureId, String name, BigDecimal amount, Enums.FeeComponentType type) {
        FeeComponent component = new FeeComponent();
        component.setTenantId(tenantId);
        component.setFeeStructureId(feeStructureId);
        component.setName(name);
        component.setAmount(amount);
        component.setType(type);
        feeComponentRepository.save(component);
    }

    private void saveSalaryComponent(String tenantId, Long structureId, String name, BigDecimal amount, Enums.SalaryComponentType type) {
        SalaryComponent component = new SalaryComponent();
        component.setTenantId(tenantId);
        component.setSalaryStructureId(structureId);
        component.setName(name);
        component.setAmount(amount);
        component.setType(type);
        salaryComponentRepository.save(component);
    }
}
