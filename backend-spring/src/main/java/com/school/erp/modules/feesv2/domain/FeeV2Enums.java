package com.school.erp.modules.feesv2.domain;

public final class FeeV2Enums {
    private FeeV2Enums() {}

    public enum ComponentType { RECURRING, ONE_TIME }
    public enum FrequencyType { MONTHLY, QUARTERLY, YEARLY, CUSTOM }
    public enum StructureStatus { DRAFT, ACTIVE, ARCHIVED }
    public enum DemandRunType { MONTHLY, ADHOC }
    public enum DemandRunStatus { INITIATED, COMPLETED, FAILED }
    public enum DemandStatus { PENDING, PARTIAL, PAID, OVERDUE }
    public enum PaymentChannelType { ONLINE, OFFLINE }
    public enum PaymentMode { UPI, CARD, NETBANKING, CASH, CHEQUE }
    public enum PaymentStatus { INITIATED, SUCCESS, FAILED, REVERSED }
    public enum AllocationType { DEMAND, ADVANCE }
    public enum LedgerEntryType { DEBIT, CREDIT }
    public enum LedgerSourceType { FEE_DEMAND, PAYMENT, REFUND, ADJUSTMENT }
    public enum DiscountType { FLAT, PERCENTAGE }
    public enum RuleType { ASSIGNMENT, LATE_FEE, DISCOUNT }

    public enum RefundStatus { PENDING, SUCCESS, FAILED }

    /** How late fee is computed when a demand is past due (after grace). */
    public enum LateFeeCalculationMode { FLAT, PERCENT_OF_PRINCIPAL }

    public enum LateFeeRunStatus { INITIATED, COMPLETED, FAILED }
}
