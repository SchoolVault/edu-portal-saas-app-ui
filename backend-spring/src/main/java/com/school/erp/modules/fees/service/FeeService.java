package com.school.erp.modules.fees.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.fees.gateway.PaymentGatewayClient;
import com.school.erp.modules.fees.dto.FeeDTOs;
import com.school.erp.modules.fees.entity.*;
import com.school.erp.modules.fees.repository.*;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class FeeService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(FeeService.class);
    private static final String DEFAULT_CURRENCY = "INR";
    private static final BigDecimal LATE_FEE_PER_DAY = BigDecimal.valueOf(50); // ₹50 per day late (tunable)
    private final FeeStructureRepository structureRepo;
    private final FeeComponentRepository componentRepo;
    private final FeePaymentRepository paymentRepo;
    private final FeePaymentAttemptRepository paymentAttemptRepository;
    private final StudentRepository studentRepository;
    private final PaymentGatewayClient paymentGatewayClient;

    // ========== FEE STRUCTURES ==========
    @Transactional(readOnly = true)
    public List<FeeDTOs.FeeStructureResponse> getStructures() {
        String t = TenantContext.getTenantId();
        return structureRepo.findByTenantIdAndIsDeletedFalse(t).stream().map(fs -> {
            List<FeeComponent> comps = componentRepo.findByTenantIdAndFeeStructureId(t, fs.getId());
            return FeeDTOs.FeeStructureResponse.builder().id(fs.getId()).name(fs.getName()).classId(fs.getClassId()).className(fs.getClassName()).academicYearId(fs.getAcademicYearId()).totalAmount(fs.getTotalAmount()).components(comps.stream().map(c -> FeeDTOs.FeeComponentDTO.builder().id(c.getId()).name(c.getName()).amount(c.getAmount()).type(c.getType() != null ? c.getType().name() : null).build()).collect(Collectors.toList())).build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public FeeDTOs.FeeStructureResponse createStructure(FeeDTOs.CreateFeeStructureRequest req) {
        String t = TenantContext.getTenantId();
        BigDecimal total = req.getComponents().stream().map(FeeDTOs.FeeComponentDTO::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        FeeStructure fs = FeeStructure.builder().name(req.getName()).classId(req.getClassId()).className(req.getClassName()).academicYearId(req.getAcademicYearId()).totalAmount(total).build();
        fs.setTenantId(t);
        structureRepo.save(fs);
        List<FeeComponent> comps = req.getComponents().stream().map(c -> {
            FeeComponent fc = FeeComponent.builder().feeStructureId(fs.getId()).name(c.getName()).amount(c.getAmount()).type(c.getType() != null ? Enums.FeeComponentType.valueOf(c.getType()) : Enums.FeeComponentType.MISC).build();
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
        List<FeePayment> payments = status != null ? paymentRepo.findByTenantIdAndStatusAndIsDeletedFalse(t, status) : paymentRepo.findByTenantIdAndIsDeletedFalse(t);
        return payments.stream().map(this::toPaymentResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeeDTOs.FeePaymentResponse> getStudentPayments(Long studentId) {
        return paymentRepo.findByTenantIdAndStudentIdAndIsDeletedFalse(TenantContext.getTenantId(), studentId).stream().map(this::toPaymentResponse).collect(Collectors.toList());
    }

    @Transactional
    public FeeDTOs.FeePaymentResponse recordPayment(FeeDTOs.RecordPaymentRequest req) {
        String t = TenantContext.getTenantId();
        // Find existing payment record or create new
        FeePayment payment;
        if (req.getPaymentId() != null) {
            payment = paymentRepo.findById(req.getPaymentId()).orElseThrow(() -> new ResourceNotFoundException("Payment", req.getPaymentId()));
            if (!payment.getTenantId().equals(t)) throw new BusinessException("Invalid payment record");
            // Update existing - add to paid amount
            BigDecimal newPaid = payment.getPaidAmount().add(req.getPaymentAmount());
            payment.setPaidAmount(newPaid);
            payment.setDueAmount(payment.getAmount().subtract(newPaid).max(BigDecimal.ZERO));
        } else {
            // New payment record
            payment = FeePayment.builder().studentId(req.getStudentId()).studentName(req.getStudentName()).feeStructureId(req.getFeeStructureId()).amount(req.getTotalAmount()).paidAmount(req.getPaymentAmount()).dueAmount(req.getTotalAmount().subtract(req.getPaymentAmount()).max(BigDecimal.ZERO)).dueDate(req.getDueDate()).discount(req.getDiscount() != null ? req.getDiscount() : BigDecimal.ZERO).lateFee(BigDecimal.ZERO).build();
            payment.setTenantId(t);
        }
        // Apply late fee if past due date
        if (payment.getDueDate() != null && LocalDate.now().isAfter(payment.getDueDate()) && payment.getDueAmount().compareTo(BigDecimal.ZERO) > 0) {
            long daysLate = java.time.temporal.ChronoUnit.DAYS.between(payment.getDueDate(), LocalDate.now());
            BigDecimal lateFee = LATE_FEE_PER_DAY.multiply(BigDecimal.valueOf(Math.max(daysLate, 0)));
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
        return FeeDTOs.FeeCollectionSummary.builder().totalCollected(collected).totalPending(pending).totalStudents((long) all.size()).overdueCount(overdue).collectionRate(total.compareTo(BigDecimal.ZERO) > 0 ? collected.multiply(BigDecimal.valueOf(100)).divide(total, 1, java.math.RoundingMode.HALF_UP).doubleValue() : 0).build();
    }

    @Transactional(readOnly = true)
    public List<FeeDTOs.ParentFeeObligationResponse> getParentFeeObligations(Long studentId) {
        assertParentOwnsStudent(studentId);
        String tenantId = TenantContext.getTenantId();
        return paymentRepo.findByTenantIdAndStudentIdAndIsDeletedFalse(tenantId, studentId).stream()
                .map(this::toParentObligation)
                .collect(Collectors.toList());
    }

    @Transactional
    public FeeDTOs.CheckoutSessionResponse createCheckoutSession(FeeDTOs.CreateCheckoutSessionRequest request) {
        String tenantId = TenantContext.getTenantId();
        Student student = assertParentOwnsStudent(request.getStudentId());
        FeePayment payment = paymentRepo.findByIdAndTenantIdAndIsDeletedFalse(request.getPaymentId(), tenantId)
                .filter(item -> item.getStudentId().equals(student.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Fee payment not found"));

        BigDecimal payableNow = getPayableNow(payment);
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Payment amount must be greater than zero");
        }
        if (request.getAmount().compareTo(payableNow) > 0) {
            throw new BusinessException("Payment amount cannot exceed current payable balance");
        }

        String provider = request.getProvider().trim().toLowerCase(Locale.ROOT);
        PaymentGatewayClient.GatewayCheckoutSession gatewaySession = paymentGatewayClient.createSession(provider, tenantId, payment.getId(), request.getAmount(), DEFAULT_CURRENCY, request.getReturnUrl());

        FeePaymentAttempt attempt = new FeePaymentAttempt();
        attempt.setTenantId(tenantId);
        attempt.setFeePaymentId(payment.getId());
        attempt.setStudentId(student.getId());
        attempt.setParentUserId(TenantContext.getUserId());
        attempt.setProvider(gatewaySession.getProvider());
        attempt.setProviderOrderId(gatewaySession.getProviderOrderId());
        attempt.setCheckoutToken(gatewaySession.getCheckoutToken());
        attempt.setCurrency(DEFAULT_CURRENCY);
        attempt.setAmount(request.getAmount());
        attempt.setStatus("initiated");
        attempt.setReturnUrl(request.getReturnUrl());
        attempt.setGatewayPayload(gatewaySession.getRawPayload());
        attempt.setInitiatedAt(LocalDateTime.now());
        attempt.setIsActive(true);
        attempt.setIsDeleted(false);
        paymentAttemptRepository.save(attempt);

        FeeDTOs.CheckoutSessionResponse response = new FeeDTOs.CheckoutSessionResponse();
        response.setAttemptId(attempt.getId());
        response.setProvider(attempt.getProvider());
        response.setProviderOrderId(attempt.getProviderOrderId());
        response.setCheckoutToken(attempt.getCheckoutToken());
        response.setCurrency(attempt.getCurrency());
        response.setAmount(attempt.getAmount());
        response.setCheckoutUrl(gatewaySession.getCheckoutUrl());
        response.setStatus(attempt.getStatus());
        return response;
    }

    @Transactional
    public FeeDTOs.PaymentReceiptResponse confirmCheckout(Long attemptId, FeeDTOs.ConfirmCheckoutRequest request) {
        String tenantId = TenantContext.getTenantId();
        FeePaymentAttempt attempt = paymentAttemptRepository.findByIdAndTenantIdAndIsDeletedFalse(attemptId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment attempt not found"));
        if (!attempt.getCheckoutToken().equals(request.getCheckoutToken())) {
            throw new UnauthorizedException("Invalid checkout token");
        }
        if ("success".equalsIgnoreCase(attempt.getStatus())) {
            FeePayment payment = paymentRepo.findByIdAndTenantIdAndIsDeletedFalse(attempt.getFeePaymentId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Fee payment not found"));
            return toReceiptResponse(payment, attempt);
        }

        PaymentGatewayClient.GatewayPaymentConfirmation confirmation = paymentGatewayClient.confirmPayment(
                attempt.getProvider(),
                attempt.getCheckoutToken(),
                attempt.getProviderOrderId(),
                request.getProviderPaymentId(),
                request.getProviderSignature()
        );

        FeePayment payment = paymentRepo.findByIdAndTenantIdAndIsDeletedFalse(attempt.getFeePaymentId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Fee payment not found"));
        assertParentOwnsStudent(payment.getStudentId());

        attempt.setProviderPaymentId(confirmation.getProviderPaymentId());
        attempt.setStatus("success");
        attempt.setGatewayPayload(confirmation.getRawPayload());
        attempt.setCompletedAt(LocalDateTime.now());
        paymentAttemptRepository.save(attempt);

        applySuccessfulPayment(payment, attempt.getAmount(), attempt.getProvider());
        paymentRepo.save(payment);
        return toReceiptResponse(payment, attempt);
    }

    @Transactional(readOnly = true)
    public FeeDTOs.PaymentReceiptResponse getReceipt(String receiptNumber) {
        FeePayment payment = paymentRepo.findByReceiptNumberAndTenantIdAndIsDeletedFalse(receiptNumber, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
        assertParentOwnsStudent(payment.getStudentId());
        FeePaymentAttempt attempt = paymentAttemptRepository.findByTenantIdAndFeePaymentIdAndIsDeletedFalse(TenantContext.getTenantId(), payment.getId())
                .stream()
                .filter(item -> "success".equalsIgnoreCase(item.getStatus()))
                .findFirst()
                .orElse(null);
        return toReceiptResponse(payment, attempt);
    }

    private FeeDTOs.FeePaymentResponse toPaymentResponse(FeePayment p) {
        return FeeDTOs.FeePaymentResponse.builder().id(p.getId()).studentId(p.getStudentId()).studentName(p.getStudentName()).feeStructureId(p.getFeeStructureId()).amount(p.getAmount()).paidAmount(p.getPaidAmount()).dueAmount(p.getDueAmount()).status(p.getStatus() != null ? p.getStatus().name().toLowerCase() : "unpaid").paymentDate(p.getPaymentDate()).dueDate(p.getDueDate()).discount(p.getDiscount()).lateFee(p.getLateFee()).receiptNumber(p.getReceiptNumber()).paymentMethod(p.getPaymentMethod()).build();
    }

    private Student assertParentOwnsStudent(Long studentId) {
        Student student = studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        if (!TenantContext.getUserId().equals(student.getParentId()) && !"ADMIN".equals(TenantContext.getUserRole())) {
            throw new UnauthorizedException("You are not allowed to access this student");
        }
        return student;
    }

    private FeeDTOs.ParentFeeObligationResponse toParentObligation(FeePayment payment) {
        FeeDTOs.ParentFeeObligationResponse response = new FeeDTOs.ParentFeeObligationResponse();
        response.setPaymentId(payment.getId());
        response.setStudentId(payment.getStudentId());
        response.setStudentName(payment.getStudentName());
        response.setFeeStructureId(payment.getFeeStructureId());
        FeeStructure structure = payment.getFeeStructureId() != null ? structureRepo.findById(payment.getFeeStructureId()).orElse(null) : null;
        response.setFeeStructureName(structure != null ? structure.getName() : "Fee Plan");
        response.setClassName(structure != null ? structure.getClassName() : null);
        response.setDueDate(payment.getDueDate() != null ? payment.getDueDate().toString() : null);
        response.setStatus(payment.getStatus() != null ? payment.getStatus().name().toLowerCase() : "unpaid");
        response.setCurrency(DEFAULT_CURRENCY);
        response.setTotalAmount(payment.getAmount());
        response.setPaidAmount(payment.getPaidAmount());
        response.setDueAmount(payment.getDueAmount());
        response.setDiscount(payment.getDiscount() != null ? payment.getDiscount() : BigDecimal.ZERO);
        response.setLateFee(payment.getLateFee() != null ? payment.getLateFee() : BigDecimal.ZERO);
        response.setPayableNow(getPayableNow(payment));
        response.setLineItems(getLineItems(payment.getFeeStructureId()));
        return response;
    }

    private List<FeeDTOs.ParentFeeLineItem> getLineItems(Long feeStructureId) {
        if (feeStructureId == null) {
            return List.of();
        }
        return componentRepo.findByTenantIdAndFeeStructureId(TenantContext.getTenantId(), feeStructureId).stream()
                .map(item -> new FeeDTOs.ParentFeeLineItem(item.getName(), item.getAmount(), item.getType() != null ? item.getType().name().toLowerCase() : "misc"))
                .collect(Collectors.toList());
    }

    private BigDecimal getPayableNow(FeePayment payment) {
        return (payment.getDueAmount() != null ? payment.getDueAmount() : BigDecimal.ZERO)
                .add(payment.getLateFee() != null ? payment.getLateFee() : BigDecimal.ZERO);
    }

    private void applySuccessfulPayment(FeePayment payment, BigDecimal amountPaid, String provider) {
        BigDecimal currentPaid = payment.getPaidAmount() != null ? payment.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal currentLateFee = payment.getLateFee() != null ? payment.getLateFee() : BigDecimal.ZERO;
        BigDecimal totalOutstanding = (payment.getDueAmount() != null ? payment.getDueAmount() : BigDecimal.ZERO).add(currentLateFee);
        if (amountPaid.compareTo(totalOutstanding) > 0) {
            throw new BusinessException("Paid amount exceeds outstanding balance");
        }

        BigDecimal remainingLateFee = currentLateFee;
        BigDecimal remainingPrincipal = payment.getDueAmount() != null ? payment.getDueAmount() : BigDecimal.ZERO;
        BigDecimal leftover = amountPaid;
        if (leftover.compareTo(remainingLateFee) >= 0) {
            leftover = leftover.subtract(remainingLateFee);
            remainingLateFee = BigDecimal.ZERO;
        } else {
            remainingLateFee = remainingLateFee.subtract(leftover);
            leftover = BigDecimal.ZERO;
        }
        if (leftover.compareTo(BigDecimal.ZERO) > 0) {
            remainingPrincipal = remainingPrincipal.subtract(leftover).max(BigDecimal.ZERO);
        }

        payment.setPaidAmount(currentPaid.add(amountPaid));
        payment.setDueAmount(remainingPrincipal);
        payment.setLateFee(remainingLateFee);
        payment.setPaymentDate(LocalDate.now());
        payment.setPaymentMethod(provider.toUpperCase(Locale.ROOT));
        if (payment.getReceiptNumber() == null || payment.getReceiptNumber().isBlank()) {
            payment.setReceiptNumber("REC-" + TenantContext.getTenantId().toUpperCase(Locale.ROOT) + "-" + System.currentTimeMillis());
        }
        if (remainingPrincipal.add(remainingLateFee).compareTo(BigDecimal.ZERO) <= 0) {
            payment.setStatus(Enums.FeeStatus.PAID);
        } else {
            payment.setStatus(Enums.FeeStatus.PARTIAL);
        }
    }

    private FeeDTOs.PaymentReceiptResponse toReceiptResponse(FeePayment payment, FeePaymentAttempt attempt) {
        FeeDTOs.PaymentReceiptResponse response = new FeeDTOs.PaymentReceiptResponse();
        FeeStructure structure = payment.getFeeStructureId() != null ? structureRepo.findById(payment.getFeeStructureId()).orElse(null) : null;
        response.setReceiptNumber(payment.getReceiptNumber());
        response.setPaymentId(payment.getId());
        response.setStudentId(payment.getStudentId());
        response.setStudentName(payment.getStudentName());
        response.setFeeStructureName(structure != null ? structure.getName() : "Fee Plan");
        response.setClassName(structure != null ? structure.getClassName() : null);
        response.setProvider(attempt != null ? attempt.getProvider() : "manual");
        response.setProviderPaymentId(attempt != null ? attempt.getProviderPaymentId() : null);
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setPaymentDate(payment.getPaymentDate() != null ? payment.getPaymentDate().toString() : null);
        response.setDueDate(payment.getDueDate() != null ? payment.getDueDate().toString() : null);
        response.setCurrency("USD");
        response.setAmountPaid(attempt != null ? attempt.getAmount() : payment.getPaidAmount());
        response.setTotalAmount(payment.getAmount());
        response.setPaidAmount(payment.getPaidAmount());
        response.setDueAmount(payment.getDueAmount());
        response.setDiscount(payment.getDiscount() != null ? payment.getDiscount() : BigDecimal.ZERO);
        response.setLateFee(payment.getLateFee() != null ? payment.getLateFee() : BigDecimal.ZERO);
        response.setLineItems(getLineItems(payment.getFeeStructureId()));
        return response;
    }

    public FeeService(final FeeStructureRepository structureRepo, final FeeComponentRepository componentRepo, final FeePaymentRepository paymentRepo, final FeePaymentAttemptRepository paymentAttemptRepository, final StudentRepository studentRepository, final PaymentGatewayClient paymentGatewayClient) {
        this.structureRepo = structureRepo;
        this.componentRepo = componentRepo;
        this.paymentRepo = paymentRepo;
        this.paymentAttemptRepository = paymentAttemptRepository;
        this.studentRepository = studentRepository;
        this.paymentGatewayClient = paymentGatewayClient;
    }
}
