package com.school.erp.modules.fees.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.fees.dto.FeeDTOs;
import com.school.erp.modules.fees.entity.*;
import com.school.erp.modules.fees.repository.*;
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
public class FeeService {

    private final FeeStructureRepository structureRepo;
    private final FeeComponentRepository componentRepo;
    private final FeePaymentRepository paymentRepo;

    // ========== FEE STRUCTURES ==========

    @Transactional(readOnly = true)
    public List<FeeDTOs.FeeStructureResponse> getStructures() {
        String t = TenantContext.getTenantId();
        return structureRepo.findByTenantIdAndIsDeletedFalse(t).stream().map(fs -> {
            List<FeeComponent> comps = componentRepo.findByTenantIdAndFeeStructureId(t, fs.getId());
            return FeeDTOs.FeeStructureResponse.builder()
                    .id(fs.getId()).name(fs.getName()).classId(fs.getClassId())
                    .className(fs.getClassName()).academicYearId(fs.getAcademicYearId())
                    .totalAmount(fs.getTotalAmount())
                    .components(comps.stream().map(c -> FeeDTOs.FeeComponentDTO.builder()
                            .id(c.getId()).name(c.getName()).amount(c.getAmount())
                            .type(c.getType() != null ? c.getType().name() : null).build()
                    ).collect(Collectors.toList()))
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public FeeDTOs.FeeStructureResponse createStructure(FeeDTOs.CreateFeeStructureRequest req) {
        String t = TenantContext.getTenantId();
        BigDecimal total = req.getComponents().stream()
                .map(FeeDTOs.FeeComponentDTO::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        FeeStructure fs = FeeStructure.builder()
                .name(req.getName()).classId(req.getClassId()).className(req.getClassName())
                .academicYearId(req.getAcademicYearId()).totalAmount(total).build();
        fs.setTenantId(t);
        structureRepo.save(fs);

        List<FeeComponent> comps = req.getComponents().stream().map(c -> {
            FeeComponent fc = FeeComponent.builder()
                    .feeStructureId(fs.getId()).name(c.getName()).amount(c.getAmount())
                    .type(c.getType() != null ? Enums.FeeComponentType.valueOf(c.getType()) : Enums.FeeComponentType.MISC).build();
            fc.setTenantId(t);
            return fc;
        }).collect(Collectors.toList());
        componentRepo.saveAll(comps);

        log.info("Fee structure created: {} total={}", fs.getName(), total);
        return getStructures().stream().filter(s -> s.getId().equals(fs.getId())).findFirst().orElse(null);
    }

    // ========== FEE PAYMENTS ==========

    @Transactional(readOnly = true)
    public List<FeeDTOs.FeePaymentResponse> getPayments(Enums.FeeStatus status) {
        String t = TenantContext.getTenantId();
        List<FeePayment> payments = status != null
                ? paymentRepo.findByTenantIdAndStatusAndIsDeletedFalse(t, status)
                : paymentRepo.findByTenantIdAndIsDeletedFalse(t);
        return payments.stream().map(this::toPaymentResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeeDTOs.FeePaymentResponse> getStudentPayments(Long studentId) {
        return paymentRepo.findByTenantIdAndStudentIdAndIsDeletedFalse(TenantContext.getTenantId(), studentId)
                .stream().map(this::toPaymentResponse).collect(Collectors.toList());
    }

    @Transactional
    public FeeDTOs.FeePaymentResponse recordPayment(FeeDTOs.RecordPaymentRequest req) {
        String t = TenantContext.getTenantId();

        // Find existing payment record or create new
        FeePayment payment;
        if (req.getPaymentId() != null) {
            payment = paymentRepo.findById(req.getPaymentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payment", req.getPaymentId()));
            if (!payment.getTenantId().equals(t)) throw new BusinessException("Invalid payment record");
            // Update existing - add to paid amount
            BigDecimal newPaid = payment.getPaidAmount().add(req.getPaymentAmount());
            payment.setPaidAmount(newPaid);
            payment.setDueAmount(payment.getAmount().subtract(newPaid).max(BigDecimal.ZERO));
        } else {
            // New payment record
            payment = FeePayment.builder()
                    .studentId(req.getStudentId()).studentName(req.getStudentName())
                    .feeStructureId(req.getFeeStructureId())
                    .amount(req.getTotalAmount()).paidAmount(req.getPaymentAmount())
                    .dueAmount(req.getTotalAmount().subtract(req.getPaymentAmount()).max(BigDecimal.ZERO))
                    .dueDate(req.getDueDate()).discount(req.getDiscount() != null ? req.getDiscount() : BigDecimal.ZERO)
                    .lateFee(BigDecimal.ZERO)
                    .build();
            payment.setTenantId(t);
        }

        // Apply late fee if past due date
        if (payment.getDueDate() != null && LocalDate.now().isAfter(payment.getDueDate()) && payment.getDueAmount().compareTo(BigDecimal.ZERO) > 0) {
            long daysLate = java.time.temporal.ChronoUnit.DAYS.between(payment.getDueDate(), LocalDate.now());
            BigDecimal lateFee = BigDecimal.valueOf(daysLate * 5); // $5 per day late
            payment.setLateFee(lateFee);
        }

        // Set status
        if (payment.getDueAmount().compareTo(BigDecimal.ZERO) <= 0) {
            payment.setStatus(Enums.FeeStatus.PAID);
        } else if (payment.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            payment.setStatus(Enums.FeeStatus.PARTIAL);
        } else if (payment.getDueDate() != null && LocalDate.now().isAfter(payment.getDueDate())) {
            payment.setStatus(Enums.FeeStatus.OVERDUE);
        } else {
            payment.setStatus(Enums.FeeStatus.UNPAID);
        }

        // Set payment date and receipt
        payment.setPaymentDate(LocalDate.now());
        if (payment.getReceiptNumber() == null) {
            payment.setReceiptNumber("REC-" + t.toUpperCase() + "-" + System.currentTimeMillis());
        }
        payment.setPaymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : "CASH");

        paymentRepo.save(payment);
        log.info("Payment recorded: student={} amount={} status={}", payment.getStudentId(), req.getPaymentAmount(), payment.getStatus());
        return toPaymentResponse(payment);
    }

    // ========== REPORTS ==========

    @Transactional(readOnly = true)
    public FeeDTOs.FeeCollectionSummary getCollectionSummary() {
        String t = TenantContext.getTenantId();
        List<FeePayment> all = paymentRepo.findByTenantIdAndIsDeletedFalse(t);
        BigDecimal collected = all.stream().map(p -> p.getPaidAmount() != null ? p.getPaidAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pending = all.stream().map(p -> p.getDueAmount() != null ? p.getDueAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal total = collected.add(pending);
        long overdue = all.stream().filter(p -> p.getStatus() == Enums.FeeStatus.OVERDUE).count();

        return FeeDTOs.FeeCollectionSummary.builder()
                .totalCollected(collected).totalPending(pending)
                .totalStudents((long) all.size()).overdueCount(overdue)
                .collectionRate(total.compareTo(BigDecimal.ZERO) > 0
                        ? collected.multiply(BigDecimal.valueOf(100)).divide(total, 1, java.math.RoundingMode.HALF_UP).doubleValue() : 0)
                .build();
    }

    private FeeDTOs.FeePaymentResponse toPaymentResponse(FeePayment p) {
        return FeeDTOs.FeePaymentResponse.builder()
                .id(p.getId()).studentId(p.getStudentId()).studentName(p.getStudentName())
                .feeStructureId(p.getFeeStructureId()).amount(p.getAmount()).paidAmount(p.getPaidAmount())
                .dueAmount(p.getDueAmount()).status(p.getStatus() != null ? p.getStatus().name().toLowerCase() : "unpaid")
                .paymentDate(p.getPaymentDate()).dueDate(p.getDueDate()).discount(p.getDiscount())
                .lateFee(p.getLateFee()).receiptNumber(p.getReceiptNumber()).paymentMethod(p.getPaymentMethod())
                .build();
    }
}
