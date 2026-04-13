package com.school.erp.modules.fees.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.fees.gateway.PaymentGatewayClient;
import com.school.erp.modules.payment.domain.PaymentProviderIds;
import com.school.erp.modules.fees.dto.FeeDTOs;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.fees.entity.*;
import com.school.erp.modules.fees.repository.*;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.notification.service.NotificationOutboxService;
import com.school.erp.modules.reminder.service.FeeReminderAutomationService;
import com.school.erp.events.domain.FeePaymentRecordedEvent;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.platform.port.DomainEventPublisher;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FeeService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(FeeService.class);
    private static final String DEFAULT_CURRENCY = "INR";
    private static final BigDecimal LATE_FEE_PER_DAY = BigDecimal.valueOf(50); // ₹50 per day late (tunable)
    private static final int BULK_ASSIGN_MAX_STUDENTS = 2000;
    private static final int BULK_ASSIGN_SKIPPED_CAP = 100;
    private static final int BULK_ASSIGN_CREATED_SAMPLE = 25;
    private final FeeStructureRepository structureRepo;
    private final FeeComponentRepository componentRepo;
    private final FeePaymentRepository paymentRepo;
    private final FeePaymentAttemptRepository paymentAttemptRepository;
    private final StudentRepository studentRepository;
    private final GuardianService guardianService;
    private final PaymentGatewayClient paymentGatewayClient;
    private final NotificationOutboxService notificationOutboxService;
    private final UserRepository userRepository;
    private final FeeReminderAutomationService feeReminderAutomationService;
    private final SectionRepository sectionRepository;
    private final DomainEventPublisher domainEventPublisher;

    @Value("${app.payments.razorpay.key:}")
    private String razorpayPublishableKeyId;

    /** CSV of provider ids allowed for parent fee checkout (e.g. {@code razorpay} or {@code razorpay,mockpay} for tests). */
    @Value("${app.payments.parent.enabled-providers:razorpay}")
    private String parentFeeEnabledProvidersCsv;

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
            FeeComponent fc = FeeComponent.builder().feeStructureId(fs.getId()).name(c.getName()).amount(c.getAmount()).type(parseFeeComponentType(c.getType())).build();
            fc.setTenantId(t);
            return fc;
        }).collect(Collectors.toList());
        componentRepo.saveAll(comps);
        log.info("Fee structure created: {} total={}", fs.getName(), total);
        return getStructures().stream().filter(s -> s.getId().equals(fs.getId())).findFirst().orElse(null);
    }

    private Enums.FeeComponentType parseFeeComponentType(String type) {
        if (type == null || type.isBlank()) {
            return Enums.FeeComponentType.MISC;
        }
        try {
            return Enums.FeeComponentType.valueOf(type.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return Enums.FeeComponentType.MISC;
        }
    }

    @Transactional
    public FeeDTOs.FeeStructureResponse updateStructure(Long id, FeeDTOs.CreateFeeStructureRequest req) {
        FeeStructure fs = requireFeeStructure(id);
        String structureTenant = fs.getTenantId();
        BigDecimal total = req.getComponents().stream().map(FeeDTOs.FeeComponentDTO::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        fs.setName(req.getName());
        fs.setClassId(req.getClassId());
        fs.setClassName(req.getClassName());
        fs.setAcademicYearId(req.getAcademicYearId());
        fs.setTotalAmount(total);
        structureRepo.save(fs);
        List<FeeComponent> old = componentRepo.findByTenantIdAndFeeStructureId(structureTenant, id);
        componentRepo.deleteAll(old);
        List<FeeComponent> comps = req.getComponents().stream().map(c -> {
            FeeComponent fc = FeeComponent.builder().feeStructureId(fs.getId()).name(c.getName()).amount(c.getAmount()).type(parseFeeComponentType(c.getType())).build();
            fc.setTenantId(structureTenant);
            return fc;
        }).collect(Collectors.toList());
        componentRepo.saveAll(comps);
        log.info("Fee structure updated: id={} total={}", id, total);
        return mapStructureResponse(fs, structureTenant);
    }

    private FeeDTOs.FeeStructureResponse mapStructureResponse(FeeStructure fs, String tenantForComponents) {
        List<FeeComponent> comps = componentRepo.findByTenantIdAndFeeStructureId(tenantForComponents, fs.getId());
        return FeeDTOs.FeeStructureResponse.builder().id(fs.getId()).name(fs.getName()).classId(fs.getClassId()).className(fs.getClassName()).academicYearId(fs.getAcademicYearId()).totalAmount(fs.getTotalAmount()).components(comps.stream().map(c -> FeeDTOs.FeeComponentDTO.builder().id(c.getId()).name(c.getName()).amount(c.getAmount()).type(c.getType() != null ? c.getType().name() : null).build()).collect(Collectors.toList())).build();
    }

    private FeeStructure requireFeeStructure(Long id) {
        String t = TenantContext.getTenantId();
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            return structureRepo.findById(id).filter(x -> !Boolean.TRUE.equals(x.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("FeeStructure", id));
        }
        return structureRepo.findByIdAndTenantIdAndIsDeletedFalse(id, t).orElseThrow(() -> new ResourceNotFoundException("FeeStructure", id));
    }

    @Transactional
    public void deleteStructure(Long id) {
        FeeStructure fs = requireFeeStructure(id);
        String t = fs.getTenantId();
        fs.setIsDeleted(true);
        structureRepo.save(fs);
        for (FeeComponent c : componentRepo.findByTenantIdAndFeeStructureId(t, id)) {
            c.setIsDeleted(true);
            componentRepo.save(c);
        }
        log.info("Fee structure soft-deleted: id={}", id);
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
            if (TenantQueryPolicy.isPlatformSuperAdmin()) {
                payment = paymentRepo.findById(req.getPaymentId()).filter(p -> !Boolean.TRUE.equals(p.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("Payment", req.getPaymentId()));
            } else {
                payment = paymentRepo.findByIdAndTenantIdAndIsDeletedFalse(req.getPaymentId(), t).orElseThrow(() -> new ResourceNotFoundException("Payment", req.getPaymentId()));
            }
            // Update existing - add to paid amount
            BigDecimal newPaid = payment.getPaidAmount().add(req.getPaymentAmount());
            payment.setPaidAmount(newPaid);
            payment.setDueAmount(payment.getAmount().subtract(newPaid).max(BigDecimal.ZERO));
        } else {
            // New payment record
            payment = FeePayment.builder().studentId(req.getStudentId()).studentName(req.getStudentName()).feeStructureId(req.getFeeStructureId()).amount(req.getTotalAmount()).paidAmount(req.getPaymentAmount()).dueAmount(req.getTotalAmount().subtract(req.getPaymentAmount()).max(BigDecimal.ZERO)).dueDate(req.getDueDate()).discount(req.getDiscount() != null ? req.getDiscount() : BigDecimal.ZERO).lateFee(BigDecimal.ZERO).build();
            payment.setTenantId(t);
        }
        applyDueDateLateFeeAndStatus(payment);
        // Set payment date and receipt
        payment.setPaymentDate(LocalDate.now());
        if (payment.getReceiptNumber() == null) {
            payment.setReceiptNumber("REC-" + t.toUpperCase() + "-" + System.currentTimeMillis());
        }
        payment.setPaymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : "CASH");
        paymentRepo.save(payment);
        if (req.getPaymentId() == null
                && payment.getDueAmount() != null
                && payment.getDueAmount().compareTo(BigDecimal.ZERO) > 0) {
            feeReminderAutomationService.onFeeAssigned(t, payment);
        }
        log.info("Payment recorded: student={} amount={} status={}", payment.getStudentId(), req.getPaymentAmount(), payment.getStatus());
        domainEventPublisher.publish(new FeePaymentRecordedEvent(
                t,
                payment.getId(),
                payment.getStudentId(),
                payment.getStudentName(),
                req.getPaymentAmount(),
                payment.getStatus() != null ? payment.getStatus().name() : "UNKNOWN",
                payment.getReceiptNumber(),
                Instant.now()));
        return toPaymentResponse(payment);
    }

    /**
     * Creates unpaid fee obligations for all active students in a class (or one section) in one transaction.
     * Uses a single duplicate lookup query and {@link FeePaymentRepository#saveAll} for persistence.
     */
    @Transactional
    public FeeDTOs.BulkAssignFeesResponse bulkAssignFees(FeeDTOs.BulkAssignFeesRequest req) {
        String t = TenantContext.getTenantId();
        FeeStructure fs = requireFeeStructure(req.getFeeStructureId());
        if (!fs.getClassId().equals(req.getClassId())) {
            throw new BusinessException("Fee structure does not apply to the selected class");
        }
        if (req.getSectionId() != null) {
            var section = sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getSectionId(), t)
                    .orElseThrow(() -> new ResourceNotFoundException("Section", req.getSectionId()));
            if (!section.getClassId().equals(req.getClassId())) {
                throw new BusinessException("Section does not belong to the selected class");
            }
        }
        List<Student> students = req.getSectionId() == null
                ? studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(t, req.getClassId())
                : studentRepository.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(t, req.getClassId(), req.getSectionId());
        if (students.size() > BULK_ASSIGN_MAX_STUDENTS) {
            throw new BusinessException("Too many students in scope (max " + BULK_ASSIGN_MAX_STUDENTS + "). Narrow by section or split the run.");
        }
        boolean skipDup = !Boolean.FALSE.equals(req.getSkipIfDuplicate());
        BigDecimal discount = req.getDiscount() != null ? req.getDiscount() : BigDecimal.ZERO;

        List<FeeDTOs.BulkAssignFeesSkipEntry> skippedSample = new ArrayList<>();
        List<Student> activeStudents = new ArrayList<>();
        int inactiveSkipped = 0;
        for (Student s : students) {
            if (s.getStatus() != Enums.StudentStatus.ACTIVE) {
                inactiveSkipped++;
                appendBulkSkip(skippedSample, s.getId(), "STUDENT_INACTIVE", "Student is not active");
                continue;
            }
            activeStudents.add(s);
        }

        Set<Long> duplicateIds = Collections.emptySet();
        List<Long> activeIds = activeStudents.stream().map(Student::getId).collect(Collectors.toList());
        if (skipDup && !activeIds.isEmpty()) {
            duplicateIds = paymentRepo.findStudentIdsWithObligationOnDueDate(t, fs.getId(), req.getDueDate(), activeIds);
        }

        List<Student> toCreate = new ArrayList<>();
        int duplicateSkipped = 0;
        for (Student s : activeStudents) {
            if (duplicateIds.contains(s.getId())) {
                if (skipDup) {
                    duplicateSkipped++;
                    appendBulkSkip(skippedSample, s.getId(), "DUPLICATE_OBLIGATION", "Same structure and due date already assigned");
                    continue;
                }
                throw new BusinessException("Student " + s.getId() + " already has this fee for the chosen due date");
            }
            toCreate.add(s);
        }

        long stamp = System.currentTimeMillis();
        String tenantUpper = t.toUpperCase(Locale.ROOT);
        List<FeePayment> batch = new ArrayList<>(toCreate.size());
        for (Student s : toCreate) {
            FeePayment p = FeePayment.builder()
                    .studentId(s.getId())
                    .studentName(trimToEmpty(s.getFirstName()) + " " + trimToEmpty(s.getLastName()))
                    .feeStructureId(fs.getId())
                    .amount(fs.getTotalAmount())
                    .paidAmount(BigDecimal.ZERO)
                    .dueAmount(fs.getTotalAmount())
                    .dueDate(req.getDueDate())
                    .discount(discount)
                    .lateFee(BigDecimal.ZERO)
                    .build();
            p.setTenantId(t);
            p.setPaymentDate(LocalDate.now());
            p.setReceiptNumber("REC-" + tenantUpper + "-" + stamp + "-" + s.getId());
            p.setPaymentMethod("BULK_ASSIGN");
            applyDueDateLateFeeAndStatus(p);
            batch.add(p);
        }

        List<FeePayment> saved = paymentRepo.saveAll(batch);
        for (FeePayment p : saved) {
            if (p.getDueAmount() != null && p.getDueAmount().compareTo(BigDecimal.ZERO) > 0) {
                feeReminderAutomationService.onFeeAssigned(t, p);
            }
        }

        FeeDTOs.BulkAssignFeesResponse resp = new FeeDTOs.BulkAssignFeesResponse();
        resp.setCreatedCount(saved.size());
        resp.setSkippedCount(inactiveSkipped + duplicateSkipped);
        resp.setSkipped(skippedSample);
        resp.setCreatedSample(saved.stream().limit(BULK_ASSIGN_CREATED_SAMPLE).map(this::toPaymentResponse).collect(Collectors.toList()));
        log.info("Bulk fee assign tenant={} structure={} class={} section={} created={} skipped={} correlationId={}",
                t, fs.getId(), req.getClassId(), req.getSectionId(), saved.size(), resp.getSkippedCount(), req.getCorrelationId());
        return resp;
    }

    private static String trimToEmpty(String s) {
        return s != null ? s.trim() : "";
    }

    private void appendBulkSkip(List<FeeDTOs.BulkAssignFeesSkipEntry> out, Long studentId, String code, String detail) {
        if (out.size() >= BULK_ASSIGN_SKIPPED_CAP) {
            return;
        }
        FeeDTOs.BulkAssignFeesSkipEntry e = new FeeDTOs.BulkAssignFeesSkipEntry();
        e.setStudentId(studentId);
        e.setCode(code);
        e.setDetail(detail);
        out.add(e);
    }

    private void applyDueDateLateFeeAndStatus(FeePayment payment) {
        if (payment.getDueDate() != null && LocalDate.now().isAfter(payment.getDueDate()) && payment.getDueAmount().compareTo(BigDecimal.ZERO) > 0) {
            long daysLate = ChronoUnit.DAYS.between(payment.getDueDate(), LocalDate.now());
            BigDecimal lateFee = LATE_FEE_PER_DAY.multiply(BigDecimal.valueOf(Math.max(daysLate, 0)));
            payment.setLateFee(lateFee);
        }
        if (payment.getDueAmount().compareTo(BigDecimal.ZERO) <= 0) {
            payment.setStatus(Enums.FeeStatus.PAID);
        } else if (payment.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            payment.setStatus(Enums.FeeStatus.PARTIAL);
        } else if (payment.getDueDate() != null && LocalDate.now().isAfter(payment.getDueDate())) {
            payment.setStatus(Enums.FeeStatus.OVERDUE);
        } else {
            payment.setStatus(Enums.FeeStatus.UNPAID);
        }
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
        if (!enabledParentFeeProviders().contains(provider)) {
            throw new BusinessException("Payment provider is not enabled for parent checkout: " + provider);
        }
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
        if (PaymentProviderIds.RAZORPAY.equalsIgnoreCase(attempt.getProvider())
                && razorpayPublishableKeyId != null
                && !razorpayPublishableKeyId.isBlank()) {
            response.setPublicKeyId(razorpayPublishableKeyId.trim());
        }
        return response;
    }

    @Transactional
    public FeeDTOs.PaymentReceiptResponse confirmCheckout(Long attemptId, FeeDTOs.ConfirmCheckoutRequest request) {
        String tenantId = TenantContext.getTenantId();
        FeePaymentAttempt attempt = paymentAttemptRepository.findByIdAndTenantIdAndIsDeletedFalse(attemptId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment attempt not found"));
        Long uid = TenantContext.getUserId();
        if (attempt.getParentUserId() != null) {
            if (uid == null || !attempt.getParentUserId().equals(uid)) {
                throw new UnauthorizedException("This checkout session belongs to another account.");
            }
        }
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
        enqueueParentPaymentChannels(tenantId, payment, attempt);
        return toReceiptResponse(payment, attempt);
    }

    /**
     * Applies a provider-captured payment when notified by webhook (no browser session).
     * Idempotent if attempt is already {@code success} with the same {@code razorpayPaymentId}.
     * Sets {@link TenantContext} for the attempt's tenant and parent for downstream filters and notifications.
     */
    @Transactional
    public boolean reconcilePaymentCapturedFromWebhook(
            FeePaymentAttempt attempt,
            String razorpayPaymentId,
            long amountPaise,
            String currency,
            String rawPayload) {
        String tenantId = attempt.getTenantId();
        try {
            TenantContext.setTenantId(tenantId);
            TenantContext.setUserId(attempt.getParentUserId());
            TenantContext.setUserRole("PARENT");

            if ("success".equalsIgnoreCase(attempt.getStatus())) {
                if (razorpayPaymentId != null && razorpayPaymentId.equals(attempt.getProviderPaymentId())) {
                    return true;
                }
                log.warn("Webhook capture ignored: attempt {} already settled with a different provider payment id", attempt.getId());
                return false;
            }

            String cur = currency != null ? currency.trim() : "INR";
            if (!"INR".equalsIgnoreCase(cur)) {
                log.warn("Webhook capture: non-INR currency {} for attempt {} — verify amount scaling", cur, attempt.getId());
            }
            long expectedPaise = attempt.getAmount().movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValue();
            if (Math.abs(amountPaise - expectedPaise) > 1) {
                log.warn("Webhook amount mismatch: paise={} expectedPaise={} attemptId={}", amountPaise, expectedPaise, attempt.getId());
                throw new BusinessException("Webhook amount does not match checkout session");
            }

            FeePayment payment = paymentRepo.findByIdAndTenantIdAndIsDeletedFalse(attempt.getFeePaymentId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Fee payment", attempt.getFeePaymentId()));

            attempt.setProviderPaymentId(razorpayPaymentId);
            attempt.setStatus("success");
            attempt.setGatewayPayload(rawPayload);
            attempt.setCompletedAt(LocalDateTime.now());
            paymentAttemptRepository.save(attempt);

            applySuccessfulPayment(payment, attempt.getAmount(), attempt.getProvider());
            paymentRepo.save(payment);
            enqueueParentPaymentChannels(tenantId, payment, attempt);
            return true;
        } finally {
            TenantContext.clear();
        }
    }

    @Transactional
    public void reconcilePaymentFailedFromWebhook(FeePaymentAttempt attempt, String rawPayload) {
        String tenantId = attempt.getTenantId();
        try {
            TenantContext.setTenantId(tenantId);
            TenantContext.setUserId(attempt.getParentUserId());
            TenantContext.setUserRole("PARENT");
            if ("success".equalsIgnoreCase(attempt.getStatus())) {
                return;
            }
            attempt.setStatus("failed");
            attempt.setGatewayPayload(rawPayload);
            attempt.setCompletedAt(LocalDateTime.now());
            paymentAttemptRepository.save(attempt);
        } finally {
            TenantContext.clear();
        }
    }

    private void enqueueParentPaymentChannels(String tenantId, FeePayment payment, FeePaymentAttempt attempt) {
        Long parentUserId = attempt.getParentUserId() != null ? attempt.getParentUserId() : TenantContext.getUserId();
        if (parentUserId == null) {
            log.warn("Skipping fee payment notifications: no parent user on attempt {}", attempt.getId());
            return;
        }
        String statusLabel = payment.getStatus() == Enums.FeeStatus.PAID ? "paid in full" : "partial payment";
        String body = "Fee receipt " + (payment.getReceiptNumber() != null ? payment.getReceiptNumber() : "")
                + ": " + DEFAULT_CURRENCY + " " + attempt.getAmount()
                + " for " + (payment.getStudentName() != null ? payment.getStudentName() : "student")
                + ". " + statusLabel + ". Outstanding: " + DEFAULT_CURRENCY + " " + payment.getDueAmount() + ".";
        String corr = "fee-pay-" + attempt.getId();
        notificationOutboxService.enqueue(
                tenantId, "FEE_PAYMENT_CONFIRM", "SMS", parentUserId, null,
                "Payment received", body, "PAYCONF:" + attempt.getId(), corr);
        notificationOutboxService.enqueue(
                tenantId, "FEE_PAYMENT_CONFIRM", "WHATSAPP", parentUserId, null,
                "Payment received", body, "PAYCONF:" + attempt.getId() + ":WA", corr);
        userRepository.findByIdAndTenantIdAndIsDeletedFalse(parentUserId, tenantId).ifPresent(u ->
                log.info("Fee payment confirmed tenant={} parentUser={} student={} amount={} status={}",
                        tenantId, parentUserId, payment.getStudentId(), attempt.getAmount(), payment.getStatus()));
    }

    @Transactional(readOnly = true)
    public FeeDTOs.PaymentReceiptResponse getReceipt(String receiptNumber) {
        FeePayment payment = paymentRepo.findByReceiptNumberAndTenantIdAndIsDeletedFalse(receiptNumber, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
        assertParentOwnsStudent(payment.getStudentId());
        return toReceiptResponse(payment, latestSuccessAttempt(TenantContext.getTenantId(), payment.getId()));
    }

    /**
     * Receipts for parent portal: one row per {@link FeePayment} that already has a receipt number and a payment date in range.
     */
    @Transactional(readOnly = true)
    public List<FeeDTOs.PaymentReceiptResponse> listParentReceipts(Long studentId, LocalDate from, LocalDate to) {
        assertParentOwnsStudent(studentId);
        String tenantId = TenantContext.getTenantId();
        return paymentRepo.findByTenantIdAndStudentIdAndIsDeletedFalse(tenantId, studentId).stream()
                .filter(p -> p.getReceiptNumber() != null && !p.getReceiptNumber().isBlank())
                .filter(p -> p.getPaymentDate() != null
                        && !p.getPaymentDate().isBefore(from)
                        && !p.getPaymentDate().isAfter(to))
                .sorted(Comparator.comparing(FeePayment::getPaymentDate).reversed())
                .map(p -> toReceiptResponse(p, latestSuccessAttempt(tenantId, p.getId())))
                .collect(Collectors.toList());
    }

    private FeePaymentAttempt latestSuccessAttempt(String tenantId, Long feePaymentId) {
        return paymentAttemptRepository.findByTenantIdAndFeePaymentIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, feePaymentId)
                .stream()
                .filter(a -> "success".equalsIgnoreCase(a.getStatus()))
                .findFirst()
                .orElse(null);
    }

    private FeeDTOs.FeePaymentResponse toPaymentResponse(FeePayment p) {
        return FeeDTOs.FeePaymentResponse.builder().id(p.getId()).studentId(p.getStudentId()).studentName(p.getStudentName()).feeStructureId(p.getFeeStructureId()).amount(p.getAmount()).paidAmount(p.getPaidAmount()).dueAmount(p.getDueAmount()).status(p.getStatus() != null ? p.getStatus().name().toLowerCase() : "unpaid").paymentDate(p.getPaymentDate()).dueDate(p.getDueDate()).discount(p.getDiscount()).lateFee(p.getLateFee()).receiptNumber(p.getReceiptNumber()).paymentMethod(p.getPaymentMethod()).build();
    }

    private Student assertParentOwnsStudent(Long studentId) {
        String tenantId = TenantContext.getTenantId();
        Student student = studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        Long uid = TenantContext.getUserId();
        boolean ok = uid != null
                && (uid.equals(student.getParentId())
                || guardianService.guardianUserHasAccessToStudent(tenantId, uid, studentId));
        if (!ok) {
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
        FeeStructure structure = payment.getFeeStructureId() != null
                ? structureRepo.findByIdAndTenantIdAndIsDeletedFalse(payment.getFeeStructureId(), payment.getTenantId()).orElse(null)
                : null;
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
        response.setLineItems(getLineItems(payment.getTenantId(), payment.getFeeStructureId()));
        if (payment.getDueDate() != null && payment.getStatus() != Enums.FeeStatus.PAID) {
            long days = ChronoUnit.DAYS.between(LocalDate.now(), payment.getDueDate());
            response.setDaysUntilDue((int) days);
        } else {
            response.setDaysUntilDue(null);
        }
        return response;
    }

    private List<FeeDTOs.ParentFeeLineItem> getLineItems(String feeTenantId, Long feeStructureId) {
        if (feeStructureId == null || feeTenantId == null) {
            return List.of();
        }
        return componentRepo.findByTenantIdAndFeeStructureId(feeTenantId, feeStructureId).stream()
                .map(item -> new FeeDTOs.ParentFeeLineItem(item.getName(), item.getAmount(), item.getType() != null ? item.getType().name().toLowerCase() : "misc"))
                .collect(Collectors.toList());
    }

    private Set<String> enabledParentFeeProviders() {
        return Arrays.stream(parentFeeEnabledProvidersCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.toLowerCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));
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
        FeeStructure structure = payment.getFeeStructureId() != null
                ? structureRepo.findByIdAndTenantIdAndIsDeletedFalse(payment.getFeeStructureId(), payment.getTenantId()).orElse(null)
                : null;
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
        response.setCurrency(DEFAULT_CURRENCY);
        response.setAmountPaid(attempt != null ? attempt.getAmount() : payment.getPaidAmount());
        response.setTotalAmount(payment.getAmount());
        response.setPaidAmount(payment.getPaidAmount());
        response.setDueAmount(payment.getDueAmount());
        response.setDiscount(payment.getDiscount() != null ? payment.getDiscount() : BigDecimal.ZERO);
        response.setLateFee(payment.getLateFee() != null ? payment.getLateFee() : BigDecimal.ZERO);
        response.setLineItems(getLineItems(payment.getTenantId(), payment.getFeeStructureId()));
        return response;
    }

    public FeeService(
            final FeeStructureRepository structureRepo,
            final FeeComponentRepository componentRepo,
            final FeePaymentRepository paymentRepo,
            final FeePaymentAttemptRepository paymentAttemptRepository,
            final StudentRepository studentRepository,
            final GuardianService guardianService,
            final PaymentGatewayClient paymentGatewayClient,
            final NotificationOutboxService notificationOutboxService,
            final UserRepository userRepository,
            final FeeReminderAutomationService feeReminderAutomationService,
            final SectionRepository sectionRepository,
            final DomainEventPublisher domainEventPublisher) {
        this.structureRepo = structureRepo;
        this.componentRepo = componentRepo;
        this.paymentRepo = paymentRepo;
        this.paymentAttemptRepository = paymentAttemptRepository;
        this.studentRepository = studentRepository;
        this.guardianService = guardianService;
        this.paymentGatewayClient = paymentGatewayClient;
        this.notificationOutboxService = notificationOutboxService;
        this.userRepository = userRepository;
        this.feeReminderAutomationService = feeReminderAutomationService;
        this.sectionRepository = sectionRepository;
        this.domainEventPublisher = domainEventPublisher;
    }
}
