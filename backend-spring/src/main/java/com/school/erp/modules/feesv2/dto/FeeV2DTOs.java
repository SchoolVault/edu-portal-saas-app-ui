package com.school.erp.modules.feesv2.dto;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

public class FeeV2DTOs {
    @Data
    public static class CreateComponentRequest {
        @NotBlank private String code;
        @NotBlank private String name;
        @NotNull private ComponentType componentType;
        @NotNull private FrequencyType frequency;
        private Boolean optionalComponent;
        private Boolean refundable;
        private String metadataJson;
    }

    @Data
    public static class ComponentResponse {
        private Long id;
        private String code;
        private String name;
        private ComponentType componentType;
        private FrequencyType frequency;
        private Boolean optionalComponent;
        private Boolean refundable;
    }

    @Data
    public static class UpdateComponentRequest {
        @NotBlank private String name;
        @NotNull private ComponentType componentType;
        @NotNull private FrequencyType frequency;
        private Boolean optionalComponent;
        private Boolean refundable;
        private String metadataJson;
    }

    @Data
    public static class StructureComponentLine {
        @NotNull private Long feeComponentMasterId;
        @NotNull private BigDecimal amount;
        private FrequencyType frequencyOverride;
        private Boolean optionalOverride;
    }

    @Data
    public static class CreateStructureRequest {
        @NotNull private Long classId;
        @NotBlank private String structureName;
        @NotNull private Integer versionNo;
        private StructureStatus status;
        private String ruleExpression;
        @NotNull private List<StructureComponentLine> components;
    }

    @Data
    public static class StructureResponse {
        private Long id;
        private Long classId;
        private String structureName;
        private Integer versionNo;
        private StructureStatus status;
        private List<StructureComponentLine> components;
    }

    @Data
    public static class CreateRuleRequest {
        @NotBlank private String ruleCode;
        @NotBlank private String ruleName;
        @NotNull private RuleType ruleType;
        private Integer priorityNo;
        private Boolean stopOnMatch;
    }

    @Data
    public static class RuleResponse {
        private Long id;
        private String ruleCode;
        private String ruleName;
        private RuleType ruleType;
        private Integer priorityNo;
        private String ruleStatus;
    }

    @Data
    public static class UpdateRuleRequest {
        @NotBlank private String ruleName;
        @NotNull private RuleType ruleType;
        private Integer priorityNo;
        private Boolean stopOnMatch;
        private String ruleStatus;
    }

    @Data
    public static class CreateDemandRunRequest {
        @NotNull private DemandRunType runType;
        @NotBlank private String periodKey;
        @NotBlank private String triggerSource;
        @NotBlank private String idempotencyKey;
        private String runMetadataJson;
    }

    @Data
    public static class DemandRunResponse {
        private Long id;
        private DemandRunType runType;
        private String periodKey;
        private DemandRunStatus status;
        private String idempotencyKey;
        /** Number of fee demand rows created for this run (0 for idempotent replay of an empty run). */
        private Integer demandsPosted;
    }

    @Data
    public static class DemandResponse {
        private Long id;
        private Long studentId;
        private Long classId;
        private Long feeComponentMasterId;
        private Long feeStructureId;
        private Long demandRunId;
        private String periodKey;
        private LocalDate dueDate;
        private BigDecimal principalAmount;
        private BigDecimal discountAmount;
        private BigDecimal lateFeeAmount;
        private BigDecimal netAmount;
        private BigDecimal outstandingAmount;
        private DemandStatus demandStatus;
    }

    @Data
    public static class StudentFeeMapResponse {
        private Long id;
        private Long studentId;
        private Long classId;
        private Long feeStructureId;
        private Integer frozenVersionNo;
        private String assignmentSource;
        private String assignedAt;
        private LocalDate validFrom;
        private LocalDate validTo;
    }

    @Data
    public static class SnapshotFeeMapResponse {
        private Long id;
    }

    @Data
    public static class CreateDiscountRequest {
        @NotNull private Long studentId;
        @NotNull private DiscountType discountType;
        @NotNull private BigDecimal discountValue;
        /** ALL or SELECTED (uses applicableComponentIdsJson). */
        private String componentScope;
        private String applicableComponentIdsJson;
        @NotNull private LocalDate validFrom;
        private LocalDate validTo;
        private String reason;
    }

    @Data
    public static class UpdateDiscountRequest {
        @NotNull private DiscountType discountType;
        @NotNull private BigDecimal discountValue;
        private String componentScope;
        private String applicableComponentIdsJson;
        @NotNull private LocalDate validFrom;
        private LocalDate validTo;
        private String approvalStatus;
        private String reason;
    }

    @Data
    public static class DiscountResponse {
        private Long id;
        private Long studentId;
        private DiscountType discountType;
        private BigDecimal discountValue;
        private String componentScope;
        private String applicableComponentIdsJson;
        private LocalDate validFrom;
        private LocalDate validTo;
        private String approvalStatus;
        private String reason;
    }

    @Data
    public static class RuleConditionLine {
        private Integer conditionOrder;
        @NotBlank private String fieldName;
        @NotBlank private String operator;
        @NotBlank private String valueType;
        private String valueText;
        private BigDecimal valueNumber;
        private String valueJson;
        private String logicalJoin;
    }

    @Data
    public static class RuleActionLine {
        private Integer actionOrder;
        @NotBlank private String actionType;
        private String targetScope;
        private String valueType;
        private BigDecimal valueNumber;
        private String valueText;
        private String valueJson;
    }

    @Data
    public static class ReplaceRuleDefinitionRequest {
        @NotNull private List<RuleConditionLine> conditions;
        @NotNull private List<RuleActionLine> actions;
    }

    @Data
    public static class RuleConditionResponse {
        private Long id;
        private Integer conditionOrder;
        private String fieldName;
        private String operator;
        private String valueType;
        private String valueText;
        private BigDecimal valueNumber;
        private String valueJson;
        private String logicalJoin;
    }

    @Data
    public static class RuleActionResponse {
        private Long id;
        private Integer actionOrder;
        private String actionType;
        private String targetScope;
        private String valueType;
        private BigDecimal valueNumber;
        private String valueText;
        private String valueJson;
    }

    @Data
    public static class RuleDefinitionResponse {
        private RuleResponse rule;
        private List<RuleConditionResponse> conditions;
        private List<RuleActionResponse> actions;
    }

    @Data
    public static class RecordPaymentRequest {
        @NotNull private Long studentId;
        @NotNull private BigDecimal amount;
        @NotNull private PaymentChannelType channelType;
        @NotNull private PaymentMode paymentMode;
        @NotBlank private String idempotencyKey;
        private String externalRefId;
        private String instrumentRef;
    }

    @Data
    public static class PaymentAllocationResponse {
        private Long feeDemandId;
        private AllocationType allocationType;
        private BigDecimal amountAllocated;
    }

    @Data
    public static class RecordPaymentResponse {
        private Long paymentId;
        private String paymentNo;
        private String receiptNo;
        private PaymentStatus paymentStatus;
        private BigDecimal amount;
        private List<PaymentAllocationResponse> allocations;
    }

    @Data
    public static class LedgerEntryResponse {
        private Long id;
        private LedgerEntryType entryType;
        private LedgerSourceType sourceType;
        private Long sourceRefId;
        private String sourceRefCode;
        private BigDecimal amount;
        private BigDecimal signedAmount;
        private BigDecimal runningBalance;
        private String narrative;
        private String txnTime;
    }

    @Data
    public static class SnapshotFeeMapRequest {
        @NotNull private Long studentId;
        @NotNull private Long classId;
        @NotNull private Long feeStructureId;
        @NotNull private Integer frozenVersionNo;
        @NotBlank private String assignmentSource;
        @NotNull private LocalDate validFrom;
        private LocalDate validTo;
        /** When empty, server builds JSON from the fee structure lines. */
        private String snapshotJson;
    }

    @Data
    public static class RecordRefundRequest {
        @NotNull private Long studentId;
        @NotNull private BigDecimal amount;
        @NotBlank private String idempotencyKey;
        private String reason;
        private Long relatedPaymentId;
        /** When true, creates a pending refund that must be approved before ledger posting. */
        private Boolean submitForApproval;
    }

    @Data
    public static class RecordRefundResponse {
        private Long refundId;
        private String refundNo;
        private RefundStatus refundStatus;
        private BigDecimal amount;
        private String approvalStatus;
    }

    @Data
    public static class PaymentModeBreakdownResponse {
        private PaymentMode paymentMode;
        private BigDecimal totalAmount;
        private Long paymentCount;
    }

    @Data
    public static class CollectionSummaryResponse {
        private BigDecimal totalCollected;
        private Long paymentCount;
        private LocalDate fromDate;
        private LocalDate toDate;
        private List<PaymentModeBreakdownResponse> byPaymentMode;
    }

    @Data
    public static class DefaulterRowResponse {
        private Long studentId;
        private Long classId;
        private BigDecimal totalOutstanding;
        private Long demandCount;
        private LocalDate oldestDueDate;
    }

    @Data
    public static class ClassOutstandingResponse {
        private Long classId;
        private BigDecimal totalOutstanding;
        private BigDecimal totalDemanded;
    }

    @Data
    public static class PaymentRegisterRowResponse {
        private Long id;
        private Long studentId;
        private String paymentNo;
        private PaymentStatus paymentStatus;
        private PaymentChannelType channelType;
        private PaymentMode paymentMode;
        private BigDecimal amount;
        private String paymentDate;
        private String receiptNo;
        private String idempotencyKey;
    }

    @Data
    public static class AuditEventResponse {
        private Long id;
        private Long actorUserId;
        private String actionCode;
        private String entityType;
        private Long entityId;
        private String correlationId;
        private String detailJson;
        private String createdAt;
    }

    @Data
    public static class StudentStatementResponse {
        private Long studentId;
        private BigDecimal runningBalance;
        private List<DemandResponse> openDemands;
        private List<LedgerEntryResponse> recentLedger;
    }

    @Data
    public static class CreateLateFeePolicyRequest {
        @NotBlank private String policyCode;
        @NotBlank private String policyName;
        @NotNull private Integer graceDays;
        @NotNull private LateFeeCalculationMode calculationMode;
        private BigDecimal flatAmount;
        private BigDecimal ratePercent;
        private BigDecimal maxLateAmount;
        private Boolean isActive;
    }

    @Data
    public static class UpdateLateFeePolicyRequest {
        @NotBlank private String policyName;
        @NotNull private Integer graceDays;
        @NotNull private LateFeeCalculationMode calculationMode;
        private BigDecimal flatAmount;
        private BigDecimal ratePercent;
        private BigDecimal maxLateAmount;
        private Boolean isActive;
    }

    @Data
    public static class LateFeePolicyResponse {
        private Long id;
        private String policyCode;
        private String policyName;
        private Integer graceDays;
        private LateFeeCalculationMode calculationMode;
        private BigDecimal flatAmount;
        private BigDecimal ratePercent;
        private BigDecimal maxLateAmount;
        private Boolean isActive;
    }

    @Data
    public static class CreateLateFeeRunRequest {
        @NotNull private Long feeLateFeePolicyId;
        @NotNull private LocalDate asOfDate;
        @NotBlank private String idempotencyKey;
        private String runMetadataJson;
    }

    @Data
    public static class LateFeeRunResponse {
        private Long id;
        private Long feeLateFeePolicyId;
        private LocalDate asOfDate;
        private LateFeeRunStatus status;
        private String idempotencyKey;
        private Integer demandsUpdated;
        private String startedAt;
        private String finishedAt;
    }

    @Data
    public static class FeeAssignmentPreviewRequest {
        /** When set with {@link #sectionId}, loads all active students in that class+section. */
        private Long classId;
        private Long sectionId;
        /** When non-empty, resolves exactly these students (class/section filters ignored). */
        private List<Long> studentIds;
        /** Optional: only evaluate rules whose {@code ruleCode} is in this list. */
        private List<String> ruleCodes;
    }

    @Data
    public static class FeeAssignmentPreviewRow {
        private Long studentId;
        private Long classId;
        private Long sectionId;
        private String admissionNumber;
        private Long currentFeeStructureId;
        private Integer currentFrozenVersionNo;
        private Long proposedFeeStructureId;
        private Integer proposedFrozenVersionNo;
        private String matchedRuleCode;
        private Boolean wouldChange;
        private String skipReason;
    }

    @Data
    public static class FeeAssignmentPreviewResponse {
        private List<FeeAssignmentPreviewRow> rows;
        private Integer wouldChangeCount;
        private Integer noMatchCount;
    }

    @Data
    public static class FeeAssignmentExecuteRequest {
        private Long classId;
        private Long sectionId;
        private List<Long> studentIds;
        private List<String> ruleCodes;
        @NotNull private LocalDate validFrom;
        private LocalDate validTo;
        @NotBlank private String idempotencyKey;
        /** When true, insert a new map row even when structure/version matches the latest assignment. */
        private Boolean forceSnapshot;
        private String runMetadataJson;
        /** Stored on each new {@code student_fee_structure_map} row (default RULE_ENGINE). */
        private String assignmentSource;
    }

    @Data
    public static class FeeAssignmentExecuteResponse {
        private Long runId;
        private Integer mapsApplied;
        private Integer studentsSkipped;
        private String idempotencyKey;
    }

    @Data
    public static class FeesV2RazorpayOrderRequest {
        @NotNull private Long studentId;
        @NotNull private BigDecimal amount;
    }

    @Data
    public static class FeesV2RazorpayOrderResponse {
        private String orderId;
        private String keyId;
        private BigDecimal amount;
        private String currency;
    }

    @Data
    public static class LedgerReconciliationRowResponse {
        private Long studentId;
        private BigDecimal demandOutstandingTotal;
        private BigDecimal ledgerRunningBalance;
        private BigDecimal delta;
    }

    @Data
    public static class LedgerReconciliationReportResponse {
        private List<LedgerReconciliationRowResponse> mismatches;
        private Integer mismatchCount;
    }
}
