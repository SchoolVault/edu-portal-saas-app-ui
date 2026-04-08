package com.school.erp.modules.payroll.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.payroll.dto.PayrollDTOs;
import com.school.erp.modules.payroll.entity.*;
import com.school.erp.modules.payroll.repository.*;
import com.school.erp.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollService {

    private final SalaryStructureRepository ssRepo;
    private final SalaryComponentRepository scRepo;
    private final PayslipRepository psRepo;

    @Transactional(readOnly = true)
    public List<PayrollDTOs.SalaryStructureResponse> getStructures() {
        String t = TenantContext.getTenantId();
        return ssRepo.findByTenantIdAndIsDeletedFalse(t).stream().map(ss -> {
            List<SalaryComponent> comps = scRepo.findByTenantIdAndSalaryStructureId(t, ss.getId());
            BigDecimal totalAllowances = comps.stream()
                    .filter(c -> c.getType() == Enums.SalaryComponentType.ALLOWANCE)
                    .map(SalaryComponent::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalDeductions = comps.stream()
                    .filter(c -> c.getType() == Enums.SalaryComponentType.DEDUCTION)
                    .map(SalaryComponent::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

            return PayrollDTOs.SalaryStructureResponse.builder()
                    .id(ss.getId()).teacherId(ss.getTeacherId()).teacherName(ss.getTeacherName())
                    .basicSalary(ss.getBasicSalary()).netSalary(ss.getNetSalary())
                    .totalAllowances(totalAllowances).totalDeductions(totalDeductions)
                    .components(comps.stream().map(c -> PayrollDTOs.SalaryComponentDTO.builder()
                            .id(c.getId()).name(c.getName()).amount(c.getAmount())
                            .type(c.getType().name().toLowerCase()).build()).collect(Collectors.toList()))
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public PayrollDTOs.SalaryStructureResponse createStructure(PayrollDTOs.CreateSalaryStructureRequest req) {
        String t = TenantContext.getTenantId();
        BigDecimal totalAllow = req.getAllowances().stream().map(PayrollDTOs.SalaryComponentDTO::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDeduct = req.getDeductions().stream().map(PayrollDTOs.SalaryComponentDTO::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netSalary = req.getBasicSalary().add(totalAllow).subtract(totalDeduct);

        SalaryStructure ss = SalaryStructure.builder()
                .teacherId(req.getTeacherId()).teacherName(req.getTeacherName())
                .basicSalary(req.getBasicSalary()).netSalary(netSalary).build();
        ss.setTenantId(t);
        ssRepo.save(ss);

        // Save allowances
        req.getAllowances().forEach(a -> {
            SalaryComponent sc = SalaryComponent.builder()
                    .salaryStructureId(ss.getId()).name(a.getName()).amount(a.getAmount())
                    .type(Enums.SalaryComponentType.ALLOWANCE).build();
            sc.setTenantId(t);
            scRepo.save(sc);
        });
        // Save deductions
        req.getDeductions().forEach(d -> {
            SalaryComponent sc = SalaryComponent.builder()
                    .salaryStructureId(ss.getId()).name(d.getName()).amount(d.getAmount())
                    .type(Enums.SalaryComponentType.DEDUCTION).build();
            sc.setTenantId(t);
            scRepo.save(sc);
        });

        log.info("Salary structure created for teacher={} net={}", req.getTeacherId(), netSalary);
        return getStructures().stream().filter(s -> s.getId().equals(ss.getId())).findFirst().orElse(null);
    }

    @Transactional
    public List<Payslip> generatePayslips(String month, int year) {
        String t = TenantContext.getTenantId();
        List<SalaryStructure> structures = ssRepo.findByTenantIdAndIsDeletedFalse(t);

        List<Payslip> payslips = structures.stream().map(ss -> {
            List<SalaryComponent> comps = scRepo.findByTenantIdAndSalaryStructureId(t, ss.getId());
            BigDecimal allow = comps.stream().filter(c -> c.getType() == Enums.SalaryComponentType.ALLOWANCE)
                    .map(SalaryComponent::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal deduct = comps.stream().filter(c -> c.getType() == Enums.SalaryComponentType.DEDUCTION)
                    .map(SalaryComponent::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

            Payslip ps = Payslip.builder()
                    .teacherId(ss.getTeacherId()).teacherName(ss.getTeacherName())
                    .month(month).year(year).basicSalary(ss.getBasicSalary())
                    .totalAllowances(allow).totalDeductions(deduct)
                    .netSalary(ss.getBasicSalary().add(allow).subtract(deduct))
                    .status(Enums.PayslipStatus.GENERATED).build();
            ps.setTenantId(t);
            return ps;
        }).collect(Collectors.toList());

        psRepo.saveAll(payslips);
        log.info("Generated {} payslips for {}/{}", payslips.size(), month, year);
        return payslips;
    }

    @Transactional(readOnly = true)
    public List<Payslip> getPayslips(Integer year, String month) {
        List<Payslip> all = psRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        if (year != null) all = all.stream().filter(p -> p.getYear().equals(year)).collect(Collectors.toList());
        if (month != null) all = all.stream().filter(p -> month.equals(p.getMonth())).collect(Collectors.toList());
        return all;
    }
}
