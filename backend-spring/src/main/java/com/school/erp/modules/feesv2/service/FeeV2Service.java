package com.school.erp.modules.feesv2.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.fees.dto.FeeDTOs;
import com.school.erp.modules.finance.service.TenantFinanceProfileService;
import com.school.erp.modules.feesv2.domain.FeeLedgerEventTaxonomy;
import com.school.erp.modules.feesv2.domain.FeeV2Enums.*;
import com.school.erp.modules.feesv2.dto.FeeV2DTOs;
import com.school.erp.modules.feesv2.entity.*;
import com.school.erp.modules.feesv2.repository.*;
import com.school.erp.modules.feesv2.repository.projection.ClassOutstandingRow;
import com.school.erp.modules.feesv2.repository.projection.DefaulterSummaryRow;
import com.school.erp.modules.feesv2.repository.projection.PaymentModeTotalRow;
import com.school.erp.modules.fees.gateway.RazorpayPaymentGatewayClient;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.tenant.AcademicYearContext;
import com.school.erp.tenant.TenantContext;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeeV2Service {
    private static final int PAYMENT_REGISTER_MAX_ROWS = 500;
    private static final String DEFAULT_CURRENCY = "INR";

    private final FeeComponentMasterV2Repository componentRepository;
    private final FeeStructureV2Repository structureRepository;
    private final FeeStructureComponentV2Repository structureComponentRepository;
    private final StudentFeeStructureMapV2Repository studentFeeStructureMapRepository;
    private final FeeRuleV2Repository feeRuleRepository;
    private final FeeRuleConditionV2Repository feeRuleConditionRepository;
    private final FeeRuleActionV2Repository feeRuleActionRepository;
    private final FeeDemandRunV2Repository feeDemandRunRepository;
    private final FeeDemandV2Repository feeDemandRepository;
    private final PaymentV2Repository paymentRepository;
    private final PaymentAllocationV2Repository paymentAllocationRepository;
    private final StudentLedgerEntryV2Repository studentLedgerRepository;
    private final StudentDiscountV2Repository studentDiscountRepository;
    private final FeeRefundV2Repository feeRefundRepository;
    private final FeeV2AuditEventRepository feeV2AuditEventRepository;
    private final FeeLateFeePolicyV2Repository feeLateFeePolicyRepository;
    private final FeeLateFeeRunV2Repository feeLateFeeRunRepository;
    private final FeeAssignmentRunV2Repository feeAssignmentRunRepository;
    private final StudentRepository studentRepository;
    private final RazorpayPaymentGatewayClient razorpayPaymentGatewayClient;
    private final FeeReceiptCounterV2Repository feeReceiptCounterRepository;
    private final ObjectMapper objectMapper;
    private final TenantFinanceProfileService tenantFinanceProfileService;

    public FeeV2Service(
            FeeComponentMasterV2Repository componentRepository,
            FeeStructureV2Repository structureRepository,
            FeeStructureComponentV2Repository structureComponentRepository,
            StudentFeeStructureMapV2Repository studentFeeStructureMapRepository,
            FeeRuleV2Repository feeRuleRepository,
            FeeRuleConditionV2Repository feeRuleConditionRepository,
            FeeRuleActionV2Repository feeRuleActionRepository,
            FeeDemandRunV2Repository feeDemandRunRepository,
            FeeDemandV2Repository feeDemandRepository,
            PaymentV2Repository paymentRepository,
            PaymentAllocationV2Repository paymentAllocationRepository,
            StudentLedgerEntryV2Repository studentLedgerRepository,
            StudentDiscountV2Repository studentDiscountRepository,
            FeeRefundV2Repository feeRefundRepository,
            FeeV2AuditEventRepository feeV2AuditEventRepository,
            FeeLateFeePolicyV2Repository feeLateFeePolicyRepository,
            FeeLateFeeRunV2Repository feeLateFeeRunRepository,
            FeeAssignmentRunV2Repository feeAssignmentRunRepository,
            StudentRepository studentRepository,
            RazorpayPaymentGatewayClient razorpayPaymentGatewayClient,
            FeeReceiptCounterV2Repository feeReceiptCounterRepository,
            ObjectMapper objectMapper,
            TenantFinanceProfileService tenantFinanceProfileService) {
        this.componentRepository = componentRepository;
        this.structureRepository = structureRepository;
        this.structureComponentRepository = structureComponentRepository;
        this.studentFeeStructureMapRepository = studentFeeStructureMapRepository;
        this.feeRuleRepository = feeRuleRepository;
        this.feeRuleConditionRepository = feeRuleConditionRepository;
        this.feeRuleActionRepository = feeRuleActionRepository;
        this.feeDemandRunRepository = feeDemandRunRepository;
        this.feeDemandRepository = feeDemandRepository;
        this.paymentRepository = paymentRepository;
        this.paymentAllocationRepository = paymentAllocationRepository;
        this.studentLedgerRepository = studentLedgerRepository;
        this.studentDiscountRepository = studentDiscountRepository;
        this.feeRefundRepository = feeRefundRepository;
        this.feeV2AuditEventRepository = feeV2AuditEventRepository;
        this.feeLateFeePolicyRepository = feeLateFeePolicyRepository;
        this.feeLateFeeRunRepository = feeLateFeeRunRepository;
        this.feeAssignmentRunRepository = feeAssignmentRunRepository;
        this.studentRepository = studentRepository;
        this.razorpayPaymentGatewayClient = razorpayPaymentGatewayClient;
        this.feeReceiptCounterRepository = feeReceiptCounterRepository;
        this.objectMapper = objectMapper;
        this.tenantFinanceProfileService = tenantFinanceProfileService;
    }

    /**
     * Parent-portal obligations from posted fee demands for the current academic year. Empty when the student has no
     * v2 demands (caller may fall back to legacy fee_payment rows).
     */
    @Transactional(readOnly = true)
    public List<FeeDTOs.ParentFeeObligationResponse> listParentFeeObligations(Long studentId) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        List<FeeDemandV2> demands = feeDemandRepository.findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByDueDateAscIdAsc(
                tenantId, yearId, studentId);
        if (demands.isEmpty()) {
            return List.of();
        }
        Student student = studentRepository
                .findByIdAndTenantIdAndIsDeletedFalse(studentId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        String studentName = (student.getFirstName() + " " + student.getLastName()).trim();
        boolean parentOnline = tenantFinanceProfileService.isParentOnlineFeeCheckoutEnabled(tenantId);
        Map<Long, List<FeeDemandV2>> byStructure =
                demands.stream().collect(Collectors.groupingBy(FeeDemandV2::getFeeStructureId, LinkedHashMap::new, Collectors.toList()));
        List<FeeDTOs.ParentFeeObligationResponse> out = new ArrayList<>();
        for (Map.Entry<Long, List<FeeDemandV2>> e : byStructure.entrySet()) {
            out.add(buildParentObligationForStructure(e.getKey(), e.getValue(), studentId, studentName, student, parentOnline, tenantId, yearId));
        }
        out.sort(Comparator.comparing(FeeDTOs.ParentFeeObligationResponse::getDueDate, Comparator.nullsLast(Comparator.naturalOrder())));
        return out;
    }

    @Transactional(readOnly = true)
    public List<FeeDTOs.PaymentReceiptResponse> listParentPaymentReceipts(Long studentId, LocalDate from, LocalDate to) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        Student student = studentRepository
                .findByIdAndTenantIdAndIsDeletedFalse(studentId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        return paymentRepository
                .findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByPaymentDateDescIdDesc(tenantId, yearId, studentId)
                .stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.SUCCESS)
                .filter(p -> p.getReceiptNo() != null && !p.getReceiptNo().isBlank())
                .filter(p -> {
                    LocalDate pd = p.getPaymentDate().toLocalDate();
                    return !pd.isBefore(from) && !pd.isAfter(to);
                })
                .map(p -> toParentPortalPaymentReceipt(p, student, tenantId, yearId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FeeDTOs.PaymentReceiptResponse getParentPaymentReceiptOrThrow(String receiptNumber) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        List<PaymentV2> rows =
                paymentRepository.findByTenantIdAndAcademicYearIdAndReceiptNoAndIsDeletedFalse(tenantId, yearId, receiptNumber);
        PaymentV2 payment = rows.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.SUCCESS)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
        Student student = studentRepository
                .findByIdAndTenantIdAndIsDeletedFalse(payment.getStudentId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", payment.getStudentId()));
        return toParentPortalPaymentReceipt(payment, student, tenantId, yearId);
    }

    private FeeDTOs.ParentFeeObligationResponse buildParentObligationForStructure(
            Long feeStructureId,
            List<FeeDemandV2> group,
            Long studentId,
            String studentName,
            Student student,
            boolean parentOnlineCheckout,
            String tenantId,
            Long yearId) {
        BigDecimal totalNet = BigDecimal.ZERO;
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalLate = BigDecimal.ZERO;
        BigDecimal totalPrincipal = BigDecimal.ZERO;
        for (FeeDemandV2 d : group) {
            totalNet = totalNet.add(nullSafe(d.getNetAmount()));
            totalOutstanding = totalOutstanding.add(nullSafe(d.getOutstandingAmount()));
            totalDiscount = totalDiscount.add(nullSafe(d.getDiscountAmount()));
            totalLate = totalLate.add(nullSafe(d.getLateFeeAmount()));
            totalPrincipal = totalPrincipal.add(nullSafe(d.getPrincipalAmount()));
        }
        BigDecimal paidPortion = totalNet.subtract(totalOutstanding);
        String status = aggregateParentObligationStatus(group);
        Optional<LocalDate> openDueMin = group.stream()
                .filter(d -> nullSafe(d.getOutstandingAmount()).compareTo(BigDecimal.ZERO) > 0)
                .map(FeeDemandV2::getDueDate)
                .min(Comparator.naturalOrder());
        LocalDate displayDue = openDueMin.orElseGet(() ->
                group.stream().map(FeeDemandV2::getDueDate).max(Comparator.naturalOrder()).orElse(null));
        FeeDTOs.ParentFeeObligationResponse response = new FeeDTOs.ParentFeeObligationResponse();
        response.setFeesV2(Boolean.TRUE);
        response.setParentOnlineFeeCheckoutEnabled(parentOnlineCheckout);
        response.setPaymentId(parentV2ObligationPaymentId(studentId, feeStructureId));
        response.setStudentId(studentId);
        response.setStudentName(studentName);
        response.setFeeStructureId(feeStructureId);
        FeeStructureV2 structure =
                structureRepository.findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(feeStructureId, tenantId, yearId).orElse(null);
        response.setFeeStructureName(structure != null ? structure.getStructureName() : "Fee Plan");
        response.setClassName(student.getClassName());
        response.setDueDate(displayDue != null ? displayDue.toString() : null);
        response.setStatus(status);
        response.setCurrency(DEFAULT_CURRENCY);
        response.setTotalAmount(totalNet);
        response.setPaidAmount(paidPortion.max(BigDecimal.ZERO));
        response.setDueAmount(totalOutstanding);
        response.setDiscount(totalDiscount);
        response.setLateFee(totalLate);
        response.setPayableNow(totalOutstanding.max(BigDecimal.ZERO));
        response.setLineItems(buildParentLineItemsFromDemands(group, tenantId, yearId));
        if (displayDue != null && !"paid".equals(status)) {
            response.setDaysUntilDue((int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), displayDue));
        } else {
            response.setDaysUntilDue(null);
        }
        return response;
    }

    private static String aggregateParentObligationStatus(List<FeeDemandV2> group) {
        boolean anyOpen = group.stream().anyMatch(d -> nullSafe(d.getOutstandingAmount()).compareTo(BigDecimal.ZERO) > 0);
        if (!anyOpen) {
            return "paid";
        }
        BigDecimal net = group.stream().map(FeeDemandV2::getNetAmount).map(FeeV2Service::nullSafe).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal out =
                group.stream().map(FeeDemandV2::getOutstandingAmount).map(FeeV2Service::nullSafe).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paid = net.subtract(out);
        if (group.stream().anyMatch(d -> d.getDemandStatus() == DemandStatus.OVERDUE)) {
            return "overdue";
        }
        if (paid.compareTo(BigDecimal.ZERO) > 0
                || group.stream().anyMatch(d -> d.getDemandStatus() == DemandStatus.PARTIAL)) {
            return "partial";
        }
        return "unpaid";
    }

    private List<FeeDTOs.ParentFeeLineItem> buildParentLineItemsFromDemands(
            List<FeeDemandV2> group, String tenantId, Long yearId) {
        Map<Long, BigDecimal> byMaster = new LinkedHashMap<>();
        for (FeeDemandV2 d : group) {
            byMaster.merge(d.getFeeComponentMasterId(), nullSafe(d.getPrincipalAmount()), BigDecimal::add);
        }
        List<FeeDTOs.ParentFeeLineItem> lines = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> e : byMaster.entrySet()) {
            FeeComponentMasterV2 m = componentRepository
                    .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(e.getKey(), tenantId, yearId)
                    .orElse(null);
            String name = m != null ? m.getName() : "Fee";
            String type = m != null && m.getComponentType() != null ? m.getComponentType().name().toLowerCase() : "misc";
            lines.add(new FeeDTOs.ParentFeeLineItem(name, e.getValue(), type));
        }
        return lines;
    }

    private FeeDTOs.PaymentReceiptResponse toParentPortalPaymentReceipt(
            PaymentV2 p, Student student, String tenantId, Long yearId) {
        List<PaymentAllocationV2> allocs =
                paymentAllocationRepository.findByTenantIdAndAcademicYearIdAndPaymentIdAndIsDeletedFalseOrderByAllocationOrderAsc(
                        tenantId, yearId, p.getId());
        Set<Long> structureIds = new LinkedHashSet<>();
        Map<Long, BigDecimal> componentPaid = new LinkedHashMap<>();
        Set<LocalDate> demandDues = new HashSet<>();
        for (PaymentAllocationV2 a : allocs) {
            if (a.getAllocationType() != AllocationType.DEMAND || a.getFeeDemandId() == null) {
                continue;
            }
            FeeDemandV2 d = feeDemandRepository
                    .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(a.getFeeDemandId(), tenantId, yearId)
                    .orElse(null);
            if (d == null || !student.getId().equals(d.getStudentId())) {
                continue;
            }
            structureIds.add(d.getFeeStructureId());
            componentPaid.merge(d.getFeeComponentMasterId(), nullSafe(a.getAmountAllocated()), BigDecimal::add);
            if (d.getDueDate() != null) {
                demandDues.add(d.getDueDate());
            }
        }
        List<FeeDTOs.ParentFeeLineItem> lines = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> e : componentPaid.entrySet()) {
            FeeComponentMasterV2 m = componentRepository
                    .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(e.getKey(), tenantId, yearId)
                    .orElse(null);
            String name = m != null ? m.getName() : "Fee";
            String type = m != null && m.getComponentType() != null ? m.getComponentType().name().toLowerCase() : "misc";
            lines.add(new FeeDTOs.ParentFeeLineItem(name, e.getValue(), type));
        }
        if (lines.isEmpty()) {
            lines.add(new FeeDTOs.ParentFeeLineItem("Fee payment", nullSafe(p.getAmount()), "misc"));
        }
        String feeStructureLabel;
        if (structureIds.size() == 1) {
            Long sid = structureIds.iterator().next();
            feeStructureLabel = structureRepository
                    .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(sid, tenantId, yearId)
                    .map(FeeStructureV2::getStructureName)
                    .orElse("Fee Plan");
        } else {
            feeStructureLabel = "School fees";
        }
        List<Long> synthKeys = structureIds.stream()
                .map(fsId -> parentV2ObligationPaymentId(student.getId(), fsId))
                .sorted()
                .collect(Collectors.toList());
        String studentName = (student.getFirstName() + " " + student.getLastName()).trim();
        FeeDTOs.PaymentReceiptResponse r = new FeeDTOs.PaymentReceiptResponse();
        r.setReceiptNumber(p.getReceiptNo());
        r.setPaymentId(p.getId());
        r.setStudentId(student.getId());
        r.setStudentName(studentName);
        r.setFeeStructureName(feeStructureLabel);
        r.setClassName(student.getClassName());
        r.setProvider(p.getChannelType() == PaymentChannelType.ONLINE ? "razorpay" : "manual");
        r.setProviderPaymentId(p.getExternalRefId());
        r.setPaymentMethod(p.getPaymentMode() != null ? p.getPaymentMode().name().toLowerCase(Locale.ROOT) : null);
        r.setPaymentDate(p.getPaymentDate() != null ? p.getPaymentDate().toString() : null);
        LocalDate minDue = demandDues.stream().min(Comparator.naturalOrder()).orElse(null);
        r.setDueDate(minDue != null ? minDue.toString() : null);
        String ccy = p.getCurrency() != null && !p.getCurrency().isBlank() ? p.getCurrency() : DEFAULT_CURRENCY;
        r.setCurrency(ccy);
        r.setAmountPaid(nullSafe(p.getAmount()));
        r.setTotalAmount(nullSafe(p.getAmount()));
        r.setPaidAmount(nullSafe(p.getAmount()));
        r.setDueAmount(BigDecimal.ZERO);
        r.setDiscount(BigDecimal.ZERO);
        r.setLateFee(BigDecimal.ZERO);
        r.setLineItems(lines);
        r.setParentObligationPaymentIds(synthKeys.isEmpty() ? List.of(p.getId()) : synthKeys);
        return r;
    }

    private static long parentV2ObligationPaymentId(long studentId, long feeStructureId) {
        long x = (studentId + 1L) * 0x9E3779B97F4A7C15L ^ (feeStructureId + 1L) * 0xC13FA9A902A6328FL;
        x &= Long.MAX_VALUE;
        if (x == 0) {
            x = 1L;
        }
        return -x;
    }

    private static BigDecimal nullSafe(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.ComponentResponse> getComponents() {
        return componentRepository.findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByNameAsc(tenantId(), academicYearId())
                .stream()
                .map(this::toComponentResponse)
                .toList();
    }

    @Transactional
    public FeeV2DTOs.ComponentResponse createComponent(FeeV2DTOs.CreateComponentRequest request) {
        componentRepository.findByTenantIdAndAcademicYearIdAndCodeAndIsDeletedFalse(tenantId(), academicYearId(), request.getCode())
                .ifPresent(existing -> { throw new BusinessException("Component code already exists in this academic year"); });
        FeeComponentMasterV2 entity = new FeeComponentMasterV2();
        entity.setTenantId(tenantId());
        entity.setAcademicYearId(academicYearId());
        entity.setCode(request.getCode().trim());
        entity.setName(request.getName().trim());
        entity.setComponentType(request.getComponentType());
        entity.setFrequency(request.getFrequency());
        entity.setOptionalComponent(Boolean.TRUE.equals(request.getOptionalComponent()));
        entity.setRefundable(Boolean.TRUE.equals(request.getRefundable()));
        entity.setMetadataJson(request.getMetadataJson());
        componentRepository.save(entity);
        return toComponentResponse(entity);
    }

    @Transactional
    public FeeV2DTOs.ComponentResponse updateComponent(Long id, FeeV2DTOs.UpdateComponentRequest request) {
        FeeComponentMasterV2 entity = componentRepository
                .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(id, tenantId(), academicYearId())
                .orElseThrow(() -> new BusinessException("Fee component not found"));
        entity.setName(request.getName().trim());
        entity.setComponentType(request.getComponentType());
        entity.setFrequency(request.getFrequency());
        entity.setOptionalComponent(Boolean.TRUE.equals(request.getOptionalComponent()));
        entity.setRefundable(Boolean.TRUE.equals(request.getRefundable()));
        entity.setMetadataJson(request.getMetadataJson());
        componentRepository.save(entity);
        return toComponentResponse(entity);
    }

    @Transactional
    public void deleteComponent(Long id) {
        FeeComponentMasterV2 entity = componentRepository
                .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(id, tenantId(), academicYearId())
                .orElseThrow(() -> new BusinessException("Fee component not found"));
        entity.markSoftDeleted();
        componentRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.StructureResponse> getStructures() {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        return structureRepository.findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByClassIdAscStructureNameAscVersionNoDesc(tenantId, yearId)
                .stream()
                .map(structure -> toStructureResponse(structure, structureComponentRepository
                        .findByTenantIdAndAcademicYearIdAndFeeStructureIdAndIsDeletedFalse(tenantId, yearId, structure.getId())))
                .toList();
    }

    @Transactional
    public FeeV2DTOs.StructureResponse createStructure(FeeV2DTOs.CreateStructureRequest request) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        FeeStructureV2 structure = new FeeStructureV2();
        structure.setTenantId(tenantId);
        structure.setAcademicYearId(yearId);
        structure.setClassId(request.getClassId());
        structure.setStructureName(request.getStructureName().trim());
        structure.setVersionNo(request.getVersionNo());
        structure.setStatus(request.getStatus() != null ? request.getStatus() : StructureStatus.DRAFT);
        structure.setRuleExpression(request.getRuleExpression());
        structureRepository.save(structure);

        List<FeeStructureComponentV2> lines = new ArrayList<>();
        for (FeeV2DTOs.StructureComponentLine line : request.getComponents()) {
            FeeStructureComponentV2 component = new FeeStructureComponentV2();
            component.setTenantId(tenantId);
            component.setAcademicYearId(yearId);
            component.setFeeStructureId(structure.getId());
            component.setFeeComponentMasterId(line.getFeeComponentMasterId());
            component.setAmount(line.getAmount());
            component.setFrequencyOverride(line.getFrequencyOverride());
            component.setOptionalOverride(line.getOptionalOverride());
            lines.add(component);
        }
        structureComponentRepository.saveAll(lines);
        return toStructureResponse(structure, lines);
    }

    @Transactional
    public FeeV2DTOs.SnapshotFeeMapResponse createStudentFeeMapSnapshot(FeeV2DTOs.SnapshotFeeMapRequest request) {
        String snapshotJson = request.getSnapshotJson();
        if (snapshotJson == null || snapshotJson.isBlank()) {
            snapshotJson = buildStructureSnapshotJson(request.getFeeStructureId());
        }
        StudentFeeStructureMapV2 map = new StudentFeeStructureMapV2();
        map.setTenantId(tenantId());
        map.setAcademicYearId(academicYearId());
        map.setStudentId(request.getStudentId());
        map.setClassId(request.getClassId());
        map.setFeeStructureId(request.getFeeStructureId());
        map.setFrozenVersionNo(request.getFrozenVersionNo());
        map.setAssignmentSource(request.getAssignmentSource());
        map.setAssignedAt(LocalDateTime.now());
        map.setValidFrom(request.getValidFrom());
        map.setValidTo(request.getValidTo());
        map.setSnapshotJson(snapshotJson);
        studentFeeStructureMapRepository.save(map);
        FeeV2DTOs.SnapshotFeeMapResponse response = new FeeV2DTOs.SnapshotFeeMapResponse();
        response.setId(map.getId());
        return response;
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.StudentFeeMapResponse> getStudentFeeMaps(Long studentId) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        List<StudentFeeStructureMapV2> rows = studentId != null
                ? studentFeeStructureMapRepository.findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByAssignedAtDesc(
                        tenantId, yearId, studentId)
                : studentFeeStructureMapRepository.findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByStudentIdAscAssignedAtDesc(
                        tenantId, yearId);
        return rows.stream().map(this::toStudentFeeMapResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.DemandResponse> getStudentDemands(Long studentId) {
        return feeDemandRepository
                .findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByDueDateAscIdAsc(
                        tenantId(), academicYearId(), studentId)
                .stream()
                .map(this::toDemandResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.DiscountResponse> getDiscountsForStudent(Long studentId) {
        return studentDiscountRepository
                .findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByValidFromDesc(
                        tenantId(), academicYearId(), studentId)
                .stream()
                .map(this::toDiscountResponse)
                .toList();
    }

    @Transactional
    public FeeV2DTOs.DiscountResponse createDiscount(FeeV2DTOs.CreateDiscountRequest request) {
        StudentDiscountV2 entity = new StudentDiscountV2();
        entity.setTenantId(tenantId());
        entity.setAcademicYearId(academicYearId());
        entity.setStudentId(request.getStudentId());
        entity.setDiscountType(request.getDiscountType());
        entity.setDiscountValue(request.getDiscountValue());
        entity.setComponentScope(request.getComponentScope() != null && !request.getComponentScope().isBlank()
                ? request.getComponentScope().trim().toUpperCase()
                : "ALL");
        entity.setApplicableComponentIdsJson(request.getApplicableComponentIdsJson());
        entity.setValidFrom(request.getValidFrom());
        entity.setValidTo(request.getValidTo());
        entity.setApprovalStatus("APPROVED");
        entity.setReason(request.getReason());
        studentDiscountRepository.save(entity);
        return toDiscountResponse(entity);
    }

    @Transactional
    public FeeV2DTOs.DiscountResponse updateDiscount(Long id, FeeV2DTOs.UpdateDiscountRequest request) {
        StudentDiscountV2 entity = studentDiscountRepository
                .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(id, tenantId(), academicYearId())
                .orElseThrow(() -> new BusinessException("Student discount not found"));
        entity.setDiscountType(request.getDiscountType());
        entity.setDiscountValue(request.getDiscountValue());
        if (request.getComponentScope() != null && !request.getComponentScope().isBlank()) {
            entity.setComponentScope(request.getComponentScope().trim().toUpperCase());
        }
        entity.setApplicableComponentIdsJson(request.getApplicableComponentIdsJson());
        entity.setValidFrom(request.getValidFrom());
        entity.setValidTo(request.getValidTo());
        if (request.getApprovalStatus() != null && !request.getApprovalStatus().isBlank()) {
            entity.setApprovalStatus(request.getApprovalStatus().trim().toUpperCase());
        }
        entity.setReason(request.getReason());
        studentDiscountRepository.save(entity);
        return toDiscountResponse(entity);
    }

    @Transactional
    public void deleteDiscount(Long id) {
        StudentDiscountV2 entity = studentDiscountRepository
                .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(id, tenantId(), academicYearId())
                .orElseThrow(() -> new BusinessException("Student discount not found"));
        entity.markSoftDeleted();
        studentDiscountRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public FeeV2DTOs.RuleDefinitionResponse getRuleDefinition(Long ruleId) {
        FeeRuleV2 rule = feeRuleRepository
                .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(ruleId, tenantId(), academicYearId())
                .orElseThrow(() -> new BusinessException("Fee rule not found"));
        FeeV2DTOs.RuleDefinitionResponse response = new FeeV2DTOs.RuleDefinitionResponse();
        response.setRule(toRuleResponse(rule));
        response.setConditions(feeRuleConditionRepository
                .findByTenantIdAndAcademicYearIdAndFeeRuleIdAndIsDeletedFalseOrderByConditionOrderAsc(
                        tenantId(), academicYearId(), ruleId)
                .stream()
                .map(this::toRuleConditionResponse)
                .toList());
        response.setActions(feeRuleActionRepository
                .findByTenantIdAndAcademicYearIdAndFeeRuleIdAndIsDeletedFalseOrderByActionOrderAsc(
                        tenantId(), academicYearId(), ruleId)
                .stream()
                .map(this::toRuleActionResponse)
                .toList());
        return response;
    }

    @Transactional
    public FeeV2DTOs.RuleDefinitionResponse replaceRuleDefinition(Long ruleId, FeeV2DTOs.ReplaceRuleDefinitionRequest request) {
        feeRuleRepository
                .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(ruleId, tenantId(), academicYearId())
                .orElseThrow(() -> new BusinessException("Fee rule not found"));
        String tenantId = tenantId();
        Long yearId = academicYearId();
        for (FeeRuleConditionV2 old : feeRuleConditionRepository.findByTenantIdAndAcademicYearIdAndFeeRuleIdAndIsDeletedFalseOrderByConditionOrderAsc(
                tenantId, yearId, ruleId)) {
            old.markSoftDeleted();
            feeRuleConditionRepository.save(old);
        }
        for (FeeRuleActionV2 old : feeRuleActionRepository.findByTenantIdAndAcademicYearIdAndFeeRuleIdAndIsDeletedFalseOrderByActionOrderAsc(
                tenantId, yearId, ruleId)) {
            old.markSoftDeleted();
            feeRuleActionRepository.save(old);
        }
        int conditionOrder = 1;
        for (FeeV2DTOs.RuleConditionLine line : request.getConditions()) {
            FeeRuleConditionV2 row = new FeeRuleConditionV2();
            row.setTenantId(tenantId);
            row.setAcademicYearId(yearId);
            row.setFeeRuleId(ruleId);
            row.setConditionOrder(line.getConditionOrder() != null ? line.getConditionOrder() : conditionOrder++);
            row.setFieldName(line.getFieldName().trim());
            row.setOperator(line.getOperator().trim());
            row.setValueType(line.getValueType().trim());
            row.setValueText(line.getValueText());
            row.setValueNumber(line.getValueNumber());
            row.setValueJson(line.getValueJson());
            row.setLogicalJoin(line.getLogicalJoin() != null && !line.getLogicalJoin().isBlank()
                    ? line.getLogicalJoin().trim().toUpperCase()
                    : "AND");
            feeRuleConditionRepository.save(row);
        }
        int actionOrder = 1;
        for (FeeV2DTOs.RuleActionLine line : request.getActions()) {
            FeeRuleActionV2 row = new FeeRuleActionV2();
            row.setTenantId(tenantId);
            row.setAcademicYearId(yearId);
            row.setFeeRuleId(ruleId);
            row.setActionOrder(line.getActionOrder() != null ? line.getActionOrder() : actionOrder++);
            row.setActionType(line.getActionType().trim());
            row.setTargetScope(line.getTargetScope());
            row.setValueType(line.getValueType());
            row.setValueNumber(line.getValueNumber());
            row.setValueText(line.getValueText());
            row.setValueJson(line.getValueJson());
            feeRuleActionRepository.save(row);
        }
        return getRuleDefinition(ruleId);
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.RuleResponse> getRules() {
        return feeRuleRepository.findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByPriorityNoAscIdAsc(tenantId(), academicYearId())
                .stream()
                .map(this::toRuleResponse)
                .toList();
    }

    @Transactional
    public FeeV2DTOs.RuleResponse createRule(FeeV2DTOs.CreateRuleRequest request) {
        FeeRuleV2 entity = new FeeRuleV2();
        entity.setTenantId(tenantId());
        entity.setAcademicYearId(academicYearId());
        entity.setRuleCode(request.getRuleCode().trim());
        entity.setRuleName(request.getRuleName().trim());
        entity.setRuleType(request.getRuleType());
        entity.setPriorityNo(request.getPriorityNo() != null ? request.getPriorityNo() : 100);
        entity.setStopOnMatch(Boolean.TRUE.equals(request.getStopOnMatch()));
        feeRuleRepository.save(entity);
        return toRuleResponse(entity);
    }

    @Transactional
    public FeeV2DTOs.RuleResponse updateRule(Long id, FeeV2DTOs.UpdateRuleRequest request) {
        FeeRuleV2 entity = feeRuleRepository
                .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(id, tenantId(), academicYearId())
                .orElseThrow(() -> new BusinessException("Fee rule not found"));
        entity.setRuleName(request.getRuleName().trim());
        entity.setRuleType(request.getRuleType());
        entity.setPriorityNo(request.getPriorityNo() != null ? request.getPriorityNo() : entity.getPriorityNo());
        entity.setStopOnMatch(Boolean.TRUE.equals(request.getStopOnMatch()));
        if (request.getRuleStatus() != null && !request.getRuleStatus().isBlank()) {
            entity.setRuleStatus(request.getRuleStatus().trim().toUpperCase());
        }
        feeRuleRepository.save(entity);
        return toRuleResponse(entity);
    }

    @Transactional
    public void deleteRule(Long id) {
        FeeRuleV2 entity = feeRuleRepository
                .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(id, tenantId(), academicYearId())
                .orElseThrow(() -> new BusinessException("Fee rule not found"));
        entity.markSoftDeleted();
        feeRuleRepository.save(entity);
    }

    @Transactional
    public FeeV2DTOs.DemandRunResponse createDemandRun(FeeV2DTOs.CreateDemandRunRequest request) {
        return feeDemandRunRepository
                .findByTenantIdAndAcademicYearIdAndIdempotencyKeyAndIsDeletedFalse(tenantId(), academicYearId(), request.getIdempotencyKey())
                .map(this::toDemandRunResponse)
                .orElseGet(() -> {
                    try {
                        YearMonth.parse(request.getPeriodKey().trim());
                    } catch (DateTimeException ex) {
                        throw new BusinessException("periodKey must use format yyyy-MM (example: 2026-04)");
                    }
                    FeeDemandRunV2 run = new FeeDemandRunV2();
                    run.setTenantId(tenantId());
                    run.setAcademicYearId(academicYearId());
                    run.setRunType(request.getRunType());
                    run.setPeriodKey(request.getPeriodKey().trim());
                    run.setTriggerSource(request.getTriggerSource().trim());
                    run.setIdempotencyKey(request.getIdempotencyKey().trim());
                    run.setRunMetadataJson(request.getRunMetadataJson());
                    run.setStartedAt(LocalDateTime.now());
                    run.setStatus(DemandRunStatus.INITIATED);
                    feeDemandRunRepository.save(run);
                    generateFeeDemandsForRun(run, request.getPeriodKey().trim());
                    run.setStatus(DemandRunStatus.COMPLETED);
                    run.setFinishedAt(LocalDateTime.now());
                    feeDemandRunRepository.save(run);
                    FeeV2DTOs.DemandRunResponse completed = toDemandRunResponse(run);
                    Map<String, Object> auditDetail = new LinkedHashMap<>();
                    auditDetail.put("periodKey", run.getPeriodKey());
                    auditDetail.put("demandsPosted", completed.getDemandsPosted());
                    writeAudit("DEMAND_RUN_COMPLETED", "fee_demand_run", run.getId(), auditDetail);
                    return completed;
                });
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.DemandRunResponse> getDemandRuns() {
        return feeDemandRunRepository.findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId(), academicYearId())
                .stream()
                .map(this::toDemandRunResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.LateFeePolicyResponse> getLateFeePolicies() {
        return feeLateFeePolicyRepository
                .findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByPolicyCodeAsc(tenantId(), academicYearId())
                .stream()
                .map(this::toLateFeePolicyResponse)
                .toList();
    }

    @Transactional
    public FeeV2DTOs.LateFeePolicyResponse createLateFeePolicy(FeeV2DTOs.CreateLateFeePolicyRequest request) {
        String code = request.getPolicyCode().trim();
        feeLateFeePolicyRepository
                .findByTenantIdAndAcademicYearIdAndPolicyCodeAndIsDeletedFalse(tenantId(), academicYearId(), code)
                .ifPresent(p -> {
                    throw new BusinessException("Late fee policy code already exists for this academic year");
                });
        FeeLateFeePolicyV2 entity = new FeeLateFeePolicyV2();
        entity.setTenantId(tenantId());
        entity.setAcademicYearId(academicYearId());
        entity.setPolicyCode(code);
        entity.setPolicyName(request.getPolicyName().trim());
        entity.setGraceDays(request.getGraceDays());
        entity.setCalculationMode(request.getCalculationMode());
        entity.setFlatAmount(request.getFlatAmount());
        entity.setRatePercent(request.getRatePercent());
        entity.setMaxLateAmount(request.getMaxLateAmount());
        entity.setIsActive(request.getIsActive() == null || request.getIsActive());
        validateLateFeePolicyConfig(entity);
        feeLateFeePolicyRepository.save(entity);
        return toLateFeePolicyResponse(entity);
    }

    @Transactional
    public FeeV2DTOs.LateFeePolicyResponse updateLateFeePolicy(Long id, FeeV2DTOs.UpdateLateFeePolicyRequest request) {
        FeeLateFeePolicyV2 entity = feeLateFeePolicyRepository
                .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(id, tenantId(), academicYearId())
                .orElseThrow(() -> new BusinessException("Late fee policy not found"));
        entity.setPolicyName(request.getPolicyName().trim());
        entity.setGraceDays(request.getGraceDays());
        entity.setCalculationMode(request.getCalculationMode());
        entity.setFlatAmount(request.getFlatAmount());
        entity.setRatePercent(request.getRatePercent());
        entity.setMaxLateAmount(request.getMaxLateAmount());
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        validateLateFeePolicyConfig(entity);
        feeLateFeePolicyRepository.save(entity);
        return toLateFeePolicyResponse(entity);
    }

    @Transactional
    public void deleteLateFeePolicy(Long id) {
        FeeLateFeePolicyV2 entity = feeLateFeePolicyRepository
                .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(id, tenantId(), academicYearId())
                .orElseThrow(() -> new BusinessException("Late fee policy not found"));
        entity.markSoftDeleted();
        feeLateFeePolicyRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.LateFeeRunResponse> getLateFeeRuns() {
        return feeLateFeeRunRepository
                .findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByStartedAtDesc(tenantId(), academicYearId())
                .stream()
                .map(this::toLateFeeRunResponse)
                .toList();
    }

    @Transactional
    public FeeV2DTOs.LateFeeRunResponse createLateFeeRun(FeeV2DTOs.CreateLateFeeRunRequest request) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        String idem = request.getIdempotencyKey().trim();
        Optional<FeeLateFeeRunV2> existingReplay = feeLateFeeRunRepository.findByTenantIdAndAcademicYearIdAndIdempotencyKeyAndIsDeletedFalse(
                tenantId, yearId, idem);
        if (existingReplay.isPresent()) {
            return toLateFeeRunResponse(existingReplay.get());
        }
        FeeLateFeePolicyV2 policy = feeLateFeePolicyRepository
                .findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(request.getFeeLateFeePolicyId(), tenantId, yearId)
                .orElseThrow(() -> new BusinessException("Late fee policy not found"));
        if (Boolean.FALSE.equals(policy.getIsActive())) {
            throw new BusinessException("Late fee policy is inactive");
        }
        validateLateFeePolicyConfig(policy);
        LocalDate asOf = request.getAsOfDate();
        int grace = policy.getGraceDays() != null ? Math.max(0, policy.getGraceDays()) : 0;
        LocalDate cutoff = asOf.minusDays(grace);
        List<FeeDemandV2> candidates = feeDemandRepository.findCandidatesForLateFeeApplication(
                tenantId, yearId, DemandStatus.PAID, cutoff);
        LocalDateTime startedAt = LocalDateTime.now();
        int updated = 0;
        for (FeeDemandV2 row : candidates) {
            FeeDemandV2 d = feeDemandRepository
                    .findByIdAndTenantIdAndAcademicYearIdForUpdate(row.getId(), tenantId, yearId)
                    .orElse(null);
            if (d == null) {
                continue;
            }
            if (d.getLateFeeAmount().compareTo(BigDecimal.ZERO) != 0) {
                continue;
            }
            if (d.getOutstandingAmount().compareTo(BigDecimal.ZERO) <= 0 || d.getDemandStatus() == DemandStatus.PAID) {
                continue;
            }
            BigDecimal delta = computeLateFeeDelta(policy, d);
            if (delta.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            d.setLateFeeAmount(delta);
            BigDecimal baseNet = d.getPrincipalAmount().subtract(d.getDiscountAmount()).add(delta);
            if (baseNet.compareTo(BigDecimal.ZERO) < 0) {
                baseNet = BigDecimal.ZERO;
            }
            baseNet = baseNet.setScale(2, RoundingMode.HALF_UP);
            d.setNetAmount(baseNet);
            d.setOutstandingAmount(d.getOutstandingAmount().add(delta).setScale(2, RoundingMode.HALF_UP));
            if (d.getOutstandingAmount().compareTo(BigDecimal.ZERO) > 0 && !asOf.isBefore(d.getDueDate())) {
                d.setDemandStatus(DemandStatus.OVERDUE);
            }
            feeDemandRepository.save(d);
            appendLedgerEntry(
                    d.getStudentId(),
                    LedgerEntryType.DEBIT,
                    LedgerSourceType.ADJUSTMENT,
                    d.getId(),
                    FeeLedgerEventTaxonomy.LATE_FEE_POSTED,
                    delta,
                    "Late fee applied");
            updated++;
        }
        FeeLateFeeRunV2 run = new FeeLateFeeRunV2();
        run.setTenantId(tenantId);
        run.setAcademicYearId(yearId);
        run.setFeeLateFeePolicyId(policy.getId());
        run.setAsOfDate(asOf);
        run.setIdempotencyKey(idem);
        run.setRunMetadataJson(request.getRunMetadataJson());
        run.setDemandsUpdated(updated);
        run.setStatus(LateFeeRunStatus.COMPLETED);
        run.setStartedAt(startedAt);
        run.setFinishedAt(LocalDateTime.now());
        feeLateFeeRunRepository.save(run);
        Map<String, Object> auditDetail = new LinkedHashMap<>();
        auditDetail.put("policyId", policy.getId());
        auditDetail.put("asOfDate", asOf.toString());
        auditDetail.put("demandsUpdated", updated);
        writeAudit("LATE_FEE_RUN_COMPLETED", "fee_late_fee_run_v2", run.getId(), auditDetail);
        return toLateFeeRunResponse(run);
    }

    @Transactional(readOnly = true)
    public FeeV2DTOs.FeeAssignmentPreviewResponse previewFeeAssignments(FeeV2DTOs.FeeAssignmentPreviewRequest request) {
        return buildFeeAssignmentPreview(request);
    }

    @Transactional
    public FeeV2DTOs.FeeAssignmentExecuteResponse executeFeeAssignments(FeeV2DTOs.FeeAssignmentExecuteRequest request) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        String idem = request.getIdempotencyKey().trim();
        Optional<FeeAssignmentRunV2> replay = feeAssignmentRunRepository.findByTenantIdAndAcademicYearIdAndIdempotencyKeyAndIsDeletedFalse(
                tenantId, yearId, idem);
        if (replay.isPresent()) {
            return toFeeAssignmentExecuteResponse(replay.get());
        }
        FeeV2DTOs.FeeAssignmentPreviewRequest previewReq = new FeeV2DTOs.FeeAssignmentPreviewRequest();
        previewReq.setClassId(request.getClassId());
        previewReq.setSectionId(request.getSectionId());
        previewReq.setStudentIds(request.getStudentIds());
        previewReq.setRuleCodes(request.getRuleCodes());
        FeeV2DTOs.FeeAssignmentPreviewResponse preview = buildFeeAssignmentPreview(previewReq);
        boolean force = Boolean.TRUE.equals(request.getForceSnapshot());
        String assignmentSource = request.getAssignmentSource() != null && !request.getAssignmentSource().isBlank()
                ? request.getAssignmentSource().trim()
                : "RULE_ENGINE";
        int mapsApplied = 0;
        int skipped = 0;
        for (FeeV2DTOs.FeeAssignmentPreviewRow row : preview.getRows()) {
            if (!Boolean.TRUE.equals(row.getWouldChange()) && !force) {
                skipped++;
                continue;
            }
            if (row.getProposedFeeStructureId() == null) {
                skipped++;
                continue;
            }
            Student student = studentRepository
                    .findByIdAndTenantIdAndIsDeletedFalse(row.getStudentId(), tenantId)
                    .orElse(null);
            if (student == null || student.getClassId() == null) {
                skipped++;
                continue;
            }
            persistRuleAssignmentMap(
                    student,
                    row.getProposedFeeStructureId(),
                    row.getProposedFrozenVersionNo() != null ? row.getProposedFrozenVersionNo() : 1,
                    request.getValidFrom(),
                    request.getValidTo(),
                    assignmentSource);
            mapsApplied++;
        }
        FeeAssignmentRunV2 run = new FeeAssignmentRunV2();
        run.setTenantId(tenantId);
        run.setAcademicYearId(yearId);
        run.setIdempotencyKey(idem);
        run.setCohortClassId(request.getClassId());
        run.setCohortSectionId(request.getSectionId());
        try {
            if (request.getStudentIds() != null && !request.getStudentIds().isEmpty()) {
                run.setStudentIdsJson(objectMapper.writeValueAsString(request.getStudentIds()));
            }
        } catch (Exception ignored) {
            run.setStudentIdsJson(null);
        }
        run.setMapsApplied(mapsApplied);
        run.setStudentsSkipped(skipped);
        run.setRunMetadataJson(request.getRunMetadataJson());
        feeAssignmentRunRepository.save(run);
        Map<String, Object> audit = new LinkedHashMap<>();
        audit.put("mapsApplied", mapsApplied);
        audit.put("studentsSkipped", skipped);
        writeAudit("FEE_ASSIGNMENT_RUN_COMPLETED", "fee_assignment_run_v2", run.getId(), audit);
        return toFeeAssignmentExecuteResponse(run);
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.LedgerEntryResponse> getStudentLedger(Long studentId) {
        return studentLedgerRepository.findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByTxnTimeAscIdAsc(
                tenantId(), academicYearId(), studentId).stream().map(this::toLedgerResponse).toList();
    }

    @Transactional(readOnly = true)
    public FeeV2DTOs.CollectionSummaryResponse getCollectionSummary(LocalDate from, LocalDate to) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        LocalDateTime fromTs = from != null ? from.atStartOfDay() : null;
        LocalDateTime toTs = to != null ? LocalDateTime.of(to, LocalTime.of(23, 59, 59, 999_000_000)) : null;
        BigDecimal total = paymentRepository.sumSuccessfulAmountInRange(tenantId, yearId, PaymentStatus.SUCCESS, fromTs, toTs);
        if (total == null) {
            total = BigDecimal.ZERO;
        }
        long cnt = paymentRepository.countSuccessfulInRange(tenantId, yearId, PaymentStatus.SUCCESS, fromTs, toTs);
        List<FeeV2DTOs.PaymentModeBreakdownResponse> breakdown = paymentRepository
                .totalsByPaymentMode(tenantId, yearId, PaymentStatus.SUCCESS, fromTs, toTs)
                .stream()
                .map(this::toPaymentModeBreakdown)
                .toList();
        FeeV2DTOs.CollectionSummaryResponse response = new FeeV2DTOs.CollectionSummaryResponse();
        response.setTotalCollected(total);
        response.setPaymentCount(cnt);
        response.setFromDate(from);
        response.setToDate(to);
        response.setByPaymentMode(breakdown);
        return response;
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.DefaulterRowResponse> getDefaulters() {
        return feeDemandRepository.summarizeDefaulters(tenantId(), academicYearId()).stream()
                .map(this::toDefaulterRow)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.ClassOutstandingResponse> getOutstandingByClass() {
        return feeDemandRepository.summarizeOutstandingByClass(tenantId(), academicYearId()).stream()
                .map(this::toClassOutstanding)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.PaymentRegisterRowResponse> listPaymentRegister(Long studentId, LocalDate from, LocalDate to) {
        LocalDateTime fromTs = from != null ? from.atStartOfDay() : null;
        LocalDateTime toTs = to != null ? LocalDateTime.of(to, LocalTime.of(23, 59, 59, 999_000_000)) : null;
        return paymentRepository
                .searchPaymentRegister(tenantId(), academicYearId(), studentId, fromTs, toTs)
                .stream()
                .limit(PAYMENT_REGISTER_MAX_ROWS)
                .map(this::toPaymentRegisterRow)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FeeV2DTOs.AuditEventResponse> listRecentAuditEvents() {
        return feeV2AuditEventRepository
                .findTop200ByTenantIdAndAcademicYearIdOrderByCreatedAtDesc(tenantId(), academicYearId())
                .stream()
                .map(this::toAuditEventResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FeeV2DTOs.StudentStatementResponse getStudentStatement(Long studentId) {
        List<FeeV2DTOs.LedgerEntryResponse> ledger = getStudentLedger(studentId);
        BigDecimal balance = ledger.isEmpty()
                ? BigDecimal.ZERO
                : ledger.get(ledger.size() - 1).getRunningBalance();
        List<FeeV2DTOs.DemandResponse> open = getStudentDemands(studentId).stream()
                .filter(d -> d.getOutstandingAmount().compareTo(BigDecimal.ZERO) > 0)
                .toList();
        int tail = Math.min(50, ledger.size());
        List<FeeV2DTOs.LedgerEntryResponse> recent = ledger.subList(ledger.size() - tail, ledger.size());
        FeeV2DTOs.StudentStatementResponse response = new FeeV2DTOs.StudentStatementResponse();
        response.setStudentId(studentId);
        response.setRunningBalance(balance);
        response.setOpenDemands(open);
        response.setRecentLedger(recent);
        return response;
    }

    @Transactional
    public FeeV2DTOs.RecordRefundResponse recordRefund(FeeV2DTOs.RecordRefundRequest request) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        String idem = request.getIdempotencyKey().trim();
        Optional<FeeRefundV2> existing = feeRefundRepository.findByTenantIdAndAcademicYearIdAndIdempotencyKeyAndIsDeletedFalse(
                tenantId, yearId, idem);
        if (existing.isPresent()) {
            return toRecordRefundResponse(existing.get());
        }
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Refund amount must be positive");
        }
        boolean forApproval = Boolean.TRUE.equals(request.getSubmitForApproval());
        FeeRefundV2 refund = new FeeRefundV2();
        refund.setTenantId(tenantId);
        refund.setAcademicYearId(yearId);
        refund.setStudentId(request.getStudentId());
        refund.setRefundNo("FR2-" + UUID.randomUUID().toString().replace("-", "").substring(0, 18).toUpperCase());
        refund.setAmount(request.getAmount());
        refund.setRefundStatus(forApproval ? RefundStatus.PENDING : RefundStatus.SUCCESS);
        refund.setApprovalStatus(forApproval ? "PENDING" : "APPROVED");
        refund.setIdempotencyKey(idem);
        refund.setReason(request.getReason());
        refund.setRelatedPaymentId(request.getRelatedPaymentId());
        feeRefundRepository.save(refund);
        if (!forApproval) {
            appendLedgerEntry(
                    request.getStudentId(),
                    LedgerEntryType.DEBIT,
                    LedgerSourceType.REFUND,
                    refund.getId(),
                    FeeLedgerEventTaxonomy.REFUND_POSTED,
                    request.getAmount(),
                    "Refund recorded");
            Map<String, Object> refAudit = new LinkedHashMap<>();
            refAudit.put("studentId", request.getStudentId());
            refAudit.put("amount", request.getAmount());
            writeAudit("REFUND_RECORDED", "fee_refund_v2", refund.getId(), refAudit);
        } else {
            Map<String, Object> refAudit = new LinkedHashMap<>();
            refAudit.put("studentId", request.getStudentId());
            refAudit.put("amount", request.getAmount());
            writeAudit("REFUND_REQUESTED", "fee_refund_v2", refund.getId(), refAudit);
        }
        return toRecordRefundResponse(refund);
    }

    @Transactional
    public FeeV2DTOs.RecordRefundResponse approvePendingRefund(Long refundId) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        FeeRefundV2 refund = feeRefundRepository
                .findById(refundId)
                .filter(r -> tenantId.equals(r.getTenantId()) && yearId.equals(r.getAcademicYearId()) && !Boolean.TRUE.equals(r.getIsDeleted()))
                .orElseThrow(() -> new BusinessException("Refund not found"));
        if (!"PENDING".equalsIgnoreCase(refund.getApprovalStatus())) {
            throw new BusinessException("Refund is not pending approval");
        }
        refund.setApprovalStatus("APPROVED");
        refund.setRefundStatus(RefundStatus.SUCCESS);
        feeRefundRepository.save(refund);
        appendLedgerEntry(
                refund.getStudentId(),
                LedgerEntryType.DEBIT,
                LedgerSourceType.REFUND,
                refund.getId(),
                FeeLedgerEventTaxonomy.REFUND_POSTED,
                refund.getAmount(),
                "Refund approved");
        Map<String, Object> refAudit = new LinkedHashMap<>();
        refAudit.put("studentId", refund.getStudentId());
        refAudit.put("amount", refund.getAmount());
        writeAudit("REFUND_APPROVED", "fee_refund_v2", refund.getId(), refAudit);
        return toRecordRefundResponse(refund);
    }

    @Transactional(readOnly = true)
    public FeeV2DTOs.LedgerReconciliationReportResponse getLedgerReconciliationReport() {
        List<Object[]> raw = feeDemandRepository.findStudentLedgerDemandMismatches(tenantId(), academicYearId());
        List<FeeV2DTOs.LedgerReconciliationRowResponse> rows = new ArrayList<>();
        for (Object[] row : raw) {
            Long sid = ((Number) row[0]).longValue();
            BigDecimal demandTotal = coalesceDecimal(row[1]);
            BigDecimal ledgerBal = coalesceDecimal(row[2]);
            FeeV2DTOs.LedgerReconciliationRowResponse r = new FeeV2DTOs.LedgerReconciliationRowResponse();
            r.setStudentId(sid);
            r.setDemandOutstandingTotal(demandTotal);
            r.setLedgerRunningBalance(ledgerBal);
            r.setDelta(demandTotal.subtract(ledgerBal));
            rows.add(r);
        }
        FeeV2DTOs.LedgerReconciliationReportResponse rep = new FeeV2DTOs.LedgerReconciliationReportResponse();
        rep.setMismatches(rows);
        rep.setMismatchCount(rows.size());
        return rep;
    }

    @Transactional(readOnly = true)
    public FeeV2DTOs.FeesV2RazorpayOrderResponse createFeesV2RazorpayOrder(FeeV2DTOs.FeesV2RazorpayOrderRequest request) {
        var session = razorpayPaymentGatewayClient.createFeesV2Order(
                tenantId(), academicYearId(), request.getStudentId(), request.getAmount());
        FeeV2DTOs.FeesV2RazorpayOrderResponse r = new FeeV2DTOs.FeesV2RazorpayOrderResponse();
        r.setOrderId(session.getProviderOrderId());
        r.setKeyId(razorpayPaymentGatewayClient.getPublishableKey());
        r.setAmount(request.getAmount());
        r.setCurrency("INR");
        return r;
    }

    @Transactional
    public void recordPaymentFromRazorpayWebhook(Long studentId, BigDecimal amountInr, String razorpayPaymentId, String razorpayOrderId) {
        String idem = ("RZP:" + razorpayPaymentId).trim();
        if (idem.length() > 120) {
            idem = idem.substring(0, 120);
        }
        FeeV2DTOs.RecordPaymentRequest req = new FeeV2DTOs.RecordPaymentRequest();
        req.setStudentId(studentId);
        req.setAmount(amountInr);
        req.setChannelType(PaymentChannelType.ONLINE);
        req.setPaymentMode(PaymentMode.UPI);
        req.setIdempotencyKey(idem);
        req.setExternalRefId(razorpayOrderId);
        req.setInstrumentRef(razorpayPaymentId);
        recordPayment(req);
    }

    @Transactional
    public FeeV2DTOs.RecordPaymentResponse recordPayment(FeeV2DTOs.RecordPaymentRequest request) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        String idem = request.getIdempotencyKey().trim();
        Optional<PaymentV2> existingPayment = paymentRepository.findByTenantIdAndAcademicYearIdAndIdempotencyKeyAndIsDeletedFalse(
                tenantId, yearId, idem);
        if (existingPayment.isPresent()) {
            PaymentV2 payment = existingPayment.get();
            List<FeeV2DTOs.PaymentAllocationResponse> allocationResponses = paymentAllocationRepository
                    .findByTenantIdAndAcademicYearIdAndPaymentIdAndIsDeletedFalseOrderByAllocationOrderAsc(tenantId, yearId, payment.getId())
                    .stream()
                    .map(this::toPaymentAllocationResponse)
                    .toList();
            FeeV2DTOs.RecordPaymentResponse replay = new FeeV2DTOs.RecordPaymentResponse();
            replay.setPaymentId(payment.getId());
            replay.setPaymentNo(payment.getPaymentNo());
            replay.setReceiptNo(payment.getReceiptNo());
            replay.setPaymentStatus(payment.getPaymentStatus());
            replay.setAmount(payment.getAmount());
            replay.setAllocations(allocationResponses);
            return replay;
        }

        PaymentV2 payment = new PaymentV2();
        payment.setTenantId(tenantId);
        payment.setAcademicYearId(yearId);
        payment.setStudentId(request.getStudentId());
        payment.setPaymentNo("FP2-" + UUID.randomUUID().toString().replace("-", "").substring(0, 18).toUpperCase());
        payment.setChannelType(request.getChannelType());
        payment.setPaymentMode(request.getPaymentMode());
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setAmount(request.getAmount());
        payment.setExternalRefId(request.getExternalRefId());
        payment.setInstrumentRef(request.getInstrumentRef());
        payment.setReceiptNo(allocateNextReceiptNo());
        payment.setPaymentDate(LocalDateTime.now());
        payment.setIdempotencyKey(idem);
        payment = paymentRepository.save(payment);

        List<FeeDemandV2> outstanding = feeDemandRepository
                .findByTenantIdAndAcademicYearIdAndStudentIdAndOutstandingAmountGreaterThanAndIsDeletedFalseOrderByDueDateAscIdAsc(
                        tenantId, yearId, payment.getStudentId(), BigDecimal.ZERO);
        BigDecimal remaining = payment.getAmount();
        int allocationOrder = 1;
        List<FeeV2DTOs.PaymentAllocationResponse> allocationResponses = new ArrayList<>();

        for (FeeDemandV2 demand : outstanding) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            BigDecimal allocated = demand.getOutstandingAmount().min(remaining);
            if (allocated.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            demand.setOutstandingAmount(demand.getOutstandingAmount().subtract(allocated));
            demand.setDemandStatus(demand.getOutstandingAmount().compareTo(BigDecimal.ZERO) == 0 ? DemandStatus.PAID : DemandStatus.PARTIAL);
            feeDemandRepository.save(demand);

            PaymentAllocationV2 allocation = new PaymentAllocationV2();
            allocation.setTenantId(tenantId);
            allocation.setAcademicYearId(yearId);
            allocation.setPaymentId(payment.getId());
            allocation.setFeeDemandId(demand.getId());
            allocation.setAllocationType(AllocationType.DEMAND);
            allocation.setAmountAllocated(allocated);
            allocation.setAllocationOrder(allocationOrder++);
            paymentAllocationRepository.save(allocation);

            allocationResponses.add(toPaymentAllocationResponse(allocation));
            remaining = remaining.subtract(allocated);
        }

        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            PaymentAllocationV2 advance = new PaymentAllocationV2();
            advance.setTenantId(tenantId);
            advance.setAcademicYearId(yearId);
            advance.setPaymentId(payment.getId());
            advance.setFeeDemandId(null);
            advance.setAllocationType(AllocationType.ADVANCE);
            advance.setAmountAllocated(remaining);
            advance.setAllocationOrder(allocationOrder);
            paymentAllocationRepository.save(advance);
            allocationResponses.add(toPaymentAllocationResponse(advance));
        }

        appendLedgerEntry(payment.getStudentId(), LedgerEntryType.CREDIT, LedgerSourceType.PAYMENT, payment.getId(),
                FeeLedgerEventTaxonomy.PAYMENT_RECEIVED, payment.getAmount(), "Payment recorded");

        Map<String, Object> payAudit = new LinkedHashMap<>();
        payAudit.put("studentId", payment.getStudentId());
        payAudit.put("amount", payment.getAmount());
        writeAudit("PAYMENT_RECORDED", "payment", payment.getId(), payAudit);

        FeeV2DTOs.RecordPaymentResponse response = new FeeV2DTOs.RecordPaymentResponse();
        response.setPaymentId(payment.getId());
        response.setPaymentNo(payment.getPaymentNo());
        response.setReceiptNo(payment.getReceiptNo());
        response.setPaymentStatus(payment.getPaymentStatus());
        response.setAmount(payment.getAmount());
        response.setAllocations(allocationResponses);
        return response;
    }

    @Transactional(readOnly = true)
    public boolean hasRecordedFeesV2RazorpayPayment(String tenantId, Long academicYearId, String razorpayPaymentId) {
        if (tenantId == null || tenantId.isBlank() || academicYearId == null || razorpayPaymentId == null || razorpayPaymentId.isBlank()) {
            return false;
        }
        String idem = ("RZP:" + razorpayPaymentId.trim());
        if (idem.length() > 120) {
            idem = idem.substring(0, 120);
        }
        return paymentRepository.findByTenantIdAndAcademicYearIdAndIdempotencyKeyAndIsDeletedFalse(tenantId, academicYearId, idem).isPresent();
    }

    private void generateFeeDemandsForRun(FeeDemandRunV2 run, String periodKey) {
        YearMonth ym = YearMonth.parse(periodKey);
        LocalDate periodStart = ym.atDay(1);
        LocalDate dueDate = ym.atEndOfMonth();
        String tenantId = tenantId();
        Long yearId = academicYearId();
        List<StudentFeeStructureMapV2> maps = studentFeeStructureMapRepository
                .findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByStudentIdAscAssignedAtDesc(tenantId, yearId);
        for (StudentFeeStructureMapV2 map : maps) {
            if (map.getValidFrom().isAfter(dueDate)) {
                continue;
            }
            if (map.getValidTo() != null && map.getValidTo().isBefore(periodStart)) {
                continue;
            }
            List<FeeStructureComponentV2> lines = structureComponentRepository.findByTenantIdAndAcademicYearIdAndFeeStructureIdAndIsDeletedFalse(
                    tenantId, yearId, map.getFeeStructureId());
            for (FeeStructureComponentV2 line : lines) {
                if (feeDemandRepository.existsByTenantIdAndAcademicYearIdAndStudentIdAndFeeComponentMasterIdAndPeriodKeyAndIsDeletedFalse(
                        tenantId, yearId, map.getStudentId(), line.getFeeComponentMasterId(), periodKey)) {
                    continue;
                }
                BigDecimal principal = line.getAmount();
                BigDecimal discountAmt = computeDiscountAmount(
                        map.getStudentId(), line.getFeeComponentMasterId(), principal, periodStart, dueDate);
                BigDecimal net = principal.subtract(discountAmt);
                if (net.compareTo(BigDecimal.ZERO) < 0) {
                    net = BigDecimal.ZERO;
                }
                FeeDemandV2 demand = new FeeDemandV2();
                demand.setTenantId(tenantId);
                demand.setAcademicYearId(yearId);
                demand.setStudentId(map.getStudentId());
                demand.setClassId(map.getClassId());
                demand.setFeeComponentMasterId(line.getFeeComponentMasterId());
                demand.setFeeStructureId(map.getFeeStructureId());
                demand.setDemandRunId(run.getId());
                demand.setPeriodKey(periodKey);
                demand.setDueDate(dueDate);
                demand.setPrincipalAmount(principal);
                demand.setDiscountAmount(discountAmt);
                demand.setLateFeeAmount(BigDecimal.ZERO);
                demand.setNetAmount(net);
                demand.setOutstandingAmount(net);
                demand.setDemandStatus(DemandStatus.PENDING);
                feeDemandRepository.save(demand);
                appendLedgerEntry(map.getStudentId(), LedgerEntryType.DEBIT, LedgerSourceType.FEE_DEMAND, demand.getId(),
                        FeeLedgerEventTaxonomy.DEMAND_POSTED, net, "Fee demand posted");
            }
        }
    }

    private BigDecimal computeDiscountAmount(Long studentId, Long componentMasterId, BigDecimal principal,
            LocalDate periodStart, LocalDate dueDate) {
        List<StudentDiscountV2> discounts = studentDiscountRepository
                .findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByValidFromDesc(
                        tenantId(), academicYearId(), studentId);
        BigDecimal total = BigDecimal.ZERO;
        for (StudentDiscountV2 d : discounts) {
            if (!"APPROVED".equalsIgnoreCase(d.getApprovalStatus())) {
                continue;
            }
            if (d.getValidFrom().isAfter(dueDate)) {
                continue;
            }
            if (d.getValidTo() != null && d.getValidTo().isBefore(periodStart)) {
                continue;
            }
            if (!discountAppliesToComponent(d, componentMasterId)) {
                continue;
            }
            BigDecimal room = principal.subtract(total);
            if (room.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            BigDecimal slice;
            if (d.getDiscountType() == DiscountType.FLAT) {
                slice = d.getDiscountValue().min(room);
            } else {
                slice = principal.multiply(d.getDiscountValue()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP).min(room);
            }
            total = total.add(slice);
        }
        return total.min(principal);
    }

    private boolean discountAppliesToComponent(StudentDiscountV2 d, Long componentMasterId) {
        String scope = d.getComponentScope();
        if (scope == null || scope.isBlank() || "ALL".equalsIgnoreCase(scope)) {
            return true;
        }
        if ("SELECTED".equalsIgnoreCase(scope) || "COMPONENT_LIST".equalsIgnoreCase(scope)) {
            String json = d.getApplicableComponentIdsJson();
            if (json == null || json.isBlank()) {
                return false;
            }
            try {
                for (var n : objectMapper.readTree(json)) {
                    if (n.isIntegralNumber() && n.longValue() == componentMasterId) {
                        return true;
                    }
                }
            } catch (Exception ignored) {
                return false;
            }
            return false;
        }
        return true;
    }

    private void validateLateFeePolicyConfig(FeeLateFeePolicyV2 policy) {
        if (policy.getGraceDays() == null || policy.getGraceDays() < 0) {
            throw new BusinessException("graceDays must be zero or positive");
        }
        if (policy.getCalculationMode() == LateFeeCalculationMode.FLAT) {
            if (policy.getFlatAmount() == null || policy.getFlatAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("FLAT mode requires flatAmount > 0");
            }
        } else if (policy.getCalculationMode() == LateFeeCalculationMode.PERCENT_OF_PRINCIPAL) {
            if (policy.getRatePercent() == null || policy.getRatePercent().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("PERCENT_OF_PRINCIPAL requires ratePercent > 0");
            }
        } else {
            throw new BusinessException("Unsupported late fee calculation mode");
        }
        if (policy.getMaxLateAmount() != null && policy.getMaxLateAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("maxLateAmount cannot be negative");
        }
    }

    private BigDecimal computeLateFeeDelta(FeeLateFeePolicyV2 policy, FeeDemandV2 d) {
        if (policy.getCalculationMode() == LateFeeCalculationMode.FLAT) {
            BigDecimal flat = policy.getFlatAmount();
            if (flat == null || flat.compareTo(BigDecimal.ZERO) <= 0) {
                return BigDecimal.ZERO;
            }
            return applyLateFeeCap(flat, policy.getMaxLateAmount());
        }
        BigDecimal rate = policy.getRatePercent();
        if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal raw = d.getPrincipalAmount()
                .multiply(rate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        return applyLateFeeCap(raw, policy.getMaxLateAmount());
    }

    private BigDecimal applyLateFeeCap(BigDecimal value, BigDecimal maxLate) {
        BigDecimal v = value.setScale(2, RoundingMode.HALF_UP);
        if (maxLate != null && maxLate.compareTo(BigDecimal.ZERO) > 0) {
            v = v.min(maxLate.setScale(2, RoundingMode.HALF_UP));
        }
        return v;
    }

    private void writeAudit(String actionCode, String entityType, Long entityId, Map<String, Object> detail) {
        try {
            FeeV2AuditEvent row = new FeeV2AuditEvent();
            row.setTenantId(tenantId());
            row.setAcademicYearId(academicYearId());
            row.setActorUserId(TenantContext.getUserId());
            row.setActionCode(actionCode);
            row.setEntityType(entityType);
            row.setEntityId(entityId);
            if (detail != null && !detail.isEmpty()) {
                row.setDetailJson(objectMapper.writeValueAsString(detail));
            }
            feeV2AuditEventRepository.save(row);
        } catch (Exception ignored) {
            // Audit failure must not roll back financial transactions.
        }
    }

    private String buildStructureSnapshotJson(Long feeStructureId) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        structureRepository.findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(feeStructureId, tenantId, yearId)
                .orElseThrow(() -> new BusinessException("Fee structure not found"));
        List<FeeStructureComponentV2> lines = structureComponentRepository.findByTenantIdAndAcademicYearIdAndFeeStructureIdAndIsDeletedFalse(
                tenantId, yearId, feeStructureId);
        try {
            Map<String, Object> root = new LinkedHashMap<>();
            root.put("feeStructureId", feeStructureId);
            root.put("lines", lines.stream().map(line -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("feeComponentMasterId", line.getFeeComponentMasterId());
                m.put("amount", line.getAmount());
                m.put("frequencyOverride", line.getFrequencyOverride() != null ? line.getFrequencyOverride().name() : null);
                m.put("optionalOverride", line.getOptionalOverride());
                return m;
            }).toList());
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new BusinessException("Could not build snapshot JSON");
        }
    }

    private void appendLedgerEntry(Long studentId, LedgerEntryType entryType, LedgerSourceType sourceType,
                                   Long sourceRefId, String sourceRefCode, BigDecimal amount, String narrative) {
        if (!FeeLedgerEventTaxonomy.ALL.contains(sourceRefCode)) {
            throw new BusinessException("Unknown ledger source event: " + sourceRefCode);
        }
        BigDecimal currentBalance = studentLedgerRepository
                .findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByTxnTimeAscIdAsc(tenantId(), academicYearId(), studentId)
                .stream()
                .reduce((a, b) -> b)
                .map(StudentLedgerEntryV2::getRunningBalance)
                .orElse(BigDecimal.ZERO);
        BigDecimal signedAmount = entryType == LedgerEntryType.DEBIT ? amount : amount.negate();
        BigDecimal newBalance = currentBalance.add(signedAmount);

        StudentLedgerEntryV2 entry = new StudentLedgerEntryV2();
        entry.setTenantId(tenantId());
        entry.setAcademicYearId(academicYearId());
        entry.setStudentId(studentId);
        entry.setEntryType(entryType);
        entry.setSourceType(sourceType);
        entry.setSourceRefId(sourceRefId);
        entry.setSourceRefCode(sourceRefCode);
        entry.setAmount(amount);
        entry.setSignedAmount(signedAmount);
        entry.setRunningBalance(newBalance);
        entry.setTxnTime(LocalDateTime.now());
        entry.setNarrative(narrative);
        studentLedgerRepository.save(entry);
    }

    private String tenantId() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new BusinessException("Missing tenant context");
        }
        return tenantId;
    }

    private Long academicYearId() {
        Long academicYearId = AcademicYearContext.getAcademicYearId();
        if (academicYearId == null) {
            throw new BusinessException("Missing academic year context");
        }
        return academicYearId;
    }

    private FeeV2DTOs.FeeAssignmentPreviewResponse buildFeeAssignmentPreview(FeeV2DTOs.FeeAssignmentPreviewRequest request) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        List<Student> students = resolveCohortStudents(request);
        if (students.isEmpty()) {
            throw new BusinessException("No active students matched the cohort");
        }
        Set<String> ruleFilter = normalizeRuleCodes(request.getRuleCodes());
        List<FeeRuleV2> rules = loadAssignmentRules(ruleFilter);
        Map<Long, List<FeeRuleConditionV2>> condByRule = new LinkedHashMap<>();
        Map<Long, List<FeeRuleActionV2>> actByRule = new LinkedHashMap<>();
        for (FeeRuleV2 r : rules) {
            condByRule.put(
                    r.getId(),
                    feeRuleConditionRepository.findByTenantIdAndAcademicYearIdAndFeeRuleIdAndIsDeletedFalseOrderByConditionOrderAsc(
                            tenantId, yearId, r.getId()));
            actByRule.put(
                    r.getId(),
                    feeRuleActionRepository.findByTenantIdAndAcademicYearIdAndFeeRuleIdAndIsDeletedFalseOrderByActionOrderAsc(
                            tenantId, yearId, r.getId()));
        }
        List<FeeV2DTOs.FeeAssignmentPreviewRow> rows = new ArrayList<>();
        int wouldChange = 0;
        int noMatch = 0;
        for (Student s : students) {
            FeeV2DTOs.FeeAssignmentPreviewRow row = new FeeV2DTOs.FeeAssignmentPreviewRow();
            row.setStudentId(s.getId());
            row.setClassId(s.getClassId());
            row.setSectionId(s.getSectionId());
            row.setAdmissionNumber(s.getAdmissionNumber());
            studentFeeStructureMapRepository
                    .findFirstByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByAssignedAtDesc(tenantId, yearId, s.getId())
                    .ifPresent(cur -> {
                        row.setCurrentFeeStructureId(cur.getFeeStructureId());
                        row.setCurrentFrozenVersionNo(cur.getFrozenVersionNo());
                    });
            AssignmentProposal proposal = evaluateFirstMatchingRule(s, rules, condByRule, actByRule, tenantId, yearId);
            if (proposal == null) {
                row.setWouldChange(false);
                row.setSkipReason("NO_RULE_MATCH");
                noMatch++;
                rows.add(row);
                continue;
            }
            row.setProposedFeeStructureId(proposal.feeStructureId());
            row.setProposedFrozenVersionNo(proposal.frozenVersionNo());
            row.setMatchedRuleCode(proposal.matchedRuleCode());
            boolean change = row.getCurrentFeeStructureId() == null
                    || !row.getCurrentFeeStructureId().equals(proposal.feeStructureId())
                    || row.getCurrentFrozenVersionNo() == null
                    || !row.getCurrentFrozenVersionNo().equals(proposal.frozenVersionNo());
            row.setWouldChange(change);
            if (change) {
                wouldChange++;
            }
            rows.add(row);
        }
        FeeV2DTOs.FeeAssignmentPreviewResponse resp = new FeeV2DTOs.FeeAssignmentPreviewResponse();
        resp.setRows(rows);
        resp.setWouldChangeCount(wouldChange);
        resp.setNoMatchCount(noMatch);
        return resp;
    }

    private Set<String> normalizeRuleCodes(List<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return null;
        }
        Set<String> s = new HashSet<>();
        for (String c : codes) {
            if (c != null && !c.isBlank()) {
                s.add(c.trim());
            }
        }
        return s.isEmpty() ? null : s;
    }

    private List<FeeRuleV2> loadAssignmentRules(Set<String> ruleCodesFilter) {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        return feeRuleRepository.findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByPriorityNoAscIdAsc(tenantId, yearId).stream()
                .filter(r -> r.getRuleType() == RuleType.ASSIGNMENT)
                .filter(r -> r.getRuleStatus() != null && "ACTIVE".equalsIgnoreCase(r.getRuleStatus().trim()))
                .filter(r -> ruleCodesFilter == null || ruleCodesFilter.contains(r.getRuleCode()))
                .toList();
    }

    private List<Student> resolveCohortStudents(FeeV2DTOs.FeeAssignmentPreviewRequest request) {
        String tid = tenantId();
        if (request.getStudentIds() != null && !request.getStudentIds().isEmpty()) {
            List<Student> out = new ArrayList<>();
            for (Long sid : request.getStudentIds()) {
                studentRepository.findByIdAndTenantIdAndIsDeletedFalse(sid, tid).ifPresent(out::add);
            }
            return out.stream().filter(s -> s.getStatus() == Enums.StudentStatus.ACTIVE).toList();
        }
        Long classId = request.getClassId();
        if (classId == null) {
            throw new BusinessException("Provide classId (and optional sectionId) or an explicit studentIds list");
        }
        Long sectionId = request.getSectionId();
        List<Student> raw = sectionId != null
                ? studentRepository.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tid, classId, sectionId)
                : studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tid, classId);
        return raw.stream().filter(s -> s.getStatus() == Enums.StudentStatus.ACTIVE).toList();
    }

    private AssignmentProposal evaluateFirstMatchingRule(
            Student s,
            List<FeeRuleV2> rules,
            Map<Long, List<FeeRuleConditionV2>> condByRule,
            Map<Long, List<FeeRuleActionV2>> actByRule,
            String tenantId,
            Long yearId) {
        for (FeeRuleV2 rule : rules) {
            List<FeeRuleConditionV2> conds = condByRule.getOrDefault(rule.getId(), List.of());
            if (!conditionsMatch(s, conds)) {
                continue;
            }
            List<FeeRuleActionV2> acts = actByRule.getOrDefault(rule.getId(), List.of());
            for (FeeRuleActionV2 a : acts) {
                if (a.getActionType() == null || !"ASSIGN_STRUCTURE".equalsIgnoreCase(a.getActionType().trim())) {
                    continue;
                }
                Long structId = parseFeeStructureIdFromAction(a);
                if (structId == null) {
                    continue;
                }
                Optional<FeeStructureV2> fsOpt =
                        structureRepository.findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(structId, tenantId, yearId);
                if (fsOpt.isEmpty()) {
                    continue;
                }
                FeeStructureV2 fs = fsOpt.get();
                int frozen = a.getValueNumber() != null ? a.getValueNumber().intValue() : fs.getVersionNo();
                return new AssignmentProposal(structId, frozen, rule.getRuleCode());
            }
        }
        return null;
    }

    private boolean conditionsMatch(Student s, List<FeeRuleConditionV2> conds) {
        if (conds == null || conds.isEmpty()) {
            return true;
        }
        boolean first = true;
        boolean acc = true;
        for (FeeRuleConditionV2 c : conds) {
            boolean clause = evalCondition(s, c);
            String join = c.getLogicalJoin() != null ? c.getLogicalJoin().trim().toUpperCase() : "AND";
            if (first) {
                acc = clause;
                first = false;
            } else if ("OR".equals(join)) {
                acc = acc || clause;
            } else {
                acc = acc && clause;
            }
        }
        return acc;
    }

    private boolean evalCondition(Student s, FeeRuleConditionV2 c) {
        String field = c.getFieldName() != null ? c.getFieldName().trim() : "";
        String op = c.getOperator() != null ? c.getOperator().trim().toUpperCase() : "EQ";
        Long ctxVal =
                switch (field) {
                    case "classId" -> s.getClassId();
                    case "sectionId" -> s.getSectionId();
                    case "studentId" -> s.getId();
                    default -> null;
                };
        if ("IN".equals(op)) {
            if (ctxVal == null || c.getValueJson() == null || c.getValueJson().isBlank()) {
                return false;
            }
            try {
                JsonNode arr = objectMapper.readTree(c.getValueJson());
                if (!arr.isArray()) {
                    return false;
                }
                for (JsonNode n : arr) {
                    if (n.isIntegralNumber() && Objects.equals(ctxVal, n.longValue())) {
                        return true;
                    }
                }
                return false;
            } catch (Exception e) {
                return false;
            }
        }
        Long expected = null;
        if (c.getValueNumber() != null) {
            expected = c.getValueNumber().longValue();
        } else if (c.getValueText() != null && !c.getValueText().isBlank()) {
            try {
                expected = Long.parseLong(c.getValueText().trim());
            } catch (NumberFormatException e) {
                return false;
            }
        }
        return switch (op) {
            case "EQ", "==" -> Objects.equals(ctxVal, expected);
            case "NE", "!=" -> !Objects.equals(ctxVal, expected);
            default -> Objects.equals(ctxVal, expected);
        };
    }

    private Long parseFeeStructureIdFromAction(FeeRuleActionV2 a) {
        if (a.getValueText() != null && !a.getValueText().isBlank()) {
            try {
                return Long.parseLong(a.getValueText().trim());
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        if (a.getValueJson() != null && !a.getValueJson().isBlank()) {
            try {
                JsonNode n = objectMapper.readTree(a.getValueJson()).get("feeStructureId");
                if (n != null && n.isIntegralNumber()) {
                    return n.longValue();
                }
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    private void persistRuleAssignmentMap(
            Student student, Long feeStructureId, int frozenVersionNo, LocalDate validFrom, LocalDate validTo, String assignmentSource) {
        String src = assignmentSource.length() > 30 ? assignmentSource.substring(0, 30) : assignmentSource;
        String snapshotJson = buildStructureSnapshotJson(feeStructureId);
        StudentFeeStructureMapV2 map = new StudentFeeStructureMapV2();
        map.setTenantId(tenantId());
        map.setAcademicYearId(academicYearId());
        map.setStudentId(student.getId());
        map.setClassId(student.getClassId());
        map.setFeeStructureId(feeStructureId);
        map.setFrozenVersionNo(frozenVersionNo);
        map.setAssignmentSource(src);
        map.setAssignedAt(LocalDateTime.now());
        map.setValidFrom(validFrom);
        map.setValidTo(validTo);
        map.setSnapshotJson(snapshotJson);
        studentFeeStructureMapRepository.save(map);
    }

    private FeeV2DTOs.FeeAssignmentExecuteResponse toFeeAssignmentExecuteResponse(FeeAssignmentRunV2 run) {
        FeeV2DTOs.FeeAssignmentExecuteResponse r = new FeeV2DTOs.FeeAssignmentExecuteResponse();
        r.setRunId(run.getId());
        r.setMapsApplied(run.getMapsApplied());
        r.setStudentsSkipped(run.getStudentsSkipped());
        r.setIdempotencyKey(run.getIdempotencyKey());
        return r;
    }

    private record AssignmentProposal(Long feeStructureId, int frozenVersionNo, String matchedRuleCode) {}

    private FeeV2DTOs.ComponentResponse toComponentResponse(FeeComponentMasterV2 entity) {
        FeeV2DTOs.ComponentResponse response = new FeeV2DTOs.ComponentResponse();
        response.setId(entity.getId());
        response.setCode(entity.getCode());
        response.setName(entity.getName());
        response.setComponentType(entity.getComponentType());
        response.setFrequency(entity.getFrequency());
        response.setOptionalComponent(entity.getOptionalComponent());
        response.setRefundable(entity.getRefundable());
        return response;
    }

    private FeeV2DTOs.StructureResponse toStructureResponse(FeeStructureV2 structure, List<FeeStructureComponentV2> components) {
        FeeV2DTOs.StructureResponse response = new FeeV2DTOs.StructureResponse();
        response.setId(structure.getId());
        response.setClassId(structure.getClassId());
        response.setStructureName(structure.getStructureName());
        response.setVersionNo(structure.getVersionNo());
        response.setStatus(structure.getStatus());
        response.setComponents(components.stream().map(line -> {
            FeeV2DTOs.StructureComponentLine dto = new FeeV2DTOs.StructureComponentLine();
            dto.setFeeComponentMasterId(line.getFeeComponentMasterId());
            dto.setAmount(line.getAmount());
            dto.setFrequencyOverride(line.getFrequencyOverride());
            dto.setOptionalOverride(line.getOptionalOverride());
            return dto;
        }).toList());
        return response;
    }

    private FeeV2DTOs.StudentFeeMapResponse toStudentFeeMapResponse(StudentFeeStructureMapV2 entity) {
        FeeV2DTOs.StudentFeeMapResponse r = new FeeV2DTOs.StudentFeeMapResponse();
        r.setId(entity.getId());
        r.setStudentId(entity.getStudentId());
        r.setClassId(entity.getClassId());
        r.setFeeStructureId(entity.getFeeStructureId());
        r.setFrozenVersionNo(entity.getFrozenVersionNo());
        r.setAssignmentSource(entity.getAssignmentSource());
        r.setAssignedAt(entity.getAssignedAt() != null ? entity.getAssignedAt().toString() : null);
        r.setValidFrom(entity.getValidFrom());
        r.setValidTo(entity.getValidTo());
        return r;
    }

    private FeeV2DTOs.DemandResponse toDemandResponse(FeeDemandV2 entity) {
        FeeV2DTOs.DemandResponse r = new FeeV2DTOs.DemandResponse();
        r.setId(entity.getId());
        r.setStudentId(entity.getStudentId());
        r.setClassId(entity.getClassId());
        r.setFeeComponentMasterId(entity.getFeeComponentMasterId());
        r.setFeeStructureId(entity.getFeeStructureId());
        r.setDemandRunId(entity.getDemandRunId());
        r.setPeriodKey(entity.getPeriodKey());
        r.setDueDate(entity.getDueDate());
        r.setPrincipalAmount(entity.getPrincipalAmount());
        r.setDiscountAmount(entity.getDiscountAmount());
        r.setLateFeeAmount(entity.getLateFeeAmount());
        r.setNetAmount(entity.getNetAmount());
        r.setOutstandingAmount(entity.getOutstandingAmount());
        r.setDemandStatus(entity.getDemandStatus());
        return r;
    }

    private FeeV2DTOs.DiscountResponse toDiscountResponse(StudentDiscountV2 entity) {
        FeeV2DTOs.DiscountResponse r = new FeeV2DTOs.DiscountResponse();
        r.setId(entity.getId());
        r.setStudentId(entity.getStudentId());
        r.setDiscountType(entity.getDiscountType());
        r.setDiscountValue(entity.getDiscountValue());
        r.setComponentScope(entity.getComponentScope());
        r.setApplicableComponentIdsJson(entity.getApplicableComponentIdsJson());
        r.setValidFrom(entity.getValidFrom());
        r.setValidTo(entity.getValidTo());
        r.setApprovalStatus(entity.getApprovalStatus());
        r.setReason(entity.getReason());
        return r;
    }

    private FeeV2DTOs.RuleConditionResponse toRuleConditionResponse(FeeRuleConditionV2 entity) {
        FeeV2DTOs.RuleConditionResponse r = new FeeV2DTOs.RuleConditionResponse();
        r.setId(entity.getId());
        r.setConditionOrder(entity.getConditionOrder());
        r.setFieldName(entity.getFieldName());
        r.setOperator(entity.getOperator());
        r.setValueType(entity.getValueType());
        r.setValueText(entity.getValueText());
        r.setValueNumber(entity.getValueNumber());
        r.setValueJson(entity.getValueJson());
        r.setLogicalJoin(entity.getLogicalJoin());
        return r;
    }

    private FeeV2DTOs.RuleActionResponse toRuleActionResponse(FeeRuleActionV2 entity) {
        FeeV2DTOs.RuleActionResponse r = new FeeV2DTOs.RuleActionResponse();
        r.setId(entity.getId());
        r.setActionOrder(entity.getActionOrder());
        r.setActionType(entity.getActionType());
        r.setTargetScope(entity.getTargetScope());
        r.setValueType(entity.getValueType());
        r.setValueNumber(entity.getValueNumber());
        r.setValueText(entity.getValueText());
        r.setValueJson(entity.getValueJson());
        return r;
    }

    private FeeV2DTOs.RuleResponse toRuleResponse(FeeRuleV2 entity) {
        FeeV2DTOs.RuleResponse response = new FeeV2DTOs.RuleResponse();
        response.setId(entity.getId());
        response.setRuleCode(entity.getRuleCode());
        response.setRuleName(entity.getRuleName());
        response.setRuleType(entity.getRuleType());
        response.setPriorityNo(entity.getPriorityNo());
        response.setRuleStatus(entity.getRuleStatus());
        return response;
    }

    private FeeV2DTOs.DemandRunResponse toDemandRunResponse(FeeDemandRunV2 run) {
        FeeV2DTOs.DemandRunResponse response = new FeeV2DTOs.DemandRunResponse();
        response.setId(run.getId());
        response.setRunType(run.getRunType());
        response.setPeriodKey(run.getPeriodKey());
        response.setStatus(run.getStatus());
        response.setIdempotencyKey(run.getIdempotencyKey());
        response.setDemandsPosted((int) feeDemandRepository.countByTenantIdAndAcademicYearIdAndDemandRunIdAndIsDeletedFalse(
                run.getTenantId(), run.getAcademicYearId(), run.getId()));
        return response;
    }

    private FeeV2DTOs.LateFeePolicyResponse toLateFeePolicyResponse(FeeLateFeePolicyV2 entity) {
        FeeV2DTOs.LateFeePolicyResponse r = new FeeV2DTOs.LateFeePolicyResponse();
        r.setId(entity.getId());
        r.setPolicyCode(entity.getPolicyCode());
        r.setPolicyName(entity.getPolicyName());
        r.setGraceDays(entity.getGraceDays());
        r.setCalculationMode(entity.getCalculationMode());
        r.setFlatAmount(entity.getFlatAmount());
        r.setRatePercent(entity.getRatePercent());
        r.setMaxLateAmount(entity.getMaxLateAmount());
        r.setIsActive(entity.getIsActive());
        return r;
    }

    private FeeV2DTOs.LateFeeRunResponse toLateFeeRunResponse(FeeLateFeeRunV2 run) {
        FeeV2DTOs.LateFeeRunResponse r = new FeeV2DTOs.LateFeeRunResponse();
        r.setId(run.getId());
        r.setFeeLateFeePolicyId(run.getFeeLateFeePolicyId());
        r.setAsOfDate(run.getAsOfDate());
        r.setStatus(run.getStatus());
        r.setIdempotencyKey(run.getIdempotencyKey());
        r.setDemandsUpdated(run.getDemandsUpdated());
        r.setStartedAt(run.getStartedAt() != null ? run.getStartedAt().toString() : null);
        r.setFinishedAt(run.getFinishedAt() != null ? run.getFinishedAt().toString() : null);
        return r;
    }

    private FeeV2DTOs.PaymentAllocationResponse toPaymentAllocationResponse(PaymentAllocationV2 allocation) {
        FeeV2DTOs.PaymentAllocationResponse response = new FeeV2DTOs.PaymentAllocationResponse();
        response.setFeeDemandId(allocation.getFeeDemandId());
        response.setAllocationType(allocation.getAllocationType());
        response.setAmountAllocated(allocation.getAmountAllocated());
        return response;
    }

    private FeeV2DTOs.LedgerEntryResponse toLedgerResponse(StudentLedgerEntryV2 entry) {
        FeeV2DTOs.LedgerEntryResponse response = new FeeV2DTOs.LedgerEntryResponse();
        response.setId(entry.getId());
        response.setEntryType(entry.getEntryType());
        response.setSourceType(entry.getSourceType());
        response.setSourceRefId(entry.getSourceRefId());
        response.setSourceRefCode(entry.getSourceRefCode());
        response.setAmount(entry.getAmount());
        response.setSignedAmount(entry.getSignedAmount());
        response.setRunningBalance(entry.getRunningBalance());
        response.setNarrative(entry.getNarrative());
        response.setTxnTime(entry.getTxnTime() != null ? entry.getTxnTime().toString() : null);
        return response;
    }

    private FeeV2DTOs.PaymentModeBreakdownResponse toPaymentModeBreakdown(PaymentModeTotalRow row) {
        FeeV2DTOs.PaymentModeBreakdownResponse r = new FeeV2DTOs.PaymentModeBreakdownResponse();
        r.setPaymentMode(row.getPaymentMode());
        r.setTotalAmount(row.getTotalAmount());
        r.setPaymentCount(row.getPaymentCount());
        return r;
    }

    private FeeV2DTOs.DefaulterRowResponse toDefaulterRow(DefaulterSummaryRow row) {
        FeeV2DTOs.DefaulterRowResponse r = new FeeV2DTOs.DefaulterRowResponse();
        r.setStudentId(row.getStudentId());
        r.setClassId(row.getClassId());
        r.setTotalOutstanding(row.getTotalOutstanding());
        r.setDemandCount(row.getDemandCount());
        r.setOldestDueDate(row.getOldestDueDate());
        return r;
    }

    private FeeV2DTOs.ClassOutstandingResponse toClassOutstanding(ClassOutstandingRow row) {
        FeeV2DTOs.ClassOutstandingResponse r = new FeeV2DTOs.ClassOutstandingResponse();
        r.setClassId(row.getClassId());
        r.setTotalOutstanding(row.getTotalOutstanding());
        r.setTotalDemanded(row.getTotalDemanded());
        return r;
    }

    private FeeV2DTOs.PaymentRegisterRowResponse toPaymentRegisterRow(PaymentV2 p) {
        FeeV2DTOs.PaymentRegisterRowResponse r = new FeeV2DTOs.PaymentRegisterRowResponse();
        r.setId(p.getId());
        r.setStudentId(p.getStudentId());
        r.setPaymentNo(p.getPaymentNo());
        r.setPaymentStatus(p.getPaymentStatus());
        r.setChannelType(p.getChannelType());
        r.setPaymentMode(p.getPaymentMode());
        r.setAmount(p.getAmount());
        r.setPaymentDate(p.getPaymentDate() != null ? p.getPaymentDate().toString() : null);
        r.setReceiptNo(p.getReceiptNo());
        r.setIdempotencyKey(p.getIdempotencyKey());
        return r;
    }

    private FeeV2DTOs.AuditEventResponse toAuditEventResponse(FeeV2AuditEvent e) {
        FeeV2DTOs.AuditEventResponse r = new FeeV2DTOs.AuditEventResponse();
        r.setId(e.getId());
        r.setActorUserId(e.getActorUserId());
        r.setActionCode(e.getActionCode());
        r.setEntityType(e.getEntityType());
        r.setEntityId(e.getEntityId());
        r.setCorrelationId(e.getCorrelationId());
        r.setDetailJson(e.getDetailJson());
        r.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return r;
    }

    private FeeV2DTOs.RecordRefundResponse toRecordRefundResponse(FeeRefundV2 refund) {
        FeeV2DTOs.RecordRefundResponse r = new FeeV2DTOs.RecordRefundResponse();
        r.setRefundId(refund.getId());
        r.setRefundNo(refund.getRefundNo());
        r.setRefundStatus(refund.getRefundStatus());
        r.setAmount(refund.getAmount());
        r.setApprovalStatus(refund.getApprovalStatus());
        return r;
    }

    private String allocateNextReceiptNo() {
        String tenantId = tenantId();
        Long yearId = academicYearId();
        FeeReceiptCounterV2 counter = feeReceiptCounterRepository
                .findForUpdate(tenantId, yearId)
                .orElseGet(() -> {
                    FeeReceiptCounterV2 c = new FeeReceiptCounterV2();
                    c.setTenantId(tenantId);
                    c.setAcademicYearId(yearId);
                    c.setNextSeq(1L);
                    return feeReceiptCounterRepository.save(c);
                });
        long seq = counter.getNextSeq();
        counter.setNextSeq(seq + 1);
        feeReceiptCounterRepository.save(counter);
        return "RCP2-" + yearId + "-" + seq;
    }

    private static BigDecimal coalesceDecimal(Object o) {
        if (o == null) {
            return BigDecimal.ZERO;
        }
        if (o instanceof BigDecimal b) {
            return b;
        }
        if (o instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        return new BigDecimal(o.toString());
    }
}
