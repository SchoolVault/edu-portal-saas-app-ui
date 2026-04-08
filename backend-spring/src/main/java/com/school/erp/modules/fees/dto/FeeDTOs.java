package com.school.erp.modules.fees.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class FeeDTOs {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateFeeStructureRequest {
        @NotBlank private String name;
        @NotNull private Long classId;
        private String className;
        private Long academicYearId;
        @NotNull private List<FeeComponentDTO> components;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class FeeComponentDTO {
        private Long id;
        @NotBlank private String name;
        @NotNull private BigDecimal amount;
        private String type; // TUITION, TRANSPORT, LIBRARY, LAB, SPORTS, MISC
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class FeeStructureResponse {
        private Long id;
        private String name;
        private Long classId;
        private String className;
        private Long academicYearId;
        private BigDecimal totalAmount;
        private List<FeeComponentDTO> components;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RecordPaymentRequest {
        private Long paymentId; // null for new payment
        @NotNull private Long studentId;
        private String studentName;
        private Long feeStructureId;
        private BigDecimal totalAmount; // required for new payment
        @NotNull private BigDecimal paymentAmount;
        private LocalDate dueDate;
        private BigDecimal discount;
        private String paymentMethod; // CASH, ONLINE, CHEQUE, UPI
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class FeePaymentResponse {
        private Long id;
        private Long studentId;
        private String studentName;
        private Long feeStructureId;
        private BigDecimal amount;
        private BigDecimal paidAmount;
        private BigDecimal dueAmount;
        private String status;
        private LocalDate paymentDate;
        private LocalDate dueDate;
        private BigDecimal discount;
        private BigDecimal lateFee;
        private String receiptNumber;
        private String paymentMethod;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class FeeCollectionSummary {
        private BigDecimal totalCollected;
        private BigDecimal totalPending;
        private long totalStudents;
        private long overdueCount;
        private double collectionRate;
    }
}
